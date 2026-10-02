import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Live online yoga classes, 1:1 personal coaching, and in-person offline classes in Ahmedabad — explore every way to practice with Living Yoga.',
  alternates: { canonical: '/services' },
};

const SERVICES = [
  {
    title: 'Live Classes',
    copy: 'Hatha, Vinyasa & Ashtanga flows across the day, taught live in small batches capped at 15 students — so instructors can actually correct your form in real time.',
    points: ['20+ weekly slots across styles', 'Small batches, capped at 15', 'Recordings available for 7 days'],
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1100&auto=format&fit=crop',
    cta: 'See class timings',
    href: '/classes',
  },
  {
    title: '1:1 Personal Coaching',
    copy: "Private sessions built entirely around you — a nagging injury, a specific pose you're chasing, or simply a pace group classes can't offer.",
    points: ['Fully personalised sequencing', 'Flexible scheduling', 'Included free with Unlimited & Family plans'],
    image: 'https://images.unsplash.com/photo-1591291621164-2c6367723315?q=80&w=1100&auto=format&fit=crop',
    cta: 'Book a coaching session',
    href: '/contact',
  },
  {
    title: 'Offline Classes',
    copy: 'Prefer a real room and a real mat next to you? Join our in-person sessions at the studio in Ahmedabad, taught by the same instructors you see online.',
    points: ['In-person at our Ahmedabad studio', 'Same instructors as live online classes', 'Great for first-timers'],
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1100&auto=format&fit=crop',
    cta: 'Enquire about offline classes',
    href: '/contact',
  },
];

export default function ServicesPage() {
  return (
    <div>
      <div className="container-editorial py-20 md:py-28">
        <ScrollReveal>
          <p className="eyebrow">Our services</p>
          <h1 className="mt-4 max-w-xl text-display-lg">
            A practice for every <span className="accent-italic">season</span> of you.
          </h1>
        </ScrollReveal>
      </div>

      <div className="container-editorial space-y-24 pb-24 md:space-y-32 md:pb-32">
        {SERVICES.map((s, i) => (
          <div key={s.title} className={`grid gap-12 md:grid-cols-2 md:items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
            <ScrollReveal className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image src={s.image} alt={s.title} fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-display-md">{s.title}</h2>
              <p className="mt-4 max-w-md leading-relaxed text-ink/70">{s.copy}</p>
              <ul className="mt-6 space-y-2.5">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-ink/70">
                    <Check size={16} className="mt-0.5 shrink-0 text-moss" /> {p}
                  </li>
                ))}
              </ul>
              <Link href={s.href} className="btn-outline mt-8">
                <span>{s.cta}</span>
                <ArrowUpRight size={16} />
              </Link>
            </ScrollReveal>
          </div>
        ))}
      </div>
    </div>
  );
}
