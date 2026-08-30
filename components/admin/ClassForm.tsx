import { Trash2 } from 'lucide-react';
import { saveClass, deleteClass } from '@/lib/actions/classes';
import DangerSubmit from '@/components/admin/DangerSubmit';
import type { YogaClass } from '@/types/database';

const CATEGORIES = ['Hatha', 'Vinyasa', 'Ashtanga', 'Prenatal', 'Power Yoga', 'Meditation', 'Pranayama', 'Beginner'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function ClassForm({ existing }: { existing?: YogaClass }) {
  return (
    <div className="max-w-xl space-y-6">
      <form action={saveClass} className="space-y-5 glass-card p-6">
        {existing && <input type="hidden" name="id" value={existing.id} />}

        <div>
          <label className="text-sm font-medium text-ink">Name</label>
          <input name="name" defaultValue={existing?.name} required className="input-field" placeholder="Sunrise Vinyasa Flow" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink">Category</label>
            <select name="category" defaultValue={existing?.category ?? CATEGORIES[0]} className="input-field">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Difficulty</label>
            <select name="difficulty" defaultValue={existing?.difficulty ?? 'All Levels'} className="input-field">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Short description</label>
          <input name="short_description" defaultValue={existing?.short_description} required className="input-field" placeholder="One line shown on class cards" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Full description (optional)</label>
          <textarea name="long_description" defaultValue={existing?.long_description ?? ''} rows={4} className="input-field resize-none" />
        </div>

        {/* Classes are never charged directly — access is via membership — so
            there is no price for admins to manage here. The DB column is kept
            (NOT NULL, unused elsewhere) via this hidden field rather than a
            migration, so existing rows and any other code reading it are
            unaffected. */}
        <input type="hidden" name="price" value={existing?.price ?? 0} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink">Duration (min)</label>
            <input name="duration_minutes" type="number" min={10} defaultValue={existing?.duration_minutes ?? 60} required className="input-field" />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" name="is_active" defaultChecked={existing?.is_active ?? true} className="h-4 w-4" />
              Active
            </label>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Image URL (optional)</label>
          <input name="image_url" defaultValue={existing?.image_url ?? ''} className="input-field" placeholder="https://..." />
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary">
            <span>{existing ? 'Save changes' : 'Create class'}</span>
          </button>
        </div>
      </form>

      {/*
        Destructive action deliberately outside the main form. A <form> inside a
        <form> is invalid HTML: the browser's parser silently drops the inner
        start tag, so "Delete class" ended up being a submit button for the
        saveClass form — which is what made React throw "A React form was
        unexpectedly submitted."
      */}
      {existing && (
        <form action={deleteClass} className="rounded-lg border border-ink/10 p-5">
          <input type="hidden" name="id" value={existing.id} />
          <p className="font-body text-sm font-semibold text-ink">Delete this class</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            Only a class nothing depends on is actually deleted — and that takes its timetable slots with
            it. If a batch teaches this class, or it has any past bookings, it is deactivated instead: it
            disappears from <strong>/classes</strong> while the batch and the history stay intact. To hide a
            class without deleting anything, untick <strong>Active</strong> above and save.
          </p>
          <DangerSubmit
            message="Delete this class? Its timetable slots go with it. If a batch teaches it, or it has past bookings, it will be deactivated instead of deleted."
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-700"
          >
            <Trash2 size={14} /> Delete class
          </DangerSubmit>
        </form>
      )}
    </div>
  );
}
