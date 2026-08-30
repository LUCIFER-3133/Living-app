-- ============================================================================
-- RATE LIMITING  (simple, Postgres-only — no Redis/external service needed)
-- ============================================================================
-- Backs lib/rateLimit.ts. Used on public, unauthenticated POST endpoints
-- (contact form / inquiry popup, chat-bot) that had nothing standing between
-- them and scripted abuse. One row per (endpoint + identifier) key, reset
-- once its window has elapsed.
create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

-- Admin/service-role only — never exposed to anon/authenticated via PostgREST.
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Atomic check-and-increment: single UPSERT so two concurrent requests for
-- the same key can't both read count=0 and both slip through.
create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
        when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then 1
        else public.rate_limits.count + 1
      end,
      window_start = case
        when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then now()
        else public.rate_limits.window_start
      end
  returning count into v_count;

  return v_count <= p_max;
end;
$$ language plpgsql security definer set search_path = public;

-- Housekeeping: rows older than a day are stale (their window has long since
-- reset) and only ever accumulate. Call this occasionally from the same cron
-- that runs the membership-expiry job, or by hand — it's not required for
-- correctness, only to keep the table small.
create or replace function public.cleanup_rate_limits()
returns void as $$
begin
  delete from public.rate_limits where window_start < now() - interval '1 day';
end;
$$ language plpgsql security definer set search_path = public;
