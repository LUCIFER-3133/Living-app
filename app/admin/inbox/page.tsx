import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import InboxComposer from '@/components/admin/InboxComposer';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, { text: string; tone: 'moss' | 'gold' }> = {
  fields_required: { text: 'A title and message are both required. Nothing was sent.', tone: 'gold' },
  no_recipients: { text: 'That audience is empty right now — nothing was sent.', tone: 'gold' },
  send_failed: { text: 'That message could not be sent — check the server logs.', tone: 'gold' },
};

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; count?: string }>;
}) {
  const { notice, count } = await searchParams;
  await requireAdminPage();
  const admin = createAdminClient();

  // The composer inserts one row per recipient (see sendInboxMessage), so
  // "recent sends" groups those back into one line per broadcast — by
  // title + body + the same created_at timestamp, which is exact since
  // every row in one send shares a single `new Date()` from the insert.
  const { data: sent } = await admin
    .from('inbox_messages')
    .select('title, body, link, created_at, category')
    .eq('category', 'admin')
    .not('sender_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);

  const grouped = new Map<string, { title: string; body: string; link: string | null; created_at: string; count: number }>();
  for (const m of sent ?? []) {
    const key = `${m.title}|${m.body}|${m.created_at}`;
    const existing = grouped.get(key);
    if (existing) existing.count += 1;
    else grouped.set(key, { title: m.title, body: m.body, link: m.link, created_at: m.created_at, count: 1 });
  }
  const recentSends = Array.from(grouped.values()).slice(0, 30);

  const noticeInfo = notice && Object.prototype.hasOwnProperty.call(NOTICES, notice) ? NOTICES[notice] : null;

  return (
    <div>
      {noticeInfo && (
        <p className={`glass-card mb-8 p-4 text-sm normal-case font-normal ${noticeInfo.tone === 'gold' ? 'text-gold' : 'text-moss'}`}>
          {noticeInfo.text}
        </p>
      )}
      {notice === 'sent' && (
        <p className="glass-card mb-8 p-4 text-sm normal-case font-normal text-moss">
          Sent to {count ?? 'your recipients'}{count === '1' ? ' member' : ' members'}.
        </p>
      )}

      <div>
        <h1 className="text-display-md">Inbox</h1>
        <p className="mt-1 text-sm text-ink/55">
          Message your members directly in the app. They&apos;ll also get automatic reminders here — a daily
          heads-up for classes in their live batch that day, and a warning 3 days before a membership expires —
          you don&apos;t need to send those yourself.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="font-display text-lg">Compose</h2>
          <div className="mt-4">
            <InboxComposer />
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg">Recently sent</h2>
          <div className="mt-4 space-y-3">
            {recentSends.length === 0 && (
              <p className="glass-card p-6 text-center text-sm text-ink/50">Nothing sent yet.</p>
            )}
            {recentSends.map((m, i) => (
              <div key={i} className="glass-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">{m.title}</p>
                  <span className="shrink-0 text-xs text-ink/45">{formatDate(m.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-ink/65">{m.body}</p>
                <p className="mt-2 text-xs text-ink/45">Sent to {m.count} member{m.count === 1 ? '' : 's'}{m.link ? ` · links to ${m.link}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
