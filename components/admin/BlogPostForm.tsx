import { Trash2 } from 'lucide-react';
import { saveBlogPost, deleteBlogPost } from '@/lib/actions/blog';
import DangerSubmit from '@/components/admin/DangerSubmit';
import type { BlogPost } from '@/types/database';

export default function BlogPostForm({ existing }: { existing?: BlogPost }) {
  return (
    <div className="max-w-2xl space-y-6">
      <form action={saveBlogPost} className="space-y-5 glass-card p-6">
        {existing && <input type="hidden" name="id" value={existing.id} />}

        <div>
          <label className="text-sm font-medium text-ink">Title</label>
          <input name="title" defaultValue={existing?.title} required className="input-field" placeholder="5 breaths to start your morning" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">URL slug (optional)</label>
          <input name="slug" defaultValue={existing?.slug} className="input-field" placeholder="Leave blank to generate from the title" />
          <p className="mt-1 text-xs text-ink/45">Lives at /blog/&lt;slug&gt; — only change this if the post is already published and linked elsewhere.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Excerpt (optional)</label>
          <textarea name="excerpt" defaultValue={existing?.excerpt ?? ''} rows={2} className="input-field resize-none" placeholder="One or two sentences shown on the blog listing card" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Content</label>
          <textarea name="content" defaultValue={existing?.content} required rows={14} className="input-field resize-y font-mono text-xs" placeholder="Write the post. Plain paragraphs — separate them with a blank line." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink">Category (optional)</label>
            <input name="category" defaultValue={existing?.category ?? ''} className="input-field" placeholder="Practice" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Author</label>
            <input name="author_name" defaultValue={existing?.author_name ?? 'Minal Chopra'} className="input-field" placeholder="Minal Chopra" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Featured image URL (optional)</label>
          <input name="featured_image" defaultValue={existing?.featured_image ?? ''} className="input-field" placeholder="https://res.cloudinary.com/…" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink">SEO title (optional)</label>
            <input name="seo_title" defaultValue={existing?.seo_title ?? ''} className="input-field" placeholder="Overrides the page &lt;title&gt;" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">SEO description (optional)</label>
            <input name="seo_description" defaultValue={existing?.seo_description ?? ''} className="input-field" placeholder="Overrides the meta description" />
          </div>
        </div>

        <div className="flex items-center gap-2 pb-1">
          <input type="checkbox" id="is_published" name="is_published" defaultChecked={existing?.is_published ?? false} className="h-4 w-4" />
          <label htmlFor="is_published" className="text-sm font-medium text-ink">Published (shows on /blog)</label>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary">
            <span>{existing ? 'Save changes' : 'Create post'}</span>
          </button>
        </div>
      </form>

      {existing && (
        <form action={deleteBlogPost} className="rounded-lg border border-ink/10 p-5">
          <input type="hidden" name="id" value={existing.id} />
          <p className="font-body text-sm font-semibold text-ink">Delete this post</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">This removes it permanently, including its /blog/{existing.slug} page if published.</p>
          <DangerSubmit
            message="Delete this post? This can't be undone."
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-700"
          >
            <Trash2 size={14} /> Delete post
          </DangerSubmit>
        </form>
      )}
    </div>
  );
}
