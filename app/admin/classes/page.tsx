import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, { text: string; tone: 'moss' | 'gold' }> = {
  deleted: { text: 'Class deleted.', tone: 'moss' },
  deactivated_batch: { text: 'A batch is teaching this class, so it was deactivated instead of deleted — it no longer appears on /classes, but the batch and its members are untouched. Delete or repoint that batch first if you really want the class gone.', tone: 'gold' },
  deactivated_history: { text: 'This class has past bookings, so it was deactivated instead of deleted — it no longer appears on /classes, but the booking history stays intact.', tone: 'gold' },
  slug_taken: { text: 'Another class already uses that name. Pick a different one — the web address is derived from the name, so two classes cannot share it.', tone: 'gold' },
  name_required: { text: 'A class needs a name. Nothing was saved.', tone: 'gold' },
  save_failed: { text: 'That class could not be saved — check the server logs. Nothing was changed.', tone: 'gold' },
  error: { text: 'Something went wrong deleting that class — check the server logs. Nothing was changed.', tone: 'gold' },
};

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: classes } = await admin.from('classes').select('*').order('name');

  // hasOwnProperty, not a bare lookup: `notice` comes from the query string, so
  // ?notice=__proto__ would otherwise resolve to an inherited object and render
  // an empty notice card.
  const noticeInfo =
    notice && Object.prototype.hasOwnProperty.call(NOTICES, notice) ? NOTICES[notice] : null;

  return (
    <div>
      {noticeInfo && (
        <p className={`glass-card mb-8 p-4 text-sm normal-case font-normal ${noticeInfo.tone === 'gold' ? 'text-gold' : 'text-moss'}`}>
          {noticeInfo.text}
        </p>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-display-md">Classes</h1>
        <Link href="/admin/classes/new" className="btn-primary !px-4 !py-2 !text-xs">
          <Plus size={14} /> <span>New Class</span>
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto glass-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Active</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {(classes ?? []).map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.category}</td>
                <td className="px-4 py-3">{c.is_active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/classes/${c.id}`} className="link-underline text-moss">Edit</Link>
                </td>
              </tr>
            ))}
            {(!classes || classes.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/50">No classes yet — add your first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
