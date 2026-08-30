import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate, formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: payments } = await admin
    .from('payments')
    .select('*, profile:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-display-md">Payments</h1>
      <div className="mt-8 overflow-x-auto glass-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
            <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">{p.profile?.full_name ?? '—'}</td>
                <td className="px-4 py-3 capitalize">{p.type}</td>
                <td className="px-4 py-3">{formatINR(p.amount)}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
                <td className="px-4 py-3">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
