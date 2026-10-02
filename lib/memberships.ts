import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// A membership counts as "active" only if its status says so AND its
// end_date hasn't passed — status alone can go stale if nothing has run
// the expiry job yet, so we check both.
export async function hasActiveMembership(supabase: SupabaseClient<Database>, userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', today)
    .limit(1)
    .maybeSingle();

  return !!data;
}
