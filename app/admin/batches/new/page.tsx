import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import BatchForm from '@/components/admin/BatchForm';
import type { YogaClass } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function NewBatchPage() {
  // This page reads with the service-role client, which bypasses RLS, so it
  // carries its own admin check rather than relying on the route guard.
  await requireAdminPage();

  const admin = createAdminClient();
  const { data: classes } = await admin
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return (
    <div>
      <Link href="/admin/batches" className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink">
        <ChevronLeft size={13} /> All batches
      </Link>

      <h1 className="mt-3 text-display-md">New batch</h1>
      <p className="mt-1 max-w-xl text-sm text-ink/55">
        Set the class, the days and time it repeats, and the meeting link. You&apos;ll assign members on the
        next screen.
      </p>

      <div className="mt-8">
        <BatchForm classes={(classes as YogaClass[]) ?? []} />
      </div>
    </div>
  );
}
