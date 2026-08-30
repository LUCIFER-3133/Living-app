import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Cancellation & Refund Policy', alternates: { canonical: '/cancellation-refund' } };

export default function CancellationRefundPage() {
  return (
    <div className="container-editorial max-w-2xl py-20 md:py-28">
      <h1 className="text-display-lg">Cancellation &amp; Refund Policy</h1>
      <p className="mt-4 text-sm text-ink/50">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-display prose-a:text-moss">
        <p>This is placeholder legal copy — replace with text reviewed by your counsel before launch.</p>
        <h2>1. Class booking cancellations</h2>
        <p>You may cancel or reschedule a confirmed class booking from your dashboard up to 4 hours before the scheduled start time for a full refund to your original payment method. Cancellations inside the 4-hour window are non-refundable.</p>
        <h2>2. Membership cancellations</h2>
        <p>Monthly and quarterly memberships can be cancelled anytime from your dashboard; cancellation takes effect at the end of the current billing period. Annual memberships are refundable on a pro-rated basis within the first 14 days only.</p>
        <h2>3. Studio-initiated cancellations</h2>
        <p>If we cancel a scheduled class (e.g. instructor unavailability), you&rsquo;ll receive a full refund or the option to rebook any available session at no extra cost.</p>
        <h2>4. Refund timelines</h2>
        <p>Approved refunds are processed via Razorpay to your original payment method within 5–7 business days.</p>
        <h2>5. Contact for disputes</h2>
        <p>Email hello@livingyoga.in with your booking or payment reference for any refund query.</p>
      </div>
    </div>
  );
}
