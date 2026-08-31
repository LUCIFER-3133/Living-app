import type { Config } from 'tailwindcss';

// Design tokens — Living Yoga ("Beyond the mat, into life.")
// Palette is the studio's actual brand kit (Black / White / Beige / Latte /
// Espresso / Olive Green) — replaces the earlier placeholder terracotta/rust
// accent. Token NAMES (gold, moss, stone, ink, canvas) are kept as-is since
// they're used in ~150 files across the app; only the hex values changed, so
// every existing `text-gold`, `bg-moss`, etc. now renders in brand color
// without a repo-wide rename:
//   gold   -> Espresso/Latte family (was a saturated orange-red)
//   moss   -> Olive Green (was a darker, more black-green olive)
//   stone  -> Beige
//   ink    -> Black
//   canvas -> White / Beige
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
        // Olive Green (brand). Used for primary buttons, links, success/
        // active states — same role it always had, just retinted from a
        // darker near-black olive to the brand's actual Olive Green.
        moss: {
          DEFAULT: '#6E7046',
          50: '#EEF0E5',
          100: '#DBDFC8',
          300: '#A9AD82',
          500: '#6E7046',
          700: '#4E5033',
          900: '#24261A',
        },
        // Beige (brand). Muted secondary surface/badge color.
        stone: {
          DEFAULT: '#DCCBB8',
          50: '#F8F3ED',
          100: '#EFE4D7',
          300: '#DCCBB8',
          500: '#C7AF93',
          700: '#9C8468',
        },
        // Espresso/Latte (brand). The site's warm secondary accent — was a
        // saturated orange-red (#C1592E); now the brand's coffee-brown
        // family, still dark enough at DEFAULT for white/canvas text on top
        // (bg-gold buttons) to stay readable.
        gold: {
          DEFAULT: '#7A3E22',
          50: '#F3E7D8',
          300: '#B9935A',
          500: '#7A3E22',
          700: '#5A2E19',
        },
        // Black (brand).
        ink: {
          DEFAULT: '#111111',
          700: '#262626',
          500: '#4D4D4D',
        },
        // White / Beige (brand).
        canvas: {
          DEFAULT: '#F7F5F2',
          dim: '#DCCBB8',
          card: '#FBF9F6',
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
