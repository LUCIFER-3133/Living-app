import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatINR } from '@/lib/utils';
import RevenueTrend from '@/components/admin/RevenueTrend';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [
    { count: userCount },
    { count: bookingCount },
    { count: pendingAppointments },
    { data: paidPayments },
    { count: activeMembershipCount },
    { data: recentPayments },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    admin.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('payments').select('amount').eq('status', 'paid'),
    admin.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('end_date', today),
    admin
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'paid')
      .gte('created_at', sixMonthsAgo.toISOString()),
  ]);

  const revenue = (paidPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  // Revenue per calendar month for the trailing 6 months — the "real-time
  // reporting" a subscription business actually lives in day to day, versus
  // a single lifetime total that never tells you if this month is up or down.
  const monthBuckets: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthBuckets.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), total: 0 });
  }
  for (const p of recentPayments ?? []) {
    const d = new Date(p.created_at);
    const monthsAgo =
      (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth());
    const idx = 5 - monthsAgo;
    if (idx >= 0 && idx < 6) monthBuckets[idx].total += Number(p.amount);
  }

  const thisMonth = monthBuckets[5]?.total ?? 0;
  const lastMonth = monthBuckets[4]?.total ?? 0;
  const momChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  const stats = [
    { label: 'Total Revenue', value: formatINR(revenue) },
    { label: 'Active Memberships', value: activeMembershipCount ?? 0 },
    { label: 'Confirmed Bookings', value: bookingCount ?? 0 },
    { label: 'Registered Users', value: userCount ?? 0 },
    { label: 'Pending Appointments', value: pendingAppointments ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-display-md">Overview</h1>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-6">
            <p className="text-xs uppercase tracking-wide text-ink/45">{s.label}</p>
            <p className="mt-2 font-display text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 glass-card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">Revenue, last 6 months</h2>
          <p className="text-sm text-ink/55">
            This month: <span className="font-semibold text-ink">{formatINR(thisMonth)}</span>
            {momChange !== null && (
              <span className={momChange >= 0 ? 'ml-2 text-moss' : 'ml-2 text-gold'}>
                {momChange >= 0 ? '+' : ''}{momChange}% vs last month
              </span>
            )}
          </p>
        </div>
        <RevenueTrend data={monthBuckets} />
      </div>
    </div>
  );
}
