'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type Input = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const supabase = createClient();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Input) {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });
    // Always show success, even on error — confirming or denying that an
    // email exists on the account is exactly what this screen shouldn't leak.
    if (error) console.error('[forgot-password]', error);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-lg border border-ink/10 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto text-gold" size={28} />
        <p className="mt-3 font-display text-xl">Check your inbox</p>
        <p className="mt-1 text-sm text-ink/60">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="link-underline mt-4 inline-block text-sm text-moss">Back to log in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium text-ink">Email</label>
        <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" />
        {errors.email && <p className="mt-1 text-xs text-moss">{errors.email.message}</p>}
      </div>
      {serverError && <p className="text-sm text-moss">{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>Send reset link</span>}
      </button>
      <p className="text-center text-sm text-ink/60">
        <Link href="/login" className="link-underline text-moss">Back to log in</Link>
      </p>
    </form>
  );
}
