import type { Config } from 'tailwindcss';

// Design tokens — Living Yoga ("Beyond the mat, into life.")
// Palette matched to the reference site: dark olive-to-rust hero gradient,
// warm ivory sections, a near-black footer, and a terracotta/rust accent.
// Surfaces (cards, forms, nav) use a glassmorphism treatment — see the
// .glass-* utilities in globals.css.
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        moss: {
          DEFAULT: '#3A4A2E',
          50: '#EEF1EA',
          100: '#D7DECB',
          300: '#8FA07E',
          500: '#4C5D42',
          700: '#3A4A2E',
          900: '#1D2416',
        },
        stone: {
          DEFAULT: '#B7A88C',
          50: '#F7F4EE',
          100: '#EEE7D8',
          300: '#D7C7A4',
          500: '#B7A88C',
          700: '#8F7E60',
        },
        gold: {
          // Terracotta / rust — the reference site's single warm accent.
          DEFAULT: '#C1592E',
          50: '#FBEEE7',
          300: '#DD8D66',
          500: '#C1592E',
          700: '#93401E',
        },
        ink: {
          DEFAULT: '#1B1712',
          700: '#2A241C',
          500: '#4A4136',
        },
        canvas: {
          DEFAULT: '#F3EBDA',
          dim: '#EAE0C9',
          card: '#F8F2E4',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Cormorant Garamond has a small x-height and thin strokes, so display
      // sizes run larger and lighter than they would for a sturdier serif.
      // Weight is baked into the token so `text-display-*` always renders at
      // the intended airy weight without each caller remembering to set it.
      fontSize: {
        'display-xl': ['clamp(3.4rem, 7vw, 7.5rem)', { lineHeight: '1.0', letterSpacing: '-0.015em', fontWeight: '300' }],
        'display-lg': ['clamp(2.75rem, 5.2vw, 5rem)', { lineHeight: '1.06', letterSpacing: '-0.012em', fontWeight: '300' }],
        'display-md': ['clamp(2.15rem, 3.6vw, 3.5rem)', { lineHeight: '1.12', letterSpacing: '-0.01em', fontWeight: '400' }],
        'display-sm': ['clamp(1.6rem, 2.2vw, 2.15rem)', { lineHeight: '1.2', letterSpacing: '-0.005em', fontWeight: '400' }],
      },
      maxWidth: { content: '1320px' },
      borderRadius: { sm: '6px', DEFAULT: '10px', lg: '16px', xl: '22px', full: '999px' },
      transitionTimingFunction: { editorial: 'cubic-bezier(0.65, 0, 0.35, 1)' },
      transitionDuration: { 400: '400ms' },
      boxShadow: {
        card: '0 1px 2px rgba(27,23,18,0.04), 0 16px 40px -20px rgba(27,23,18,0.28)',
        glass: '0 8px 32px -12px rgba(27,23,18,0.25)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-33.333%)' } },
      },
      animation: { marquee: 'marquee 28s linear infinite' },
    },
  },
  plugins: [],
};

export default config;
