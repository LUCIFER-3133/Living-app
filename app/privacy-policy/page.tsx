import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy-policy' } };

export default function PrivacyPolicyPage() {
  return (
    <div className="container-editorial max-w-2xl py-20 md:py-28">
      <h1 className="text-display-lg">Privacy Policy</h1>
      <p className="mt-4 text-sm text-ink/50">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-display prose-a:text-moss">
        <p>This is placeholder legal copy — replace with text reviewed by your counsel before launch.</p>
        <h2>1. Information we collect</h2>
        <p>We collect the information you provide when creating an account, booking a class, purchasing a membership, or submitting an appointment request — including your name, email, phone number, and payment metadata (we never store full card numbers; payments are processed by Razorpay).</p>
        <h2>2. How we use your information</h2>
        <p>We use your information to operate your account, process bookings and payments, send transactional emails (confirmations, receipts, reminders), and improve our services.</p>
        <h2>3. Data storage and security</h2>
        <p>Your data is stored with Supabase (PostgreSQL) with row-level security so you can only access your own records. Payment processing is handled entirely by Razorpay; we never see or store your card details.</p>
        <h2>4. Third-party services</h2>
        <p>We use Razorpay for payments and Resend for transactional email. Both process data solely to provide their respective services to us.</p>
        <h2>5. Your rights</h2>
        <p>You may request access to, correction of, or deletion of your personal data at any time by contacting hello@livingyoga.in.</p>
        <h2>6. Contact</h2>
        <p>Questions about this policy can be directed to hello@livingyoga.in.</p>
      </div>
    </div>
  );
}
