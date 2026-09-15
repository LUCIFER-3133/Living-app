import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ScrollReveal from '@/components/ui/ScrollReveal';

// Real content from the studio's founder — replaces the earlier placeholder
// "three instructors, founded 2021" copy, which described a studio that
// doesn't exist. This is a single named, certified teacher, and the bio,
// title, description and schema below all reflect that.
export const metadata: Metadata = {
  title: 'About Minal Chopra — YCB Level 3 Certified Yoga Teacher',
  description:
    'Meet Minal Chopra, YCB Level 3 Certified Yoga Teacher and founder of Living Yoga — mindful movement, breath awareness and real progress, at your own pace.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Minal Chopra — YCB Level 3 Certified Yoga Teacher',
    description: 'Yoga as a practice of awareness, strength, balance and transformation.',
    url: '/about',
  },
};

const PRACTICE_LINES = [
  { title: 'Practice with intention.', copy: 'Every session has a purpose — not movement for its own sake.' },
  { title: 'Move with awareness.', copy: 'Alignment and breath come before speed or difficulty.' },
  { title: 'Breathe with purpose.', copy: 'The breath is the practice, not a soundtrack to it.' },
  { title: 'Progress with patience.', copy: 'Strength and mobility are built gradually, through consistency, not force.' },
];

export default function AboutPage() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Minal Chopra',
    jobTitle: 'YCB Level 3 Certified Yoga Teacher',
    description:
      'YCB Level 3 Certified Yoga Teacher and founder of Living Yoga, teaching mindful movement, breath awareness, strength and intelligent progression.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.livingyoga.in'}/about`,
    worksFor: { '@type': 'Organization', name: 'Living Yoga' },
    knowsAbout: ['Yoga', 'Asana', 'Pranayama', 'Mindful Movement', 'Yoga Alignment'],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />

      {/* ── Hero ──
          Same video-hero treatment as the homepage and /classes: full-bleed
          clip, grayscale gradient overlay (no color tint) + text-shadow for
          legibility, content absolutely centered so it holds regardless of
          how the section's own height is set. */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover"
          src="https://res.cloudinary.com/daflkt8ob/video/upload/v1789411702/4_fetk06.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="hero-video-overlay absolute inset-0 z-10" aria-hidden="true" />
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container-editorial">
            <ScrollReveal>
              <div className="hero-text-shadow">
                <p className="eyebrow">Meet your teacher</p>
                <h1 className="mt-4 max-w-2xl text-display-lg text-canvas">
                  Meet <span className="accent-italic">Minal.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-canvas/85">
                  Yoga as a practice of awareness, strength, balance and transformation.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Bio ── */}
      <div className="container-editorial grid gap-14 pt-20 pb-24 md:grid-cols-2 md:pt-28 md:pb-32">
        <ScrollReveal className="relative aspect-[4/5] overflow-hidden rounded-lg">
          {/* Placeholder — swap for a real photo of Minal teaching or in
              practice once you have one to hand over. */}
          <Image
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1100&auto=format&fit=crop"
            alt="A live yoga session — mindful movement and breath-led practice"
            fill
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover"
          />
        </ScrollReveal>
        <ScrollReveal delay={0.1} className="space-y-5 leading-relaxed text-ink/70">
          <p>
            I&apos;m <strong className="font-semibold text-ink">Minal Chopra</strong>, a{' '}
            <strong className="font-semibold text-ink">YCB Level 3 Certified Yoga Teacher and dedicated practitioner</strong>,
            with several years of experience in practising and teaching yoga.
          </p>
          <p>
            My journey with yoga began as a personal exploration, but over time, it became much more than a physical
            practice. Yoga taught me to become more aware of my body, my breath and my mind — and to understand that
            the practice continues long after we step off the mat.
          </p>
          <p>
            This journey has shaped the way I teach today: with a deep respect for the traditional roots of yoga,
            while creating a practice that is purposeful, progressive and relevant to the individual.
          </p>
        </ScrollReveal>
      </div>

      {/* ── My Approach to Yoga ── */}
      <div className="bg-canvas-dim py-24 md:py-32">
        <div className="container-editorial max-w-2xl">
          <ScrollReveal>
            <p className="eyebrow">My approach</p>
            <h2 className="mt-4 text-display-md">Not how flexible you are. How aware you become.</h2>
            <p className="mt-6 leading-relaxed text-ink/70">
              I believe yoga is not about how flexible you are or how perfectly you can perform an asana. It is about
              developing a deeper relationship with your body and learning to move, breathe and live with greater
              awareness.
            </p>
            <p className="mt-4 leading-relaxed text-ink/70">
              My teaching focuses on <strong className="font-semibold text-ink">mindful movement, strength, mobility,
              flexibility, alignment, breath awareness and intelligent progression</strong>. For students working
              towards advanced asanas, I believe in building the required strength and mobility gradually, through
              proper preparation, technique and consistency rather than force.
            </p>
            <p className="mt-4 leading-relaxed text-ink/70">
              Whether you are beginning your yoga journey or looking to deepen an existing practice, my intention is
              to create a space where you can challenge yourself while also learning to listen to your body.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* ── Yoga Beyond the Mat ── */}
      <div className="container-editorial py-24 md:py-32">
        <div className="grid gap-14 md:grid-cols-2">
          <ScrollReveal>
            <p className="eyebrow">Honesty, not perfection</p>
            <h2 className="mt-4 max-w-md text-display-md">
              Yoga beyond the <span className="accent-italic">mat.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1} className="space-y-5 leading-relaxed text-ink/70">
            <p>
              I also believe in being honest about what it means to practise yoga in real life. I&apos;m a yoga
              teacher, but I&apos;m also a photographer, a professional, and a person with multiple responsibilities.
              There are days when I miss my practice, work takes over, or I find myself going to bed later than I
              planned. I don&apos;t always manage to follow every yogic practice perfectly throughout the day — and I
              don&apos;t believe I need to pretend otherwise.
            </p>
            <p className="border-l-2 border-gold/40 pl-5 font-display text-xl italic text-ink">
              Because consistency does not mean perfection.
            </p>
            <p>
              The way we sleep, work, rest, eat, think and respond to everyday situations is also part of our
              relationship with yoga. At the same time, life has its own demands, and maintaining an ideal routine
              every single day is not always realistic.
            </p>
            <p>
              What matters to me is learning to listen. If my body needs rest, I rest. If I have missed my practice,
              I return to it. If my schedule becomes demanding, I try to make conscious choices, protect my sleep and
              avoid pushing my body simply because I feel I should.
            </p>
            <p className="font-semibold text-ink">
              My goal is not to practise perfectly for a short period of time. My goal is to keep practising for
              life.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* ── My Philosophy ── */}
      <div className="bg-canvas-dim py-24 md:py-32">
        <div className="container-editorial">
          <ScrollReveal className="max-w-2xl">
            <p className="eyebrow">My philosophy</p>
            <h2 className="mt-4 text-display-md">
              Discipline, patience and <span className="accent-italic">curiosity</span> — not comparison.
            </h2>
            <p className="mt-6 leading-relaxed text-ink/70">
              You don&apos;t have to practise every single day. You don&apos;t have to be extremely flexible. You
              don&apos;t have to follow every yogic principle flawlessly to have a meaningful practice. What matters
              is awareness — the ability to observe yourself, respect your body&apos;s needs, keep learning and
              return to the practice whenever you can.
            </p>
            <p className="mt-4 leading-relaxed text-ink/70">
              For me, yoga is not about creating a perfect life. It is about becoming more aware of the life I am
              already living.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PRACTICE_LINES.map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 0.08}>
                <h3 className="font-display text-lg text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{v.copy}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Closing ── */}
      <div className="container-editorial py-24 text-center md:py-32">
        <ScrollReveal className="mx-auto max-w-2xl">
          <p className="eyebrow">Living Yoga</p>
          <p className="mt-6 text-display-sm leading-snug text-ink">
            Through Living Yoga, my intention is to create more than just yoga classes. I want to create a space
            where you can slow down, strengthen your body, understand your breath, challenge your limitations and
            reconnect with yourself.
          </p>
          <p className="mx-auto mt-8 max-w-lg leading-relaxed text-ink/70">
            Your practice is your journey. I&apos;m here to guide you through it — one breath, one movement and one
            step at a time.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/membership" className="btn-primary !px-6 !py-3">
              <span>See membership plans</span>
            </Link>
            <Link href="/classes" className="btn-secondary !px-6 !py-3">
              <span>Explore classes</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
