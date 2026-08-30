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

// A compact dropdown panel anchored just above the floating nav pill —
// replaces the previous full-screen photo takeover, which felt heavy for
// what is just a short list of links. Clicking the dimmed backdrop (not a
// blurred photo) closes it, same as any standard dropdown.
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
        className="glass-card fixed inset-x-4 bottom-24 z-[95] mx-auto max-w-md overflow-hidden sm:w-80"
      >
        <nav className="max-h-[60vh] overflow-y-auto py-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="block px-6 py-3 text-base font-medium text-ink transition-colors hover:bg-ink/5 hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-between border-t border-ink/10 px-6 py-4">
          <Link href="/contact" onClick={onClose} className="btn-outline !px-4 !py-2 !text-xs">
            <span>Book Now</span>
          </Link>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"><Instagram size={14} /></a>
            <a href="#" aria-label="YouTube" className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"><Youtube size={14} /></a>
            <a href="https://wa.me/917984925843" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"><MessageCircle size={14} /></a>
          </div>
        </div>
      </motion.div>
    </>
  );
}
