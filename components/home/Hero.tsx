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
      <div className="container-editorial relative py-28 md:py-40">
        <motion.div style={{ y: textY, opacity }} className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.25em] text-canvas/65"
          >
            Beyond the mat, into life.
          </motion.p>

          <h1 className="mt-6 text-display-xl text-canvas">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
              className="block"
            >
              Find your <span className="accent-italic">stillness,</span>
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.32, ease: [0.65, 0, 0.35, 1] }}
              className="block"
            >
              wherever you are.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-7 max-w-md text-base leading-relaxed text-canvas/70"
          >
            Practice with a YBC Level 3 Certified &amp; Intermediate-Level Aerial Yoga
            Teacher, online from anywhere or in person in Ahmedabad — your practice,
            your pace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-9 flex flex-wrap gap-4"
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
        className="pointer-events-none absolute -bottom-6 right-6 select-none font-display text-[9rem] italic text-canvas/[0.08] sm:text-[13rem]"
      >
        yoga
      </p>
    </section>
  );
}
