import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate, formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, { text: string; tone: 'moss' | 'gold' }> = {
  deleted: { text: 'Plan deleted.', tone: 'moss' },
  deactivated: { text: 'This plan has existing members, so it was deactivated instead of deleted — it no longer shows on /membership or accepts new purchases, but existing members keep their history.', tone: 'gold' },
  slug_taken: { text: 'Another plan already uses that name. Pick a different one — the web address is derived from the name, so two plans cannot share it.', tone: 'gold' },
  name_required: { text: 'A plan needs a name. Nothing was saved.', tone: 'gold' },
  save_failed: { text: 'That plan could not be saved — check the server logs. Nothing was changed.', tone: 'gold' },
  error: { text: 'Something went wrong deleting that plan — check the server logs. Nothing was changed.', tone: 'gold' },
};

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const [{ data: plans }, { data: memberships }] = await Promise.all([
    admin.from('membership_plans').select('*').order('price'),
    admin.from('memberships').select('*, profile:profiles(full_name), plan:membership_plans(name)').order('created_at', { ascending: false }).limit(50),
  ]);

  // hasOwnProperty, not a bare lookup: `notice` comes from the query string, so
  // ?notice=__proto__ would otherwise resolve to an inherited object and render
  // an empty notice card.
  const noticeInfo =
    notice && Object.prototype.hasOwnProperty.call(NOTICES, notice) ? NOTICES[notice] : null;

  return (
    <div className="space-y-12">
      {noticeInfo && (
        <p className={`glass-card p-4 text-sm normal-case font-normal ${noticeInfo.tone === 'gold' ? 'text-gold' : 'text-moss'}`}>
          {noticeInfo.text}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-display-md">Membership Plans</h1>
          <Link href="/admin/memberships/new" className="btn-primary !px-4 !py-2 !text-xs">
            <Plus size={14} /> <span>New Plan</span>
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(plans ?? []).map((p) => (
            <Link key={p.id} href={`/admin/memberships/${p.id}`} className="block glass-card p-5 transition-transform hover:-translate-y-0.5">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-ink/60">{formatINR(p.price)} / {p.billing_interval}</p>
              <p className="mt-1 text-xs uppercase text-ink/45">{p.status}</p>
            </Link>
          ))}
          {(!plans || plans.length === 0) && <p className="text-sm text-ink/55">No plans yet — add your first one.</p>}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl">Active Members</h2>
        <div className="mt-4 overflow-x-auto glass-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
              <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Ends</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {(memberships ?? []).map((m: any) => (
                <tr key={m.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">{m.profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">{m.plan?.name}</td>
                  <td className="px-4 py-3">{formatDate(m.end_date)}</td>
                  <td className="px-4 py-3 capitalize">{m.status}</td>
                </tr>
              ))}
              {(!memberships || memberships.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/50">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
