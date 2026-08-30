import type { Metadata } from 'next';
import Image from 'next/image';
import ScrollReveal from '@/components/ui/ScrollReveal';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Meet the team behind Living Yoga — a certified online yoga studio based in India, on a mission to make authentic, live yoga instruction accessible to everyone.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { title: 'Authenticity over trend', copy: 'We teach classical sequences, not fitness-fad remixes.' },
  { title: 'Accessibility first', copy: 'Every level, every body, every budget has a place at Living Yoga.' },
  { title: 'Community, not content', copy: 'Small live batches so instructors actually know your name.' },
];

export default function AboutPage() {
  return (
    <div>
      <div className="container-editorial py-20 md:py-28">
        <ScrollReveal>
          <p className="eyebrow">Our story</p>
          <h1 className="mt-4 max-w-2xl text-display-lg">
            Built by teachers who missed their <span className="accent-italic">students.</span>
          </h1>
        </ScrollReveal>
      </div>

      <div className="container-editorial grid gap-14 pb-24 md:grid-cols-2 md:pb-32">
        <ScrollReveal className="relative aspect-[4/5] overflow-hidden rounded-lg">
          <Image
            src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1100&auto=format&fit=crop"
            alt="Living Yoga studio interior"
            fill
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover"
          />
        </ScrollReveal>
        <ScrollReveal delay={0.1} className="space-y-5 leading-relaxed text-ink/70">
          <p>
            Living Yoga began in 2021 as three instructors trying to keep their community
            together during a difficult year — it&apos;s now a studio serving thousands across
            India and beyond.
          </p>
          <p>
            What started as a handful of video calls turned into a full teaching practice:
            structured weekly batches, real-time correction, and a community that shows up
            for each other as much as for the poses.
          </p>
        </ScrollReveal>
      </div>

      <div className="bg-canvas-dim py-24 md:py-32">
        <div className="container-editorial max-w-2xl">
          <ScrollReveal>
            <p className="eyebrow">Mission</p>
            <h2 className="mt-4 text-display-md">Making real yoga instruction reach every home in India.</h2>
            <p className="mt-6 leading-relaxed text-ink/70">
              We believe good yoga instruction shouldn&apos;t depend on which city you live in.
              A student in a small town deserves the same real-time correction and attention
              as someone who can walk into a premium studio — that gap is what Living Yoga
              was built to close.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="container-editorial py-24 md:py-32">
        <ScrollReveal>
          <p className="eyebrow">What we stand for</p>
          <h2 className="mt-4 max-w-lg text-display-md">
            Our <span className="accent-italic">values</span>
          </h2>
        </ScrollReveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {VALUES.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 0.08}>
              <h3 className="font-display text-xl text-ink">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{v.copy}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
