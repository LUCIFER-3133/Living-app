import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { BlogPost } from '@/types/database';

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block overflow-hidden glass-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-canvas-dim">
        {post.featured_image && (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
            className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-6">
        {post.category && <p className="eyebrow">{post.category}</p>}
        <h3 className="mt-2 font-display text-xl text-ink">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>}
        {post.published_at && <p className="mt-4 text-xs text-ink/45">{formatDate(post.published_at)}</p>}
      </div>
    </Link>
  );
}
