import type { Metadata } from 'next';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Set New Password', alternates: { canonical: '/reset-password' } };

export default function ResetPasswordPage() {
  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-canvas p-8 shadow-2xl">
        <p className="eyebrow text-center">Account Access</p>
        <h1 className="mt-3 text-center text-display-md">Choose a new password</h1>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
