import { Clock, User, CalendarDays } from 'lucide-react';
import { formatStudioTime, formatWeekdays, getDurationMinutes, WEEKDAY_SHORT } from '@/lib/batches';
import type { Batch, Weekday, YogaClass } from '@/types/database';

type TimetableBatch = Batch & { class?: Pick<YogaClass, 'name' | 'category' | 'difficulty'> | null };

/**
 * Read-only weekly timetable for the public /classes page.
 *
 * Deliberately has NO booking or join affordances. Members don't pick their
 * own slots — an admin assigns them to a batch — so every CTA here points at
 * membership instead of a booking flow.
 */
export default function BatchTimetable({ batches }: { batches: TimetableBatch[] }) {
  if (batches.length === 0) {
    return (
      <p className="mt-10 text-sm text-ink/55">
        The timetable is being updated — please check back shortly.
      </p>
    );
  }

  // Group by weekday so the grid reads like a week, Monday first. A batch on
  // Mon/Wed/Fri legitimately appears under all three days.
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
  const byDay = order
    .map((day) => ({
      day,
      label: WEEKDAY_SHORT[day],
      full: day === 0 ? 'Sunday' : day === 6 ? 'Saturday' : ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][day],
      items: batches
        .filter((b) => b.weekdays.includes(day))
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }))
    .filter((d) => d.items.length > 0);

  return (
    <div className="mt-10 space-y-12">
      {/* ── Week grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {byDay.map((d) => (
          <div key={d.day} className="glass-card border-t-2 border-t-ink/80 p-6">
            <h3 className="text-xl">{d.full}</h3>
            <ul className="mt-4 space-y-3">
              {d.items.map((b) => (
                <li key={`${d.day}-${b.id}`} className="border-b border-ink/10 pb-3 last:border-0 last:pb-0">
                  <p className="font-body text-sm font-semibold text-ink">
                    {formatStudioTime(b.start_time)} – {formatStudioTime(b.end_time)}
                  </p>
                  <p className="mt-0.5 text-sm text-ink/70">{b.class?.name ?? b.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
                    <span className="inline-flex items-center gap-1"><User size={11} /> {b.instructor_name}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {getDurationMinutes(b)} min</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Batch summary: what a member actually gets assigned to ── */}
      <div>
        <h3 className="text-display-sm">Our batches</h3>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Each batch is a small, consistent group that practises together at the same time every week —
          same people, same teacher, same rhythm.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {batches.map((b) => (
            <div key={b.id} className="glass-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg">{b.name}</h4>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-gold">
                    {b.class?.category ?? 'Yoga'}
                    {b.class?.difficulty ? ` · ${b.class.difficulty}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                  {formatStudioTime(b.start_time)}
                </span>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-sm text-ink/65">
                <CalendarDays size={13} className="text-moss" /> {formatWeekdays(b.weekdays)}
              </p>

              {b.description && (
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{b.description}</p>
              )}

              <p className="mt-3 text-xs text-ink/45">with {b.instructor_name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
