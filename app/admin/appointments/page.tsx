import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage, requireAdminAction } from '@/lib/auth';
import { sendAppointmentDecisionEmail } from '@/lib/email/send';
import { formatDate, formatTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function decideAppointment(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const decision = formData.get('decision') as 'approved' | 'rejected';

  // Re-check admin role inside the Server Action itself — never trust
  // that only the admin UI can invoke this.
  await requireAdminAction();

  const admin = createAdminClient();
  const { data: appt } = await admin
    .from('appointments')
    .update({ status: decision })
    .eq('id', id)
    .select()
    .single();

  if (appt && appt.preferred_date && appt.preferred_time) {
    await sendAppointmentDecisionEmail(appt.email, appt.name, decision === 'approved', formatDate(appt.preferred_date), appt.preferred_time);
  }

  revalidatePath('/admin/appointments');
}

export default async function AdminAppointmentsPage() {
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: appointments } = await admin.from('appointments').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-display-md">Appointments</h1>
      <div className="mt-8 space-y-3">
        {(appointments ?? []).map((a) => (
          <div key={a.id} className="glass-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{a.name}{a.service ? ` · ${a.service}` : ''}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    a.type === 'appointment' ? 'bg-moss/10 text-moss' : 'bg-stone/30 text-ink/60'
                  }`}>
                    {a.type === 'appointment' ? 'Appointment' : 'General enquiry'}
                  </span>
                </div>
                <p className="text-sm text-ink/60">{a.email} {a.phone ? `· ${a.phone}` : ''}</p>
                {a.preferred_date && a.preferred_time && (
                  <p className="mt-1 text-sm text-ink/60">
                    Requested: {formatDate(a.preferred_date)} at {formatTime(`1970-01-01T${a.preferred_time}`)}
                  </p>
                )}
                {a.message && <p className="mt-2 max-w-lg text-sm text-ink/70">&ldquo;{a.message}&rdquo;</p>}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                a.status === 'pending' ? 'bg-stone/30 text-moss' : a.status === 'approved' ? 'bg-gold/15 text-gold' : 'bg-ink/10 text-ink/60'
              }`}>
                {a.status}
              </span>
            </div>

            {a.status === 'pending' && (
              <div className="mt-4 flex gap-3">
                <form action={decideAppointment}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <button className="btn-outline !px-4 !py-2 !text-xs">Approve</button>
                </form>
                <form action={decideAppointment}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <button className="!px-4 !py-2 text-xs text-moss underline">Reject</button>
                </form>
              </div>
            )}
          </div>
        ))}
        {(!appointments || appointments.length === 0) && (
          <p className="text-sm text-ink/55">No appointment requests yet.</p>
        )}
      </div>
    </div>
  );
}
