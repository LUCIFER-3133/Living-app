'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="hero-gradient relative overflow-hidden">
      {/* Background video — muted/looped/inline so autoplay works on every
          browser including iOS Safari, which otherwise force-fullscreens
          any video without playsInline. .hero-gradient on the section
          (above) is what's visible until this paints, and stays visible
          behind it via object-cover regardless of the source clip's own
          aspect ratio. A black/gray gradient sits over it for legibility
          (below) — no color tint, so the footage's own colors stay true. */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        // f_auto,q_auto lets Cloudinary pick the smallest codec/bitrate the
        // viewer's browser supports instead of serving the raw upload --
        // typically 60-80% less data for a background clip that's playing
        // silently and small on screen anyway. The matching poster frame
        // (so_0 = the first frame, as a .jpg) paints instantly so there's
        // a real image instead of a blank flash while the video buffers.
        poster="https://res.cloudinary.com/daflkt8ob/video/upload/f_auto,q_auto,so_0/v1789389372/1_1_egi11m.jpg"
        src="https://res.cloudinary.com/daflkt8ob/video/upload/f_auto,q_auto/v1789389372/1_1_egi11m.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="hero-video-overlay absolute inset-0 z-10" aria-hidden="true" />

      <div className="container-editorial relative z-20 py-28 md:py-40">
        <motion.div style={{ y: textY, opacity }} className="hero-text-shadow max-w-md">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.25em] text-canvas/80"
          >
            Beyond the mat, into life.
          </motion.p>

          {/* Smaller, three lines, and a lighter sans weight instead of the
              big italic serif — takes up less of the frame and reads clean
              over real footage (including a face) rather than sitting on
              top of it as one large decorative block. */}
          <h1 className="mt-5 font-body text-display-md font-light normal-case leading-[1.18] text-canvas">
            <motion.span
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
              className="block"
            >
              Find your
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.27, ease: [0.65, 0, 0.35, 1] }}
              className="block font-medium text-gold"
            >
              stillness,
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.39, ease: [0.65, 0, 0.35, 1] }}
              className="block"
            >
              wherever you are.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-6 max-w-sm text-base leading-relaxed text-canvas/85"
          >
            Practice with a YCB Level 3 Certified &amp; Intermediate-Level Aerial Yoga
            Teacher, online from anywhere or in person in Ahmedabad — your practice,
            your pace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link href="/contact" className="btn-primary">
              <span>Book Your Session</span>
              <ArrowUpRight size={16} />
            </Link>
            <Link href="/classes" className="btn-secondary">
              <span>See class timings</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 right-6 z-20 select-none font-display text-[9rem] italic text-canvas/[0.1] sm:text-[13rem]"
      >
        yoga
      </p>
    </section>
  );
}
