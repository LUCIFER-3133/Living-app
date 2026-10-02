import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasActiveMembership } from '@/lib/memberships';
import ClassCard from '@/components/classes/ClassCard';
import BatchTimetable from '@/components/classes/BatchTimetable';
import ScrollReveal from '@/components/ui/ScrollReveal';
import type { Batch, YogaClass } from '@/types/database';

export const metadata: Metadata = {
  title: 'Class Timings & Schedule',
  description:
    'Browse live online yoga class timings across Hatha, Vinyasa, Ashtanga, Prenatal and Power Yoga. Join a batch with any Living Yoga membership.',
  alternates: { canonical: '/classes' },
};

export const dynamic = 'force-dynamic'; // membership status is per-user; don't cache

/**
 * BROWSE-ONLY.
 *
 * There is intentionally no booking anywhere on this page. Members don't pick
 * slots themselves — an admin assigns them to a recurring batch, and the batch
 * (plus its join link) shows up on /dashboard. Every CTA here therefore leads
 * to membership or contact, never to a booking flow.
 */
export default async function ClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const hasMembership = user ? await hasActiveMembership(supabase, user.id) : false;

  const [{ data: classes }, { data: batches }] = await Promise.all([
    supabase.from('classes').select('*').eq('is_active', true).order('name'),
    supabase
      .from('batches')
      .select('*, class:classes(name, category, difficulty)')
      .eq('status', 'active')
      .order('start_time'),
  ]);

  const classList = (classes as YogaClass[]) ?? [];
  const batchList = (batches as (Batch & { class: YogaClass | null })[]) ?? [];

  return (
    <div>
      {/* Plain text hero — no background video here (see classes page). */}
      <div className="container-editorial py-20 md:py-28">
        <ScrollReveal>
          <p className="eyebrow">Weekly schedule</p>
          <h1 className="mt-4 max-w-2xl text-display-lg">
            Find a rhythm that <span className="accent-italic">fits</span> your week.
          </h1>
          <p className="lede mt-5 max-w-xl">
            All times shown are IST. Every batch below is included with an active membership —
            no per-class fees, ever.
          </p>
        </ScrollReveal>
      </div>

      <div className="container-editorial pb-20 md:pb-28">
        {/* How access actually works — set expectations before the timetable,
            since there is no "book" button to discover. */}
        <ScrollReveal className="mt-10 glass-card p-7">
          <h2 className="text-display-sm">How joining works</h2>
          <ol className="mt-5 grid gap-6 sm:grid-cols-3">
            {[
              { n: '01', t: 'Choose a membership', d: 'Pick the plan that suits how often you want to practise.' },
              { n: '02', t: 'We place you in a batch', d: 'Tell us the timings that work and we assign you to a matching batch.' },
              { n: '03', t: 'Join from your dashboard', d: 'Your live class link appears in your dashboard an hour before each session.' },
            ].map((s) => (
              <li key={s.n}>
                <p className="font-display text-2xl italic text-gold">{s.n}</p>
                <p className="mt-1 font-body text-sm font-semibold text-ink">{s.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">{s.d}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap gap-4 border-t border-ink/10 pt-6">
            {hasMembership ? (
              <>
                <Link href="/dashboard" className="btn-primary"><span>Go to my dashboard</span></Link>
                <Link href="/contact?topic=batch-change" className="btn-outline"><span>Request a different batch</span></Link>
              </>
            ) : (
              <>
                <Link href="/membership" className="btn-primary"><span>View membership plans</span></Link>
                <Link href="/demo-sessions" className="btn-outline"><span>Watch a free demo</span></Link>
              </>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-16">
          <h2 className="text-display-md">The weekly timetable</h2>
        </ScrollReveal>
        <BatchTimetable batches={batchList} />

        {classList.length > 0 && (
          <div className="mt-24">
            <ScrollReveal>
              <p className="eyebrow">Or browse by style</p>
              <h2 className="mt-3 text-display-md">Every practice we teach.</h2>
            </ScrollReveal>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {classList.map((c, i) => (
                <ScrollReveal key={c.id} delay={(i % 3) * 0.06}>
                  <ClassCard yogaClass={c} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </div>

      {!hasMembership && (
        <div className="bg-canvas-dim py-20 md:py-24">
          <div className="container-editorial max-w-xl text-center">
            <ScrollReveal>
              <p className="eyebrow justify-center">First time here?</p>
              <h2 className="mt-4 text-display-md">Try before you join — watch a free demo.</h2>
              <p className="lede mt-4">
                Watch a full demo session to see the pace and the instructor before choosing a plan.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/demo-sessions" className="btn-primary"><span>Watch demo sessions</span></Link>
                <Link href="/membership" className="btn-outline"><span>View membership plans</span></Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      )}
    </div>
  );
}
