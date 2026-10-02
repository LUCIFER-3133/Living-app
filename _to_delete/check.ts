import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Pub = Database['public'];
type CheckTables = Pub['Tables']['classes'];
const x: CheckTables = { Row: {} as any, Insert: {} as any, Update: {} as any, Relationships: [] };

function f(c: SupabaseClient<Database>) {
  return c.from('classes').select('*');
}
