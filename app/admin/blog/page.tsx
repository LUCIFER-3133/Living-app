import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, { text: string; tone: 'moss' | 'gold' }> = {
  deleted: { text: 'Post deleted.', tone: 'moss' },
  fields_required: { text: 'A title and content are both required. Nothing was saved.', tone: 'gold' },
  slug_taken: { text: 'That URL slug is already used by another post — change it and save again.', tone: 'gold' },
  save_failed: { text: 'That post could not be saved — check the server logs.', tone: 'gold' },
  error: { text: 'Something went wrong — check the server logs. Nothing was changed.', tone: 'gold' },
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: posts } = await admin.from('blog_posts').select('*').order('created_at', { ascending: false });

  const noticeInfo = notice && Object.prototype.hasOwnProperty.call(NOTICES, notice) ? NOTICES[notice] : null;

  return (
    <div>
      {noticeInfo && (
        <p className={`glass-card mb-8 p-4 text-sm normal-case font-normal ${noticeInfo.tone === 'gold' ? 'text-gold' : 'text-moss'}`}>
          {noticeInfo.text}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md">Blog</h1>
          <p className="mt-1 text-sm text-ink/55">Posts published here show up on /blog and its own /blog/[slug] page.</p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary !px-4 !py-2 !text-xs">
          <Plus size={14} /> <span>New post</span>
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto glass-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 max-w-sm truncate">
                  {p.title}
                  <span className="ml-1.5 text-ink/40">/{p.slug}</span>
                </td>
                <td className="px-4 py-3 text-ink/70">{p.category || '—'}</td>
                <td className="px-4 py-3">{p.is_published ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-ink/60">{p.published_at ? formatDate(p.published_at) : '—'}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/blog/${p.id}`} className="link-underline text-moss">Edit</Link>
                </td>
              </tr>
            ))}
            {(!posts || posts.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No posts yet — write your first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
