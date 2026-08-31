import type { CapacitorConfig } from '@capacitor/cli';

// This is what makes "one codebase, three targets" actually true: the
// Android/iOS apps are a thin native shell (via Capacitor) that opens your
// real, already-deployed Next.js site (server.url below) inside a WebView.
// There is no separate mobile UI to keep in sync — ship a change to the
// website and the app shows it on next launch, same as any tab refresh.
// The trade-off: the app needs network access to load (same as any web
// app), and the shell can't do things a fully-native screen can (though
// @capacitor/* plugins like status-bar/splash-screen still work, since
// they're native code running alongside the WebView, not inside it).
//
// Before building the Android/iOS project, set MOBILE_APP_URL below (or the
// env var) to your real deployed URL — https://www.livingyoga.in once it's
// live, or a Vercel preview URL while testing. It cannot be localhost;
// a phone/emulator can't reach your dev machine's localhost.
const DEPLOYED_URL = process.env.MOBILE_APP_URL || 'https://www.livingyoga.in';

const config: CapacitorConfig = {
  appId: 'in.livingyoga.app',
  appName: 'Living Yoga',
  webDir: 'public', // unused with server.url set below, but required by the CLI
  server: {
    url: DEPLOYED_URL,
    androidScheme: 'https',
    // cleartext is left off on purpose — the deployed site must be HTTPS,
    // which it already is on Vercel.
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#F7F5F2', // matches the 'canvas' color in tailwind.config.ts (brand White)
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK', // dark icons/text, since the app background is light
    },
  },
};

export default config;
