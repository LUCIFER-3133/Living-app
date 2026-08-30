'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const SESSION_FLAG = 'ly_inquiry_popup_shown';

// Shown once per browser session, and only to visitors we haven't already
// converted or don't need to prompt: signed-out visitors, and signed-in
// users who are neither an admin nor holding an active membership. Existing
// members and admins never see it.
export default function InquiryPopup() {
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;

    let cancelled = false;
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let shouldShow = true;
      if (user) {
        const today = new Date().toISOString().slice(0, 10);
        const [{ data: profile }, { data: membership }] = await Promise.all([
          supabase.from('profiles').select('role').eq('id', user.id).single(),
          supabase
            .from('memberships')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('end_date', today)
            .limit(1)
            .maybeSingle(),
        ]);
        const isAdmin = profile?.role === 'admin';
        const hasActiveMembership = !!membership;
        shouldShow = !isAdmin && !hasActiveMembership;
        if (user.email) setForm((f) => ({ ...f, email: user.email! }));
      }

      if (cancelled || !shouldShow) return;
      setEligible(true);
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem(SESSION_FLAG, '1');
      }, 2200);
      return () => clearTimeout(timer);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2 || !form.email.trim()) {
      setError('Please share your name and email.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'general',
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message.trim().length >= 10 ? form.message : `${form.message} — enquiry via homepage popup`.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === 'string' ? data.error : 'Could not submit — please try again.');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!eligible) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] }}
            className="glass-card relative w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink"
            >
              <X size={16} />
            </button>

            {submitted ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto text-gold" size={28} />
                <p className="mt-3 font-display text-xl">Thank you!</p>
                <p className="mt-1 text-sm text-ink/60">We&apos;ll get back to you by email within 24 hours.</p>
              </div>
            ) : (
              <>
                <p className="eyebrow">New here?</p>
                <h2 className="mt-2 font-display text-2xl text-ink">Tell us a little about you</h2>
                <p className="mt-1 text-sm text-ink/60">
                  Leave your details and we&apos;ll help you find the right class or batch — no commitment.
                </p>

                <form onSubmit={onSubmit} className="mt-5 space-y-3">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="input-field"
                    required
                  />
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    type="email"
                    placeholder="you@example.com"
                    className="input-field"
                    required
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone (optional)"
                    className="input-field"
                  />
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="What are you looking for? (optional)"
                    rows={3}
                    className="input-field resize-none"
                  />
                  {error && <p className="text-sm text-moss">{error}</p>}
                  <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <span>Send</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full text-center text-xs text-ink/45 hover:text-ink/70"
                  >
                    Maybe later
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
