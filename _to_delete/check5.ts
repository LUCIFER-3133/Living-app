import type { Database } from '@/types/database';

type M = Database['public']['Tables']['memberships'];
type U = M['Update'];
const x: U = { status: 'cancelled' };
