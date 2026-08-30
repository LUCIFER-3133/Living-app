import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ScrollReveal from '@/components/ui/ScrollReveal';
import VideoGrid from '@/components/demo/VideoGrid';
import type { DemoVideo } from '@/types/database';

export const metadata: Metadata = {
  title: 'Demo Sessions',
  description: 'Watch free demo yoga sessions from Living Yoga instructors before you choose a membership and join a batch.',
  alternates: { canonical: '/demo-sessions' },
};

export const revalidate = 1800;

export default async function DemoSessionsPage() {
  const supabase = await createClient();
  const { data: videos } = await supabase
    .from('demo_videos')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="container-editorial py-20 md:py-28">
      <ScrollReveal>
        <p className="eyebrow">First time here?</p>
        <h1 className="mt-4 max-w-xl text-display-lg">
          Watch a class before you <span className="accent-italic">book</span> one.
        </h1>
        <p className="mt-4 max-w-md text-ink/65">
          A few full-length sessions across styles, so you can see the pace and the
          instructor before choosing a slot.
        </p>
      </ScrollReveal>

      <div className="mt-16">
        <VideoGrid videos={(videos as DemoVideo[]) ?? []} />
      </div>
    </div>
  );
}
