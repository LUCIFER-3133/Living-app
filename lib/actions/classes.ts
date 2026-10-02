'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction as requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import type { Difficulty } from '@/types/database';

/** Postgres unique-constraint violation, surfaced through PostgREST. */
const UNIQUE_VIOLATION = '23505';

export async function saveClass(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = formData.get('id') as string | null;
  const name = ((formData.get('name') as string) ?? '').trim();

  // A Server Action is a public endpoint — the browser's `required` attribute
  // is not a check. Without this, slugify(null) throws and the admin gets a
  // 500 page instead of a message.
  if (!name) redirect('/admin/classes?notice=name_required');

  const payload = {
    name,
    slug: slugify(name),
    category: formData.get('category') as string,
    short_description: formData.get('short_description') as string,
    long_description: (formData.get('long_description') as string) || null,
    image_url: (formData.get('image_url') as string) || null,
    duration_minutes: Number(formData.get('duration_minutes')),
    difficulty: formData.get('difficulty') as Difficulty,
    price: Number(formData.get('price')),
    is_active: formData.get('is_active') === 'on',
  };

  // `slug` is unique and recomputed from `name` on every save, so renaming a
  // class onto an existing one is a routine 23505 — not an edge case. The
  // previous version discarded the error and redirected anyway, so the admin
  // watched their edit silently evaporate.
  const { error } = id
    ? await admin.from('classes').update(payload).eq('id', id)
    : await admin.from('classes').insert(payload);

  if (error) {
    console.error('[classes] save failed:', error);
    redirect(`/admin/classes?notice=${error.code === UNIQUE_VIOLATION ? 'slug_taken' : 'save_failed'}`);
  }

  revalidatePath('/admin/classes');
  revalidatePath('/classes');
  redirect('/admin/classes');
}

type Dependents =
  | { ok: true; batches: number; bookings: number }
  | { ok: false };

/**
 * What would be destroyed along with this class.
 *
 *   batches.class_id     ON DELETE RESTRICT — Postgres rejects the delete
 *                        outright (batches.sql).
 *   class_schedules      ON DELETE CASCADE from classes, and bookings.schedule_id
 *                        cascades off *that* in turn (schema.sql). So a hard
 *                        delete quietly takes booking history with it, while
 *                        bookings.payment_id is ON DELETE SET NULL — leaving paid
 *                        payment rows pointing at nothing. deletePlan refuses to
 *                        destroy billing history, and this has to match it.
 *
 * Returns `{ ok: false }` rather than 0 if it cannot establish the answer, so
 * the caller can fail closed. Counting bookings through two plain queries
 * instead of one PostgREST embedded filter is deliberate: an embedded filter
 * that silently matched nothing would read as "safe to delete".
 */
async function countDependents(
  admin: ReturnType<typeof createAdminClient>,
  classId: string
): Promise<Dependents> {
  const { count: batches, error: batchErr } = await admin
    .from('batches')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId);
  if (batchErr) {
    console.error('[classes] batch dependency check failed:', batchErr);
    return { ok: false };
  }

  const { data: schedules, error: schedErr } = await admin
    .from('class_schedules')
    .select('id')
    .eq('class_id', classId);
  if (schedErr) {
    console.error('[classes] schedule lookup failed:', schedErr);
    return { ok: false };
  }
  if (!schedules?.length) return { ok: true, batches: batches ?? 0, bookings: 0 };

  const { count: bookings, error: bookingErr } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('schedule_id', schedules.map((s) => s.id));
  if (bookingErr) {
    console.error('[classes] booking dependency check failed:', bookingErr);
    return { ok: false };
  }

  return { ok: true, batches: batches ?? 0, bookings: bookings ?? 0 };
}

export async function deleteClass(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get('id') as string;
  if (!id) redirect('/admin/classes?notice=error');

  const deps = await countDependents(admin, id);

  let notice: string;
  if (!deps.ok) {
    // Could not establish what depends on this class. Deleting on an unknown is
    // exactly how history disappears, so do nothing and say so.
    notice = 'error';
  } else if (deps.batches > 0 || deps.bookings > 0) {
    const reason = deps.batches > 0 ? 'deactivated_batch' : 'deactivated_history';
    const { error } = await admin.from('classes').update({ is_active: false }).eq('id', id);
    if (error) {
      console.error('[classes] deactivate failed:', error);
      notice = 'error';
    } else {
      notice = reason;
    }
  } else {
    const { error } = await admin.from('classes').delete().eq('id', id);
    if (error) {
      console.error('[classes] delete failed:', error);
      notice = 'error';
    } else {
      notice = 'deleted';
    }
  }

  revalidatePath('/admin/classes');
  revalidatePath('/classes');
  redirect(`/admin/classes?notice=${notice}`);
}
