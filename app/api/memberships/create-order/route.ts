import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRazorpayOrder } from '@/lib/razorpay';

const schema = z.object({ plan_id: z.string().uuid() });

// POST /api/memberships/create-order
// Creates a `created` payment row, then a Razorpay order to match it.
// The membership itself is only activated in /api/memberships/verify.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: plan } = await admin
    .from('membership_plans')
    .select('*')
    .eq('id', parsed.data.plan_id)
    .eq('status', 'active')
    .single();

  if (!plan) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({
      user_id: user.id,
      type: 'membership',
      // Unique placeholder: the real order id only exists after Razorpay
      // replies, but the row has to exist first to have an id to reference.
      // A shared literal here collides with the razorpay_order_id UNIQUE
      // constraint after the very first failed order-creation attempt.
      razorpay_order_id: `pending-${crypto.randomUUID()}`,
      amount: plan.price,
      status: 'created',
    })
    .select()
    .single();

  if (paymentError || !payment) {
    console.error('[memberships/create-order] payment insert failed:', paymentError);
    return NextResponse.json({ error: 'Could not initiate payment.', detail: paymentError?.message }, { status: 500 });
  }

  let order;
  try {
    order = await createRazorpayOrder({
      amountInRupees: plan.price,
      receipt: `membership_${payment.id}`,
      notes: { userId: user.id, planId: plan.id },
    });
  } catch (err: any) {
    console.error('[memberships/create-order] Razorpay order creation failed:', err?.error || err);
    await admin.from('payments').delete().eq('id', payment.id);
    return NextResponse.json(
      { error: 'Could not start checkout with the payment provider.', detail: err?.error?.description || err?.message },
      { status: 502 }
    );
  }

  await admin.from('payments').update({ razorpay_order_id: order.id }).eq('id', payment.id);

  return NextResponse.json({
    paymentId: payment.id,
    order: { id: order.id, amount: order.amount, currency: order.currency },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
}
