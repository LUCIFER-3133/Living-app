import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

async function f(c: SupabaseClient<Database>) {
  const { data } = await c.from('memberships').select('*');
  const x: number = data; // deliberately wrong to force TS to print the real type
}
