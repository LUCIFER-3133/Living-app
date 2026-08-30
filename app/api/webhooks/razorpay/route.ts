import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

// POST /api/webhooks/razorpay
// Configure this URL in the Razorpay dashboard (Settings → Webhooks) for
// the `payment.captured` and `payment.failed` events. This is a safety
// net that reconciles payment status even if the user closes the tab
// right after paying, before the client-side /verify call fires.
//
// IMPORTANT: Razorpay requires the RAW request body for signature
// verification — do not run this through any body-parsing middleware.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminClient();

  if (event.event === 'payment.captured' || event.event === 'payment.failed') {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      await admin
        .from('payments')
        .update({
          status: event.event === 'payment.captured' ? 'paid' : 'failed',
          razorpay_payment_id: payment.id,
        })
        .eq('razorpay_order_id', payment.order_id)
        .neq('status', 'paid'); // don't clobber a status the /verify route already set
    }
  }

  return NextResponse.json({ received: true });
}
