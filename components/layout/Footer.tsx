import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Logo from '@/components/ui/Logo';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/services', label: 'Services' },
      { href: '/classes', label: 'Class Timings' },
      { href: '/membership', label: 'Membership' },
      { href: '/about', label: 'About Us' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
      { href: '/membership#faq', label: 'FAQ' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-ink pb-16 pt-20 text-canvas md:pb-20 md:pt-28">
      <div className="container-editorial">
        <ScrollReveal className="flex flex-wrap items-center justify-between gap-8 border-b border-canvas/10 pb-16">
          <h2 className="text-display-md">
            LET&apos;S BEGIN
            <br />
            YOUR <span className="accent-italic">practice.</span>
          </h2>
          <Link href="/contact" className="btn-primary">
            <span>Book Your Session</span>
            <ArrowUpRight size={16} />
          </Link>
        </ScrollReveal>

        <div className="grid gap-12 pt-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="logo-link inline-block text-canvas">
              <Logo className="h-14" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-canvas/70">
              Live online yoga classes for every body, every schedule, anywhere in the world.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-canvas/20 text-canvas/70 hover:text-canvas">IG</a>
              <a href="#" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full border border-canvas/20 text-canvas/70 hover:text-canvas">YT</a>
              <a href="https://wa.me/917984925843" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full border border-canvas/20 text-canvas/70 hover:text-canvas">WA</a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-canvas/75 link-underline hover:text-canvas">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="eyebrow">Get in touch</p>
            <ul className="mt-4 space-y-3 text-sm text-canvas/75">
              <li>hello@livingyoga.in</li>
              <li>+91 79849 25843</li>
              <li>Ahmedabad, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap justify-between gap-2 text-xs text-canvas/45">
          <span>© {new Date().getFullYear()} Living Yoga. All rights reserved.</span>
          <span>Made with care, on and off the mat.</span>
        </div>
      </div>
    </footer>
  );
}
