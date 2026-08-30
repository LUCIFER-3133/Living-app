import { Search, UserPlus, UserMinus, BadgeCheck, AlertTriangle, X } from 'lucide-react';
import { assignMember, removeMember } from '@/lib/actions/batches';
import DangerSubmit from '@/components/admin/DangerSubmit';
import { formatDate } from '@/lib/utils';

export interface RosterPerson {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  membership_active: boolean;
  assigned_at?: string;
}

function displayName(person: RosterPerson) {
  return person.full_name || person.email || 'Unnamed member';
}

export default function BatchRoster({
  batchId,
  capacity,
  members,
  pastMembers,
  candidates,
  query,
}: {
  batchId: string;
  capacity: number;
  members: RosterPerson[];
  pastMembers: RosterPerson[];
  /** Search results, already filtered to exclude current members. */
  candidates: RosterPerson[];
  query: string;
}) {
  const isFull = members.length >= capacity;
  const lapsed = members.filter((m) => !m.membership_active);

  return (
    <div className="space-y-6">
      {/* ── Current roster ── */}
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Roster</h2>
          <p className={`text-xs font-semibold ${isFull ? 'text-gold' : 'text-ink/45'}`}>
            {members.length} of {capacity} places filled
          </p>
        </div>

        {lapsed.length > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-gold-50 p-3 text-xs leading-relaxed text-ink/70">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-gold" />
            <span>
              {lapsed.length === 1
                ? `${displayName(lapsed[0])} has no active membership.`
                : `${lapsed.length} members have no active membership.`}{' '}
              They still see this batch in their dashboard, but the join link stays hidden until their
              membership is renewed.
            </span>
          </p>
        )}

        {members.length === 0 ? (
          <p className="mt-4 text-sm text-ink/55">
            Nobody is in this batch yet. Search for a member below to add them.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {members.map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-body text-sm font-semibold text-ink">
                    {displayName(m)}
                    {m.membership_active ? (
                      <span title="Active membership" className="flex text-moss">
                        <BadgeCheck size={13} />
                        <span className="sr-only">Active membership</span>
                      </span>
                    ) : (
                      <span title="No active membership" className="flex text-gold">
                        <AlertTriangle size={13} />
                        <span className="sr-only">No active membership</span>
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink/50">
                    {[m.email, m.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {m.assigned_at && (
                    <p className="mt-0.5 text-[11px] text-ink/35">Added {formatDate(m.assigned_at)}</p>
                  )}
                </div>

                <form action={removeMember}>
                  <input type="hidden" name="batch_id" value={batchId} />
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <DangerSubmit
                    message={`Remove ${displayName(m)} from the batch? They lose access to the meeting link straight away. You can add them back at any time.`}
                    className="inline-flex items-center gap-1.5 rounded-full glass-panel px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:text-gold"
                  >
                    <UserMinus size={12} /> Remove
                  </DangerSubmit>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Add members ── */}
      <section className="glass-card p-6">
        <h2 className="text-xl">Add a member</h2>
        <p className="mt-1 text-sm text-ink/55">
          Search by name, email or phone. Adding someone puts this batch straight into their dashboard.
        </p>

        {/* Plain GET form — no client JS needed, and the query stays shareable. */}
        <form method="get" className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Priya, priya@…, 98765…"
              aria-label="Search members"
              className="input-field !pl-9"
            />
          </div>
          <button className="btn-outline !px-4 !py-2 !text-xs shrink-0"><span>Search</span></button>
        </form>

        {isFull && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-gold-50 p-3 text-xs leading-relaxed text-ink/70">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-gold" />
            <span>
              This batch is at capacity. Raise the capacity in{' '}
              <span className="font-semibold">Edit batch</span> before adding anyone else.
            </span>
          </p>
        )}

        {query && (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-ink/40">
                {candidates.length} {candidates.length === 1 ? 'match' : 'matches'} for “{query}”
              </p>
              <a href="?" className="inline-flex items-center gap-1 text-xs text-ink/45 hover:text-ink">
                <X size={11} /> Clear
              </a>
            </div>

            {candidates.length === 0 ? (
              <p className="mt-3 text-sm text-ink/55">
                No one matched, or everyone who did is already in this batch. Members need an account before
                they can be assigned.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-ink/5">
                {candidates.map((c) => (
                  <li key={c.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-ink">{displayName(c)}</p>
                      <p className="mt-0.5 truncate text-xs text-ink/50">
                        {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold">
                        {c.membership_active ? (
                          <span className="text-moss">Membership active</span>
                        ) : (
                          <span className="text-gold">No active membership</span>
                        )}
                      </p>
                    </div>

                    <form action={assignMember}>
                      <input type="hidden" name="batch_id" value={batchId} />
                      <input type="hidden" name="user_id" value={c.user_id} />
                      <button
                        disabled={isFull}
                        className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <UserPlus size={12} /> Add
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* ── Audit trail ── */}
      {pastMembers.length > 0 && (
        <details className="glass-card p-6">
          <summary className="cursor-pointer font-body text-sm font-semibold text-ink/70">
            Previously in this batch ({pastMembers.length})
          </summary>
          <ul className="mt-4 divide-y divide-ink/5">
            {pastMembers.map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-body text-sm text-ink/60">{displayName(m)}</p>
                  <p className="mt-0.5 truncate text-xs text-ink/40">{m.email || m.phone || '—'}</p>
                </div>
                <form action={assignMember}>
                  <input type="hidden" name="batch_id" value={batchId} />
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <button
                    disabled={isFull}
                    className="inline-flex items-center gap-1.5 rounded-full glass-panel px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:text-moss disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <UserPlus size={12} /> Add back
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
