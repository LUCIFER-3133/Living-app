import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft, Pencil, CalendarDays, Clock, User, Users, Video, VideoOff,
  KeyRound, ExternalLink, Ban, RotateCcw, Pause, Play, Lock,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { setBatchStatus, cancelSession, restoreSession } from '@/lib/actions/batches';
import {
  formatStudioTime, formatWeekdays, formatSessionDay, formatCountdown,
  getUpcomingSessions, getDurationMinutes, JOIN_WINDOW_BEFORE_MINUTES,
} from '@/lib/batches';
import BatchRoster, { type RosterPerson } from '@/components/admin/BatchRoster';
import { formatDate } from '@/lib/utils';
import type {
  Batch, BatchCancellation, BatchMeetingCredentials, BatchRosterEntry, Profile, YogaClass,
} from '@/types/database';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-moss/10 text-moss',
  paused: 'bg-gold/10 text-gold-700',
  archived: 'bg-ink/10 text-ink/50',
};

const PROVIDER_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  other: 'Meeting',
};

function matches(person: { full_name: string | null; phone: string | null; email: string | null }, q: string) {
  const needle = q.toLowerCase();
  return [person.full_name, person.phone, person.email].some((f) => f?.toLowerCase().includes(needle));
}

export default async function BatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  // Renders meeting credentials and every member's email through the
  // RLS-bypassing client, so it re-checks admin itself.
  await requireAdminPage();

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: batch },
    { data: credentials },
    { data: roster },
    { data: cancellations },
    { data: activeMemberships },
  ] = await Promise.all([
    admin.from('batches').select('*, class:classes(name, category, duration_minutes)').eq('id', id).single(),
    admin.from('batch_meeting_credentials').select('*').eq('batch_id', id).maybeSingle(),
    admin.from('batch_roster').select('*').eq('batch_id', id).order('assigned_at'),
    admin.from('batch_cancellations').select('*').eq('batch_id', id),
    admin.from('memberships').select('user_id').eq('status', 'active').gte('end_date', today),
  ]);

  if (!batch) notFound();

  const b = batch as Batch & { class: Pick<YogaClass, 'name' | 'category' | 'duration_minutes'> | null };
  const creds = credentials as BatchMeetingCredentials | null;
  const rosterRows = (roster as BatchRosterEntry[]) ?? [];
  const cancelledDates = new Set(((cancellations as BatchCancellation[]) ?? []).map((c) => c.session_date));
  const paidUserIds = new Set((activeMemberships ?? []).map((m) => m.user_id));

  // Emails live in auth.users, not profiles, so admins can search by the thing
  // they most often have to hand. Fine at studio scale; revisit past ~1000 users.
  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailFor = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? null]));

  const toPerson = (r: BatchRosterEntry): RosterPerson => ({
    user_id: r.user_id,
    full_name: r.full_name,
    email: emailFor.get(r.user_id) ?? null,
    phone: r.phone,
    membership_active: r.membership_active,
    assigned_at: r.assigned_at,
  });

  const members = rosterRows.filter((r) => r.assignment_status === 'active').map(toPerson);
  const pastMembers = rosterRows.filter((r) => r.assignment_status === 'removed').map(toPerson);
  const assignedIds = new Set(members.map((m) => m.user_id));

  // Candidate search only runs when the admin actually searched, so the common
  // page load stays a single small query set.
  let candidates: RosterPerson[] = [];
  if (query) {
    const { data: profiles } = await admin.from('profiles').select('*').limit(1000);
    candidates = ((profiles as Profile[]) ?? [])
      .map((p) => ({
        user_id: p.id,
        full_name: p.full_name,
        email: emailFor.get(p.id) ?? null,
        phone: p.phone,
        membership_active: paidUserIds.has(p.id),
      }))
      .filter((p) => !assignedIds.has(p.user_id) && matches(p, query))
      .sort((a, b2) => Number(b2.membership_active) - Number(a.membership_active))
      .slice(0, 20);
  }

  const now = new Date();
  const sessions = getUpcomingSessions(b, { now, limit: 8, cancelledDates });
  const durationMins = getDurationMinutes(b);

  return (
    <div>
      <Link href="/admin/batches" className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink">
        <ChevronLeft size={13} /> All batches
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-md">{b.name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[b.status] ?? STATUS_STYLES.archived}`}>
              {b.status}
            </span>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink/60">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-moss" /> {formatWeekdays(b.weekdays)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-moss" />
              {formatStudioTime(b.start_time)} – {formatStudioTime(b.end_time)} IST ({durationMins} min)
            </span>
            <span className="flex items-center gap-1.5"><User size={14} className="text-moss" /> {b.instructor_name}</span>
            <span className="flex items-center gap-1.5"><Users size={14} className="text-moss" /> {members.length}/{b.capacity}</span>
          </p>
          <p className="mt-1.5 text-xs text-ink/45">
            {b.class?.name ?? 'Class removed'}
            {b.class?.category ? ` · ${b.class.category}` : ''} · from {formatDate(b.starts_on)}
            {b.ends_on ? ` to ${formatDate(b.ends_on)}` : ' · no end date'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {b.status !== 'archived' && (
            <form action={setBatchStatus}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value={b.status === 'active' ? 'paused' : 'active'} />
              <button className="btn-outline !px-4 !py-2 !text-xs">
                {b.status === 'active'
                  ? <><Pause size={13} /> <span>Pause</span></>
                  : <><Play size={13} /> <span>Resume</span></>}
              </button>
            </form>
          )}
          <Link href={`/admin/batches/${b.id}/edit`} className="btn-primary !px-4 !py-2 !text-xs">
            <Pencil size={13} /> <span>Edit batch</span>
          </Link>
        </div>
      </div>

      {b.description && (
        <p className="mt-5 max-w-2xl rounded-lg bg-white/50 p-4 text-sm leading-relaxed text-ink/65">
          {b.description}
        </p>
      )}

      {/* ── Meeting link ── */}
      <section className="mt-8 glass-card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Live meeting link</h2>
          <p className="flex items-center gap-1.5 text-[11px] text-ink/45">
            <Lock size={11} /> Visible to members {JOIN_WINDOW_BEFORE_MINUTES} min before class, until it ends
          </p>
        </div>

        {creds ? (
          <div className="mt-4 space-y-3">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-moss">
                <Video size={11} /> {PROVIDER_LABELS[creds.provider] ?? 'Meeting'}
              </span>
              <a
                href={creds.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline inline-flex min-w-0 items-center gap-1.5 break-all text-moss"
              >
                {creds.meeting_url} <ExternalLink size={12} className="shrink-0" />
              </a>
            </p>
            {(creds.meeting_id || creds.passcode) && (
              <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink/60">
                {creds.meeting_id && <span>Meeting ID: <strong className="font-semibold text-ink">{creds.meeting_id}</strong></span>}
                {creds.passcode && (
                  <span className="flex items-center gap-1.5">
                    <KeyRound size={12} className="text-moss" />
                    Passcode: <strong className="font-semibold text-ink">{creds.passcode}</strong>
                  </span>
                )}
              </p>
            )}
            {creds.host_note && (
              <p className="rounded-lg bg-ink/5 p-3 text-xs leading-relaxed text-ink/60">
                <span className="font-semibold text-ink/75">Private note:</span> {creds.host_note}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-gold/40 bg-gold-50 p-4">
            <p className="flex items-center gap-2 font-body text-sm font-semibold text-gold-700">
              <VideoOff size={14} /> No meeting link set
            </p>
            <p className="mt-1.5 text-sm text-ink/65">
              Members will see their schedule but have nothing to join.{' '}
              <Link href={`/admin/batches/${b.id}/edit`} className="link-underline font-semibold text-gold-700">
                Add the link
              </Link>{' '}
              — use a recurring Zoom meeting or a Google Meet link so it works every session.
            </p>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <BatchRoster
          batchId={b.id}
          capacity={b.capacity}
          members={members}
          pastMembers={pastMembers}
          candidates={candidates}
          query={query}
        />

        {/* ── Upcoming sessions ── */}
        <section className="glass-card h-fit p-6">
          <h2 className="text-xl">Next sessions</h2>
          <p className="mt-1 text-sm text-ink/55">
            Skip a single date without touching the schedule — members see it marked as cancelled.
          </p>

          {sessions.length === 0 ? (
            <p className="mt-4 text-sm text-ink/55">
              {b.status === 'active'
                ? 'No sessions in the next four weeks. Check the start and end dates.'
                : `This batch is ${b.status}, so no sessions are running.`}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/5">
              {sessions.map((s) => (
                <li key={s.sessionDate} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className={`font-body text-sm font-semibold ${s.isCancelled ? 'text-ink/35 line-through' : 'text-ink'}`}>
                      {formatSessionDay(s, now)}
                    </p>
                    <p className="text-xs text-ink/45">
                      {formatStudioTime(b.start_time)} · {s.isCancelled ? 'Cancelled' : formatCountdown(s.start, now)}
                    </p>
                  </div>

                  <form action={s.isCancelled ? restoreSession : cancelSession}>
                    <input type="hidden" name="batch_id" value={b.id} />
                    <input type="hidden" name="session_date" value={s.sessionDate} />
                    <button
                      className="inline-flex items-center gap-1.5 rounded-full glass-panel px-3 py-1.5 text-xs font-semibold text-ink/55 transition-colors hover:text-ink"
                      title={s.isCancelled ? 'Put this session back' : 'Cancel just this date'}
                    >
                      {s.isCancelled ? <><RotateCcw size={12} /> Restore</> : <><Ban size={12} /> Skip</>}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
