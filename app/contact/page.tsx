import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import AppointmentForm from '@/components/booking/AppointmentForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Living Yoga or request an appointment with an instructor.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  const phone = process.env.NEXT_PUBLIC_STUDIO_PHONE || '+91 79849 25843';

  return (
    <div className="container-editorial py-20 md:py-28">
      <ScrollReveal>
        <p className="eyebrow">Get in Touch</p>
        <h1 className="mt-4 max-w-xl text-display-lg">Have a question, or want to start with a chat first?</h1>
      </ScrollReveal>

      <div className="mt-16 grid gap-14 md:grid-cols-[1fr_1.2fr]">
        <ScrollReveal className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 text-moss" />
            <p className="text-sm text-ink/70">Ahmedabad, Gujarat, India</p>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={18} className="mt-0.5 text-moss" />
            <a href="mailto:hello@livingyoga.in" className="text-sm text-ink/70 hover:text-ink">hello@livingyoga.in</a>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={18} className="mt-0.5 text-moss" />
            <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="text-sm text-ink/70 hover:text-ink">{phone}</a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="glass-card p-8">
            <h2 className="font-display text-xl">Get in touch</h2>
            <p className="mt-1 text-sm text-ink/60">Send a quick message, or request a specific appointment slot — either way we&apos;ll reply within 24 hours.</p>
            <Suspense fallback={null}>
              <AppointmentForm />
            </Suspense>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
