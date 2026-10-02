import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

async function f(c: SupabaseClient<Database>) {
  await c.from('memberships').update({ status: 'cancelled' }).eq('user_id', '1');
}
