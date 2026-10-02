import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const admin = createSupabaseClient<Database, 'public'>('a','b');

async function f() {
  await admin.from('memberships').update({ status: 'cancelled' }).eq('user_id', '1');
}
