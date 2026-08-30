import Link from 'next/link';
import { Trash2, Info } from 'lucide-react';
import { saveBatch, deleteBatch } from '@/lib/actions/batches';
import DangerSubmit from '@/components/admin/DangerSubmit';
import { WEEKDAY_LABELS } from '@/lib/batches';
import type { Batch, BatchMeetingCredentials, YogaClass } from '@/types/database';

const PROVIDERS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'other', label: 'Other' },
];

// Monday-first ordering — a week that starts on Sunday reads oddly to admins.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/** Trim Postgres "HH:MM:SS" down to the "HH:MM" that <input type="time"> wants. */
function toTimeInput(value: string | undefined): string | undefined {
  return value?.slice(0, 5);
}

export default function BatchForm({
  existing,
  credentials,
  classes,
}: {
  existing?: Batch;
  credentials?: BatchMeetingCredentials | null;
  classes: YogaClass[];
}) {
  const selectedDays = new Set<number>(existing?.weekdays ?? []);

  return (
    <div className="max-w-2xl space-y-6">
      <form action={saveBatch} className="space-y-6 glass-card p-6">
        {existing && <input type="hidden" name="id" value={existing.id} />}

        {/* ── What & who ── */}
        <fieldset className="space-y-5">
          <legend className="font-display text-xl">The class</legend>

          <div>
            <label htmlFor="name" className="text-sm font-medium text-ink">Batch name</label>
            <input
              id="name"
              name="name"
              defaultValue={existing?.name}
              required
              className="input-field"
              placeholder="Morning Hatha — Mon/Wed/Fri"
            />
            <p className="mt-1 text-xs text-ink/45">
              Members see this name, so make it descriptive of the timing.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="class_id" className="text-sm font-medium text-ink">Class style</label>
              <select id="class_id" name="class_id" defaultValue={existing?.class_id} required className="input-field">
                {classes.length === 0 && <option value="">No classes yet — create one first</option>}
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="instructor_name" className="text-sm font-medium text-ink">Instructor</label>
              <input
                id="instructor_name"
                name="instructor_name"
                defaultValue={existing?.instructor_name}
                required
                className="input-field"
                placeholder="Priya Sharma"
              />
            </div>
          </div>
        </fieldset>

        {/* ── When ── */}
        <fieldset className="space-y-5 border-t border-ink/10 pt-6">
          <legend className="font-display text-xl">When it runs</legend>

          <div>
            <span className="text-sm font-medium text-ink">Days of the week</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_ORDER.map((day) => (
                <label
                  key={day}
                  className="cursor-pointer select-none rounded-full glass-panel px-4 py-2 text-xs font-semibold
                    transition-colors hover:bg-white/70
                    has-[:checked]:bg-ink has-[:checked]:text-canvas"
                >
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={day}
                    defaultChecked={selectedDays.has(day)}
                    className="sr-only"
                  />
                  {WEEKDAY_LABELS[day].slice(0, 3)}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink/45">Pick every day this batch meets. At least one is required.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="start_time" className="text-sm font-medium text-ink">Start time (IST)</label>
              <input
                id="start_time"
                name="start_time"
                type="time"
                defaultValue={toTimeInput(existing?.start_time) ?? '06:00'}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="end_time" className="text-sm font-medium text-ink">End time (IST)</label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                defaultValue={toTimeInput(existing?.end_time) ?? '07:00'}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="capacity" className="text-sm font-medium text-ink">Capacity</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={existing?.capacity ?? 20}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="starts_on" className="text-sm font-medium text-ink">First session on</label>
              <input
                id="starts_on"
                name="starts_on"
                type="date"
                defaultValue={existing?.starts_on ?? new Date().toISOString().slice(0, 10)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="ends_on" className="text-sm font-medium text-ink">Last session on (optional)</label>
              <input id="ends_on" name="ends_on" type="date" defaultValue={existing?.ends_on ?? ''} className="input-field" />
              <p className="mt-1 text-xs text-ink/45">Leave blank to run indefinitely.</p>
            </div>
          </div>
        </fieldset>

        {/* ── Meeting link ── */}
        <fieldset className="space-y-5 border-t border-ink/10 pt-6">
          <legend className="font-display text-xl">Live meeting link</legend>

          <p className="flex items-start gap-2 rounded-lg bg-moss/5 p-3.5 text-xs leading-relaxed text-ink/65">
            <Info size={14} className="mt-0.5 shrink-0 text-moss" />
            <span>
              Use a <strong>recurring</strong> Zoom meeting or a Google Meet link so the same URL works every
              session. Members only see it from <strong>1 hour before</strong> each class until the class ends,
              and only while their membership is active.
            </span>
          </p>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div>
              <label htmlFor="provider" className="text-sm font-medium text-ink">Platform</label>
              <select id="provider" name="provider" defaultValue={credentials?.provider ?? 'zoom'} className="input-field">
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="meeting_url" className="text-sm font-medium text-ink">Meeting link</label>
              <input
                id="meeting_url"
                name="meeting_url"
                type="url"
                defaultValue={credentials?.meeting_url ?? ''}
                className="input-field"
                placeholder="https://us02web.zoom.us/j/1234567890"
              />
              <p className="mt-1 text-xs text-ink/45">Clear this field to revoke access to the link.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="meeting_id" className="text-sm font-medium text-ink">Meeting ID (optional)</label>
              <input
                id="meeting_id"
                name="meeting_id"
                defaultValue={credentials?.meeting_id ?? ''}
                className="input-field"
                placeholder="123 456 7890"
              />
            </div>
            <div>
              <label htmlFor="passcode" className="text-sm font-medium text-ink">Passcode (optional)</label>
              <input
                id="passcode"
                name="passcode"
                defaultValue={credentials?.passcode ?? ''}
                className="input-field"
                placeholder="yoga123"
              />
            </div>
          </div>

          <div>
            <label htmlFor="host_note" className="text-sm font-medium text-ink">Private host notes (optional)</label>
            <textarea
              id="host_note"
              name="host_note"
              rows={2}
              defaultValue={credentials?.host_note ?? ''}
              className="input-field resize-none"
              placeholder="Host key, dial-in number — never shown to members."
            />
          </div>
        </fieldset>

        {/* ── Member-facing extras ── */}
        <fieldset className="space-y-5 border-t border-ink/10 pt-6">
          <legend className="font-display text-xl">Details & status</legend>

          <div>
            <label htmlFor="description" className="text-sm font-medium text-ink">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={existing?.description ?? ''}
              className="input-field resize-none"
              placeholder="Gentle pace. Bring a strap and a bolster."
            />
            <p className="mt-1 text-xs text-ink/45">
              Shown on the public timetable and on the member&apos;s dashboard card.
            </p>
          </div>

          <div className="sm:w-56">
            <label htmlFor="status" className="text-sm font-medium text-ink">Status</label>
            <select id="status" name="status" defaultValue={existing?.status ?? 'active'} className="input-field">
              <option value="active">Active — visible &amp; running</option>
              <option value="paused">Paused — hidden, no sessions</option>
              <option value="archived">Archived — finished</option>
            </select>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4 border-t border-ink/10 pt-6">
          <button type="submit" className="btn-primary">
            <span>{existing ? 'Save changes' : 'Create batch'}</span>
          </button>
          <Link href="/admin/batches" className="text-sm text-ink/55 hover:text-ink">Cancel</Link>
        </div>
      </form>

      {/* Destructive action deliberately outside the main form. */}
      {existing && (
        <form action={deleteBatch} className="rounded-lg border border-ink/10 p-5">
          <input type="hidden" name="id" value={existing.id} />
          <p className="font-body text-sm font-semibold text-ink">Delete this batch</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            Permanently removes the batch, its meeting link and all member assignments. To stop a batch
            temporarily without losing the roster, set its status to <strong>Paused</strong> instead.
          </p>
          <DangerSubmit
            message="Delete this batch permanently? Its meeting link and every member assignment go with it. To pause without losing the roster, set the status to Paused instead."
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-700"
          >
            <Trash2 size={14} /> Delete permanently
          </DangerSubmit>
        </form>
      )}
    </div>
  );
}
