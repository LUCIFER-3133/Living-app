import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const POSTS = [
  { category: 'Beginners', title: '5 poses to start your morning right', slug: 'poses-to-start-your-morning-right' },
  { category: 'Breathwork', title: 'Pranayama for anxious minds', slug: 'pranayama-for-anxious-minds' },
  { category: 'Lifestyle', title: 'Building a home practice that sticks', slug: 'building-a-home-practice-that-sticks' },
];

export default function BlogTeasers() {
  return (
    <section className="container-editorial py-24 md:py-32">
      <ScrollReveal className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">From the journal</p>
          <h2 className="mt-4 max-w-lg text-display-md">
            Notes on <span className="accent-italic">practice</span>
          </h2>
        </div>
        <Link href="/blog" className="link-underline hidden text-sm font-semibold text-moss md:inline-block">
          Read the blog →
        </Link>
      </ScrollReveal>

      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {POSTS.map((p, i) => (
          <ScrollReveal key={p.slug} delay={i * 0.08}>
            <Link href={`/blog/${p.slug}`} className="group flex items-center justify-between gap-4 border-b border-ink/10 pb-6">
              <div>
                <p className="eyebrow">{p.category}</p>
                <h3 className="mt-2 font-display text-xl text-ink">{p.title}</h3>
              </div>
              <ArrowUpRight size={18} className="shrink-0 text-moss transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </ScrollReveal>
        ))}
      </div>

      <Link href="/blog" className="link-underline mt-10 inline-block text-sm font-semibold text-moss md:hidden">
        Read the blog →
      </Link>
    </section>
  );
}
