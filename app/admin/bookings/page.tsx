import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate, formatTime, formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from('bookings')
    .select('*, profile:profiles(full_name), schedule:class_schedules(start_time, class:classes(name))')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-display-md">Bookings</h1>
      <div className="mt-8 overflow-x-auto glass-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((b: any) => (
              <tr key={b.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">{b.profile?.full_name ?? '—'}</td>
                <td className="px-4 py-3">{b.schedule?.class?.name ?? '—'}</td>
                <td className="px-4 py-3">{b.schedule ? `${formatDate(b.schedule.start_time)} · ${formatTime(b.schedule.start_time)}` : '—'}</td>
                <td className="px-4 py-3">{formatINR(b.amount)}</td>
                <td className="px-4 py-3 capitalize">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
