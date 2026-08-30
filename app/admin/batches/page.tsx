import Link from 'next/link';
import { Plus, Users, Video, VideoOff, CalendarDays, Clock } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatStudioTime, formatWeekdays, getNextSession, formatSessionDay, formatCountdown } from '@/lib/batches';
import type { Batch, YogaClass } from '@/types/database';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-moss/10 text-moss',
  paused: 'bg-gold/10 text-gold-700',
  archived: 'bg-ink/10 text-ink/50',
};

export default async function AdminBatchesPage() {
  // Reads with the service-role client (RLS bypassed), so it guards itself.
  await requireAdminPage();

  const admin = createAdminClient();

  const [{ data: batches }, { data: credentials }, { data: memberCounts }] = await Promise.all([
    admin.from('batches').select('*, class:classes(name, category)').order('start_time'),
    admin.from('batch_meeting_credentials').select('batch_id'),
    admin.from('batch_members').select('batch_id').eq('status', 'active'),
  ]);

  const batchList = (batches as (Batch & { class: YogaClass | null })[]) ?? [];
  const hasLink = new Set((credentials ?? []).map((c) => c.batch_id));

  const counts = new Map<string, number>();
  for (const row of memberCounts ?? []) {
    counts.set(row.batch_id, (counts.get(row.batch_id) ?? 0) + 1);
  }

  const now = new Date();
  const missingLinks = batchList.filter((b) => b.status === 'active' && !hasLink.has(b.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md">Batches</h1>
          <p className="mt-1 text-sm text-ink/55">
            A batch is a recurring live class with one reusable meeting link. Assign members to a batch and
            it appears in their dashboard.
          </p>
        </div>
        <Link href="/admin/batches/new" className="btn-primary !px-4 !py-2 !text-xs shrink-0">
          <Plus size={14} /> <span>New Batch</span>
        </Link>
      </div>

      {/* The one mistake that silently breaks a live class: an active batch
          with no meeting link. Surface it before the class starts. */}
      {missingLinks.length > 0 && (
        <div className="mt-8 rounded-lg border border-gold/40 bg-gold-50 p-5">
          <p className="flex items-center gap-2 font-body text-sm font-semibold text-gold-700">
            <VideoOff size={15} /> {missingLinks.length} active {missingLinks.length === 1 ? 'batch has' : 'batches have'} no meeting link
          </p>
          <p className="mt-1.5 text-sm text-ink/65">
            Members in {missingLinks.length === 1 ? 'this batch' : 'these batches'} will see their schedule but
            won&apos;t be able to join:{' '}
            {missingLinks.map((b, i) => (
              <span key={b.id}>
                {i > 0 && ', '}
                <Link href={`/admin/batches/${b.id}`} className="link-underline font-semibold text-gold-700">{b.name}</Link>
              </span>
            ))}
          </p>
        </div>
      )}

      {batchList.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-ink/20 p-10 text-center">
          <p className="font-display text-2xl">No batches yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
            Create your first batch — pick a class, the days and time it runs, and paste your Zoom or Google
            Meet link. Then assign members to it.
          </p>
          <Link href="/admin/batches/new" className="btn-primary mt-6"><span>Create a batch</span></Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {batchList.map((b) => {
            // Wider than the 28-day default: a batch that starts next term is
            // scheduled, and showing "—" for it would look like a mistake.
            const next = getNextSession(b, { now, horizonDays: 200 });
            const memberCount = counts.get(b.id) ?? 0;
            return (
              <Link
                key={b.id}
                href={`/admin/batches/${b.id}`}
                className="block glass-card p-5 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl">{b.name}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[b.status] ?? STATUS_STYLES.archived}`}>
                        {b.status}
                      </span>
                      {hasLink.has(b.id) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-moss">
                          <Video size={11} /> Link set
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold">
                          <VideoOff size={11} /> No link
                        </span>
                      )}
                    </div>

                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/60">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={12} className="text-moss" /> {formatWeekdays(b.weekdays)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-moss" />
                        {formatStudioTime(b.start_time)} – {formatStudioTime(b.end_time)} IST
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={12} className="text-moss" /> {memberCount}/{b.capacity} members
                      </span>
                    </p>

                    <p className="mt-1.5 text-xs text-ink/45">
                      {b.class?.name ?? 'Class removed'} · {b.instructor_name}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[11px] uppercase tracking-wider text-ink/40">Next session</p>
                    {next ? (
                      <>
                        <p className="mt-0.5 font-body text-sm font-semibold text-ink">
                          {formatSessionDay(next, now)}
                        </p>
                        <p className="text-xs text-ink/55">{formatCountdown(next.start, now)}</p>
                      </>
                    ) : (
                      <p className="mt-0.5 text-sm text-ink/40">—</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
