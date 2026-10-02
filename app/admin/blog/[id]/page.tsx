import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import BlogPostForm from '@/components/admin/BlogPostForm';
import type { BlogPost } from '@/types/database';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: post } = await admin.from('blog_posts').select('*').eq('id', id).single();
  if (!post) notFound();

  return (
    <div>
      <h1 className="text-display-md">Edit Post</h1>
      <div className="mt-8">
        <BlogPostForm existing={post as BlogPost} />
      </div>
    </div>
  );
}
