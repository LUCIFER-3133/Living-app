import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ScrollReveal from '@/components/ui/ScrollReveal';
import MembershipPurchase from '@/components/booking/MembershipPurchase';
import FAQ from '@/components/home/FAQ';
import type { MembershipPlan } from '@/types/database';

export const metadata: Metadata = {
  title: 'Membership & Pricing',
  description: 'Compare Living Yoga group class packs — Monthly, 3-Month, 6-Month and Annual. Flexible online yoga memberships across India.',
  alternates: { canonical: '/membership' },
};

export const revalidate = 3600;

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase.from('membership_plans').select('*').eq('status', 'active').order('price');

  return (
    <div>
      <div className="container-editorial py-20 md:py-28">
        <ScrollReveal>
          <p className="eyebrow">Membership</p>
          <h1 className="mt-4 max-w-xl text-display-lg">
            Simple pricing, <span className="accent-italic">unlimited</span> practice.
          </h1>
          <p className="mt-4 max-w-md text-sm normal-case font-normal text-ink/65">
            Group class packs for regular practice, or 1:1 Personal Training if you want
            dedicated attention.
          </p>
        </ScrollReveal>

        <div className="mt-14 flex items-center justify-between">
          <span className="btn-pill-sm !cursor-default bg-ink/8">Group Classes</span>
          <Link href="/contact" className="link-underline text-sm font-semibold text-gold">
            Ask about 1:1 Personal Training →
          </Link>
        </div>

        <div className="mt-8">
          <MembershipPurchase plans={(plans as MembershipPlan[]) ?? FALLBACK_PLANS} />
        </div>

        <p className="mt-10 max-w-xl text-sm normal-case font-normal text-ink/50">
          All plans include a 7-day free trial. No long-term lock-in — pause or cancel anytime from your account.
        </p>
      </div>

      <FAQ />
    </div>
  );
}

const FALLBACK_PLANS: MembershipPlan[] = [
  { id: '1', slug: 'monthly', name: 'Monthly', description: '20 live classes', price: 2500, billing_interval: 'monthly', features: ['20 live classes / month', 'Email reminders before your plan renews', 'Community chat access'], status: 'active', created_at: '', updated_at: '' },
  { id: '2', slug: '3-months', name: '3 Months', description: '≈ ₹1,999 / month · 60 live classes', price: 5999, billing_interval: 'quarterly', features: ['60 live classes total', 'Email reminders before your plan renews', 'Community chat access'], status: 'active', created_at: '', updated_at: '' },
  { id: '3', slug: '6-months', name: '6 Months', description: '≈ ₹1,666 / month · 120 live classes', price: 9999, billing_interval: 'half_yearly', features: ['120 live classes total', 'Email reminders before your plan renews', 'Community chat access'], status: 'active', created_at: '', updated_at: '' },
  { id: '4', slug: 'annual', name: 'Annual', description: '≈ ₹1,249 / month · 240 live classes', price: 14999, billing_interval: 'yearly', features: ['240 live classes total', 'Email reminders before your plan renews', 'Community chat access'], status: 'active', created_at: '', updated_at: '' },
];
