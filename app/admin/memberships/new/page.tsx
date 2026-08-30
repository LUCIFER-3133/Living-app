import PlanForm from '@/components/admin/PlanForm';
import { requireAdminPage } from '@/lib/auth';

export default async function NewPlanPage() {
  // No data is read here, so this guard is not load-bearing on its own — the
  // Server Action behind the form re-checks. It's here so "every admin page
  // checks" is true without exceptions to remember.
  await requireAdminPage();
  return (
    <div>
      <h1 className="text-display-md">New Membership Plan</h1>
      <div className="mt-8">
        <PlanForm />
      </div>
    </div>
  );
}
