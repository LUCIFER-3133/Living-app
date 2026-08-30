import ScrollReveal from '@/components/ui/ScrollReveal';

export default function QuoteSection() {
  return (
    <section className="bg-canvas-dim py-24 md:py-32">
      <div className="container-editorial max-w-3xl text-center">
        <ScrollReveal>
          <span className="font-display text-5xl italic text-gold">&ldquo;</span>
          <p className="mt-2 text-display-md leading-snug">
            Yoga isn&apos;t a workout — it&apos;s a way of coming home to yourself, one breath at a time.
          </p>
          <p className="mt-6 text-sm normal-case font-semibold text-ink">Minal Chopra</p>
          <p className="text-sm normal-case font-normal text-ink/50">YBC Level 3 Yoga Teacher, Living Yoga</p>
        </ScrollReveal>
      </div>
    </section>
  );
}
