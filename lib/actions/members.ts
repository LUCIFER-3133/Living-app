'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction as requireAdmin } from '@/lib/auth';

const INTERVAL_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  half_yearly: 180,
  yearly: 365,
};

/**
 * Manual membership grant — the admin-side override that didn't exist
 * before. Covers goodwill extensions, offline/cash payments, and support
 * cases, without needing a Razorpay order. `payment_id` stays null, which
 * is exactly how the schema already distinguishes an admin-granted
 * membership from a paid one (see the partial unique index on
 * memberships.payment_id).
 */
export async function grantMembership(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const userId = formData.get('user_id') as string;
  const planId = formData.get('plan_id') as string;
  if (!userId || !planId) redirect(`/admin/users/${userId}?notice=grant_failed`);

  const { data: plan } = await admin.from('membership_plans').select('billing_interval').eq('id', planId).single();
  if (!plan) redirect(`/admin/users/${userId}?notice=grant_failed`);

  // Same chaining rule as a self-serve purchase (/api/memberships/verify):
  // if this member already has something running or queued, the grant
  // starts the day after that ends instead of overlapping it.
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await admin
    .from('memberships')
    .select('end_date')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', today)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const days = INTERVAL_DAYS[plan.billing_interval] ?? 30;
  let startDate = new Date();
  if (existing?.end_date) {
    const chainedStart = new Date(existing.end_date);
    chainedStart.setDate(chainedStart.getDate() + 1);
    if (chainedStart > startDate) startDate = chainedStart;
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  const { error } = await admin.from('memberships').insert({
    user_id: userId,
    plan_id: planId,
    status: 'active',
    start_date: startDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10),
  });

  const notice = error ? 'grant_failed' : 'granted';
  if (error) console.error('[members] grant failed:', error);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/memberships');
  redirect(`/admin/users/${userId}?notice=${notice}`);
}

/** Pushes an active membership's end date out by N days — for goodwill extensions. */
export async function extendMembership(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const userId = formData.get('user_id') as string;
  const membershipId = formData.get('membership_id') as string;
  const days = Number(formData.get('days'));

  if (!membershipId || !Number.isFinite(days) || days === 0) {
    redirect(`/admin/users/${userId}?notice=extend_failed`);
  }

  const { data: membership } = await admin.from('memberships').select('end_date').eq('id', membershipId).single();
  if (!membership) redirect(`/admin/users/${userId}?notice=extend_failed`);

  const newEnd = new Date(membership.end_date);
  newEnd.setDate(newEnd.getDate() + days);

  const { error } = await admin
    .from('memberships')
    .update({ end_date: newEnd.toISOString().slice(0, 10) })
    .eq('id', membershipId);

  const notice = error ? 'extend_failed' : 'extended';
  if (error) console.error('[members] extend failed:', error);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/memberships');
  redirect(`/admin/users/${userId}?notice=${notice}`);
}

/** Ends a membership immediately — sets status to cancelled, doesn't delete history. */
export async function cancelMembership(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const userId = formData.get('user_id') as string;
  const membershipId = formData.get('membership_id') as string;
  if (!membershipId) redirect(`/admin/users/${userId}?notice=cancel_failed`);

  const { error } = await admin.from('memberships').update({ status: 'cancelled' }).eq('id', membershipId);

  const notice = error ? 'cancel_failed' : 'cancelled';
  if (error) console.error('[members] cancel failed:', error);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/memberships');
  redirect(`/admin/users/${userId}?notice=${notice}`);
}

/**
 * Promote/demote a user's role. Guarded server-side same as every other
 * admin mutation, plus two safeguards specific to this one mutation because
 * of what it can lock you out of:
 *
 *  - An admin can't remove their own admin access. Nothing else in the app
 *    can undo that from inside /admin once it happens — the button would
 *    otherwise be a working "lock myself out" switch on every admin's own
 *    user page.
 *  - The last remaining admin can't be demoted by anyone, for the same
 *    reason: it would leave the whole /admin section unreachable, with no
 *    admin account left to reverse it, short of editing the database
 *    directly.
 */
export async function setUserRole(formData: FormData) {
  const actingAdminId = await requireAdmin();
  const admin = createAdminClient();

  const userId = formData.get('user_id') as string;
  const role = formData.get('role') as string;
  if (!userId || (role !== 'user' && role !== 'admin')) redirect(`/admin/users/${userId}?notice=role_failed`);

  if (role === 'user') {
    if (userId === actingAdminId) {
      redirect(`/admin/users/${userId}?notice=cannot_self_demote`);
    }

    const { count: adminCount } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    if ((adminCount ?? 0) <= 1) {
      redirect(`/admin/users/${userId}?notice=last_admin`);
    }
  }

  const { error } = await admin.from('profiles').update({ role }).eq('id', userId);

  const notice = error ? 'role_failed' : 'role_updated';
  if (error) console.error('[members] role update failed:', error);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  redirect(`/admin/users/${userId}?notice=${notice}`);
}
