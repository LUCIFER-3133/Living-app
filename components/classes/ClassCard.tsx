import Image from 'next/image';
import Link from 'next/link';
import { Clock, Signal, ArrowRight } from 'lucide-react';
import type { YogaClass } from '@/types/database';

/**
 * Browse-only class card. There is no booking anywhere in the product — the
 * card's job is purely to describe a style of practice and lead to its detail
 * page, so there are no lock badges or "members only" states here.
 */
export default function ClassCard({ yogaClass }: { yogaClass: YogaClass }) {
  return (
    <Link
      href={`/classes/${yogaClass.slug}`}
      className="group block overflow-hidden glass-card transition-transform duration-500 ease-editorial hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={yogaClass.image_url || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=900&auto=format&fit=crop'}
          alt={yogaClass.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-canvas/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moss">
          {yogaClass.category}
        </span>
      </div>
      <div className="p-6">
        <h3 className="text-xl">{yogaClass.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/65">{yogaClass.short_description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/60">
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {yogaClass.duration_minutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <Signal size={14} /> {yogaClass.difficulty}
          </span>
          <span className="flex items-center gap-1 font-semibold text-moss">
            Explore <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
