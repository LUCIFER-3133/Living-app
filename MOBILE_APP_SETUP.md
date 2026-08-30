# Living Yoga — Android & iOS app (Capacitor)

## How this works

Your Android and iOS apps are a thin native shell (Capacitor) that opens your
real, already-deployed website inside a WebView. There is **one codebase** —
this Next.js project. There is no separate mobile UI to maintain: ship a
change to the website like you always do, and the app shows it the next time
someone opens it (or pulls to refresh). Nothing to rebuild or resubmit to the
app stores for a normal content/feature change.

What Capacitor adds on top, natively (not through the website's JS):
- `@capacitor/status-bar` — matches the status bar to your color scheme
- `@capacitor/splash-screen` — a native splash screen while the site loads
- `@capacitor/app` — makes Android's back button behave like browser "back"
  instead of exiting the app

All of that lives in `capacitor.config.ts` and `components/mobile/CapacitorBridge.tsx`.
It's already installed and wired in — nothing pending on that front.

## One-time setup (run these yourself — I can't run Android Studio/Xcode
## from here)

1. **Set the URL the apps will load.** They can't point at `localhost` — a
   phone or emulator can't reach your dev machine. Use your real deployed
   URL:
   ```
   set MOBILE_APP_URL=https://www.livingyoga.in   (Windows cmd)
   $env:MOBILE_APP_URL="https://www.livingyoga.in" (PowerShell)
   ```
   (Once you've deployed — if you haven't yet, a Vercel preview URL works
   fine for testing the app shell.)

2. **Generate the native projects** (creates `android/` and `ios/` folders —
   real native projects, meant to be committed to git):
   ```
   npm run cap:add:android
   npm run cap:add:ios      # macOS only — iOS builds require a Mac + Xcode
   ```

3. **Sync** (run this again any time you change `capacitor.config.ts` or add
   a Capacitor plugin — not needed for normal website changes):
   ```
   npm run cap:sync
   ```

4. **Open and run:**
   ```
   npm run cap:open:android   # opens Android Studio — run on emulator/device from there
   npm run cap:open:ios       # opens Xcode — run on simulator/device from there (macOS only)
   ```

### Requirements on your machine
- Android: [Android Studio](https://developer.android.com/studio) installed
  (it bundles the SDK). First open can take a while while it installs
  platform tools.
- iOS: a Mac with Xcode installed, plus an Apple Developer account
  (free for simulator testing; $99/yr required to publish to the App Store).

## Before submitting to the app stores

- **App icon & splash image**: Capacitor ships placeholder icons. Replace
  them with your real logo — `npx @capacitor/assets generate` can do this
  from a single source image (see https://capacitorjs.com/docs/guides/splash-screens-and-icons).
- **Privacy policy URL**: both stores require one at submission — you
  already have `/privacy-policy` on the site; use its full URL.
- **Permissions**: this app shell doesn't request camera/location/etc., so
  there's nothing extra to justify to either store's review team.
- **App Store Connect / Google Play Console accounts**: these are yours to
  create (same category as the Razorpay/Sentry-style items from the earlier
  audit — I can't sign up for third-party accounts on your behalf).

## "SaaS" note

You confirmed "SaaS" here just means marketing your existing site as a
product, not a separate multi-tenant build — so there's no second backend or
schema to maintain. Target #1 (the ReactJS web app) and #2 (the SaaS
product) are the same running code; the only genuinely separate artifact
here is the mobile shell described above.
