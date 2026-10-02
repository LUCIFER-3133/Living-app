'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Instagram, Youtube, MessageCircle } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/classes', label: 'Classes' },
  { href: '/demo-sessions', label: 'Demo Sessions' },
  { href: '/membership', label: 'Membership' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

// Staggers the links in one after another rather than the whole list
// fading in as a single block — each one eases up into place a beat after
// the last, so opening the menu reads as a small sequence rather than a
// flat pop. Framer's own stagger orchestration (staggerChildren /
// delayChildren on the parent) drives the timing; each link just declares
// its own hidden/show state.
const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.08 },
  },
};

const linkVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// A compact dropdown panel anchored just above the floating nav pill —
// replaces the previous full-screen photo takeover, which felt heavy for
// what is just a short list of links. Clicking the dimmed backdrop (not a
// blurred photo) closes it, same as any standard dropdown.
//
// Solid opaque canvas panel (not the site's usual frosted glass) with
// centered, uppercase, letter-spaced links — reads as its own dedicated
// menu surface rather than a see-through overlay on the page behind it.
// Sized with headroom (wider than the link list currently needs) so more
// items or a secondary column can be added later without a resize pass.
export default function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90] bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.65, 0, 0.35, 1] }}
        className="fixed inset-x-4 bottom-24 z-[95] mx-auto max-w-[52rem] overflow-hidden rounded-lg border border-ink/10 bg-canvas shadow-2xl sm:w-[42rem]"
      >
        <motion.nav
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="max-h-[66vh] overflow-y-auto py-6"
        >
          {LINKS.map((link) => (
            <motion.div key={link.href} variants={linkVariants}>
              <Link
                href={link.href}
                onClick={onClose}
                className="block py-4 text-center text-base font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </motion.nav>

        <div className="flex items-center justify-between border-t border-ink/10 px-6 py-4">
          <Link href="/contact" onClick={onClose} className="btn-outline !px-5 !py-2.5 !text-xs">
            <span>Book Now</span>
          </Link>
          <div className="flex gap-3">
            <a href="https://www.instagram.com/yogawithlivingyoga" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"><Instagram size={14} /></a>
            <a href="#" aria-label="YouTube" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"><Youtube size={14} /></a>
            <a href="https://wa.me/917984925843" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"><MessageCircle size={14} /></a>
          </div>
        </div>
      </motion.div>
    </>
  );
}
