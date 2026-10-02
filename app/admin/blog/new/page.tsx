import BlogPostForm from '@/components/admin/BlogPostForm';
import { requireAdminPage } from '@/lib/auth';

export default async function NewBlogPostPage() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="text-display-md">New Post</h1>
      <div className="mt-8">
        <BlogPostForm />
      </div>
    </div>
  );
}
