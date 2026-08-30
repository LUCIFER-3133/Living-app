'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import type { Testimonial } from '@/types/database';

// Slow, continuous auto-slide that pauses the moment the pointer enters the
// track and resumes from wherever it left off once it leaves. Native
// horizontal scroll (rather than a transform-driven marquee) is what makes
// this play nicely with the arrow buttons and with touch swipe for free.
const AUTO_SLIDE_INTERVAL = 4200;

// This used to render six invented quotes attributed to made-up students —
// presented as genuine reviews with nothing behind them. Real ones now come
// from the `testimonials` table (manage them at /admin/testimonials); until
// there are some published, the section just doesn't render rather than
// showing anything fabricated in their place.
export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.children[0] as HTMLElement | undefined;
    const gap = 24; // matches gap-6
    const amount = (firstCard?.offsetWidth ?? track.clientWidth * 0.85) + gap;
    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByCard(1);
      }
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [isPaused]);

  if (testimonials.length === 0) return null;

  return (
    <section className="container-editorial py-24 md:py-32">
      <ScrollReveal className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-4 text-display-md">
            What our students <span className="accent-italic">say</span>
          </h2>
        </div>
        <div className="hidden gap-3 md:flex">
          <button
            aria-label="Previous testimonial"
            onClick={() => scrollByCard(-1)}
            className="rounded-full border border-ink/20 p-2.5 transition-colors hover:border-ink hover:bg-white/50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next testimonial"
            onClick={() => scrollByCard(1)}
            className="rounded-full border border-ink/20 p-2.5 transition-colors hover:border-ink hover:bg-white/50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </ScrollReveal>

      <div
        ref={trackRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((t, i) => (
          <ScrollReveal
            key={t.name}
            delay={i * 0.05}
            className="w-[85%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
          >
            <div className="flex h-full flex-col rounded-lg glass-card p-7 transition-transform duration-400 ease-editorial hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <span className="font-display text-4xl italic leading-none text-gold/70">&ldquo;</span>
                <div className="mt-1.5 flex gap-1 text-gold">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} size={13} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/75">{t.quote}</p>
              <div className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss/10 font-display text-sm text-moss">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink/50">{t.role}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3 md:hidden">
        <button
          aria-label="Previous testimonial"
          onClick={() => scrollByCard(-1)}
          className="rounded-full border border-ink/20 p-2.5 transition-colors hover:border-ink"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          aria-label="Next testimonial"
          onClick={() => scrollByCard(1)}
          className="rounded-full border border-ink/20 p-2.5 transition-colors hover:border-ink"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
