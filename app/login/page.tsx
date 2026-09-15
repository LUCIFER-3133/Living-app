import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Log In', alternates: { canonical: '/login' } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const { redirectedFrom } = await searchParams;
  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-canvas p-8 shadow-2xl">
        <p className="eyebrow text-center">Welcome Back</p>
        <h1 className="mt-3 text-center text-display-md">Log in to Living Yoga</h1>
        <LoginForm redirectedFrom={redirectedFrom} />
      </div>
    </div>
  );
}
