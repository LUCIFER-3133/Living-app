import { Trash2 } from 'lucide-react';
import { saveTestimonial, deleteTestimonial } from '@/lib/actions/testimonials';
import DangerSubmit from '@/components/admin/DangerSubmit';
import type { Testimonial } from '@/types/database';

export default function TestimonialForm({ existing }: { existing?: Testimonial }) {
  return (
    <div className="max-w-xl space-y-6">
      <form action={saveTestimonial} className="space-y-5 glass-card p-6">
        {existing && <input type="hidden" name="id" value={existing.id} />}

        <div>
          <label className="text-sm font-medium text-ink">Member name</label>
          <input name="name" defaultValue={existing?.name} required className="input-field" placeholder="Ananya R." />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Role / location (optional)</label>
          <input name="role" defaultValue={existing?.role ?? ''} className="input-field" placeholder="Bengaluru" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Quote</label>
          <textarea name="quote" defaultValue={existing?.quote} required rows={4} className="input-field resize-none" placeholder="What they actually said" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink">Rating</label>
            <select name="rating" defaultValue={existing?.rating ?? 5} className="input-field">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r === 1 ? '' : 's'}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" name="is_published" defaultChecked={existing?.is_published ?? false} className="h-4 w-4" />
              Published (shows on homepage)
            </label>
          </div>
        </div>

        <p className="text-xs text-ink/45">
          Only use a real quote from a real member — with their permission. This is what visitors see as
          social proof; it should hold up if they ever ask that member about it.
        </p>

        <div className="pt-2">
          <button type="submit" className="btn-primary">
            <span>{existing ? 'Save changes' : 'Add testimonial'}</span>
          </button>
        </div>
      </form>

      {existing && (
        <form action={deleteTestimonial} className="rounded-lg border border-ink/10 p-5">
          <input type="hidden" name="id" value={existing.id} />
          <p className="font-body text-sm font-semibold text-ink">Delete this testimonial</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">This removes it permanently, including from the homepage if published.</p>
          <DangerSubmit
            message="Delete this testimonial? This can't be undone."
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-700"
          >
            <Trash2 size={14} /> Delete testimonial
          </DangerSubmit>
        </form>
      )}
    </div>
  );
}
