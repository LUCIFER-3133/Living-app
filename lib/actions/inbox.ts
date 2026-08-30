'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAction as requireAdmin } from '@/lib/auth';

export type InboxAudience = 'all' | 'active' | 'inactive';

/**
 * Resolves an audience keyword to the user ids it currently matches.
 * "active"/"inactive" mirror the same in-effect-today definition used
 * everywhere else membership status is judged (app/admin/users/page.tsx,
 * app/dashboard/page.tsx): a membership counts as currently active only if
 * it's status='active', unexpired, AND already started — a queued future
 * membership doesn't make someone "active" yet.
 */
async function resolveAudience(admin: ReturnType<typeof createAdminClient>, audience: InboxAudience): Promise<string[]> {
  const { data: profiles } = await admin.from('profiles').select('id');
  const allIds = (profiles ?? []).map((p) => p.id);
  if (audience === 'all') return allIds;

  const today = new Date().toISOString().slice(0, 10);
  const { data: current } = await admin
    .from('memberships')
    .select('user_id')
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today);

  const activeIds = new Set((current ?? []).map((m) => m.user_id));
  return audience === 'active' ? allIds.filter((id) => activeIds.has(id)) : allIds.filter((id) => !activeIds.has(id));
}

/**
 * Admin composer: broadcast to an audience, or DM a single member (from
 * their profile page — see the "Send message" form in
 * app/admin/users/[id]/page.tsx, which sets user_id and leaves audience
 * unset).
 */
export async function sendInboxMessage(formData: FormData) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const title = ((formData.get('title') as string) ?? '').trim();
  const body = ((formData.get('body') as string) ?? '').trim();
  const link = ((formData.get('link') as string) ?? '').trim() || null;
  const singleUserId = (formData.get('user_id') as string) || null;
  const audience = (formData.get('audience') as InboxAudience) || 'all';
  const redirectTo = singleUserId ? `/admin/users/${singleUserId}` : '/admin/inbox';

  if (!title || !body) redirect(`${redirectTo}?notice=fields_required`);

  const recipientIds = singleUserId ? [singleUserId] : await resolveAudience(admin, audience);

  if (recipientIds.length === 0) redirect(`${redirectTo}?notice=no_recipients`);

  const rows = recipientIds.map((user_id) => ({
    user_id,
    sender_id: adminId,
    category: 'admin' as const,
    title,
    body,
    link,
  }));

  const { error } = await admin.from('inbox_messages').insert(rows);
  if (error) {
    console.error('[inbox] send failed:', error);
    redirect(`${redirectTo}?notice=send_failed`);
  }

  revalidatePath('/admin/inbox');
  if (singleUserId) revalidatePath(`/admin/users/${singleUserId}`);
  redirect(`${redirectTo}?notice=sent&count=${recipientIds.length}`);
}

/**
 * Member-facing: marks every one of the signed-in user's unread messages as
 * read. Uses the request-scoped (RLS-respecting) client rather than the
 * admin client — there's no need to bypass RLS to update your own rows, and
 * not bypassing it means the "only read_at may change" trigger stays a real
 * guarantee for this path too, not just for a hypothetical attacker.
 */
export async function markAllInboxRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('inbox_messages').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  revalidatePath('/dashboard/inbox');
}
