-- ============================================================================
-- LIVE CLASS BATCHES
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Safe to re-run (idempotent).
--
-- MODEL
--   A "batch" is a recurring live-class group: one class style, one
--   instructor, a fixed set of weekdays + a fixed wall-clock time, and ONE
--   persistent meeting link that gets reused every session. The admin sets a
--   batch up once, assigns members to it, and never touches the link again.
--
--   Members do NOT book anything. Access is: active membership + assigned to
--   a batch. The join link appears in their dashboard 1 hour before each
--   session and disappears when the session ends.
--
-- SECURITY NOTE — why credentials live in their own table
--   Postgres RLS is row-level, not column-level. If the meeting URL and
--   passcode were columns on `batches`, then anyone allowed to read a batch
--   row would also read its credentials. Splitting them into
--   `batch_meeting_credentials` gives us two different access rules:
--     batches                    -> assigned members (even if lapsed)
--     batch_meeting_credentials  -> assigned members WITH an active membership
--   So a member whose membership expires keeps seeing their timetable (and a
--   "renew" prompt) but immediately loses the ability to fetch the link,
--   even if they query Supabase directly from the browser console.
--
--   Within the credentials table, `host_note` needs a *third* rule (admin
--   only), and a policy cannot express that — so it is handled with column
--   privileges instead. See the grant below the policies.
--
-- SECURITY NOTE — what the join window does and does not do
--   The "link appears 1 hour before class" rule lives in application code
--   (canJoinNow in lib/batches.ts, applied in app/dashboard/page.tsx), NOT in
--   these policies. It keeps the link out of the page until it is needed, but
--   an entitled member can still query the row at any hour. That is accepted:
--   the link is deliberately persistent and reused every session, so anyone who
--   legitimately joins once already holds it forever. Reimplementing the IST
--   recurrence maths in plpgsql would add a second source of truth for the
--   window without changing what an entitled member can obtain.
--
-- SECURITY NOTE — helper functions and PostgREST
--   Every function in `public` is also a REST endpoint (/rest/v1/rpc/<name>).
--   The rule this file follows: a helper that only ever answers about the
--   *caller* may be `security definer` (is_admin, is_batch_member — as an RPC
--   they tell you only about yourself). A helper that takes a user id must be
--   `security invoker`, so the table's own RLS decides whether the answer is
--   available — otherwise it becomes an oracle over other people's data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: does this user have a membership that is active AND unexpired?
-- Mirrors hasActiveMembership() in lib/memberships.ts. `status` alone can go
-- stale if no expiry job has run, so end_date is checked too.
--
-- `security invoker` per the note above, since it takes a user id. Both callers
-- still work: the credentials policy asks only about auth.uid() (memberships'
-- RLS lets you read your own row), and batch_roster is read by the service
-- role, which bypasses RLS.
-- ----------------------------------------------------------------------------
create or replace function public.has_active_membership(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships
    where user_id = uid
      and status = 'active'
      and end_date >= current_date
  );
$$ language sql security invoker stable set search_path = public;

-- ============================================================================
-- BATCHES
-- ============================================================================
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_id uuid not null references public.classes(id) on delete restrict,
  instructor_name text not null,

  -- Weekly recurrence. Postgres/JS convention: 0 = Sunday .. 6 = Saturday.
  -- e.g. Mon/Wed/Fri => '{1,3,5}'. Required — a batch with no days can never
  -- produce a session, so there is deliberately no default.
  weekdays smallint[] not null,

  -- Wall-clock IST times (the whole product is IST — see IST_OFFSET_MINUTES
  -- in lib/batches.ts if that ever needs to change).
  start_time time not null,
  end_time time not null,

  capacity int not null default 20,
  -- Shown publicly on the /classes timetable AND on the member's dashboard
  -- card. Nothing private belongs here — use
  -- batch_meeting_credentials.host_note for admin-only notes.
  description text,

  starts_on date not null default current_date,
  ends_on date, -- null = runs indefinitely

  status text not null default 'active'
    check (status in ('active', 'paused', 'archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_batches_capacity check (capacity > 0)
);

-- Weekday validity lives here rather than inline, because `create table if not
-- exists` above silently skips an existing table — so an inline constraint would
-- never reach a database created from an earlier revision of this file. Stated
-- separately, it is applied on every run.
--
-- `cardinality`, not `array_length(weekdays, 1) >= 1`: an empty array has no
-- dimension 1, so array_length returns NULL, and a CHECK is satisfied by TRUE
-- *or NULL*. That version accepted '{}' — exactly what it was written to reject.
alter table public.batches drop constraint if exists chk_batches_weekdays;
alter table public.batches add constraint chk_batches_weekdays check (
  weekdays <@ array[0,1,2,3,4,5,6]::smallint[] and cardinality(weekdays) >= 1
);

create index if not exists idx_batches_status on public.batches(status);
create index if not exists idx_batches_class on public.batches(class_id);

drop trigger if exists trg_batches_updated_at on public.batches;
create trigger trg_batches_updated_at
  before update on public.batches
  for each row execute function public.set_updated_at();

-- ============================================================================
-- BATCH MEETING CREDENTIALS  (1:1 with batches — see security note above)
-- ============================================================================
create table if not exists public.batch_meeting_credentials (
  batch_id uuid primary key references public.batches(id) on delete cascade,
  provider text not null default 'zoom'
    check (provider in ('zoom', 'google_meet', 'other')),
  meeting_url text not null,
  meeting_id text,
  passcode text,
  host_note text, -- admin-only scratch space (host key, dial-in, etc.)
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_batch_creds_updated_at on public.batch_meeting_credentials;
create trigger trg_batch_creds_updated_at
  before update on public.batch_meeting_credentials
  for each row execute function public.set_updated_at();

-- ============================================================================
-- BATCH MEMBERS  (admin assigns members to a batch)
-- ============================================================================
create table if not exists public.batch_members (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'removed')),
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (batch_id, user_id)
);

create index if not exists idx_batch_members_user on public.batch_members(user_id, status);
create index if not exists idx_batch_members_batch on public.batch_members(batch_id, status);

-- ============================================================================
-- BATCH CANCELLATIONS  (skip one date without deleting the batch)
-- ============================================================================
create table if not exists public.batch_cancellations (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  session_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (batch_id, session_date)
);

create index if not exists idx_batch_cancellations_batch
  on public.batch_cancellations(batch_id, session_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.batches enable row level security;
alter table public.batch_meeting_credentials enable row level security;
alter table public.batch_members enable row level security;
alter table public.batch_cancellations enable row level security;

-- Is the current user an active member of this batch?
create or replace function public.is_batch_member(b_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.batch_members
    where batch_id = b_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer stable set search_path = public;

-- ── batches: the timetable itself is public (it holds no secrets — that is
--    the whole point of splitting credentials into their own table). Paused or
--    archived batches stay hidden from the public timetable, but a member who
--    is assigned to one can still see it so their dashboard can explain why
--    there is no next session.
drop policy if exists "batches_select_member_or_admin" on public.batches;
drop policy if exists "batches_public_read" on public.batches;
create policy "batches_public_read" on public.batches
  for select using (status = 'active' or public.is_admin() or public.is_batch_member(id));

drop policy if exists "batches_admin_write" on public.batches;
create policy "batches_admin_write" on public.batches
  for all using (public.is_admin()) with check (public.is_admin());

-- ── credentials: assigned member AND active membership required ────────────
drop policy if exists "batch_creds_select_paid_member_or_admin" on public.batch_meeting_credentials;
create policy "batch_creds_select_paid_member_or_admin" on public.batch_meeting_credentials
  for select using (
    public.is_admin()
    or (public.is_batch_member(batch_id) and public.has_active_membership(auth.uid()))
  );

drop policy if exists "batch_creds_admin_write" on public.batch_meeting_credentials;
create policy "batch_creds_admin_write" on public.batch_meeting_credentials
  for all using (public.is_admin()) with check (public.is_admin());

-- Column privileges, because the policy above grants the whole ROW and
-- `host_note` is the admin's scratch space (host key, dial-in PIN). Without
-- this, an assigned paying member could read it with one REST call:
--   GET /rest/v1/batch_meeting_credentials?select=*
-- Privileges and RLS are independent and both must pass, so this narrows the
-- columns while the policy keeps narrowing the rows. The table-level grant has
-- to be revoked first — Postgres will not subtract one column from it.
-- The admin UI is unaffected: it reads with the service-role key.
revoke select on public.batch_meeting_credentials from anon, authenticated;
grant select (batch_id, provider, meeting_url, meeting_id, passcode)
  on public.batch_meeting_credentials to authenticated;

-- ── batch_members: a member sees only their own assignment rows ────────────
drop policy if exists "batch_members_select_own_or_admin" on public.batch_members;
create policy "batch_members_select_own_or_admin" on public.batch_members
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "batch_members_admin_write" on public.batch_members;
create policy "batch_members_admin_write" on public.batch_members
  for all using (public.is_admin()) with check (public.is_admin());

-- ── cancellations: the member dashboard reads these to strike out a date. Not
--    public, because `reason` is free text the admin types and it tends to be
--    about a person ("Anita is travelling"). The public timetable shows the
--    weekly pattern only, so it never needs this table.
drop policy if exists "batch_cancellations_select" on public.batch_cancellations;
create policy "batch_cancellations_select" on public.batch_cancellations
  for select using (public.is_admin() or public.is_batch_member(batch_id));

drop policy if exists "batch_cancellations_admin_write" on public.batch_cancellations;
create policy "batch_cancellations_admin_write" on public.batch_cancellations
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- CONVENIENCE VIEW — batch roster with member details, for the admin UI.
-- security_invoker makes the view respect the caller's RLS instead of the
-- view owner's, so this cannot be used to bypass the policies above.
-- ============================================================================
drop view if exists public.batch_roster;
create view public.batch_roster with (security_invoker = true) as
select
  bm.id            as assignment_id,
  bm.batch_id,
  bm.user_id,
  bm.status        as assignment_status,
  bm.assigned_at,
  p.full_name,
  p.phone,
  public.has_active_membership(bm.user_id) as membership_active
from public.batch_members bm
join public.profiles p on p.id = bm.user_id;
