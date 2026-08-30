import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import ClassForm from '@/components/admin/ClassForm';
import type { YogaClass } from '@/types/database';

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: yogaClass } = await admin.from('classes').select('*').eq('id', id).single();
  if (!yogaClass) notFound();

  return (
    <div>
      <h1 className="text-display-md">Edit Class</h1>
      <div className="mt-8">
        <ClassForm existing={yogaClass as YogaClass} />
      </div>
    </div>
  );
}
