import Link from 'next/link';
import Image from 'next/image';
import Link2 from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const SERVICES = [
  {
    title: 'Live Classes',
    copy: 'Hatha, Vinyasa & Ashtanga flows across the day, taught live in small batches.',
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: '1:1 Personal Coaching',
    copy: "Private sessions tailored to injuries, goals, or a specific pose you're chasing.",
    image: 'https://images.unsplash.com/photo-1591291621164-2c6367723315?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'Offline Classes',
    copy: 'Join our in-person yoga sessions in Ahmedabad.',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=900&auto=format&fit=crop',
  },
];

export default function ServicesSection() {
  return (
    <section className="container-editorial py-24 md:py-32">
      <ScrollReveal className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Our services</p>
          <h2 className="mt-4 max-w-lg text-display-md">
            A practice for every <span className="accent-italic">season</span> of you.
          </h2>
        </div>
        <Link2 href="/services" className="link-underline hidden text-sm font-semibold text-moss md:inline-block">
          Explore all services →
        </Link2>
      </ScrollReveal>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {SERVICES.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 0.08}>
            <Link href="/services" className="group block overflow-hidden glass-card">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={s.image} alt={s.title} fill sizes="(min-width: 768px) 30vw, 90vw" className="img-zoom object-cover" />
              </div>
              <div className="flex items-center justify-between gap-3 p-6">
                <div>
                  <h3 className="font-display text-xl text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{s.copy}</p>
                </div>
                <ArrowUpRight size={18} className="shrink-0 text-moss transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>

      <Link href="/services" className="link-underline mt-10 inline-block text-sm font-semibold text-moss md:hidden">
        Explore all services →
      </Link>
    </section>
  );
}
