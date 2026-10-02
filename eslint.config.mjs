import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// eslint-config-next@16 ships its own native flat-config export (this file),
// built for eslint 9's flat config format directly. The old bridge through
// FlatCompat + the "next/core-web-vitals" shareable-config string doesn't
// work anymore under this combination (eslint-config-next's react plugin
// config now has a circular structure that FlatCompat's schema validator
// can't JSON-stringify), so this loads the native flat config instead.
const eslintConfig = [
  {
    // Generated/vendored output — Capacitor's native Android project and
    // any build artifacts. Never hand-written, never worth linting.
    ignores: ['android/**', 'ios/**', '.next/**', 'node_modules/**'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // eslint-config-next@16 pulls in the React Compiler's new purity/effect
      // rules. They're right in spirit, but here they flag patterns that are
      // safe in context (Date.now() while rendering a Server Component that
      // re-runs per request, not a client component the compiler would
      // memoize; setNow(Date.now()) as the very first line of a countdown's
      // mount effect, which is the standard "seed then tick" pattern). Kept
      // as warnings rather than turned off, so real regressions still show up.
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
