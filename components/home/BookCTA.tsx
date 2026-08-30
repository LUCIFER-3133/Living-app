import Link from 'next/link';
import ScrollReveal from '@/components/ui/ScrollReveal';

// A small mid-page nudge, distinct from the bigger closing CTA. Classes
// aren't booked one at a time any more, so this points at the conversation
// that leads to a batch placement rather than at a checkout.
export default function BookCTA() {
  return (
    <section className="container-editorial py-24 text-center md:py-32">
      <ScrollReveal>
        <h2 className="text-display-md">Start practising this week!</h2>
        <p className="mt-3 text-ink/60">Tell us the times that suit you — we&apos;ll find your batch.</p>
        <Link href="/contact" className="btn-primary mt-8 inline-flex">
          <span>Talk to us</span>
        </Link>
      </ScrollReveal>
    </section>
  );
}
