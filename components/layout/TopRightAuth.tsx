'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function TopRightAuth() {
  const [account, setAccount] = useState<{ name: string; isAdmin: boolean } | null | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function loadAccount(userId: string, email: string | undefined) {
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', userId).single();
      setAccount({ name: profile?.full_name || email || 'Account', isAdmin: profile?.role === 'admin' });
    }

    async function loadUnreadCount(userId: string) {
      const { count } = await supabase
        .from('inbox_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);
      setUnreadCount(count ?? 0);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        loadAccount(data.user.id, data.user.email);
        loadUnreadCount(data.user.id);
      } else {
        setAccount(null);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadAccount(session.user.id, session.user.email);
        loadUnreadCount(session.user.id);
      } else {
        setAccount(null);
        setUnreadCount(0);
      }
    });

    // Cheap polling rather than a realtime subscription — this app doesn't
    // use Supabase Realtime anywhere else, and a message landing a minute
    // late in a badge count is a non-issue for what this is (reminders,
    // studio announcements), not worth the added connection/complexity.
    const interval = setInterval(() => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) loadUnreadCount(data.user.id);
      });
    }, 60_000);

    return () => {
      sub.subscription.unsubscribe();
      clearInterval(interval);
    };
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
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/inbox"
            aria-label={unreadCount > 0 ? `Inbox, ${unreadCount} unread` : 'Inbox'}
            className="glass-panel relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-transform duration-300 hover:scale-105"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-canvas">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href={profileHref}
            aria-label="Your account"
            className="glass-panel flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-ink transition-transform duration-300 hover:scale-105"
          >
            {initials || <User size={16} />}
          </Link>
        </div>
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
