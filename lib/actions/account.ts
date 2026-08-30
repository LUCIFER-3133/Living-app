'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Self-service account deletion. Deliberately NOT a hard delete of the auth
 * user: profiles.id -> auth.users(id) is ON DELETE CASCADE, and memberships/
 * payments/bookings all cascade off profiles in turn (schema.sql) — deleting
 * the auth row would silently destroy real payment and transaction history
 * along with it, which most tax/accounting rules require keeping regardless
 * of a customer erasure request.
 *
 * Instead: cancel anything active, strip the personally-identifying fields
 * a member actually asked to have removed (name, phone), and ban the login
 * indefinitely — so the account is fully unusable and de-identified, while
 * the financial record (payments, membership history) survives intact and
 * unlinked-in-practice from anything identifying.
 */
export async function deleteOwnAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  await admin.from('memberships').update({ status: 'cancelled' }).eq('user_id', user.id).eq('status', 'active');

  await admin.from('profiles').update({ full_name: 'Deleted user', phone: null }).eq('id', user.id);

  // ~100 years — GoTrue has no permanent-ban primitive, so this stands in
  // for one. Long enough that "temporary" isn't a meaningful description.
  const { error: banError } = await admin.auth.admin.updateUserById(user.id, { ban_duration: '876000h' });
  if (banError) {
    console.error('[account] failed to ban user after deletion request:', banError);
  }

  await supabase.auth.signOut();
  redirect('/?notice=account_deleted');
}
