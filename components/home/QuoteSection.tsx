import ScrollReveal from '@/components/ui/ScrollReveal';

export default function QuoteSection() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        // f_auto,q_auto = Cloudinary auto-compression (see Hero.tsx for the
        // full rationale). preload="metadata" instead of "auto" -- this
        // section is below the fold on first load, so there's no reason to
        // spend bandwidth downloading it before the visitor scrolls near
        // it; the browser fetches the rest once autoplay actually needs it.
        poster="https://res.cloudinary.com/daflkt8ob/video/upload/f_auto,q_auto,so_0/v1789408208/2_p864eu.jpg"
        src="https://res.cloudinary.com/daflkt8ob/video/upload/f_auto,q_auto/v1789408208/2_p864eu.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
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
            <p className="text-sm normal-case font-normal text-canvas/70">YCB Level 3 Yoga Teacher, Living Yoga</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
