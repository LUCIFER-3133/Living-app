import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import TopRightAuth from '@/components/layout/TopRightAuth';
import Footer from '@/components/layout/Footer';
// LoadingScreen intentionally not rendered -- it blocked every first
// page view each session behind a ~1.35s fake progress animation for a
// branding flourish, which fights directly against "make the site fast".
// The component still exists (components/ui/LoadingScreen.tsx) if you want
// the branded intro back despite the delay -- just re-add <LoadingScreen />.
import FloatingWidgets from '@/components/layout/FloatingWidgets';
import InquiryPopup from '@/components/marketing/InquiryPopup';
import CapacitorBridge from '@/components/mobile/CapacitorBridge';

// Typography: "calm & airy".
//   display — Cormorant Garamond: a light, tall, generously-spaced serif.
//     Used for ALL headings in mixed case (see globals.css). It has a small
//     x-height, so display sizes are set larger and lighter than a normal
//     serif would need — the tuning lives in tailwind.config.ts fontSize.
//   body    — Jost: a geometric sans (Futura lineage) for body copy and UI.
//     Pairs cleanly with the serif without competing for attention.
// Sacramento used to load here as a stand-in for the wordmark. The real logo
// now renders as a masked PNG (components/ui/Logo.tsx), so the script face had
// no glyphs left to set and was a preloaded font file per page for nothing.
const display = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const body = Jost({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.livingyoga.in';

// viewport-fit=cover lets CSS env(safe-area-inset-*) resolve to real
// values instead of 0 — needed so fixed-position UI (BottomNav) doesn't
// sit under the iPhone home indicator / Android gesture bar when this
// site is running inside the Capacitor app shell.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Colors the browser chrome (mobile Chrome/Safari address bar) and the
  // Android status bar behind the Capacitor app shell — brand canvas/ink.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F5F2' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Living Yoga — Online Yoga Classes in India | Live & On-Demand',
    template: '%s | Living Yoga',
  },
  description:
    'Join live online yoga classes from certified Indian instructors. Flexible timings, personalised guidance, and a warm community — book your session today.',
  keywords: ['online yoga classes india', 'live yoga classes', 'yoga teacher online', 'book yoga class', 'yoga membership india'],
  openGraph: {
    type: 'website',
    siteName: 'Living Yoga',
    title: 'Living Yoga — Online Yoga Classes in India',
    description: 'Live online yoga classes with certified Indian instructors. Book your session today.',
    url: SITE_URL,
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Living Yoga' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Living Yoga — Online Yoga Classes in India',
    description: 'Live online yoga classes with certified Indian instructors. Book your session today.',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: 'Living Yoga',
    description: 'Live online yoga classes for every body, every schedule, anywhere in India.',
    url: SITE_URL,
    telephone: process.env.NEXT_PUBLIC_STUDIO_PHONE || '+91-79849-25843',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ahmedabad',
      addressRegion: 'Gujarat',
      addressCountry: 'IN',
    },
    sameAs: ['https://www.instagram.com/yogawithlivingyoga'],
    // Ties the org to its named, certified teacher for stronger E-E-A-T
    // signals — a real founder is more credible to both search engines and
    // people than an anonymous 'HealthAndBeautyBusiness'. Full bio/credentials
    // are on /about, which has its own Person schema.
    founder: {
      '@type': 'Person',
      name: 'Minal Chopra',
      jobTitle: 'YCB Level 3 Certified Yoga Teacher',
      url: `${SITE_URL}/about`,
    },
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <CapacitorBridge />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-canvas"
        >
          Skip to content
        </a>
        <TopRightAuth />
        <main id="main-content" className="pb-28">{children}</main>
        <Footer />
        <BottomNav />
        <FloatingWidgets />
        <InquiryPopup />
      </body>
    </html>
  );
}
