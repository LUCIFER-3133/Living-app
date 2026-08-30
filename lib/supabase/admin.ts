import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// SERVICE ROLE CLIENT — bypasses Row Level Security entirely.
// Only ever import this inside app/api/** route handlers or other
// server-only trusted code (webhook handlers, admin actions).
// NEVER import this into a client component or expose the key to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
