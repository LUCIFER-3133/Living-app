'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function TopRightAuth() {
  const [account, setAccount] = useState<{ name: string; isAdmin: boolean } | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    async function loadAccount(userId: string, email: string | undefined) {
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', userId).single();
      setAccount({ name: profile?.full_name || email || 'Account', isAdmin: profile?.role === 'admin' });
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) loadAccount(data.user.id, data.user.email);
      else setAccount(null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadAccount(session.user.id, session.user.email);
      else setAccount(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const profileHref = account?.isAdmin ? '/admin' : '/dashboard';
  const initials = account?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="fixed right-4 z-50 sm:right-6"
      // Adds the iOS/Android status-bar inset on top of the normal spacing
      // instead of replacing it, so this stays right-4/top-4 on the web
      // (env() resolves to 0 there) and clears the notch inside the app shell.
      style={{ top: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
    >
      {account === undefined ? (
        <div className="h-11 w-11 animate-pulse rounded-full bg-ink/10 backdrop-blur-md" />
      ) : account ? (
        <Link
          href={profileHref}
          aria-label="Your account"
          className="glass-panel flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-ink transition-transform duration-300 hover:scale-105"
        >
          {initials || <User size={16} />}
        </Link>
      ) : (
        <div className="glass-panel flex items-center gap-1 rounded-full p-1">
          <Link href="/login" className="rounded-full px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-white/50">
            Log in
          </Link>
          <Link href="/signup" className="btn-secondary !px-4 !py-2 !text-xs">
            <span>Sign up</span>
          </Link>
        </div>
      )}
    </div>
  );
}
