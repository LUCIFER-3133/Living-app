import Razorpay from 'razorpay';
import crypto from 'crypto';

// Server-only. Never import this file into a client component —
// it uses RAZORPAY_KEY_SECRET which must never reach the browser.
export function getRazorpayClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

interface CreateOrderInput {
  amountInRupees: number;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder({ amountInRupees, receipt, notes }: CreateOrderInput) {
  const razorpay = getRazorpayClient();
  // Razorpay expects the smallest currency unit (paise for INR).
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: 'INR',
    receipt,
    notes,
  });
}

interface VerifySignatureInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

// This is the ONLY trustworthy way to confirm a payment succeeded.
// Frontend "success" callbacks can be spoofed — always re-derive and
// compare the HMAC signature server-side before marking anything paid.
export function verifyRazorpaySignature({ orderId, paymentId, signature }: VerifySignatureInput): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// For verifying the async webhook (app/api/webhooks/razorpay), which uses a
// separate webhook secret configured in the Razorpay dashboard.
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
