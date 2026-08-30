import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import PlanForm from '@/components/admin/PlanForm';
import type { MembershipPlan } from '@/types/database';

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: plan } = await admin.from('membership_plans').select('*').eq('id', id).single();
  if (!plan) notFound();

  return (
    <div>
      <h1 className="text-display-md">Edit Membership Plan</h1>
      <div className="mt-8">
        <PlanForm existing={plan as MembershipPlan} />
      </div>
    </div>
  );
}
