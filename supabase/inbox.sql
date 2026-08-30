-- ============================================================================
-- INBOX  — in-app messages: admin broadcasts/DMs to members, plus automated
-- reminders (daily class reminders, membership renewal warnings).
-- Run this in the Supabase SQL editor AFTER schema.sql and batches.sql
-- (category 'class_reminder' rows are written by the cron job, which reads
-- batches/batch_members — no hard FK dependency, just a logical one).
-- Safe to re-run (idempotent).
-- ============================================================================
create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Who sent it. Null for anything the system generated (cron reminders) —
  -- distinct from "an admin sent this", which always has a real sender_id.
  sender_id uuid references public.profiles(id) on delete set null,
  category text not null default 'admin'
    check (category in ('admin', 'class_reminder', 'membership_renewal', 'system')),
  title text not null,
  body text not null,
  -- Optional in-app path to deep-link to, e.g. '/dashboard' or '/membership'.
  -- Deliberately just a path, not a full URL — this is an internal inbox,
  -- not an email client that needs to link off-site.
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_inbox_messages_user_created
  on public.inbox_messages(user_id, created_at desc);

-- Partial index: the only query that cares about read/unread is "how many
-- unread does this user have", so only unread rows need to be in it.
create index if not exists idx_inbox_messages_unread
  on public.inbox_messages(user_id) where read_at is null;

alter table public.inbox_messages enable row level security;

drop policy if exists "inbox_select_own" on public.inbox_messages;
create policy "inbox_select_own" on public.inbox_messages
  for select using (auth.uid() = user_id);

-- Members are allowed to UPDATE their own rows (to mark as read), but the
-- column-level restriction — read_at only, nothing else — can't be expressed
-- in a row policy, so it's enforced by the trigger below. Belt-and-suspenders
-- with the server action that's the app's only normal path to this: the
-- action already only ever sets read_at, this stops a browser console call
-- (a signed-in user's own JS, with their own anon-key session) from rewriting
-- someone's message content on their own row.
drop policy if exists "inbox_update_own" on public.inbox_messages;
create policy "inbox_update_own" on public.inbox_messages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admins can do everything (compose, edit, delete) via the anon-key client
-- too, same pattern as testimonials — though in practice the admin UI goes
-- through the service-role client per requireAdminAction(), same as every
-- other admin mutation in this app.
drop policy if exists "inbox_admin_all" on public.inbox_messages;
create policy "inbox_admin_all" on public.inbox_messages
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create or replace function public.inbox_messages_guard_update()
returns trigger as $$
begin
  -- Admins (checked the same way the RLS policy above does) may change
  -- anything. A non-admin update reaching this trigger is the member
  -- marking their own message read — only read_at may move.
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.sender_id is distinct from old.sender_id
    or new.category is distinct from old.category
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.link is distinct from old.link
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only read_at may be changed on an inbox message.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_inbox_messages_guard_update on public.inbox_messages;
create trigger trg_inbox_messages_guard_update
  before update on public.inbox_messages
  for each row execute function public.inbox_messages_guard_update();
