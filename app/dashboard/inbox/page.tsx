import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bell, Calendar, Megaphone, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import type { InboxCategory } from '@/types/database';

export const metadata: Metadata = { title: 'Inbox' };
export const dynamic = 'force-dynamic';

const CATEGORY_META: Record<InboxCategory, { label: string; icon: typeof Bell; tone: string }> = {
  admin: { label: 'From the studio', icon: Megaphone, tone: 'text-moss' },
  class_reminder: { label: 'Class reminder', icon: Calendar, tone: 'text-stone-700' },
  membership_renewal: { label: 'Membership', icon: RefreshCw, tone: 'text-gold' },
  system: { label: 'Notice', icon: Bell, tone: 'text-ink/60' },
};

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects

  // Visiting the inbox is what "reads" it — mark everything unread as read
  // before rendering, so the badge elsewhere in the app clears the moment
  // someone actually looks at their messages, same as any normal inbox.
  await supabase.from('inbox_messages').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);

  const { data: messages } = await supabase
    .from('inbox_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-display-md">Inbox</h1>
      <p className="mt-1 text-sm text-ink/55">Messages from the studio, plus your class and membership reminders.</p>

      <div className="mt-8 space-y-3">
        {(!messages || messages.length === 0) && (
          <p className="glass-card p-8 text-center text-sm text-ink/50">Nothing here yet.</p>
        )}
        {(messages ?? []).map((m) => {
          const meta = CATEGORY_META[m.category as InboxCategory] ?? CATEGORY_META.system;
          const Icon = meta.icon;
          return (
            <div key={m.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${meta.tone}`}>
                  <Icon size={13} />
                  <span>{meta.label}</span>
                </div>
                <span className="shrink-0 text-xs text-ink/40">{formatDate(m.created_at)}</span>
              </div>
              <p className="mt-2 font-display text-lg">{m.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{m.body}</p>
              {m.link && (
                <Link href={m.link} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-moss link-underline">
                  <span>View</span> <ArrowRight size={14} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
