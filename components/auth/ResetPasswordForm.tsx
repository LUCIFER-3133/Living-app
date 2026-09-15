'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type Input = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // The /api/auth/callback redirect that lands here already exchanged the
  // email link for a session server-side — this just confirms the browser
  // actually has one before letting the member try to set a password with
  // none, which would otherwise fail with a confusing "not authenticated".
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({ resolver: zodResolver(schema) });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, [supabase]);

  async function onSubmit(values: Input) {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  if (hasSession === false) {
    return (
      <div className="mt-8 rounded-lg border border-ink/10 bg-white p-6 text-center text-sm text-ink/60">
        This reset link is invalid or has expired.{' '}
        <a href="/forgot-password" className="link-underline text-moss">Request a new one</a>.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium text-ink">New password</label>
        <div className="relative mt-1.5">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className="input-field !mt-0 pr-11"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink/40 transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-moss">{errors.password.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-ink">Confirm password</label>
        <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} className="input-field" />
        {errors.confirmPassword && <p className="mt-1 text-xs text-moss">{errors.confirmPassword.message}</p>}
      </div>
      {serverError && <p className="text-sm text-moss">{serverError}</p>}
      <button type="submit" disabled={isSubmitting || hasSession === null} className="btn-primary w-full justify-center">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>Set new password</span>}
      </button>
    </form>
  );
}
