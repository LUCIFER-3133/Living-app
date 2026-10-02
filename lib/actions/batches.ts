'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction as requireAdmin } from '@/lib/auth';
import { formatStudioTime, formatWeekdays } from '@/lib/batches';
import { sendBatchAssignmentEmail } from '@/lib/email/send';
import type { BatchStatus, MeetingProvider, Weekday } from '@/types/database';

/** Revalidate everywhere a batch is visible. */
function revalidateBatch(batchId?: string) {
  revalidatePath('/admin/batches');
  if (batchId) revalidatePath(`/admin/batches/${batchId}`);
  revalidatePath('/dashboard');
  revalidatePath('/classes');
}

function parseWeekdays(formData: FormData): Weekday[] {
  return formData
    .getAll('weekdays')
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) as Weekday[];
}

/** "" -> null, so empty form fields don't become empty strings in the DB. */
function nullable(formData: FormData, key: string): string | null {
  const value = (formData.get(key) as string | null)?.trim();
  return value ? value : null;
}

/**
 * A field the DB requires. `required` in the markup is browser-side only, and
 * a server action is a public endpoint — so a missing field has to fail here
 * with a readable message rather than as a TypeError on `.trim()`.
 */
function requireText(formData: FormData, key: string, label: string): string {
  const value = nullable(formData, key);
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

// ── Batch CRUD ──────────────────────────────────────────────────────────────

export async function saveBatch(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = (formData.get('id') as string | null) || null;
  const weekdays = parseWeekdays(formData);

  if (weekdays.length === 0) {
    throw new Error('Pick at least one day of the week for this batch.');
  }

  const meetingUrl = nullable(formData, 'meeting_url');
  if (meetingUrl && !/^https?:\/\//i.test(meetingUrl)) {
    throw new Error('The meeting link must start with http:// or https://');
  }

  const batchPayload = {
    name: requireText(formData, 'name', 'Batch name'),
    class_id: requireText(formData, 'class_id', 'Class style'),
    instructor_name: requireText(formData, 'instructor_name', 'Instructor'),
    weekdays,
    start_time: requireText(formData, 'start_time', 'Start time'),
    end_time: requireText(formData, 'end_time', 'End time'),
    capacity: Math.min(15, Math.max(1, Number(formData.get('capacity')) || 15)), // studio policy: 15 max per batch, clamped server-side (the input's max=15 is only a UI hint)
    description: nullable(formData, 'description'),
    starts_on: nullable(formData, 'starts_on') ?? new Date().toISOString().slice(0, 10),
    ends_on: nullable(formData, 'ends_on'),
    status: ((formData.get('status') as string) || 'active') as BatchStatus,
  };

  if (batchPayload.ends_on && batchPayload.ends_on < batchPayload.starts_on) {
    throw new Error('The last session cannot be before the first session.');
  }

  let batchId = id;

  if (id) {
    const { error } = await admin.from('batches').update(batchPayload).eq('id', id);
    if (error) throw new Error(`Could not save the batch: ${error.message}`);
  } else {
    const { data, error } = await admin.from('batches').insert(batchPayload).select('id').single();
    if (error) throw new Error(`Could not create the batch: ${error.message}`);
    batchId = data.id;
  }

  // Credentials live in their own table so RLS can guard them separately —
  // see the security note in supabase/batches.sql.
  if (meetingUrl) {
    const { error } = await admin.from('batch_meeting_credentials').upsert(
      {
        batch_id: batchId!,
        provider: ((formData.get('provider') as string) || 'zoom') as MeetingProvider,
        meeting_url: meetingUrl,
        meeting_id: nullable(formData, 'meeting_id'),
        passcode: nullable(formData, 'passcode'),
        host_note: nullable(formData, 'host_note'),
      },
      { onConflict: 'batch_id' }
    );
    if (error) throw new Error(`Could not save the meeting link: ${error.message}`);
  } else if (id) {
    // Link cleared in the form — drop it so members stop seeing a stale link.
    await admin.from('batch_meeting_credentials').delete().eq('batch_id', id);
  }

  revalidateBatch(batchId ?? undefined);
  redirect(`/admin/batches/${batchId}`);
}

export async function deleteBatch(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get('id') as string;

  // Credentials, assignments and cancellations all cascade on batch delete.
  const { error } = await admin.from('batches').delete().eq('id', id);
  if (error) throw new Error(`Could not delete the batch: ${error.message}`);

  revalidateBatch();
  redirect('/admin/batches');
}

export async function setBatchStatus(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get('id') as string;
  const status = formData.get('status') as BatchStatus;

  const { error } = await admin.from('batches').update({ status }).eq('id', id);
  if (error) throw new Error(`Could not update the batch status: ${error.message}`);

  revalidateBatch(id);
}

// ── Roster ──────────────────────────────────────────────────────────────────

export async function assignMember(formData: FormData) {
  const adminUserId = await requireAdmin();
  const admin = createAdminClient();

  const batchId = formData.get('batch_id') as string;
  const userId = formData.get('user_id') as string;
  if (!batchId || !userId) throw new Error('Missing batch or member.');

  const { data: batch } = await admin.from('batches').select('capacity').eq('id', batchId).single();
  const { count } = await admin
    .from('batch_members')
    .select('id', { count: 'exact', head: true })
    .eq('batch_id', batchId)
    .eq('status', 'active');

  if (batch && typeof count === 'number' && count >= batch.capacity) {
    throw new Error(`This batch is already at its capacity of ${batch.capacity}. Raise the capacity first.`);
  }

  // Re-assigning someone previously removed should reactivate their row rather
  // than fail on the (batch_id, user_id) unique constraint.
  const { error } = await admin.from('batch_members').upsert(
    { batch_id: batchId, user_id: userId, status: 'active', assigned_by: adminUserId, assigned_at: new Date().toISOString() },
    { onConflict: 'batch_id,user_id' }
  );
  if (error) throw new Error(`Could not assign this member: ${error.message}`);

  // Tell them. Without this the member has no way to learn they've been placed
  // in a batch except by happening to open their dashboard, which makes the
  // admin's assignment feel like it did nothing.
  //
  // Wrapped, not merely awaited: the upsert above has already committed, so a
  // throw here would skip revalidateBatch below and show the admin an error
  // *and* a roster missing the member they just added — the most confusing
  // possible outcome. safeSend swallows send failures, but that only covers the
  // last of six operations in there; this keeps the invariant local.
  try {
    await notifyAssignment(admin, batchId, userId);
  } catch (err) {
    console.error('[assignMember] assignment email failed', { batchId, userId }, err);
  }

  revalidateBatch(batchId);
}

/**
 * Best-effort "you're in a batch" email. Separate from assignMember so the
 * happy path there stays readable, and so a missing profile or class name
 * degrades to sending nothing rather than throwing after the write succeeded.
 */
async function notifyAssignment(
  admin: ReturnType<typeof createAdminClient>,
  batchId: string,
  userId: string
) {
  const [{ data: profile }, { data: batch }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', userId).single(),
    admin
      .from('batches')
      .select('name, instructor_name, start_time, weekdays, class:classes(name)')
      .eq('id', batchId)
      .single(),
  ]);
  if (!batch) return;

  // profiles has no email column — it lives on auth.users, which only the
  // service-role key can read.
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return;

  // PostgREST types an embedded to-one relation as an array, so normalise
  // rather than asserting one shape and being wrong at runtime.
  const embedded = batch.class as { name: string } | { name: string }[] | null;
  const className =
    (Array.isArray(embedded) ? embedded[0]?.name : embedded?.name) ?? batch.name ?? 'your class';

  await sendBatchAssignmentEmail(
    email,
    profile?.full_name || 'there',
    className,
    // `?? []` rather than a cast: formatWeekdays spreads its argument, so a null
    // column would throw a TypeError here.
    formatWeekdays(batch.weekdays ?? []),
    formatStudioTime(batch.start_time),
    batch.instructor_name
  );
}

export async function removeMember(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const batchId = formData.get('batch_id') as string;
  const userId = formData.get('user_id') as string;

  // Soft-remove keeps the audit trail of who was in the batch and when.
  const { error } = await admin
    .from('batch_members')
    .update({ status: 'removed' })
    .eq('batch_id', batchId)
    .eq('user_id', userId);
  if (error) throw new Error(`Could not remove this member: ${error.message}`);

  revalidateBatch(batchId);
}

// ── Cancelling a single session ─────────────────────────────────────────────

export async function cancelSession(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const batchId = formData.get('batch_id') as string;
  const sessionDate = formData.get('session_date') as string;

  const { error } = await admin.from('batch_cancellations').upsert(
    { batch_id: batchId, session_date: sessionDate, reason: nullable(formData, 'reason') },
    { onConflict: 'batch_id,session_date' }
  );
  if (error) throw new Error(`Could not cancel that session: ${error.message}`);

  revalidateBatch(batchId);
}

export async function restoreSession(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const batchId = formData.get('batch_id') as string;
  const sessionDate = formData.get('session_date') as string;

  const { error } = await admin
    .from('batch_cancellations')
    .delete()
    .eq('batch_id', batchId)
    .eq('session_date', sessionDate);
  if (error) throw new Error(`Could not restore that session: ${error.message}`);

  revalidateBatch(batchId);
}
