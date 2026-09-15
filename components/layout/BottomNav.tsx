'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import MobileMenu from '@/components/layout/MobileMenu';
import Logo from '@/components/ui/Logo';

// The reference site's signature UI move: a floating glass pill fixed to
// the bottom of the viewport instead of a conventional top header. It
// holds the primary CTA, the wordmark, and the menu trigger.
export default function BottomNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav
        className="fixed inset-x-0 z-50 flex justify-center px-4"
        // Same reasoning as TopRightAuth: keep bottom-5 on the web, clear
        // the iPhone home indicator / Android gesture bar in the app shell.
        style={{ bottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
      >
        <div className="glass-panel-dark flex w-full max-w-md items-center justify-between gap-3 rounded-full py-2 pl-2 pr-2.5 text-canvas">
          {/* Black-and-white instead of the site's moss/gold accents —
              black button, white text, same treatment as Sign up below.
              Border + shadow (from .btn-primary) still separate it from the
              dark glass pill it sits on even though both are near-black. */}
          <Link href="/contact" className="btn-primary !bg-ink !text-canvas hover:!bg-ink/90 !px-4 !py-2.5 !text-xs">
            <span>Book a demo</span>
          </Link>
          {/* text-canvas isn't decoration here — the mark is masked
              `currentColor`, so this is what paints it. */}
          <Link href="/" className="logo-link shrink-0 text-canvas">
            <Logo className="h-9" />
          </Link>
          <button
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-canvas transition-colors hover:bg-white/20"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      <AnimatePresence>{open && <MobileMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
