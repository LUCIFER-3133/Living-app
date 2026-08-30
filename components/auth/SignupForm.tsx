'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signupSchema, type SignupInput } from '@/lib/validations';

export default function SignupForm({ redirectedFrom }: { redirectedFrom?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    setTermsTouched(true);
    if (!agreedToTerms) return;
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name },
        // Without this, Supabase falls back to the project's default Site
        // URL for the confirmation link, which never reaches our own
        // code-exchange route — the click would land on a bare Next.js page
        // with a `code` in the URL and nothing to do with it.
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/login`,
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mt-8 glass-card p-6 text-center">
        <CheckCircle2 className="mx-auto text-gold" size={28} />
        <p className="mt-3 font-display text-xl">Check your inbox</p>
        <p className="mt-1 text-sm text-ink/60">
          We&apos;ve sent a verification link to confirm your account.
        </p>
        {redirectedFrom && (
          <p className="mt-3 text-xs text-ink/45">
            Once verified, <Link href={`/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`} className="link-underline text-moss">log in</Link> to continue where you left off.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium text-ink">Full name</label>
        <input {...register('full_name')} className="input-field" placeholder="Jane Doe" />
        {errors.full_name && <p className="mt-1 text-xs text-moss">{errors.full_name.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-ink">Email</label>
        <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" />
        {errors.email && <p className="mt-1 text-xs text-moss">{errors.email.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-ink">Password</label>
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
        <div className="relative mt-1.5">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            className="input-field !mt-0 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink/40 transition-colors hover:text-ink"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="mt-1 text-xs text-moss">{errors.confirmPassword.message}</p>}
      </div>
      <div>
        <label className="flex items-start gap-2.5 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              setTermsTouched(true);
            }}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="link-underline text-moss">Terms of Service</Link> and{' '}
            <Link href="/privacy-policy" target="_blank" className="link-underline text-moss">Privacy Policy</Link>.
          </span>
        </label>
        {termsTouched && !agreedToTerms && (
          <p className="mt-1 text-xs text-moss">You need to agree before creating an account.</p>
        )}
      </div>
      {serverError && <p className="text-sm text-moss">{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>Create Account</span>}
      </button>
      <p className="text-center text-sm text-ink/60">
        Already a member?{' '}
        <Link
          href={redirectedFrom ? `/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}` : '/login'}
          className="link-underline text-moss"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
