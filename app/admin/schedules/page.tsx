import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import { formatDate, formatTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminSchedulesPage() {
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: schedules } = await admin
    .from('class_schedules')
    .select('*, class:classes(name)')
    .order('start_time', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-display-md">Schedules</h1>
      <div className="mt-8 overflow-x-auto glass-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase text-ink/45">
            <tr><th className="px-4 py-3">Class</th><th className="px-4 py-3">When</th><th className="px-4 py-3">Instructor</th><th className="px-4 py-3">Booked</th></tr>
          </thead>
          <tbody>
            {(schedules ?? []).map((s: any) => (
              <tr key={s.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">{s.class?.name}</td>
                <td className="px-4 py-3">{formatDate(s.start_time)} · {formatTime(s.start_time)}</td>
                <td className="px-4 py-3">{s.instructor_name}</td>
                <td className="px-4 py-3">{s.booked_count}/{s.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
