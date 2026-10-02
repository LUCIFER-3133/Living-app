'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction as requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import type { BillingInterval } from '@/types/database';

/** Postgres unique-constraint violation, surfaced through PostgREST. */
const UNIQUE_VIOLATION = '23505';

export async function savePlan(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = formData.get('id') as string | null;
  const name = ((formData.get('name') as string) ?? '').trim();
  const featuresRaw = (formData.get('features') as string) ?? '';

  // A Server Action is a public endpoint — the browser's `required` attribute
  // is not a check. Without this, slugify(null) throws and the admin gets a
  // 500 page instead of a message.
  if (!name) redirect('/admin/memberships?notice=name_required');

  const payload = {
    name,
    slug: slugify(name),
    description: (formData.get('description') as string) || null,
    price: Number(formData.get('price')),
    billing_interval: formData.get('billing_interval') as BillingInterval,
    features: featuresRaw.split('\n').map((f) => f.trim()).filter(Boolean),
    status: formData.get('status') as 'active' | 'inactive',
  };

  // `slug` is unique and recomputed from `name` on every save, so renaming a
  // plan onto an existing one is a routine 23505 — not an edge case. The
  // previous version discarded the error and redirected anyway, so the admin
  // watched their edit silently evaporate.
  const { error } = id
    ? await admin.from('membership_plans').update(payload).eq('id', id)
    : await admin.from('membership_plans').insert(payload);

  if (error) {
    console.error('[memberships] save failed:', error);
    redirect(`/admin/memberships?notice=${error.code === UNIQUE_VIOLATION ? 'slug_taken' : 'save_failed'}`);
  }

  revalidatePath('/admin/memberships');
  revalidatePath('/membership');
  redirect('/admin/memberships');
}

export async function deletePlan(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get('id') as string;

  // A plan can't be hard-deleted once any membership (active, expired, or
  // cancelled) references it — memberships.plan_id has no ON DELETE rule,
  // so Postgres rejects the delete to avoid orphaning that history. The
  // previous version of this action ignored that error entirely, so the
  // delete silently no-op'd with zero feedback. Instead: if anything
  // references this plan, deactivate it (hides it from /membership,
  // blocks new purchases, preserves existing members' records); only
  // hard-delete when nothing ever referenced it.
  const { count, error: countErr } = await admin
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', id);

  // Fail closed. If we can't establish whether anyone is on this plan, deleting
  // on the assumption that nobody is would be rejected by the FK at best and
  // destroy billing history at worst.
  if (countErr) {
    console.error('[memberships] dependency check failed:', countErr);
    redirect('/admin/memberships?notice=error');
  }

  let notice: string;
  if (count && count > 0) {
    const { error } = await admin.from('membership_plans').update({ status: 'inactive' }).eq('id', id);
    if (error) {
      console.error('[memberships] deactivate failed:', error);
      notice = 'error';
    } else {
      notice = 'deactivated';
    }
  } else {
    const { error } = await admin.from('membership_plans').delete().eq('id', id);
    if (error) {
      console.error('[memberships] delete failed:', error);
      notice = 'error';
    } else {
      notice = 'deleted';
    }
  }

  revalidatePath('/admin/memberships');
  revalidatePath('/membership');
  redirect(`/admin/memberships?notice=${notice}`);
}
