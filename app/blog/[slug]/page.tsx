import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import type { BlogPost } from '@/types/database';

export const revalidate = 1800;

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('is_published', true).single();
  return data as BlogPost | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featured_image ? [{ url: post.featured_image }] : undefined,
      publishedTime: post.published_at || undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: post.featured_image ? [post.featured_image] : undefined,
    datePublished: post.published_at,
    author: { '@type': 'Person', name: post.author_name },
  };

  return (
    <article className="container-editorial py-20 md:py-28">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink/50">
        <Link href="/blog" className="hover:text-ink">Journal</Link>
        <ChevronRight size={12} />
        <span className="text-ink">{post.title}</span>
      </nav>

      <div className="mx-auto mt-8 max-w-2xl">
        {post.category && <p className="eyebrow">{post.category}</p>}
        <h1 className="mt-3 text-display-lg">{post.title}</h1>
        <p className="mt-3 text-sm text-ink/50">
          {post.author_name}{post.published_at ? ` · ${formatDate(post.published_at)}` : ''}
        </p>

        {post.featured_image && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg">
            <Image src={post.featured_image} alt={post.title} fill sizes="(min-width: 768px) 700px, 90vw" className="object-cover" />
          </div>
        )}

        <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-display prose-a:text-moss">
          {post.content.split('\n\n').map((para, i) => (
            <p key={i} className="mb-5 leading-relaxed text-ink/75">{para}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
