import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ScrollReveal from '@/components/ui/ScrollReveal';
import BlogCard from '@/components/blog/BlogCard';
import type { BlogPost } from '@/types/database';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Notes on practice, breath and mindful living from the Living Yoga studio.',
  alternates: { canonical: '/blog' },
};

export const revalidate = 1800;

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  const list = (posts as BlogPost[]) ?? [];

  return (
    <div className="container-editorial py-20 md:py-28">
      <ScrollReveal>
        <p className="eyebrow">Journal</p>
        <h1 className="mt-4 max-w-xl text-display-lg">Notes on practice and mindful living.</h1>
      </ScrollReveal>

      {list.length === 0 ? (
        <p className="mt-16 text-ink/60">Posts will appear here once published from the admin dashboard.</p>
      ) : (
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((post, i) => (
            <ScrollReveal key={post.id} delay={(i % 3) * 0.06}>
              <BlogCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
