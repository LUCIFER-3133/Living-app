'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction as requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function saveBlogPost(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = formData.get('id') as string | null;
  const title = ((formData.get('title') as string) ?? '').trim();
  const content = ((formData.get('content') as string) ?? '').trim();

  if (!title || !content) redirect('/admin/blog?notice=fields_required');

  const slugInput = ((formData.get('slug') as string) ?? '').trim();
  const slug = slugify(slugInput || title);
  const isPublished = formData.get('is_published') === 'on';

  // published_at is set the first time a post goes live, and never moved
  // afterwards just because it's re-saved — otherwise every edit would
  // bump an already-published post back to the top of the feed.
  let publishedAt: string | null = null;
  if (id) {
    const { data: current } = await admin.from('blog_posts').select('published_at').eq('id', id).single();
    publishedAt = current?.published_at ?? null;
  }
  if (isPublished && !publishedAt) publishedAt = new Date().toISOString();

  const payload = {
    title,
    slug,
    content,
    excerpt: ((formData.get('excerpt') as string) ?? '').trim() || null,
    featured_image: ((formData.get('featured_image') as string) ?? '').trim() || null,
    category: ((formData.get('category') as string) ?? '').trim() || null,
    author_name: ((formData.get('author_name') as string) ?? '').trim() || 'Living Yoga',
    is_published: isPublished,
    published_at: publishedAt,
    seo_title: ((formData.get('seo_title') as string) ?? '').trim() || null,
    seo_description: ((formData.get('seo_description') as string) ?? '').trim() || null,
  };

  const { error } = id
    ? await admin.from('blog_posts').update(payload).eq('id', id)
    : await admin.from('blog_posts').insert(payload);

  if (error) {
    console.error('[blog] save failed:', error);
    // A duplicate slug is the one failure mode worth naming specifically —
    // everything else just says "check the logs".
    const notice = error.code === '23505' ? 'slug_taken' : 'save_failed';
    redirect(`/admin/blog?notice=${notice}`);
  }

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  redirect('/admin/blog');
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get('id') as string;
  if (!id) redirect('/admin/blog?notice=error');

  const { data: post } = await admin.from('blog_posts').select('slug').eq('id', id).single();
  const { error } = await admin.from('blog_posts').delete().eq('id', id);
  const notice = error ? 'error' : 'deleted';
  if (error) console.error('[blog] delete failed:', error);

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  if (post?.slug) revalidatePath(`/blog/${post.slug}`);
  redirect(`/admin/blog?notice=${notice}`);
}
