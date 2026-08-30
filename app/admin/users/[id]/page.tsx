import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck, ShieldOff } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate, formatINR } from '@/lib/utils';
import { grantMembership, extendMembership, cancelMembership, setUserRole } from '@/lib/actions/members';
import { sendInboxMessage } from '@/lib/actions/inbox';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, { text: string; tone: 'moss' | 'gold' }> = {
  granted: { text: 'Membership granted.', tone: 'moss' },
  extended: { text: 'Membership extended.', tone: 'moss' },
  cancelled: { text: 'Membership cancelled.', tone: 'moss' },
  role_updated: { text: 'Role updated.', tone: 'moss' },
  grant_failed: { text: 'Could not grant membership — check the server logs.', tone: 'gold' },
  extend_failed: { text: 'Could not extend membership — check the server logs.', tone: 'gold' },
  cancel_failed: { text: 'Could not cancel membership — check the server logs.', tone: 'gold' },
  role_failed: { text: 'Could not update role — check the server logs.', tone: 'gold' },
  sent: { text: 'Message sent.', tone: 'moss' },
  fields_required: { text: 'A title and message are both required. Nothing was sent.', tone: 'gold' },
  send_failed: { text: 'That message could not be sent — check the server logs.', tone: 'gold' },
};

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  await requireAdminPage();
  const admin = createAdminClient();

  const [{ data: profile }, { data: authUser }, { data: memberships }, { data: payments }, { data: plans }, { data: bookings }] =
    await Promise.all([
      admin.from('profiles').select('*').eq('id', id).single(),
      admin.auth.admin.getUserById(id),
      admin
        .from('memberships')
        .select('*, plan:membership_plans(name)')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      admin.from('payments').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
      admin.from('membership_plans').select('*').eq('status', 'active').order('price'),
      admin
        .from('bookings')
        .select('*, schedule:class_schedules(start_time, class:classes(name))')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  if (!profile) notFound();

  const today = new Date().toISOString().slice(0, 10);
  // The one actually in effect today, not just the most recently created —
  // a second purchase while a membership was already active is queued to
  // start later (see /api/memberships/verify), so it must not be mistaken
  // for the current one here.
  const unexpired = (memberships ?? []).filter((m) => m.status === 'active' && m.end_date >= today);
  const activeMembership = unexpired.find((m) => m.start_date <= today) as any;
  const queuedMembershipIds = new Set(unexpired.filter((m) => m !== activeMembership).map((m) => m.id));

  const noticeInfo = notice && Object.prototype.hasOwnProperty.call(NOTICES, notice) ? NOTICES[notice] : null;

  return (
    <div className="space-y-10">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-ink/55 hover:text-ink">
        <ArrowLeft size={14} /> Back to members
      </Link>

      {noticeInfo && (
        <p className={`glass-card p-4 text-sm normal-case font-normal ${noticeInfo.tone === 'gold' ? 'text-gold' : 'text-moss'}`}>
          {noticeInfo.text}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-display-md">{profile.full_name || 'Unnamed member'}</h1>
          <p className="mt-1 text-sm text-ink/60">{authUser?.user?.email}</p>
          <p className="mt-0.5 text-sm text-ink/50">{profile.phone || 'No phone on file'} · Joined {formatDate(profile.created_at)}</p>
        </div>

        <form action={setUserRole}>
          <input type="hidden" name="user_id" value={id} />
          <input type="hidden" name="role" value={profile.role === 'admin' ? 'user' : 'admin'} />
          <button type="submit" className="btn-outline !px-4 !py-2 !text-xs">
            {profile.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
            <span>{profile.role === 'admin' ? 'Remove admin access' : 'Make admin'}</span>
          </button>
        </form>
      </div>

      {/* ── Send a message ── */}
      <section>
        <h2 className="font-display text-xl">Send a message</h2>
        <p className="mt-1 text-sm text-ink/55">Goes straight to their inbox in the app — see /admin/inbox to message everyone at once instead.</p>
        <form action={sendInboxMessage} className="mt-4 space-y-4 glass-card p-6">
          <input type="hidden" name="user_id" value={id} />
          <div>
            <label className="text-sm font-medium text-ink">Title</label>
            <input name="title" required maxLength={120} className="input-field" placeholder="About your last class" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Message</label>
            <textarea name="body" required rows={3} className="input-field resize-none" placeholder="What you want to tell them" />
          </div>
          <button type="submit" className="btn-outline !px-4 !py-2 !text-xs"><span>Send</span></button>
        </form>
      </section>

      {/* ── Membership ── */}
      <section>
        <h2 className="font-display text-xl">Membership</h2>

        {activeMembership ? (
          <div className="mt-4 glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">{activeMembership.plan?.name}</p>
                <p className="mt-1 text-sm text-ink/60">
                  Active {formatDate(activeMembership.start_date)} → {formatDate(activeMembership.end_date)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={extendMembership} className="flex items-center gap-2">
                  <input type="hidden" name="user_id" value={id} />
                  <input type="hidden" name="membership_id" value={activeMembership.id} />
                  <select name="days" className="input-field !mt-0 !w-auto !py-2 text-xs" defaultValue="30">
                    <option value="7">+7 days</option>
                    <option value="30">+30 days</option>
                    <option value="90">+90 days</option>
                    <option value="-30">-30 days</option>
                  </select>
                  <button type="submit" className="btn-outline !px-3 !py-2 !text-xs"><span>Apply</span></button>
                </form>
                <form action={cancelMembership}>
                  <input type="hidden" name="user_id" value={id} />
                  <input type="hidden" name="membership_id" value={activeMembership.id} />
                  <button type="submit" className="btn-outline !px-3 !py-2 !text-xs !text-gold"><span>Cancel</span></button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 glass-card p-6">
            <p className="text-sm text-ink/60">No active membership. Grant one manually (offline payment, goodwill, support case) — this doesn&apos;t create a Razorpay charge.</p>
            <form action={grantMembership} className="mt-4 flex flex-wrap items-center gap-2">
              <input type="hidden" name="user_id" value={id} />
              <select name="plan_id" className="input-field !mt-0 !w-auto" required>
                <option value="" disabled selected>Choose a plan</option>
                {(plans ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatINR(p.price)}</option>
                ))}
              </select>
              <button type="submit" className="btn-primary !px-4 !py-2.5 !text-xs"><span>Grant membership</span></button>
            </form>
          </div>
        )}

        {(memberships?.length ?? 0) > 0 && (
          <div className="mt-4 overflow-x-auto glass-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
                <tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {(memberships ?? []).map((m: any) => (
                  <tr key={m.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">{m.plan?.name}</td>
                    <td className="px-4 py-3">{formatDate(m.start_date)} → {formatDate(m.end_date)}</td>
                    <td className="px-4 py-3 capitalize">
                      {queuedMembershipIds.has(m.id) ? (
                        <span className="rounded-full bg-moss/10 px-2 py-0.5 text-xs font-medium normal-case text-moss">Upcoming</span>
                      ) : (
                        m.status
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Payments ── */}
      <section>
        <h2 className="font-display text-xl">Payment history</h2>
        <div className="mt-4 overflow-x-auto glass-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {(payments ?? []).map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3 capitalize">{p.type}</td>
                  <td className="px-4 py-3">{formatINR(Number(p.amount))}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/50">No payments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Bookings ── */}
      {(bookings?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-display text-xl">Recent bookings</h2>
          <div className="mt-4 overflow-x-auto glass-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
                <tr><th className="px-4 py-3">Class</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {(bookings ?? []).map((b: any) => (
                  <tr key={b.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">{b.schedule?.class?.name ?? '—'}</td>
                    <td className="px-4 py-3">{b.schedule?.start_time ? formatDate(b.schedule.start_time) : '—'}</td>
                    <td className="px-4 py-3 capitalize">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
