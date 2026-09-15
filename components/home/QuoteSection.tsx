import ScrollReveal from '@/components/ui/ScrollReveal';

export default function QuoteSection() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src="https://res.cloudinary.com/daflkt8ob/video/upload/v1789408208/2_p864eu.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* Same grayscale gradient treatment as the hero video — keeps this
          clip's own colors true while holding the quote legible. */}
      <div className="hero-video-overlay absolute inset-0 z-10" aria-hidden="true" />
      <div className="container-editorial relative z-20 max-w-3xl text-center">
        <ScrollReveal>
          <div className="hero-text-shadow">
            <span className="font-display text-5xl italic text-gold">&ldquo;</span>
            <p className="mt-2 text-display-md leading-snug text-canvas">
              Yoga isn&apos;t a workout — it&apos;s a way of coming home to yourself, one breath at a time.
            </p>
            <p className="mt-6 text-sm normal-case font-semibold text-canvas">Minal Chopra</p>
            <p className="text-sm normal-case font-normal text-canvas/70">YBC Level 3 Yoga Teacher, Living Yoga</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
