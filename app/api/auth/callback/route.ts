import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/auth/callback
// Lands every Supabase auth email link here: sign-up confirmation, and
// password-reset. Supabase's PKCE flow hands back a `code` that has to be
// exchanged for a session before the destination page can do anything
// (updateUser({ password }) on /reset-password, for instance, needs an
// active session — without this route, that link had nowhere to go).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
