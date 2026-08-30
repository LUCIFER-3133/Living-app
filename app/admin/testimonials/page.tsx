import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, { text: string; tone: 'moss' | 'gold' }> = {
  deleted: { text: 'Testimonial deleted.', tone: 'moss' },
  fields_required: { text: 'A name and quote are both required. Nothing was saved.', tone: 'gold' },
  save_failed: { text: 'That testimonial could not be saved — check the server logs.', tone: 'gold' },
  error: { text: 'Something went wrong — check the server logs. Nothing was changed.', tone: 'gold' },
};

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: testimonials } = await admin.from('testimonials').select('*').order('created_at', { ascending: false });

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
          <h1 className="text-display-md">Testimonials</h1>
          <p className="mt-1 text-sm text-ink/55">Only real quotes from real members, with their permission — these show as social proof on the homepage.</p>
        </div>
        <Link href="/admin/testimonials/new" className="btn-primary !px-4 !py-2 !text-xs">
          <Plus size={14} /> <span>Add testimonial</span>
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto glass-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Quote</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Published</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {(testimonials ?? []).map((t) => (
              <tr key={t.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">{t.name}{t.role ? <span className="text-ink/45"> · {t.role}</span> : null}</td>
                <td className="px-4 py-3 max-w-sm truncate text-ink/70">{t.quote}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-0.5 text-gold">
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={12} fill="currentColor" strokeWidth={0} />)}
                  </span>
                </td>
                <td className="px-4 py-3">{t.is_published ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/testimonials/${t.id}`} className="link-underline text-moss">Edit</Link>
                </td>
              </tr>
            ))}
            {(!testimonials || testimonials.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No testimonials yet — add your first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
