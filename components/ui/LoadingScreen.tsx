'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Shows the "breathe in… 00%" reveal once per browser session — not on
// every client-side navigation. The reference site is a static multi-page
// site where every link is a full reload, so it re-shows every time; a
// Next.js app routes client-side, so replaying a full-screen loader on
// every internal link would make the site feel slower, not classier.
// Showing it once on first arrival keeps the branded moment without
// taxing perceived performance afterward.
export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('ly-loaded')) return;

    setVisible(true);
    const start = performance.now();
    const DURATION = 1100;

    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem('ly-loaded', '1');
        setTimeout(() => setVisible(false), 250);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-canvas"
          aria-hidden="true"
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-2xl italic text-ink/80 md:text-3xl"
          >
            breathe in&hellip;
          </motion.p>
          <p className="mt-6 font-body text-sm tracking-[0.2em] text-ink/40">
            {String(progress).padStart(2, '0')}%
          </p>
          <motion.div
            className="mt-8 h-px w-40 origin-left bg-moss/30"
            style={{ scaleX: progress / 100 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
