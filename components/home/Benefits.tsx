import { Video, Clock, Users, Layers } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const BENEFITS = [
  { icon: Video, n: '01', title: 'Live, not pre-recorded', copy: 'Real-time correction and eye contact — the studio feeling, on your screen.' },
  { icon: Clock, n: '02', title: 'Timings for every shift', copy: 'Early morning, lunch break, or evening — 20+ weekly slots.' },
  { icon: Users, n: '03', title: 'Small batches, always', copy: 'Capped at 15 students per class so instructor can actually see you.' },
  { icon: Layers, n: '04', title: 'All levels welcome', copy: 'From first Downward Dog to advanced arm balances — a track for every body.' },
];

export default function Benefits() {
  return (
    <section className="container-editorial py-24 md:py-32">
      <ScrollReveal>
        <p className="eyebrow">Why Living Yoga</p>
        <h2 className="mt-4 max-w-xl text-display-lg">
          Rooted in tradition, <span className="accent-italic">designed</span> for today.
        </h2>
      </ScrollReveal>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b, i) => (
          <ScrollReveal key={b.title} delay={i * 0.08} className="glass-card p-7">
            <p className="font-display italic text-sm text-gold">{b.n}</p>
            <b.icon size={22} className="mt-4 text-ink/60" strokeWidth={1.5} />
            <h3 className="mt-5 text-base leading-snug">{b.title}</h3>
            <p className="mt-2 text-sm normal-case font-normal leading-relaxed text-ink/60">{b.copy}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
