import type { Metadata } from 'next';
import SignupForm from '@/components/auth/SignupForm';

export const metadata: Metadata = { title: 'Sign Up', alternates: { canonical: '/signup' } };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const { redirectedFrom } = await searchParams;
  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">Join Living Yoga</p>
        <h1 className="mt-3 text-center text-display-md">Create your account</h1>
        <SignupForm redirectedFrom={redirectedFrom} />
      </div>
    </div>
  );
}
