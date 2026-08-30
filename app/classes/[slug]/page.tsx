import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Signal, ChevronRight, CalendarDays, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasActiveMembership } from '@/lib/memberships';
import { formatStudioTime, formatWeekdays } from '@/lib/batches';
import ScrollReveal from '@/components/ui/ScrollReveal';
import type { Batch, YogaClass } from '@/types/database';

export const dynamic = 'force-dynamic'; // membership status is per-user; don't cache

async function getClass(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('classes').select('*').eq('slug', slug).eq('is_active', true).single();
  return data as YogaClass | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const yogaClass = await getClass(slug);
  if (!yogaClass) return {};

  return {
    title: yogaClass.seo_title || `${yogaClass.name} — Living Yoga`,
    description: yogaClass.seo_description || yogaClass.short_description,
    alternates: { canonical: `/classes/${yogaClass.slug}` },
    openGraph: {
      title: yogaClass.name,
      description: yogaClass.short_description,
      images: yogaClass.image_url ? [{ url: yogaClass.image_url }] : undefined,
    },
  };
}

/** Browse-only. Shows which batches run this class; assignment happens by admin. */
export default async function ClassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const yogaClass = await getClass(slug);
  if (!yogaClass) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const hasMembership = user ? await hasActiveMembership(supabase, user.id) : false;

  const { data: batches } = await supabase
    .from('batches')
    .select('*')
    .eq('class_id', yogaClass.id)
    .eq('status', 'active')
    .order('start_time');

  const batchList = (batches as Batch[]) ?? [];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Classes', item: '/classes' },
      { '@type': 'ListItem', position: 2, name: yogaClass.name, item: `/classes/${yogaClass.slug}` },
    ],
  };

  return (
    <div className="container-editorial py-20 md:py-28">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink/50">
        <Link href="/classes" className="hover:text-ink">Classes</Link>
        <ChevronRight size={12} />
        <span className="text-ink">{yogaClass.name}</span>
      </nav>

      <div className="mt-8 grid gap-14 md:grid-cols-2">
        <ScrollReveal className="relative aspect-[4/3] overflow-hidden rounded-lg">
          <Image
            src={yogaClass.image_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1100&auto=format&fit=crop'}
            alt={yogaClass.name}
            fill
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover"
          />
        </ScrollReveal>

        <div>
          <ScrollReveal>
            <p className="eyebrow">{yogaClass.category}</p>
            <h1 className="mt-3 text-display-lg">{yogaClass.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-ink/60">
              <span className="flex items-center gap-1.5"><Clock size={15} /> {yogaClass.duration_minutes} minutes</span>
              <span className="flex items-center gap-1.5"><Signal size={15} /> {yogaClass.difficulty}</span>
            </div>
            <p className="mt-6 max-w-md leading-relaxed text-ink/70">
              {yogaClass.long_description || yogaClass.short_description}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="mt-10">
            <h2 className="text-display-sm">Batches running this class</h2>

            {batchList.length === 0 ? (
              <p className="mt-4 text-sm text-ink/55">
                No batch is running this class right now —{' '}
                <Link href={`/contact?topic=new-batch&class=${encodeURIComponent(yogaClass.name)}`} className="link-underline text-moss">ask us about starting one</Link>.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {batchList.map((b) => (
                  <li key={b.id} className="glass-card p-4">
                    <p className="font-body text-sm font-semibold text-ink">{b.name}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/60">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-moss" /> {formatWeekdays(b.weekdays)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-moss" />
                        {formatStudioTime(b.start_time)} – {formatStudioTime(b.end_time)} IST
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-moss" /> {b.instructor_name}
                      </span>
                    </p>
                    {b.description && <p className="mt-2 text-sm leading-relaxed text-ink/60">{b.description}</p>}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex flex-wrap gap-4">
              {hasMembership ? (
                <>
                  <Link href="/dashboard" className="btn-primary"><span>My live classes</span></Link>
                  <Link href={`/contact?topic=join-batch&class=${encodeURIComponent(yogaClass.name)}`} className="btn-outline"><span>Ask to join this batch</span></Link>
                </>
              ) : (
                <>
                  <Link href="/membership" className="btn-primary"><span>View membership plans</span></Link>
                  <Link href="/demo-sessions" className="btn-outline"><span>Watch a free demo</span></Link>
                </>
              )}
            </div>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-ink/45">
              Classes aren&apos;t booked individually. Once you have a membership we place you in the batch
              that suits your timings, and your join link appears in your dashboard before each session.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
