import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addMonths, addYears } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { sendMembershipActivationEmail, sendPaymentSuccessEmail } from '@/lib/email/send';
import { formatDate, formatINR } from '@/lib/utils';

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan_id: z.string().uuid(),
});

function computeEndDate(interval: string, from: Date) {
  if (interval === 'monthly') return addMonths(from, 1);
  if (interval === 'quarterly') return addMonths(from, 3);
  if (interval === 'half_yearly') return addMonths(from, 6);
  return addYears(from, 1);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = parsed.data;

  const isValid = verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
  const admin = createAdminClient();

  // Everything below runs with the service-role key, so each check has to be
  // made explicitly — RLS is not doing any of this work for us.
  const { data: payment } = await admin
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', razorpay_order_id)
    .single();
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });

  // Razorpay hands the signature to the browser, so the caller knowing a valid
  // triple proves only that *someone* paid — not that it was this account.
  if (payment.user_id !== user.id || payment.type !== 'membership') {
    return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  }

  if (!isValid) {
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });
  }

  const { data: plan } = await admin.from('membership_plans').select('*').eq('id', plan_id).single();
  if (!plan) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });

  // plan_id arrives in the request body, so it has to be reconciled against
  // what was actually charged — otherwise you could pay for a month and claim
  // the annual plan.
  if (Number(plan.price) !== Number(payment.amount)) {
    return NextResponse.json(
      { error: 'This payment does not match the selected plan. Please contact us.' },
      { status: 422 }
    );
  }

  // Not conditional on the current status: the Razorpay webhook is a safety net
  // that may already have marked this paid before the browser got here, and that
  // must not stop a legitimate membership from being created.
  await admin
    .from('payments')
    .update({ status: 'paid', razorpay_payment_id, razorpay_signature })
    .eq('id', payment.id);

  // If the member already has a membership running (or already queued from an
  // earlier purchase) that hasn't lapsed yet, this one is queued to start the
  // day after the last one ends instead of starting today and running
  // concurrently — otherwise a member who buys a second plan while one is
  // still active would be paying for time they can't use, and the new
  // membership would have no visible effect anywhere.
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await admin
    .from('memberships')
    .select('end_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gte('end_date', today)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  let startDate = new Date();
  if (existing?.end_date) {
    const chainedStart = new Date(existing.end_date);
    chainedStart.setDate(chainedStart.getDate() + 1);
    if (chainedStart > startDate) startDate = chainedStart;
  }
  const endDate = computeEndDate(plan.billing_interval, startDate);

  const { data: membership, error: membershipError } = await admin
    .from('memberships')
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      payment_id: payment.id,
      status: 'active',
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
    })
    .select()
    .single();

  // 23505 = unique violation on uq_memberships_payment. One payment, one
  // membership — so this is a replay or a double-submitted form, and the
  // membership already exists. `code` lets the browser send them to the
  // dashboard instead of showing a failure for something that worked.
  if (membershipError?.code === '23505') {
    return NextResponse.json(
      { error: 'This payment has already been activated.', code: 'already_redeemed' },
      { status: 409 }
    );
  }

  // The money is taken at this point, so failing quietly would leave a paying
  // member with no membership and no signal to anyone.
  if (membershipError || !membership) {
    console.error('[memberships/verify] membership insert failed after payment', payment.id, membershipError);
    return NextResponse.json(
      { error: 'Your payment went through but we could not activate the membership. Please contact us.' },
      { status: 500 }
    );
  }

  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single();
  const name = profile?.full_name || user.email || 'there';

  await Promise.all([
    sendMembershipActivationEmail(user.email!, name, plan.name, formatDate(endDate)),
    sendPaymentSuccessEmail(user.email!, name, formatINR(plan.price), razorpay_payment_id),
  ]);

  return NextResponse.json({ success: true, membership });
}
