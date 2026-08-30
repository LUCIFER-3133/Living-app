-- ============================================================================
-- TESTIMONIALS  (admin-managed — replaces the six invented placeholder
-- quotes that used to be hardcoded in components/home/Testimonials.tsx)
-- ============================================================================
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  rating int not null default 5 check (rating between 1 and 5),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_testimonials_published on public.testimonials(is_published);

drop trigger if exists trg_testimonials_updated_at on public.testimonials;
create trigger trg_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_select_published" on public.testimonials;
create policy "testimonials_select_published" on public.testimonials
  for select using (is_published = true);

drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
