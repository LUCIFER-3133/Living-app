import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import BatchForm from '@/components/admin/BatchForm';
import type { Batch, BatchMeetingCredentials, YogaClass } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  // Renders the meeting link and passcode via the RLS-bypassing client, so it
  // re-checks admin here rather than trusting the route guard alone.
  await requireAdminPage();

  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: batch }, { data: credentials }, { data: classes }] = await Promise.all([
    admin.from('batches').select('*').eq('id', id).single(),
    admin.from('batch_meeting_credentials').select('*').eq('batch_id', id).maybeSingle(),
    admin.from('classes').select('*').eq('is_active', true).order('name'),
  ]);

  if (!batch) notFound();

  // A batch may point at a class that has since been deactivated — keep it in
  // the select list so saving doesn't silently reassign the batch.
  const classList = (classes as YogaClass[]) ?? [];
  if (!classList.some((c) => c.id === batch.class_id)) {
    const { data: orphan } = await admin.from('classes').select('*').eq('id', batch.class_id).maybeSingle();
    if (orphan) classList.unshift(orphan as YogaClass);
  }

  return (
    <div>
      <Link
        href={`/admin/batches/${id}`}
        className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink"
      >
        <ChevronLeft size={13} /> {batch.name}
      </Link>

      <h1 className="mt-3 text-display-md">Edit batch</h1>

      <div className="mt-8">
        <BatchForm
          existing={batch as Batch}
          credentials={credentials as BatchMeetingCredentials | null}
          classes={classList}
        />
      </div>
    </div>
  );
}
