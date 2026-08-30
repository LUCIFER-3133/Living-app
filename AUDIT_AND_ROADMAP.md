# Living Yoga — Changes Made & System Audit
_Generated 30 Aug 2026_

## 1. What I built this session

| # | Request | What changed |
|---|---------|---------------|
| 1 | WhatsApp chat button | New floating button (`components/layout/WhatsAppButton.tsx`), opens `wa.me/917984925843` with a pre-filled greeting. Number is read from `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` — change it there any time, no code edit needed. |
| 2 | AI chat-bot | Added a rule-based FAQ widget (`components/layout/ChatBot.tsx` + `app/api/chatbot/route.ts`). No external AI API key needed — it answers from **live** data (current membership prices, class categories, demo video count) pulled from Supabase, so it never drifts out of sync with what's in your admin dashboard. Falls back to "chat on WhatsApp / use the contact form" for anything it doesn't recognise. If you later want a smarter, more conversational bot, this is a clean place to swap in OpenAI/Anthropic — say the word and I'll wire it in (you'd need to get an API key first). |
| 3 | Inquiry popup on first visit | `components/marketing/InquiryPopup.tsx`. Appears once per browser session, ~2 seconds after page load, only for visitors who are **not** an admin and **don't** currently hold an active membership (so logged-out visitors and signed-up-but-not-yet-paying leads see it; existing paying members and admins never do). Submits into the same `appointments` table/inbox as your contact form. |
| 4 | Nav menu style | `components/layout/MobileMenu.tsx` no longer takes over the whole screen. It's now a compact dropdown panel anchored above the bottom nav pill, with a light dimmed backdrop you can tap to dismiss — same links, much lighter feel. |
| 5 | Demo videos require login | `components/demo/VideoGrid.tsx` now checks for a session before playing a video; a logged-out visitor is sent to `/signup` (with a return link back to demo sessions) instead of the video opening. |
| 6 | Duplicate membership warning | `components/booking/MembershipPurchase.tsx` now checks for an existing active membership before checkout and shows a confirmation modal ("Your X plan is active until Y — still want to buy Z?") instead of silently letting someone double-pay. |
| 7 | Remove Ref. Price from admin | Removed the "Ref. Price" column from `app/admin/classes` and the price field from the class edit form. (The underlying database column is untouched — a hidden field keeps saves working — so nothing else in the app breaks.) |

All of the above passed `tsc --noEmit` and `next lint` with zero errors.

### Something to decide: was "member" the right read?

For the inquiry popup, I read "not a member" as **not holding an active paid membership** (rather than simply "not logged in"), so a signed-up-but-not-yet-paying visitor still sees it as a lead-capture prompt. If you actually meant "any logged-in user, membership or not," tell me and it's a one-line change.

---

## 2. System audit — what's genuinely missing or risky

I read through the schema, RLS policies, payment flow, email system, and admin dashboards. The engineering underneath is well above average for a project this size — the Razorpay webhook + client-verify double-check, the RLS split for Zoom credentials, and the booked-count triggers are all done properly. The gaps below are real, not nitpicks.

### Fix soon (security / trust)

- **Password reset / email confirmation links have nowhere to land.** `app/api/auth/callback/` exists as an empty folder — there's no `route.ts` handling Supabase's auth callback. Right now, a "reset password" or "confirm your email" link a user clicks will likely 404 or fail silently. This is worth fixing before you rely on email-based signup/reset in production.
- **No rate limiting or CAPTCHA** on `/login`, `/signup`, `/contact`, or the new inquiry popup. All are open to scripted abuse (credential stuffing, spam submissions) with nothing in front of them today.
- **Homepage testimonials are fabricated placeholder data** (`components/home/Testimonials.tsx`) — six named "customers" with quotes that were never said, presented as real reviews. I didn't touch this since it wasn't part of your ask, but I'd flag it: publishing invented testimonials as genuine is a real legal/trust risk in most jurisdictions. Swap in real reviews (even 2–3 genuine ones) or clearly label them as illustrative.
- **Razorpay webhook secret isn't set** — `.env.local` has `RAZORPAY_WEBHOOK_SECRET` commented out. Without it, the reconciliation webhook (your safety net for payments that succeed but the browser never confirms) can't verify signatures. Get this from Razorpay → Settings → Webhooks and set it before go-live.

### Product gaps worth closing

- **"WhatsApp reminders" is listed as a feature on every membership plan, but no WhatsApp integration exists anywhere in the code.** It's a text promise with nothing behind it. Either build it (WhatsApp Business API or a service like Twilio/Gupshup/Interakt — all need a paid account) or remove the claim from the plan descriptions so you're not advertising something you don't deliver.
- **`sendMembershipExpiryEmail` is written but never called.** There's no scheduled job anywhere that runs it, so members are never actually warned before their membership lapses. Same story for class-start reminders — there's no reminder email/notification before a live session at all, despite that being one of the more valuable retention touches for a subscription product.
- **Nothing marks a membership `expired` automatically** when `end_date` passes — status likely just sits at `active` indefinitely unless an admin manually updates it. Worth a daily scheduled job (Supabase cron / a Vercel cron route) that flips expired rows and, ideally, fires the expiry email above.
- **Admin overview (`/admin`) is four static counts** — total revenue, confirmed bookings, users, pending appointments. No trend over time, no active-membership count, no "classes happening today," no revenue-by-plan breakdown. For a subscription business this is the dashboard you'll actually live in day to day, so it's worth investing in.
- **No analytics** (GA4, PostHog, Plausible, etc.) anywhere in the app — you have no visibility into traffic, signup funnel drop-off, or which page loses people before they buy a membership.
- **No error monitoring** (Sentry or similar) — if something breaks in production for a user, you won't know unless they tell you.
- **No automated tests** — no Jest/Vitest/Playwright anywhere in the repo, so every change (including everything above) is verified by hand.

### Smaller, worth knowing about

- The new AI chat-bot and WhatsApp button are visually solid, but there's no way for you to review chat-bot conversations or measure how often the WhatsApp button gets clicked — worth adding basic logging if this becomes a real support channel.
- No pause/resume-only mid-cycle membership flow — the copy says "pause or cancel anytime," but I didn't find a pause action anywhere in the dashboard, only cancellation-by-policy text.

---

## 3. What you need to do yourself

1. **Set `RAZORPAY_WEBHOOK_SECRET`** in your production environment (Razorpay dashboard → Settings → Webhooks) — required for the payment safety-net webhook to work at all.
2. **Replace the placeholder WhatsApp/phone number** (`NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_STUDIO_PHONE`) if `+91 79849 25843` isn't the number you actually want customers messaging.
3. **Verify your Resend sending domain** is fully verified (not just added) — otherwise transactional emails (payment receipts, batch assignment, appointment replies) may silently fail or land in spam.
4. **Decide on the testimonials** — swap in real ones, or tell me to pull them and replace with something honest (e.g. "Be one of our first reviewers").
5. **Decide on WhatsApp reminders** — either commit to building real WhatsApp automation (needs a WhatsApp Business API provider account, which costs money) or I can update the plan copy to stop promising it.
6. If you want a **real AI-powered chatbot** instead of the rule-based one, sign up for an OpenAI or Anthropic API key and share it (as an env var, never pasted in chat) — I'll wire it in using the same live-data grounding the current bot already fetches.
7. Consider a **CAPTCHA** (Cloudflare Turnstile is free and simple to add) on login/signup/contact if spam or abuse becomes a problem.

Happy to pick up any of the "Fix soon" items next — the auth callback route and the membership-expiry cron job would be my top two recommendations if you want me to keep going.

---

## 4. Round 2 — Coursera-inspired dashboard & member-management upgrade (30 Aug 2026)

You asked me to look at how Coursera handles online classes, membership, and member management, and bring what's relevant into this site. Coursera's own admin side (Coursera for Business) is built around three things: real member management (search, roles, per-member drill-down), reporting/analytics with trends over time, and progress indicators that nudge the learner toward their next action. I adapted those three ideas to this app's shape:

- **`/admin/users` is now real member management**, not a name/role/date list. It shows each member's email (pulled from `auth.users` via the service-role client — it was never mirrored into `profiles`), their live membership status as a badge, and has search + status filters (All / Active / Lapsed / No membership).
- **New `/admin/users/[id]` member detail page.** Full membership history, payment history, recent bookings, and three admin actions that didn't exist anywhere before: **grant** a membership manually (for offline payments or goodwill, no Razorpay charge involved), **extend** an active one by a chosen number of days, and **cancel** one outright. Also a one-click admin-role toggle.
- **`/admin` overview now tracks trends, not just totals.** Added an active-membership count and a 6-month revenue bar chart with month-over-month % change, so you can see whether this month is up or down at a glance — the same kind of "real-time reporting" Coursera for Business highlights as a core admin feature.
- **Member `/dashboard` now shows billing-cycle progress**, mirroring Coursera's course-progress-bar pattern: a progress bar for how far through the current membership period you are, plus a "renewing soon" nudge with a direct renew link when 7 days or fewer remain. Coursera's own data showed this kind of progress/next-step nudge measurably improves completion — the same principle applies to renewal here.

I deliberately didn't try to copy Coursera's course-catalog/certificate machinery — this is a live-batch yoga studio, not a self-paced course marketplace, so concepts like "certificates" and "skill paths" don't map onto what you're running. I focused on the pieces that transfer: knowing who your members are, seeing revenue trends instead of one lifetime total, and giving members a reason to renew before they lapse.

All of the above passed a full `tsc --noEmit` and `next lint` with zero errors. (A full production `next build` on this machine is slow enough over the mounted project folder that it didn't finish inside a single command's time limit — typecheck + lint is the same verification your own `npm run typecheck`/`npm run lint` scripts do, so I'd suggest running `npm run build` yourself once when convenient, just as a final sanity check before deploying.)

### Also fixed from your last message
- The nav dropdown was hugging the right edge on wider screens — it's now centered under the nav pill like on mobile.
- Added an explicit close (✕) button inside the chat-bot panel's header — previously closing relied on noticing the floating button's icon had changed to an X, which wasn't obvious with the panel open on top of it.

---

## 5. Membership overlap bug — fixed (30 Aug 2026)

You caught a real bug: buying a second membership (e.g. Monthly) while an Annual one was still active created a new row that was also marked "active," starting *immediately* and overlapping the Annual one — instead of queuing behind it. Because your dashboard only ever showed the membership with the furthest-out end date, the newly bought one had nothing pointing to it anywhere, and would have quietly run out while the Annual plan was still active and being used — money paid for time that could never actually be used.

**Fixed:**
- `/api/memberships/verify` (checkout) and the admin's manual "Grant membership" action now both check for anything the member already has running or queued, and start the new membership the day after that ends — so purchases chain back-to-back instead of overlapping.
- `/dashboard` now lists a queued membership under an "Upcoming" card ("Monthly — queued, starts 12 Oct, once your current plan ends"), instead of it existing invisibly.
- `/admin/users` and the member detail page now show a "+N queued" badge and label upcoming memberships correctly, instead of the admin view silently picking whichever row happens to have the latest end date.
- The "you already have an active membership" confirmation popup now explains it'll be queued rather than asking a question that used to have a misleading answer either way.

**⚠️ One thing you need to do yourself:** this fix only changes what happens for *future* purchases — it doesn't retroactively fix memberships that already got created wrong, including the one from your test. I wrote a one-off repair script for that: `scripts/fix_overlapping_memberships.mjs`. I couldn't run it myself (this session's tools don't have network access to your Supabase project), so from your own terminal, in the project folder, run:

```
npm run fix:memberships
```

That's a dry run — it prints exactly which memberships it would reschedule and how, without changing anything. Once it looks right, apply it with:

```
node --env-file=.env.local scripts/fix_overlapping_memberships.mjs --apply
```

It reschedules any overlapping memberships into a proper back-to-back chain (in the order they were purchased), preserving the number of days each one paid for — nobody loses time they paid for. It's safe to run more than once.

---

## 6. Go-live readiness verdict (30 Aug 2026)

**Short answer: not yet.** The engineering is genuinely solid — better than most projects this size — but there are a handful of gaps that would hurt real, paying customers if you opened signups today. None of them are large rewrites; they're mostly a day or two each.

### Launch blockers — fix before taking real payments

1. **No password reset flow at all.** There's no "forgot password" link on `/login`, no request-reset form, and the Supabase auth callback route (`app/api/auth/callback/`) is an empty folder — so even if a reset email went out, the link has nowhere to land. A locked-out paying member currently has no self-serve way back in.
2. **`RAZORPAY_WEBHOOK_SECRET` isn't set** (commented out in `.env.local`). Without it, the reconciliation webhook — your safety net for a payment that succeeds but the browser never confirms — can't verify signatures and won't do anything.
3. **No rate limiting or CAPTCHA** on `/login`, `/signup`, `/contact`, or the inquiry popup. Wide open to credential-stuffing and spam right now.
4. **Fabricated testimonials on the homepage** — six named "customers" with quotes nobody said, presented as real reviews. This is a genuine legal/trust liability in most places once you have real traffic, not just a content nit.
5. **No terms-of-service acceptance at signup**, and no account-deletion path for a user who wants their data removed. Both are standard expectations (and in a lot of jurisdictions, legal requirements) once you're processing real payments and personal data.

### Should fix soon — not launch-blocking, but will bite you

- `sendMembershipExpiryEmail` exists but nothing ever calls it — no cron job, so members are never actually warned before their plan lapses. Nothing auto-marks a membership `expired` either.
- "WhatsApp reminders" is advertised on every plan; no WhatsApp automation exists anywhere. Either build it or stop promising it.
- No error monitoring (Sentry or similar) — if something breaks for a user in production, you won't know unless they tell you.
- No analytics (GA4/PostHog/Plausible) — no visibility into signup funnel or drop-off.
- No security headers configured in `next.config.js` (no CSP, no HSTS, no X-Frame-Options) — cheap to add, meaningfully reduces clickjacking/XSS exposure.
- No automated tests, no CI pipeline — every change (including everything I've done this session) is currently verified by hand.

### Fine for now, worth knowing about

- Refunds are manual (via the Razorpay dashboard) — the `/cancellation-refund` page is policy text only, no automated refund flow. Reasonable at low volume; revisit once volume grows.
- Admin dashboard is now much better (see Round 2 above) but still has no export/reporting for accounting, and no email-domain verification check surfaced anywhere in the UI.

### If "SaaS" means selling this to other studios, not just running your own

Everything above is about launching **your own** yoga studio safely. If you actually meant turning this into multi-tenant software other studios could sign up for and run their own instance of, that's a materially different and much bigger project — there's currently no tenant isolation, no per-studio branding/config, no billing-for-the-platform-itself layer, and the whole data model (one `profiles`/`classes`/`memberships` set, no `studio_id` anywhere) assumes a single business. Worth a separate conversation if that's the actual goal, rather than folding it into this punch list.

---

## 7. Round 3 — closing the launch blockers (30 Aug 2026)

You asked me to handle everything from the go-live checklist except the Razorpay webhook secret (you're doing that one yourself). Here's what changed:

### Password reset & email confirmation — was completely missing
- `app/api/auth/callback/route.ts` — the Supabase auth code-exchange handler that simply didn't exist before. Every email-based auth link (signup confirmation, password reset) now has somewhere to land.
- New `/forgot-password` and `/reset-password` pages + forms.
- "Forgot password?" link added to `/login`.
- Sign-up's confirmation email now explicitly redirects through the callback route instead of relying on the Supabase project's default Site URL.

### Rate limiting — was completely missing
- `supabase/rate_limits.sql` (**you need to run this** — see below) adds a small Postgres-only limiter, no Redis or third-party service required.
- Applied to `/api/appointments` (contact form + inquiry popup — 5 requests/10 min per IP) and `/api/chatbot` (20 messages/5 min per IP, since each message also costs a few DB reads).
- Fails *open* on any error — if the limiter itself breaks, it logs and lets the request through rather than taking the feature down.
- Login/signup themselves go straight to Supabase Auth, which has its own baseline rate limiting server-side — this fix targets the custom endpoints that had none at all.

### Fabricated testimonials — removed
- The six invented customer quotes are gone. `components/home/Testimonials.tsx` now renders real reviews from a new `testimonials` table, managed at **`/admin/testimonials`** (list, add, edit, publish/unpublish, delete) — same pattern as your other admin CRUD pages.
- Until you add and publish at least one real testimonial, the section on the homepage simply doesn't render — nothing fake in its place.
- `supabase/testimonials.sql` (**you need to run this** — see below) creates the table.

### Terms acceptance + account deletion — was completely missing
- Sign-up now requires checking "I agree to the Terms of Service and Privacy Policy" (linked) before the account can be created.
- New self-service **"Delete my account"** on `/dashboard`: cancels any active membership, clears your name/phone from the profile, and permanently bans the login — while deliberately *not* hard-deleting the Supabase auth user, because that would cascade-delete payment and membership history that (in most places) you're required to keep for accounting even after a customer asks to be forgotten. This is a judgment call — happy to change the approach if you'd rather handle deletion requests differently.

### Membership expiry — was dead code, now runs daily
- `app/api/cron/membership-expiry` does two things nothing did before: auto-expires memberships whose `end_date` has passed (previously they'd sit at `status: 'active'` forever), and sends the `sendMembershipExpiryEmail` — which existed in your codebase but was never called by anything — exactly 3 days before a membership lapses.
- `vercel.json` schedules it daily at 03:00 UTC (~8:30am IST) via Vercel Cron. If you don't deploy to Vercel, this needs an equivalent scheduler (GitHub Actions cron, Supabase pg_cron, cron-job.org, etc.) hitting the same URL instead.
- Protected by `CRON_SECRET` — I generated one and added it to `.env.local`; **you need to also add the same value to your production environment's env vars** (Vercel project settings, or wherever you deploy) so the header Vercel Cron sends actually matches.

### Security headers — was completely missing
- `next.config.mjs` now sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and a locked-down Permissions-Policy on every response. The CSP allowlists exactly what the app actually loads (Razorpay checkout, your Supabase project, Unsplash/https images) rather than being wide open.
- One honest caveat: `script-src` still includes `'unsafe-inline'` because Next.js's own hydration bootstrap is inline `<script>` content, and removing that properly needs per-request CSP nonces wired through middleware — a real next step, but a separate and riskier change from "turn security headers on at all."
- I could not start this dev server in this sandbox to visually confirm the headers (the project's installed native build tools are Windows-only, this session's shell is Linux) — the config follows Next.js's documented `headers()` API exactly, but please do a quick `curl -I http://localhost:3000` yourself after `npm run dev` as a sanity check.

### CI — was completely missing
- `.github/workflows/ci.yml` runs `npm run typecheck` and `npm run lint` on every push and pull request. Doesn't touch your real Supabase project — uses placeholder env values just so the build doesn't throw on a missing `process.env.X`.

### "WhatsApp reminders" claim — fixed
- Every membership plan's feature list said "WhatsApp reminders" with no WhatsApp automation anywhere behind it. Changed to "Email reminders before your plan renews" — which is now literally true, tied to the cron job above. (This is in the code's fallback plan data and the seed script; **if you've already customized your live plans' features in the database, update that wording there too** — I can't reach your database from here to do it for you.)
- The WhatsApp icons in the footer and nav menu (previously dead `href="#"` links) now actually open a chat with your number.

### Everything above passed `tsc --noEmit` and `next lint` clean.

---

### ⚠️ Things only you can do (three SQL files + two env vars)

I don't have network access to your Supabase project from this session, so none of the new tables/functions exist in your database yet. From the Supabase dashboard's SQL editor, run these three files (same way you'd have run the existing ones like `batches.sql`):

1. `supabase/rate_limits.sql`
2. `supabase/testimonials.sql`
3. (Already covered earlier) `supabase/schema.sql` changes, if any — no schema changes this round beyond the two new files above.

And two environment variables:

- `CRON_SECRET` — already generated and sitting in your local `.env.local`; copy that same value into your production deployment's environment variables (e.g. Vercel → Project → Settings → Environment Variables) so the cron job's auth check passes.
- `RAZORPAY_WEBHOOK_SECRET` — still on you, as agreed.

### Still not done — needs a third-party account I can't create for you

- **Error monitoring** (Sentry or similar) — needs you to sign up and hand me a DSN.
- **Analytics** (GA4/PostHog/Plausible) — same, needs an account + measurement ID.
- **CAPTCHA** (Cloudflare Turnstile, recommended — free) — needs a site key. The rate limiting above covers the same ground reasonably well for now; CAPTCHA is the next layer if spam/abuse becomes a real problem.
- **Real WhatsApp automation** — if you still want actual WhatsApp reminders (not just the chat button), that needs a WhatsApp Business API provider account (Twilio, Gupshup, Interakt, etc.), which costs money. I removed the false claim rather than build against an account that doesn't exist yet — say the word once you've picked a provider and I'll wire it in.

Once the SQL files are run and `CRON_SECRET` is set in production, the launch-blocker list from before this round is fully closed except the Razorpay webhook secret you're handling.

## Round 4 — Android/iOS app via Capacitor, and a dev-server CSP fix

**Fixed first**: the strict CSP from Round 3 was missing `'unsafe-eval'`,
which Next.js's *dev server* (not production) needs for Fast Refresh/source
maps — this was silently blocking all client-side JS in `npm run dev` (the
"admin is stuck, nothing renders" report). Now added only when
`NODE_ENV !== 'production'`, so the production CSP is unchanged.

**Added**: Android and iOS apps that load your real deployed site inside a
native shell (Capacitor) — one codebase, no duplicated UI. Installed
`@capacitor/core`, `@capacitor/app`, `@capacitor/status-bar`,
`@capacitor/splash-screen`, `@capacitor/cli`, `@capacitor/android`,
`@capacitor/ios`. New files: `capacitor.config.ts`,
`components/mobile/CapacitorBridge.tsx` (native status bar/splash/back-button
handling, a no-op on the web). Added safe-area-aware positioning to the two
fixed-position UI pieces (`BottomNav`, `TopRightAuth`) so they clear the
notch/home-indicator/gesture-bar inside the app. Full setup steps —
generating the native projects, running them in Android Studio/Xcode,
app-store submission checklist — are in `MOBILE_APP_SETUP.md`. I can't run
Android Studio or Xcode from this session, so the actual `cap add`/build/run
steps are yours to run, same category as the Razorpay/Sentry items above.

"SaaS" (target #2) was confirmed to mean marketing the existing site as a
product, not a separate multi-tenant build — so it's the same running code
as the web app, nothing new to build there.
