import Link from 'next/link';
import { Video, KeyRound, Lock, CalendarDays, Clock, User, Ban, ExternalLink } from 'lucide-react';
import {
  formatStudioTime, formatWeekdays, formatSessionDay, formatStudioClock,
  joinOpensAt, JOIN_WINDOW_BEFORE_MINUTES, type BatchSession,
} from '@/lib/batches';
import SessionCountdown from '@/components/dashboard/SessionCountdown';
import CopyField from '@/components/dashboard/CopyField';
import type { Batch, MemberMeetingCredentials, YogaClass } from '@/types/database';

const PROVIDER_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  other: 'meeting',
};

export default function LiveClassCard({
  batch,
  sessions,
  credentials,
  linkPending,
  membershipActive,
  now,
}: {
  batch: Batch & { class?: Pick<YogaClass, 'name' | 'slug'> | null };
  /** Upcoming sessions, soonest first, cancellations included. */
  sessions: BatchSession[];
  /**
   * Only ever passed when the join window is open — the server omits it
   * entirely otherwise, so the link never reaches the browser early. Typed as
   * the member-safe subset so `host_note` cannot be rendered here by mistake.
   */
  credentials: MemberMeetingCredentials | null;
  /** True when no meeting link has been set for this batch yet. */
  linkPending: boolean;
  membershipActive: boolean;
  now: Date;
}) {
  const next = sessions[0] ?? null;
  const later = sessions.slice(1, 4);
  const unlocked = !!credentials;

  return (
    <article className="glass-card overflow-hidden">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-display-sm">{batch.name}</h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/55">
              {batch.class?.name && (
                <span>
                  {batch.class.slug ? (
                    <Link href={`/classes/${batch.class.slug}`} className="link-underline">{batch.class.name}</Link>
                  ) : (
                    batch.class.name
                  )}
                </span>
              )}
              <span className="flex items-center gap-1.5"><User size={12} className="text-moss" /> {batch.instructor_name}</span>
            </p>
          </div>
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink/65">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-moss" /> {formatWeekdays(batch.weekdays)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-moss" />
            {formatStudioTime(batch.start_time)} – {formatStudioTime(batch.end_time)} IST
          </span>
        </p>

        {batch.description && (
          <p className="mt-3 text-sm leading-relaxed text-ink/60">{batch.description}</p>
        )}
      </div>

      {/* ── The join strip: everything the member needs, and nothing else ── */}
      <div className="border-t border-ink/10 bg-white/45 p-6">
        {!next ? (
          <p className="text-sm text-ink/55">
            No sessions scheduled at the moment. We&apos;ll be in touch about the next block.
          </p>
        ) : next.isCancelled ? (
          <>
            <p className="flex items-center gap-2 font-body text-sm font-semibold text-gold-700">
              <Ban size={14} /> {formatSessionDay(next, now)}&apos;s session is cancelled
            </p>
            {later.find((s) => !s.isCancelled) && (
              <p className="mt-1.5 text-sm text-ink/60">
                Next one: {formatSessionDay(later.find((s) => !s.isCancelled)!, now)} at{' '}
                {formatStudioTime(batch.start_time)}.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-body text-sm font-semibold text-ink">
                {formatSessionDay(next, now)} · {formatStudioTime(batch.start_time)}
              </p>
              <p className="text-xs">
                <SessionCountdown
                  startsAt={next.start.toISOString()}
                  endsAt={next.end.toISOString()}
                  opensAt={joinOpensAt(next).toISOString()}
                  unlocked={unlocked}
                />
              </p>
            </div>

            {!membershipActive ? (
              <div className="mt-4 rounded-lg border border-gold/40 bg-gold-50 p-4">
                <p className="flex items-center gap-2 font-body text-sm font-semibold text-gold-700">
                  <Lock size={14} /> Membership needed to join
                </p>
                <p className="mt-1.5 text-sm text-ink/65">
                  You&apos;re still on the roster for this batch — renew your membership and your join link
                  comes straight back.{' '}
                  <Link href="/membership" className="link-underline font-semibold text-gold-700">
                    View plans →
                  </Link>
                </p>
              </div>
            ) : credentials ? (
              <div className="mt-4">
                <a
                  href={credentials.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center sm:w-auto"
                >
                  <Video size={15} />
                  <span>Join on {PROVIDER_LABELS[credentials.provider] ?? 'the call'}</span>
                  <ExternalLink size={13} />
                </a>

                {(credentials.passcode || credentials.meeting_id) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {credentials.meeting_id && <CopyField label="Meeting ID" value={credentials.meeting_id} />}
                    {credentials.passcode && <CopyField label="Passcode" value={credentials.passcode} />}
                  </div>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink/45">
                  <KeyRound size={11} /> Keep this link to yourself — it&apos;s tied to your membership.
                </p>
              </div>
            ) : linkPending ? (
              <p className="mt-4 rounded-lg bg-ink/5 p-3.5 text-sm text-ink/60">
                Your teacher hasn&apos;t added the joining link for this batch yet. It&apos;ll appear here
                before the session starts.
              </p>
            ) : (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-ink/5 p-3.5 text-sm text-ink/60">
                <Lock size={14} className="mt-0.5 shrink-0 text-ink/35" />
                <span>
                  Your join link appears here at{' '}
                  <strong className="font-semibold text-ink">{formatStudioClock(joinOpensAt(next))}</strong> —{' '}
                  {JOIN_WINDOW_BEFORE_MINUTES} minutes before class. No need to refresh; it unlocks on its own.
                </span>
              </p>
            )}
          </>
        )}

        {later.length > 0 && (
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/5 pt-4 text-[11px] text-ink/45">
            <span className="uppercase tracking-wider">Then</span>
            {later.map((s) => (
              <span key={s.sessionDate} className={s.isCancelled ? 'line-through' : ''}>
                {formatSessionDay(s, now)}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
