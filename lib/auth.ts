import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin checks, done server-side against the database rather than trusted from
 * middleware.
 *
 * Middleware and the /admin layout both gate these routes already. This exists
 * because those are *route* guards, and the things they protect aren't only
 * routes: a page that reads with the service-role client bypasses RLS, and a
 * server action is an individually addressable endpoint. Anything that only
 * guards the page which renders a form is not actually guarding the mutation,
 * and anything that only guards the route is not guarding an RLS bypass.
 */
async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user.id : null;
}

/** For pages: sends non-admins somewhere sensible instead of erroring. */
export async function requireAdminPage(): Promise<string> {
  const userId = await getAdminUserId();
  if (!userId) redirect('/dashboard');
  return userId;
}

/** For server actions: throws, so a mutation can never half-complete. */
export async function requireAdminAction(): Promise<string> {
  const userId = await getAdminUserId();
  if (!userId) throw new Error('Not authorized.');
  return userId;
}
