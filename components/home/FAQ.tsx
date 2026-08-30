'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const FAQS = [
  { q: 'Can I switch plans later?', a: 'Yes — upgrade, downgrade, or pause your membership anytime from your account. Changes apply from your next billing cycle.' },
  { q: 'What happens if I miss a class?', a: 'Every live class is recorded and available in your account for a limited window, so you never fully lose a session.' },
  { q: 'Do I need any equipment?', a: 'Just a mat and a quiet corner. Props like blocks and straps are helpful but never required — instructors always offer alternatives.' },
  { q: 'Is there a refund policy?', a: 'Your first 7 days are free. After that, cancellations take effect at the end of your current billing cycle — no partial refunds.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="container-editorial py-24 md:py-32">
      <ScrollReveal>
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-4 max-w-lg text-display-md">
          Questions, <span className="accent-italic">answered.</span>
        </h2>
      </ScrollReveal>

      <div className="mt-12 divide-y divide-ink/10 border-t border-ink/10">
        {FAQS.map((item, i) => (
          <div key={item.q}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
              aria-expanded={open === i}
            >
              <span className="font-display text-xl text-ink">{item.q}</span>
              <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.3 }}>
                <Plus size={20} className="text-moss" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-sm leading-relaxed text-ink/65">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
