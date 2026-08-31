'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn, formatINR, formatDate } from '@/lib/utils';
import type { MembershipPlan } from '@/types/database';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const INTERVAL_LABEL: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: '3 Months',
  half_yearly: '6 Months',
  yearly: 'Annual',
};
const INTERVAL_SUFFIX: Record<string, string> = {
  monthly: '/mo',
  quarterly: '/3 mo',
  half_yearly: '/6 mo',
  yearly: '/yr',
};

export default function MembershipPurchase({ plans }: { plans: MembershipPlan[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [activeMembership, setActiveMembership] = useState<{ planName: string; endDate: string } | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Plan the visitor picked while they already have an active membership —
  // holds the "are you sure?" confirmation until they answer it.
  const [confirmPlan, setConfirmPlan] = useState<MembershipPlan | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser({ id: data.user.id, email: data.user.email! });
      const today = new Date().toISOString().slice(0, 10);
      const { data: membership } = await supabase
        .from('memberships')
        .select('end_date, plan:membership_plans(name)')
        .eq('user_id', data.user.id)
        .eq('status', 'active')
        .gte('end_date', today)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (membership) {
        setActiveMembership({
          planName: (membership.plan as any)?.name ?? 'your current plan',
          endDate: membership.end_date as string,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function purchase(plan: MembershipPlan) {
    setError(null);
    if (!user) {
      router.push(`/login?redirectedFrom=/membership`);
      return;
    }
    // Already has a running membership — confirm before stacking another
    // one on top, rather than silently letting them double-pay.
    if (activeMembership) {
      setConfirmPlan(plan);
      return;
    }
    startCheckout(plan);
  }

  async function startCheckout(plan: MembershipPlan) {
    setConfirmPlan(null);
    setLoadingPlan(plan.id);
    try {
      const res = await fetch('/api/memberships/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start checkout.');

      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: 'Living Yoga',
        description: `${plan.name} membership`,
        prefill: { email: user!.email },
        theme: { color: '#7A3E22' }, // Espresso — matches the 'gold' brand color in tailwind.config.ts
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/memberships/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id,
            }),
          });
          if (verifyRes.ok) {
            router.push('/dashboard');
          } else {
            // A duplicate verify (double-click, or Razorpay firing the handler
            // twice) means the membership already exists — that's a success from
            // the member's point of view, not a failure worth alarming them with.
            const body = await verifyRes.json().catch(() => null);
            if (body?.code === 'already_redeemed') {
              router.push('/dashboard');
            } else {
              setError(body?.error ?? 'Payment succeeded but activation failed — our team will follow up by email.');
            }
          }
          setLoadingPlan(null);
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message);
      setLoadingPlan(null);
    }
  }

  // Highlight whichever plan is annual — matches the reference's
  // "BEST VALUE" badge on its longest-commitment tier.
  const bestValueId = plans.find((p) => p.billing_interval === 'yearly')?.id;

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {error && <p className="mb-6 rounded-lg bg-gold/10 px-4 py-3 text-sm text-gold">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-4">
        {plans.map((plan) => {
          const isBest = plan.id === bestValueId;
          return (
            <div
              key={plan.id}
              id={plan.slug}
              className={cn(
                'relative flex flex-col rounded-lg p-7',
                isBest ? 'glass-panel-dark text-canvas lg:-translate-y-3' : 'glass-card'
              )}
            >
              {isBest && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-canvas">
                  Best Value
                </span>
              )}

              <span
                className={cn(
                  'inline-block w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                  isBest ? 'bg-canvas/15 text-canvas' : 'bg-ink/5 text-ink/70'
                )}
              >
                {INTERVAL_LABEL[plan.billing_interval]}
              </span>

              <p className="mt-5 text-3xl font-display italic normal-case font-normal">
                {formatINR(plan.price)}
                <span className={cn('text-sm font-body not-italic', isBest ? 'text-canvas/50' : 'text-ink/50')}>
                  {INTERVAL_SUFFIX[plan.billing_interval]}
                </span>
              </p>
              {plan.description && (
                <p className={cn('mt-1 text-sm normal-case font-normal', isBest ? 'text-canvas/60' : 'text-ink/55')}>
                  {plan.description}
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm normal-case font-normal">
                    <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                    <span className={isBest ? 'text-canvas/80' : 'text-ink/70'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => purchase(plan)}
                disabled={loadingPlan === plan.id}
                className={isBest ? 'btn-secondary mt-8 justify-center' : 'btn-outline mt-8 justify-center'}
              >
                {loadingPlan === plan.id ? <Loader2 size={16} className="animate-spin" /> : <span>Choose {INTERVAL_LABEL[plan.billing_interval]}</span>}
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {confirmPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
            onClick={() => setConfirmPlan(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="glass-card w-full max-w-sm p-7 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <TriangleAlert className="mx-auto text-gold" size={28} />
              <h3 className="mt-3 font-display text-xl text-ink">You already have an active membership</h3>
              <p className="mt-2 text-sm text-ink/60">
                Your {activeMembership?.planName} plan is active until{' '}
                {activeMembership && formatDate(activeMembership.endDate)}. {confirmPlan.name} won&apos;t start
                right away — it&apos;ll be queued to begin automatically the day your current plan ends, and
                you&apos;ll see it listed on your dashboard as upcoming. Still want to buy it now?
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirmPlan(null)} className="btn-outline flex-1 justify-center !py-2.5">
                  <span>Cancel</span>
                </button>
                <button onClick={() => startCheckout(confirmPlan)} className="btn-primary flex-1 justify-center !py-2.5">
                  <span>Continue</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
