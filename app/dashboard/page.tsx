import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, CalendarClock, CreditCard, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatINR } from '@/lib/utils';
import { getUpcomingSessions, canJoinNow, type BatchSession } from '@/lib/batches';
import LiveClassCard from '@/components/dashboard/LiveClassCard';
import DeleteAccountButton from '@/components/dashboard/DeleteAccountButton';
import type { Batch, MemberMeetingCredentials, Membership, MembershipPlan, YogaClass } from '@/types/database';

export const metadata: Metadata = { title: 'My Live Classes' };

// Everything here is per-user and time-sensitive — the join link appears based
// on the clock, so this page must never be served from a cache.
export const dynamic = 'force-dynamic';

type BatchWithClass = Batch & { class?: Pick<YogaClass, 'name' | 'slug'> | null };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: assignments }, { data: memberships }, { data: payments }, { data: bookings }] = await Promise.all([
    supabase.from('batch_members').select('batch_id').eq('user_id', user.id).eq('status', 'active'),
    // Every unexpired membership, not just one — a second plan bought while
    // one is still running is queued (see /api/memberships/verify) rather
    // than made active immediately, so it needs to show up here too instead
    // of silently existing with nothing pointing to it.
    supabase
      .from('memberships')
      .select('*, plan:membership_plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_date', today)
      .order('start_date', { ascending: true }),
    supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    // Historical only — classes are no longer booked individually.
    supabase
      .from('bookings')
      .select('*, schedule:class_schedules(start_time, class:classes(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const unexpiredMemberships = (memberships ?? []) as (Membership & { plan: Pick<MembershipPlan, 'name'> | null })[];
  // The one actually in effect today — earliest start_date that has already
  // started. Anything after it in the list is queued to start later.
  const activeMembership = unexpiredMemberships.find((m) => m.start_date <= today) ?? null;
  const queuedMemberships = unexpiredMemberships.filter((m) => m !== activeMembership);

  // Billing-cycle progress for the membership card's progress bar — clamped
  // so a membership with a same-day start/end (admin-granted edge case)
  // doesn't divide by zero, and so a slightly-stale server clock never
  // pushes the bar past 100% or the day count below zero.
  let membershipDaysLeft = 0;
  let membershipProgressPct = 0;
  if (activeMembership) {
    const start = new Date(activeMembership.start_date).getTime();
    const end = new Date(activeMembership.end_date).getTime();
    const nowMs = Date.now();
    const totalDays = Math.max(1, Math.round((end - start) / 86_400_000));
    const elapsedDays = Math.max(0, Math.round((nowMs - start) / 86_400_000));
    membershipDaysLeft = Math.max(0, Math.round((end - nowMs) / 86_400_000));
    membershipProgressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }
  const membershipActive = !!activeMembership;
  const batchIds = (assignments ?? []).map((a) => a.batch_id);

  let batches: BatchWithClass[] = [];
  let cancelledByBatch = new Map<string, Set<string>>();
  let linkedBatchIds = new Set<string>();

  if (batchIds.length > 0) {
    const [{ data: batchRows }, { data: cancellations }, { data: linkPresence }] = await Promise.all([
      supabase.from('batches').select('*, class:classes(name, slug)').in('id', batchIds).neq('status', 'archived'),
      supabase.from('batch_cancellations').select('batch_id, session_date').in('batch_id', batchIds),
      // Presence check only — selecting batch_id reveals no secret, and RLS
      // returns nothing here unless the membership is active.
      supabase.from('batch_meeting_credentials').select('batch_id').in('batch_id', batchIds),
    ]);

    batches = (batchRows as BatchWithClass[]) ?? [];
    linkedBatchIds = new Set((linkPresence ?? []).map((r) => r.batch_id));

    cancelledByBatch = new Map();
    for (const row of cancellations ?? []) {
      const set = cancelledByBatch.get(row.batch_id) ?? new Set<string>();
      set.add(row.session_date);
      cancelledByBatch.set(row.batch_id, set);
    }
  }

  const now = new Date();

  const cards = batches
    .map((batch) => ({
      batch,
      sessions: getUpcomingSessions(batch, {
        now,
        limit: 4,
        // Wider than the 28-day default so a member added to a batch that
        // starts next term sees their dates instead of an empty card.
        horizonDays: 120,
        cancelledDates: cancelledByBatch.get(batch.id),
      }),
    }))
    // Soonest class first; batches with nothing scheduled sink to the bottom.
    .sort((a, b) => (a.sessions[0]?.start.getTime() ?? Infinity) - (b.sessions[0]?.start.getTime() ?? Infinity));

  // The join window is the only gate on fetching credentials at all, so a link
  // for a class that's hours away never enters the HTML.
  const joinableIds = cards
    .filter(({ sessions }) => sessions[0] && !sessions[0].isCancelled && canJoinNow(sessions[0], now))
    .map(({ batch }) => batch.id);

  let credentialsByBatch = new Map<string, MemberMeetingCredentials>();
  if (membershipActive && joinableIds.length > 0) {
    // Columns are listed explicitly rather than `*` so `host_note` — the
    // admin's private jottings — can never travel to a member's browser.
    const { data: creds } = await supabase
      .from('batch_meeting_credentials')
      .select('batch_id, provider, meeting_url, meeting_id, passcode')
      .in('batch_id', joinableIds);
    credentialsByBatch = new Map(
      ((creds as MemberMeetingCredentials[]) ?? []).map((c) => [c.batch_id, c])
    );
  }

  // Deliberately derived from what we actually hold, not from the clock: a
  // lapsed member, or a batch whose link the admin hasn't added, is inside the
  // join window but has nothing to join.
  const joinableNow = credentialsByBatch.size;

  const pastBookings = (bookings ?? []) as { id: string; status: string; schedule?: { start_time: string; class?: { name: string } | null } | null }[];

  return (
    <div className="space-y-14">
      <section>
        <h1 className="text-display-md">My live classes</h1>
        {cards.length > 0 && (
          <p className="mt-2 text-sm text-ink/60">
            {joinableNow > 0
              ? 'You have a class you can join right now.'
              : !membershipActive
                ? `You're on the roster for ${cards.length === 1 ? 'a batch' : `${cards.length} batches`} — renew your membership to get your join link back.`
                : `You're in ${cards.length} ${cards.length === 1 ? 'batch' : 'batches'}. Your join link appears here an hour before each session.`}
          </p>
        )}
      </section>

      {/* ── Live classes ── */}
      <section>
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink/20 p-8 text-center">
            <Sparkles size={20} className="mx-auto text-moss" />
            <p className="mt-3 font-display text-2xl">
              {membershipActive ? 'We’re finding your batch' : 'No classes yet'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/60">
              {membershipActive ? (
                <>
                  Your membership is active. Tell us which timings suit you and we&apos;ll add you to a batch —
                  it shows up here with a join link before every session.
                </>
              ) : (
                <>
                  Live classes run in small batches. Pick a membership and we&apos;ll place you in the batch
                  that fits your week — no booking needed, ever.
                </>
              )}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {membershipActive ? (
                <>
                  <Link href="/contact?topic=timings" className="btn-primary"><span>Tell us your timings</span></Link>
                  <Link href="/classes" className="btn-outline"><span>See the timetable</span></Link>
                </>
              ) : (
                <>
                  <Link href="/membership" className="btn-primary"><span>View membership plans</span></Link>
                  <Link href="/classes" className="btn-outline"><span>See the timetable</span></Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {cards.map(({ batch, sessions }) => (
              <LiveClassCard
                key={batch.id}
                batch={batch}
                sessions={sessions as BatchSession[]}
                credentials={credentialsByBatch.get(batch.id) ?? null}
                linkPending={membershipActive && !linkedBatchIds.has(batch.id)}
                membershipActive={membershipActive}
                now={now}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Membership ── */}
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl">
          <CalendarClock size={16} className="text-moss" /> Membership
        </h2>
        {activeMembership ? (
          <div className="mt-4 glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-body font-semibold text-ink">{activeMembership.plan?.name ?? 'Membership'}</p>
                <p className="mt-1 text-sm text-ink/60">
                  {membershipDaysLeft > 0
                    ? `${membershipDaysLeft} day${membershipDaysLeft === 1 ? '' : 's'} left · until ${formatDate(activeMembership.end_date)}`
                    : `Active until ${formatDate(activeMembership.end_date)}`}
                </p>
              </div>
              <Link href="/membership" className="text-sm font-semibold text-moss hover:text-moss/80">
                Manage <ArrowRight size={13} className="inline" />
              </Link>
            </div>

            {/* Days-elapsed progress — the same "where am I in this" cue a
                learning-platform course progress bar gives, applied to the
                billing cycle instead of lesson completion. */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
              <div
                className={`h-full rounded-full ${membershipDaysLeft <= 7 ? 'bg-gold' : 'bg-moss'}`}
                style={{ width: `${membershipProgressPct}%` }}
              />
            </div>

            {membershipDaysLeft > 0 && membershipDaysLeft <= 7 && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gold">
                Renewing soon — your plan ends in {membershipDaysLeft} day{membershipDaysLeft === 1 ? '' : 's'}.{' '}
                <Link href="/membership" className="link-underline">Renew now →</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-ink/20 p-5 text-sm text-ink/60">
            No active membership.{' '}
            <Link href="/membership" className="link-underline text-moss">View plans →</Link>
          </div>
        )}

        {/* Bought while a membership was already running — held here rather
            than made active immediately, so it doesn't overlap. This is what
            makes that purchase visible instead of appearing to have vanished. */}
        {queuedMemberships.length > 0 && (
          <div className="mt-3 space-y-2">
            {queuedMemberships.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-moss/30 bg-moss/5 px-5 py-3">
                <p className="text-sm text-ink/70">
                  <span className="font-semibold text-ink">{m.plan?.name ?? 'Membership'}</span> — queued, starts{' '}
                  {formatDate(m.start_date)} (once your current plan ends)
                </p>
                <span className="rounded-full bg-moss/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-moss">
                  Upcoming
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Payments ── */}
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl">
          <CreditCard size={16} className="text-moss" /> Payment history
        </h2>
        {!payments || payments.length === 0 ? (
          <p className="mt-4 text-sm text-ink/55">No payments yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto glass-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 capitalize">{p.type}</td>
                    <td className="px-4 py-3">{formatINR(p.amount)}</td>
                    <td className="px-4 py-3 capitalize">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Only shown to members who booked under the old per-class system. */}
      {pastBookings.length > 0 && (
        <section>
          <details>
            <summary className="cursor-pointer font-display text-xl">Earlier bookings</summary>
            <p className="mt-2 text-xs text-ink/45">
              From before classes moved to batches. Kept for your records.
            </p>
            <ul className="mt-4 space-y-2">
              {pastBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4 text-sm">
                  <span>{b.schedule?.class?.name ?? 'Class'}</span>
                  <span className="text-ink/50">
                    {b.schedule ? formatDate(b.schedule.start_time) : ''} · {b.status}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* ── Account ── */}
      <section className="border-t border-ink/10 pt-8">
        <h2 className="font-display text-xl">Account</h2>
        <p className="mt-2 max-w-md text-sm text-ink/55">
          Deleting your account cancels any active membership, removes your name and phone number from our
          records, and logs you out for good. Your payment history is kept for accounting purposes but is no
          longer linked to your name.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
