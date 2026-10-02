'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validations';

export default function LoginForm({ redirectedFrom }: { redirectedFrom?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const { data, error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setServerError(error.message);
      return;
    }

    // An explicit redirectedFrom (bounced here from a protected page) always
    // wins. Otherwise send admins to /admin and everyone else to /dashboard
    // -- previously this always went to /dashboard, so an admin logging in
    // landed on the member dashboard instead of their own panel.
    let destination = redirectedFrom;
    if (!destination && data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      destination = profile?.role === 'admin' ? '/admin' : '/dashboard';
    }
    router.push(destination || '/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium text-ink">Email</label>
        <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" />
        {errors.email && <p className="mt-1 text-xs text-moss">{errors.email.message}</p>}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink">Password</label>
          <Link href="/forgot-password" className="link-underline text-xs text-ink/50 hover:text-moss">
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-1.5">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className="input-field !mt-0 pr-11"
            placeholder="••••••••"
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
      {serverError && <p className="text-sm text-moss">{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>Log In</span>}
      </button>
      <p className="text-center text-sm text-ink/60">
        New here? <Link href="/signup" className="link-underline text-moss">Create an account</Link>
      </p>
    </form>
  );
}
