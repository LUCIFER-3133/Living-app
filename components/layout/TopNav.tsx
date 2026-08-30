'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import MobileMenu from '@/components/layout/MobileMenu';
import TopRightAuth from '@/components/layout/TopRightAuth';
import Logo from '@/components/ui/Logo';

// A floating masthead — dark glass bar with a small margin from the
// viewport edges and rounded corners (matching the reference), rather than
// a flush edge-to-edge rectangle. `main` in app/layout.tsx and MobileMenu's
// offset are both padded by NAV_HEIGHT to clear this, so all three stay in
// sync from one shared constant.
export default function TopNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 mx-3 mt-3 sm:mx-4 sm:mt-4">
        <div className="glass-panel-dark relative flex h-16 items-center justify-between gap-3 rounded-xl px-4 sm:px-6">
          <Link href="/contact" className="btn-outline !px-4 !py-2.5 !text-xs sm:!px-5">
            <span>Book Now</span>
          </Link>

          {/* text-canvas isn't decoration here — the mark is masked
              `currentColor`, so this is what paints it. */}
          <Link
            href="/"
            className="logo-link absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-canvas"
          >
            <Logo className="h-7 sm:h-8" />
          </Link>

          <div className="flex items-center gap-3">
            <TopRightAuth />
            <button
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center text-canvas transition-colors hover:opacity-70"
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{open && <MobileMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
