import type { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Reset Password', alternates: { canonical: '/forgot-password' } };

export default function ForgotPasswordPage() {
  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">Account Access</p>
        <h1 className="mt-3 text-center text-display-md">Reset your password</h1>
        <p className="mt-3 text-center text-sm text-ink/60">
          Enter the email on your account and we&apos;ll send you a link to set a new password.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
