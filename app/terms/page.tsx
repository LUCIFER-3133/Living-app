import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms & Conditions', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <div className="container-editorial max-w-2xl py-20 md:py-28">
      <h1 className="text-display-lg">Terms &amp; Conditions</h1>
      <p className="mt-4 text-sm text-ink/50">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-display prose-a:text-moss">
        <p>This is placeholder legal copy — replace with text reviewed by your counsel before launch.</p>
        <h2>1. Acceptance of terms</h2>
        <p>By creating an account or booking a class through this site, you agree to these Terms &amp; Conditions.</p>
        <h2>2. Bookings and payments</h2>
        <p>Class bookings and memberships are confirmed only after successful payment, verified server-side. Prices are shown in INR and are subject to change without prior notice for future bookings.</p>
        <h2>3. Conduct</h2>
        <p>Instructors may decline to teach or ask a participant to leave a session for safety or conduct reasons; no refund is guaranteed in such cases beyond what our Cancellation &amp; Refund Policy provides.</p>
        <h2>4. Health disclaimer</h2>
        <p>Yoga involves physical activity. Consult a physician before beginning any new exercise practice, particularly if you are pregnant or have a pre-existing condition. Practice at your own risk.</p>
        <h2>5. Limitation of liability</h2>
        <p>Living Yoga is not liable for injuries sustained during classes conducted with reasonable instructor supervision and standard safety practices.</p>
        <h2>6. Changes to these terms</h2>
        <p>We may update these terms from time to time; continued use of the site constitutes acceptance of the revised terms.</p>
      </div>
    </div>
  );
}
