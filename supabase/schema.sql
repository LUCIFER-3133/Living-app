-- ============================================================================
-- YOGA+ DATABASE SCHEMA
-- Run this in the Supabase SQL editor (or via `supabase db push`), BEFORE
-- supabase/batches.sql, which builds on it.
--
-- Fully idempotent: every policy and trigger is dropped before it is created,
-- and tables/indexes use `if not exists`. Re-run it after any change to this
-- file rather than hand-applying the delta.
--
-- Run it as ONE statement batch, not statement-by-statement. Each
-- `drop policy` / `create policy` pair leaves a brief window where the table has
-- RLS enabled and no policy, which fails closed (public reads 403 until the
-- create lands). The Supabase SQL editor wraps a submission in a transaction, so
-- pasting the whole file is safe; a `psql -f` apply is autocommit-per-statement
-- and would expose that window, so wrap it in begin/commit yourself there.
--
-- NOTE ON `create table if not exists`: it silently skips an existing table, so
-- a column or inline constraint added to this file later will NOT reach an
-- already-provisioned database. Add those as separate `alter table` statements
-- (see chk_batches_weekdays in batches.sql for the pattern) rather than editing
-- a create-table body and assuming a re-run applies it.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- PROFILES  (1:1 with auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
-- `on conflict do nothing` because this runs inside the auth.users insert: if a
-- profile row somehow already exists for the uid, a raised exception would abort
-- the signup itself rather than just skip the profile.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- CLASSES
-- ============================================================================
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null, -- Hatha, Vinyasa, Yin, Power, Meditation, Breathwork, Beginner
  short_description text not null,
  long_description text,
  image_url text,
  duration_minutes int not null default 60,
  difficulty text not null default 'All Levels'
    check (difficulty in ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_classes_slug on public.classes(slug);
create index if not exists idx_classes_active on public.classes(is_active);

drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- CLASS SCHEDULES  (bookable time slots for a class)
-- ============================================================================
create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  instructor_name text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text not null default 'studio' check (location in ('studio', 'online')),
  capacity int not null default 15,
  booked_count int not null default 0,
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint chk_capacity_nonneg check (booked_count >= 0 and booked_count <= capacity)
);

create index if not exists idx_schedules_class on public.class_schedules(class_id);
create index if not exists idx_schedules_start on public.class_schedules(start_time);

-- ============================================================================
-- PAYMENTS  (single source of truth for all Razorpay transactions)
-- ============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('booking', 'membership')),
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_order on public.payments(razorpay_order_id);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- BOOKINGS
-- ============================================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  schedule_id uuid not null references public.class_schedules(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  amount numeric(10, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, schedule_id)
);

create index if not exists idx_bookings_user on public.bookings(user_id);
create index if not exists idx_bookings_schedule on public.bookings(schedule_id);
create index if not exists idx_bookings_status on public.bookings(status);

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Keep class_schedules.booked_count in sync with confirmed bookings.
create or replace function public.sync_schedule_booked_count()
returns trigger as $$
declare
  target_schedule uuid;
begin
  target_schedule := coalesce(new.schedule_id, old.schedule_id);

  update public.class_schedules
  set booked_count = (
    select count(*) from public.bookings
    where schedule_id = target_schedule and status = 'confirmed'
  )
  where id = target_schedule;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_sync_booked_count on public.bookings;
create trigger trg_sync_booked_count
  after insert or update of status or delete on public.bookings
  for each row execute function public.sync_schedule_booked_count();

-- ============================================================================
-- APPOINTMENTS  (free-form consultation requests, not paid class bookings)
-- ============================================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  -- 'general' — just getting in touch, no slot to pick.
  -- 'appointment' — wants a specific booked slot; date/time/service required.
  type text not null default 'appointment' check (type in ('general', 'appointment')),
  name text not null,
  email text not null,
  phone text,
  -- Nullable: a general enquiry has no preferred slot or service. Enforced
  -- together (not individually not-null) by appointments_slot_fields_check
  -- below, so an 'appointment' row can't be saved half-filled.
  preferred_date date,
  preferred_time time,
  service text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_slot_fields_check check (
    type = 'general' or (preferred_date is not null and preferred_time is not null and service is not null)
  )
);

create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_appointments_email on public.appointments(email);

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- MEMBERSHIP PLANS
-- ============================================================================
create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  billing_interval text not null check (billing_interval in ('monthly', 'quarterly', 'half_yearly', 'yearly')),
  features jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_membership_plans_updated_at on public.membership_plans;
create trigger trg_membership_plans_updated_at
  before update on public.membership_plans
  for each row execute function public.set_updated_at();

-- ============================================================================
-- MEMBERSHIPS  (a user's purchased instance of a plan)
-- ============================================================================
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id),
  payment_id uuid references public.payments(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  start_date date not null default current_date,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_memberships_user on public.memberships(user_id);
create index if not exists idx_memberships_status on public.memberships(status);

-- One payment can only ever produce one membership. This is the constraint that
-- makes /api/memberships/verify safe against replay: the caller holds a valid
-- Razorpay signature (Razorpay hands it to the browser), so nothing stops them
-- posting it twice — but only the first insert can win. Partial, because
-- memberships an admin grants by hand have no payment.
create unique index if not exists uq_memberships_payment
  on public.memberships(payment_id)
  where payment_id is not null;

drop trigger if exists trg_memberships_updated_at on public.memberships;
create trigger trg_memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

-- ============================================================================
-- BLOG POSTS
-- ============================================================================
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  featured_image text,
  category text,
  author_name text not null default 'Living Yoga Team',
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_slug on public.blog_posts(slug);
create index if not exists idx_blog_published on public.blog_posts(is_published, published_at desc);

drop trigger if exists trg_blog_updated_at on public.blog_posts;
create trigger trg_blog_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- DEMO VIDEOS  (public demo-session library; admin uploads via Storage)
-- ============================================================================
create table if not exists public.demo_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'General',
  video_url text not null,       -- public URL in the `demo-videos` Storage bucket
  thumbnail_url text,
  duration_seconds int,
  is_published boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_demo_videos_published on public.demo_videos(is_published, created_at desc);

drop trigger if exists trg_demo_videos_updated_at on public.demo_videos;
create trigger trg_demo_videos_updated_at
  before update on public.demo_videos
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_schedules enable row level security;
alter table public.bookings enable row level security;
alter table public.appointments enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.blog_posts enable row level security;
alter table public.demo_videos enable row level security;

-- Helper: is the current user an admin?
-- `set search_path` so a definer function can't be redirected at a shadowed
-- `profiles` by a caller who controls their own search_path.
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- PRIVILEGE ESCALATION FIX — the policy above is row-scoped but not
-- column-scoped, and `role` lives on this row. Supabase grants table-level
-- UPDATE to `authenticated` by default, so without the grants below any signed-in
-- member could make themselves an admin with one call using the public anon key:
--   PATCH /rest/v1/profiles?id=eq.<their-own-uid>   {"role":"admin"}
-- public.is_admin() would then return true for them, unlocking every
-- *_admin_write policy in this file and in batches.sql — all payments, all
-- memberships, every batch's meeting link including host_note.
--
-- A policy cannot express "this row, but not that column", so this is column
-- privileges, same as batch_meeting_credentials in batches.sql. The table-level
-- grant has to be revoked first — Postgres will not subtract one column from it.
-- Admin promotion is deliberately out-of-band: see supabase/promote_admin.sql.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- classes (public read of active classes; admin manages)
drop policy if exists "classes_public_read" on public.classes;
create policy "classes_public_read" on public.classes
  for select using (is_active = true or public.is_admin());
drop policy if exists "classes_admin_write" on public.classes;
create policy "classes_admin_write" on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

-- class_schedules (public read; admin manages)
drop policy if exists "schedules_public_read" on public.class_schedules;
create policy "schedules_public_read" on public.class_schedules
  for select using (true);
drop policy if exists "schedules_admin_write" on public.class_schedules;
create policy "schedules_admin_write" on public.class_schedules
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings — HISTORY ONLY. Per-class booking was retired when classes moved to
-- admin-assigned batches; nothing in the app writes this table any more. The
-- member insert/update policies are dropped rather than left in place, because
-- a policy is a live capability, not documentation: with them, any signed-in
-- user could POST /rest/v1/bookings with the anon key and invent rows for
-- themselves — which would show up in /admin/bookings and, via
-- trg_sync_booked_count, move class_schedules.booked_count. Members keep read
-- access so their own past classes stay visible.
drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "bookings_insert_own" on public.bookings;
drop policy if exists "bookings_update_own_or_admin" on public.bookings;
drop policy if exists "bookings_update_admin" on public.bookings;
create policy "bookings_update_admin" on public.bookings
  for update using (public.is_admin());

-- appointments (anyone can submit; owner or admin can view/manage)
drop policy if exists "appointments_insert_any" on public.appointments;
create policy "appointments_insert_any" on public.appointments
  for insert with check (true);
drop policy if exists "appointments_select_own_or_admin" on public.appointments;
create policy "appointments_select_own_or_admin" on public.appointments
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "appointments_update_admin" on public.appointments;
create policy "appointments_update_admin" on public.appointments
  for update using (public.is_admin());

-- membership_plans (public read of active plans; admin manages)
drop policy if exists "plans_public_read" on public.membership_plans;
create policy "plans_public_read" on public.membership_plans
  for select using (status = 'active' or public.is_admin());
drop policy if exists "plans_admin_write" on public.membership_plans;
create policy "plans_admin_write" on public.membership_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- memberships (users see own; admin sees/manages all)
drop policy if exists "memberships_select_own_or_admin" on public.memberships;
create policy "memberships_select_own_or_admin" on public.memberships
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "memberships_admin_write" on public.memberships;
create policy "memberships_admin_write" on public.memberships
  for all using (public.is_admin()) with check (public.is_admin());

-- payments (users see own; only server [service role] or admin write)
drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- blog_posts (public read of published posts; admin manages)
drop policy if exists "blog_public_read" on public.blog_posts;
create policy "blog_public_read" on public.blog_posts
  for select using (is_published = true or public.is_admin());
drop policy if exists "blog_admin_write" on public.blog_posts;
create policy "blog_admin_write" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- demo_videos (public read of published videos; admin manages)
drop policy if exists "demo_videos_public_read" on public.demo_videos;
create policy "demo_videos_public_read" on public.demo_videos
  for select using (is_published = true or public.is_admin());
drop policy if exists "demo_videos_admin_write" on public.demo_videos;
create policy "demo_videos_admin_write" on public.demo_videos
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- STORAGE — demo video files
-- ============================================================================
-- `do update`, not `do nothing`: if the bucket exists but was created private,
-- `do nothing` would leave it private and every demo video would 404 with no
-- error anywhere to explain why.
insert into storage.buckets (id, name, public)
values ('demo-videos', 'demo-videos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "demo_video_files_public_read" on storage.objects;
create policy "demo_video_files_public_read" on storage.objects
  for select using (bucket_id = 'demo-videos');

drop policy if exists "demo_video_files_admin_write" on storage.objects;
create policy "demo_video_files_admin_write" on storage.objects
  for insert with check (bucket_id = 'demo-videos' and public.is_admin());

drop policy if exists "demo_video_files_admin_update" on storage.objects;
create policy "demo_video_files_admin_update" on storage.objects
  for update using (bucket_id = 'demo-videos' and public.is_admin());

drop policy if exists "demo_video_files_admin_delete" on storage.objects;
create policy "demo_video_files_admin_delete" on storage.objects
  for delete using (bucket_id = 'demo-videos' and public.is_admin());

-- ============================================================================
-- NOTE: all writes to `payments` in application code use the Supabase
-- service-role key from trusted server routes (see lib/supabase/admin.ts),
-- which bypasses RLS. Never perform payment writes from the client.
-- ============================================================================
