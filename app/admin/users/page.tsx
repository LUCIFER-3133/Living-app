import Link from 'next/link';
import { Search } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type StatusFilter = 'all' | 'active' | 'expired' | 'none';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active members' },
  { value: 'expired', label: 'Lapsed' },
  { value: 'none', label: 'No membership' },
];

// Member management — this used to be just names, roles and join dates with
// no way to see who's actually paying, search for someone, or open a member
// to act on their account. Now it's the admin-side equivalent of the
// membership status every member sees on their own /dashboard.
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: StatusFilter }>;
}) {
  const { q, status = 'all' } = await searchParams;
  await requireAdminPage();
  const admin = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profiles }, { data: memberships }, { data: authUsers }] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
    admin
      .from('memberships')
      .select('user_id, status, start_date, end_date, plan:membership_plans(name)')
      .order('start_date', { ascending: true }),
    // Email lives on auth.users, not profiles — the admin client is the only
    // way to read it, since nothing mirrors it into a PostgREST-visible table.
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? '']));

  // All membership rows per user, grouped — a member can have several: past
  // (expired/cancelled), the one actually in effect today, and one queued
  // to start once that one ends (see /api/memberships/verify, which chains
  // a second purchase after the first instead of overlapping it).
  const membershipsByUser = new Map<string, { status: string; start_date: string; end_date: string; planName?: string }[]>();
  for (const m of memberships ?? []) {
    const list = membershipsByUser.get(m.user_id) ?? [];
    list.push({ status: m.status, start_date: m.start_date, end_date: m.end_date, planName: (m.plan as any)?.name });
    membershipsByUser.set(m.user_id, list);
  }

  function membershipState(userId: string): { label: string; tone: 'moss' | 'gold' | 'ink'; sortKey: StatusFilter; queuedCount: number } {
    const list = membershipsByUser.get(userId) ?? [];
    const unexpired = list.filter((m) => m.status === 'active' && m.end_date >= today);
    const current = unexpired.find((m) => m.start_date <= today);
    const queuedCount = unexpired.filter((m) => m !== current).length;

    if (current) {
      return { label: `${current.planName ?? 'Active'} · until ${formatDate(current.end_date)}`, tone: 'moss', sortKey: 'active', queuedCount };
    }
    if (unexpired.length > 0) {
      // Queued but nothing in effect yet — e.g. an admin-granted membership
      // that starts in the future with no current plan ahead of it.
      return { label: `Starts ${formatDate(unexpired[0].start_date)}`, tone: 'moss', sortKey: 'active', queuedCount: unexpired.length - 1 };
    }
    const mostRecent = [...list].sort((a, b) => (a.end_date < b.end_date ? 1 : -1))[0];
    if (!mostRecent) return { label: 'No membership', tone: 'ink', sortKey: 'none', queuedCount: 0 };
    return { label: `Lapsed · ${formatDate(mostRecent.end_date)}`, tone: 'gold', sortKey: 'expired', queuedCount: 0 };
  }

  let rows = (profiles ?? []).map((u) => ({
    ...u,
    email: emailById.get(u.id) ?? '',
    membership: membershipState(u.id),
  }));

  if (status !== 'all') {
    rows = rows.filter((r) => r.membership.sortKey === status);
  }
  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    rows = rows.filter(
      (r) => r.full_name?.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle)
    );
  }

  const toneClass: Record<string, string> = {
    moss: 'bg-moss/10 text-moss',
    gold: 'bg-gold/10 text-gold',
    ink: 'bg-ink/5 text-ink/50',
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-md">Members</h1>
        <form className="flex items-center gap-2" action="/admin/users">
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or email…"
              className="input-field !mt-0 w-64 pl-9"
            />
          </div>
        </form>
      </div>

      <div className="mt-6 inline-flex flex-wrap gap-1 rounded-full bg-canvas-dim p-1 text-sm">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(t.value !== 'all' ? { status: t.value } : {}) }).toString()}`}
            className={`rounded-full px-4 py-2 font-medium transition-colors ${
              status === t.value ? 'bg-moss text-canvas shadow-card' : 'text-ink/60 hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto glass-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Membership</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-ink/5 last:border-0 hover:bg-white/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="link-underline font-medium text-ink">
                    {u.full_name || '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/70">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClass[u.membership.tone]}`}>
                    {u.membership.label}
                  </span>
                  {u.membership.queuedCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-ink/5 px-2 py-1 text-[11px] font-medium text-ink/50">
                      +{u.membership.queuedCount} queued
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No members match this search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
