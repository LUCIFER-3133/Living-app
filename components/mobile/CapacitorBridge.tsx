'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

// Mounted once in the root layout. Everything in here is a no-op on the web
// — Capacitor.isNativePlatform() is false in a browser tab — so this file
// only ever does anything when the site is running inside the Android/iOS
// app shell. That's the whole point of the "one codebase" setup: this
// component is the one place that knows it might be on a phone; the rest
// of the app never has to.
export default function CapacitorBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeBackListener: (() => void) | undefined;
    let removeSplash: (() => void) | undefined;

    (async () => {
      // Native modules are dynamically imported so a plain `npm run dev`/
      // `next build` for the website never needs them resolved — they only
      // load inside the actual native shell.
      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
        import('@capacitor/app'),
      ]);

      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      await SplashScreen.hide().catch(() => {});

      // Android's hardware/gesture back button: without this it closes the
      // whole app from any screen instead of behaving like a browser "back".
      const listener = await App.addListener('backButton', () => {
        if (window.history.length > 1) {
          router.back();
        } else {
          App.exitApp();
        }
      });
      removeBackListener = () => listener.remove();
    })();

    return () => {
      removeBackListener?.();
      removeSplash?.();
    };
  }, [router]);

  return null;
}
