// Derived so the CSP doesn't hardcode a specific Supabase project id — this
// same config file has to work whether it's pointed at dev or prod.
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host;
  } catch {
    return null;
  }
})();
const SUPABASE_ORIGIN = SUPABASE_HOST ? `https://${SUPABASE_HOST}` : 'https://*.supabase.co';
const SUPABASE_WS_ORIGIN = SUPABASE_HOST ? `wss://${SUPABASE_HOST}` : 'wss://*.supabase.co';

// Pragmatic rather than maximal: 'unsafe-inline' stays on script-src because
// Next.js's own bootstrap and hydration data are inline <script> tags, and
// locking that down properly needs per-request nonces wired through
// middleware — a real next step, just a separate, riskier change from
// "turn on security headers." Everything else here is a genuine allowlist,
// not a blanket permission.
//
// 'unsafe-eval' is added ONLY in development: Next.js's dev server bundles
// modules as eval()-wrapped code to power Fast Refresh and accurate source
// maps — that's normal dev-server behavior, not app code using eval. With a
// strict CSP and no 'unsafe-eval', the browser silently blocks every JS
// chunk from running in `next dev`, which looks like "the whole app is
// broken" (blank/inert pages) even though the code itself is fine. The
// production build doesn't need or get 'unsafe-eval'.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: https:`,
  `font-src 'self' data:`,
  `media-src 'self' ${SUPABASE_ORIGIN} https://res.cloudinary.com`, // the hero background video is hosted on Cloudinary
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS_ORIGIN} https://api.razorpay.com https://lumberjack.razorpay.com`,
  `frame-src https://api.razorpay.com https://checkout.razorpay.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Only takes effect on HTTPS responses (browsers ignore it over HTTP), so
  // it's safe to ship even before every environment is HTTPS-only.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Tree-shakes these packages to only the modules actually imported,
  // instead of bundling the whole library — meaningfully smaller JS
  // payloads for an icon-heavy, animation-heavy UI like this one.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },
  compress: true,
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
