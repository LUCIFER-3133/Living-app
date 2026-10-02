import { createAdminClient } from '@/lib/supabase/admin';

async function f() {
  const admin = createAdminClient();
  await admin.from('memberships').update({ status: 'cancelled' }).eq('user_id', '1');
}
