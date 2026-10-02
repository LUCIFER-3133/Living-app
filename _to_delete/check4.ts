import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const admin: SupabaseClient<Database> = createSupabaseClient('a','b');

async function f() {
  await admin.from('memberships').update({ status: 'cancelled' }).eq('user_id', '1');
}
