-- ============================================================================
-- GENERAL ENQUIRIES ON THE APPOINTMENTS TABLE
-- Run this in the Supabase SQL editor AFTER schema.sql, on a database that
-- already has the `appointments` table from before this change.
-- Safe to re-run (idempotent).
--
-- The contact page used to only offer "book an appointment", which forced a
-- date/time/service pick on every visitor even when they just wanted to say
-- hello or ask a question. This adds a `type` column so the same table can
-- hold both a free-form enquiry and a slot-booking request, and relaxes the
-- slot columns from NOT NULL to nullable-but-enforced (see the check
-- constraint at the bottom) so a general enquiry doesn't need to fake a
-- date/time it was never asked for.
-- ============================================================================

alter table public.appointments
  add column if not exists type text not null default 'appointment';

alter table public.appointments
  drop constraint if exists appointments_type_check;
alter table public.appointments
  add constraint appointments_type_check check (type in ('general', 'appointment'));

alter table public.appointments alter column preferred_date drop not null;
alter table public.appointments alter column preferred_time drop not null;
alter table public.appointments alter column service drop not null;

alter table public.appointments
  drop constraint if exists appointments_slot_fields_check;
alter table public.appointments
  add constraint appointments_slot_fields_check check (
    type = 'general' or (preferred_date is not null and preferred_time is not null and service is not null)
  );
