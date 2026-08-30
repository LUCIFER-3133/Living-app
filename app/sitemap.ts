import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.livingyoga.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // '/booking' is deliberately absent — it now permanently redirects to
  // /membership and shouldn't be advertised to crawlers.
  const staticRoutes = [
    '', '/about', '/classes', '/membership', '/demo-sessions', '/blog', '/contact',
    '/privacy-policy', '/terms', '/cancellation-refund',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  const { data: classes } = await supabase.from('classes').select('slug, updated_at').eq('is_active', true);
  const classRoutes = (classes ?? []).map((c) => ({
    url: `${SITE_URL}/classes/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const { data: posts } = await supabase.from('blog_posts').select('slug, updated_at').eq('is_published', true);
  const blogRoutes = (posts ?? []).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...classRoutes, ...blogRoutes];
}
