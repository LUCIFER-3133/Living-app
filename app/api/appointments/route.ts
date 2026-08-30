import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appointmentSchema } from '@/lib/validations';
import { sendAppointmentRequestedEmail, sendGeneralEnquiryReceivedEmail } from '@/lib/email/send';
import { formatDate } from '@/lib/utils';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';

// POST /api/appointments
// Open to guests as well as logged-in users (RLS allows public insert).
// Handles both intents the contact page offers: a free-form 'general'
// enquiry, and a slot-specific 'appointment' request — see appointmentSchema.
export async function POST(req: NextRequest) {
  // Open to guests, so IP is the only identifier available — 5 submissions
  // per 10 minutes is generous for a real visitor and blunt enough to stop
  // a script from flooding the appointments inbox / triggering an email per
  // hit.
  const allowed = await checkRateLimit(`appointments:${clientIp(req)}`, { max: 5, windowSeconds: 600 });
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests — please wait a few minutes and try again.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The form always submits the flat field set, but a 'general' enquiry
  // leaves the slot fields as empty strings rather than omitting them —
  // normalize those to null so they match the DB columns' actual type
  // (date/time), which reject '' outright, and so the row reads cleanly
  // for admins instead of showing blank-but-present values.
  const payload = {
    type: parsed.data.type,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    preferred_date: parsed.data.preferred_date || null,
    preferred_time: parsed.data.preferred_time || null,
    service: parsed.data.service || null,
    message: parsed.data.message || null,
    user_id: user?.id ?? null,
  };

  const { data, error } = await supabase.from('appointments').insert(payload).select().single();

  if (error || !data) {
    return NextResponse.json({ error: 'Could not submit your request. Please try again.' }, { status: 500 });
  }

  if (payload.type === 'appointment' && payload.preferred_date && payload.preferred_time) {
    await sendAppointmentRequestedEmail(payload.email, payload.name, formatDate(payload.preferred_date), payload.preferred_time);
  } else {
    await sendGeneralEnquiryReceivedEmail(payload.email, payload.name);
  }

  return NextResponse.json({ success: true, appointment: data });
}
