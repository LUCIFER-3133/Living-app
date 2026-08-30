# Living Yoga — "Beyond the Mat. Into Life."

A full-stack platform for running **live online yoga classes**: a browsable
weekly timetable, Razorpay memberships, admin-managed recurring batches with
their own Zoom/Meet links, a member dashboard that surfaces the join link an
hour before class, an admin back office, and transactional email via Resend.
Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
and Supabase.

Classes are **not individually bookable**. Access is a membership plus an
admin placing you in a batch — see "Access model" below.

## Stack

- **Framework:** Next.js 14 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Fonts:** Cormorant Garamond (display serif, headings) + Jost (geometric sans, body/UI) + Sacramento (script wordmark)
- **Database / Auth:** Supabase (Postgres + Row Level Security + Auth + Storage)
- **Payments:** Razorpay (Orders API, signature-verified server-side, webhook fallback)
- **Email:** Resend
- **Validation:** Zod + React Hook Form

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the entire contents of `supabase/schema.sql`.
   This creates every table, index, trigger and RLS policy.
3. Then run `supabase/batches.sql`, which adds the live-class batch tables.
   **Order matters** — it builds on `schema.sql`. Both files are fully
   idempotent (every policy and trigger is dropped before it is created), so
   after changing either one, re-run the whole file rather than hand-applying
   the delta.
4. Promote yourself to admin after signing up once through the app:
   ```sql
   update public.profiles set role = 'admin' where id = '<your-auth-user-id>';
   ```
   The `<TopRightAuth>` widget automatically swaps "Log in" for a profile
   avatar once you're signed in, and routes admins into `/admin` instead of
   `/dashboard`.
5. Copy your Project URL, anon key, and service role key from
   **Project Settings → API**.
6. `supabase/schema.sql` also creates a public `demo-videos` Storage bucket
   with RLS policies (public read, admin-only write) for the demo session
   video uploads in `/admin/demo-videos`. No extra setup needed beyond
   running the schema.

## 3. Set up Razorpay

1. Create an account at [razorpay.com](https://razorpay.com) and grab your
   **test mode** Key ID / Key Secret from **Settings → API Keys**.
2. Add a webhook at **Settings → Webhooks** pointing to
   `https://yourdomain.com/api/webhooks/razorpay`, subscribed to
   `payment.captured` and `payment.failed`. Copy the webhook secret.
   (In local dev you can skip this — the client-side `/verify` call is the
   primary confirmation path; the webhook is a reconciliation safety net.)

## 4. Set up Resend

1. Create an account at [resend.com](https://resend.com), verify a sending
   domain, and grab an API key.

## 5. Environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local` from steps 2–4.

## 6. Seed sample data (optional but recommended)

```bash
npm run seed
```

This inserts the 7 class types from the brief and 4 membership plans (monthly,
3-month, 6-month, annual), plus some `class_schedules` rows. The schedule rows
are **legacy** — nothing customer-facing reads them any more (see "Legacy
tables" below). Batches are not seeded: create them in `/admin/batches`, since
each one needs a real meeting link you'd have to paste by hand anyway.

## 7. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Admin capabilities

Everything below is real CRUD against Supabase — not mocked. Each page calls
`requireAdminPage()` and each Server Action calls `requireAdminAction()`
before touching the service-role client, because that client bypasses RLS and
`is_admin()` policies do nothing on those paths:

- **Live Batches** (`/admin/batches`) — the main tool for running classes.
  Create a recurring batch (class style, instructor, weekdays, IST time),
  paste one reusable Zoom or Google Meet link with its passcode, assign
  members by name/email/phone search, skip individual dates, and pause or
  resume the whole batch. Assigning someone emails them the batch's days and
  time — deliberately *without* the meeting link, since email is forwardable
  and never expires, so a link in an inbox would outlive the membership that
  entitles them to it. Capacity is enforced server-side, and the index warns
  you about any active batch with no meeting link, which is the one mistake
  that silently breaks a live class.
- **Classes** (`/admin/classes`) — create, edit, and delete class listings
  (name, category, description, duration, difficulty, price, image, active
  status).
- **Membership plans** (`/admin/memberships`) — create, edit, and delete
  plans (price, billing interval, feature list, active status), plus a
  read-only view of current members.
- **Demo Sessions** (`/admin/demo-videos`) — upload full video files
  directly to Supabase Storage (with an optional thumbnail image), publish/
  unpublish, and delete. Uploads happen straight from the browser to
  Storage using the authenticated admin session — no server relay of large
  video files.
- **Appointments** (`/admin/appointments`) — approve/reject requests, which
  triggers the corresponding decision email automatically.

## Design system

Rebuilt to match the reference site's actual visual identity (screenshots
supplied by the client), not just its copy:

- **Palette:** dark olive-to-rust radial gradient for the hero/footer CTA,
  warm ivory for content sections, near-black ink footer, terracotta/rust
  as the single accent color.
- **Typography:** headings are **Cormorant Garamond in mixed case** — a light,
  tall, generously-spaced serif (see the `h1`–`h4` base rule in `globals.css`).
  Body copy and UI are **Jost**, a geometric sans in the Futura lineage; the
  `.lede` class sets the roomy, muted standfirst paragraph that acts as the
  calm counterweight to a big serif headline. Single emphasis words are set in
  the serif's italic and tinted terracotta via `.accent-italic` — e.g. "Find a
  rhythm that *fits* your week." The wordmark uses Sacramento, a script font,
  everywhere it appears (bottom nav, footer, mobile menu).

  The earlier revision forced `h1`–`h4` to `font-body font-extrabold uppercase`,
  which meant the display serif was loaded on every page and then never
  actually used for a heading. The base rule now carries `font-medium` so small
  headings (a `text-lg` card title) don't look anaemic, while the `text-display-*`
  tokens carry their own lighter weights and win, because utilities outrank the
  base layer.
- **Glassmorphism:** every surface — buttons, cards, forms, the floating
  bottom nav, the top-right auth widget, the full-screen mobile menu — is
  built from two reusable panels in `globals.css`: `.glass-panel` (light,
  for the cream canvas) and `.glass-panel-dark` (for the hero/footer).
  Buttons and inputs (`.btn-primary`, `.btn-secondary`, `.btn-outline`,
  `.input-field`) all compose from these, so any new UI automatically
  matches without extra styling.
- **Navigation:** no top header. A `<BottomNav>` floating glass pill is
  fixed to the bottom of every page (logo + "Book a demo" + menu trigger);
  a separate `<TopRightAuth>` widget floats top-right and swaps between
  Login/Signup and a profile avatar based on auth state. The hamburger
  opens `<MobileMenu>`, a full-screen glass overlay with centered nav
  links, styled after a frosted-glass reference pattern.

## Performance notes

- The branded "breathe in…" loading screen shows **once per browser
  session** (via `sessionStorage`), not on every client-side navigation —
  replaying a full-screen loader on every internal link would make the app
  feel slower than the reference static site, not classier.
- Demo videos load **only on click** (the grid shows lightweight thumbnails;
  the `<video>` element mounts only when a card is opened).
- `next/image` is used for content imagery, for automatic AVIF/WebP and
  responsive `sizes`. Demo-video thumbnails in `components/demo/VideoGrid.tsx`
  are a deliberate exception — they're arbitrary Storage URLs, so they use a
  plain `<img>` rather than forcing every admin upload through the optimizer.
- The hero is a **CSS radial gradient** (`.hero-gradient`), not an image, so
  there is no hero LCP image to preload and nothing in the app uses `priority`.
- `experimental.optimizePackageImports` is enabled for `lucide-react`,
  `framer-motion`, and `date-fns` so only the specific icons/functions used
  are bundled, not the full libraries.
- **Public content pages use ISR** (`export const revalidate` on home,
  `/membership`, `/blog`, `/blog/[slug]`, `/demo-sessions`) so visitors get
  cached HTML. Everything that depends on who you are is `force-dynamic`
  instead — all 13 admin pages plus `/classes`, `/classes/[slug]` and
  `/dashboard` — because caching a page whose content is gated on membership
  status is how you serve one member's join state to another.

## Project structure

```
app/                  Routes (App Router) — pages + API route handlers
  api/                Server-only endpoints: memberships (Razorpay order +
                       verify), appointments, Razorpay webhook
  admin/              Protected admin dashboard (role-gated)
    batches/          Live-batch management: recurrence, link, roster
  dashboard/          Protected member dashboard — the live-class view
components/
  ui/                 Small shared primitives (ScrollReveal, etc.)
  layout/             BottomNav, TopRightAuth, MobileMenu, Footer
  home/, classes/, booking/, dashboard/, demo/, admin/, blog/, auth/
lib/
  supabase/           Browser / server / admin (service-role) Supabase clients
  actions/            Server Actions — batches.ts, classes.ts, memberships.ts
  email/              Resend client, HTML templates, typed send functions
  batches.ts          IST recurrence maths, join window, session phases
  auth.ts             requireAdminPage / requireAdminAction
  memberships.ts      hasActiveMembership
  razorpay.ts         Order creation + HMAC signature verification
  validations.ts      Zod schemas shared by forms and API routes
types/database.ts     Hand-written types mirroring the SQL files
supabase/schema.sql   Core schema, RLS policies, triggers
supabase/batches.sql  Batch tables, policies, column grants (run second)
scripts/seed.ts       Sample data loader
scripts/test-batches.ts  Assertions over the batch date maths
```

## Access model: membership + batch assignment

There is **no per-class booking anywhere in the app**. A member cannot pick a
slot, and `/api/bookings` no longer exists. Access to a live class is the
conjunction of two independent facts:

1. **An active membership** (`memberships.status = 'active'` and `end_date >=
   today`) — the only thing Razorpay is ever used for
   (`/api/memberships/create-order` → `/api/memberships/verify`).
2. **An admin having placed you in a batch** (a row in `batch_members`, written
   from `/admin/batches/<id>`; the `batch_roster` view is a read-only
   convenience over it).

Either one alone gets you nothing. A paying member on no roster sees an empty
dashboard; a rostered member whose membership lapsed keeps their batch cards
but loses the join link, with copy that says exactly that. Both halves are
enforced server-side — the credentials RLS policy in `supabase/batches.sql`
requires roster membership *and* `has_active_membership()`, so it holds even
if the UI is bypassed entirely.

`/booking` is a permanent redirect to `/membership`, so old links and any
stale bookmarks land somewhere sensible rather than 404.

Each class still has a `price` field in the database — kept for admin
reference only (shown in `/admin/classes` labeled "Ref. Price") and never
charged to a customer.

## The weekly timetable (`/classes`)

`/classes` is **browse-only by design**, and the page carries a comment
saying so, because "why is there no Book button" is the obvious question for
the next person reading it.

It renders the real `batches` rows — class style, instructor, weekdays and
IST time — grouped by weekday in `components/classes/BatchTimetable.tsx`.
Every CTA leads to membership, contact, or the member's own dashboard; none
of them lead to a booking flow. Above the timetable, a three-step "How
joining works" panel sets expectations (choose a membership → we place you in
a batch → join from your dashboard) precisely because there is no button to
discover.

Members and visitors see the same timetable. The only difference is the CTA
pair: members get "Go to my dashboard" / "Request a different batch",
everyone else gets "View membership plans" / "Watch a free demo".

## Live batches

A **batch** is a recurring commitment, not a dated event: one class style, one
instructor, a set of weekdays, one IST start time, and **one persistent
meeting link** reused every session. That is the model because it matches how
a small studio actually runs online classes — the teacher opens the same Zoom
room every Tuesday and Thursday — and it means the admin pastes a link once
instead of before every session.

Individual dates are handled as exceptions rather than rows: `batch_sessions`
does not exist. `lib/batches.ts` enumerates occurrences from the recurrence
rule and subtracts `batch_cancellations`, so skipping Diwali is one insert,
not a bulk edit.

- `lib/batches.ts` — recurrence enumeration, `canJoinNow`, `getSessionPhase`,
  `getNextSession`, `getUpcomingSessions`. All IST-anchored regardless of
  server timezone.
- `app/dashboard/page.tsx` — the member view. Fetches meeting credentials
  **only** for batches inside the join window, so a link that isn't needed yet
  never reaches the browser.
- `components/dashboard/LiveClassCard.tsx` — a server component, deliberately.
  It receives the full credentials row but passes only the specific fields the
  UI needs down to its `'use client'` children, so `host_note` never leaves the
  server. The passcode itself *does* reach the browser — it has to, the member
  needs to read it — so the protection that matters is the fetch gate above,
  not the component boundary.

**The join window is 1 hour before class → end of class.** Wide on purpose: a
member who joins ten minutes late should still find the link, and the link is
persistent anyway (see the security note below).

## Verifying changes

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # next lint
npm run test:batches  # 51 assertions over the batch date maths
```

`npm run test:batches` exists because `canJoinNow` decides whether the
dashboard fetches a meeting link at all — an off-by-one there either hides
the link from a member mid-class or hands it out early. It covers the join
window edges, all four session phases, `starts_on`/`ends_on` bounds, paused
and archived batches, cancellations, and a midnight-crossing 22:30–00:15
class. It passes identically under Asia/Kolkata, UTC, America/Los_Angeles and
Pacific/Kiritimati, so a deploy region can't quietly change the answer.

## Security notes

- **Payments are never trusted from the client.** `/api/memberships/verify`
  re-derives the HMAC signature server-side using `RAZORPAY_KEY_SECRET`
  before marking anything paid. The Razorpay checkout "success" callback is
  only used to trigger that server call.
- **A valid signature is not proof of who paid.** Razorpay hands the
  signature triple to the browser, so `/api/memberships/verify` additionally
  checks that the `payments` row belongs to the caller, and that
  `plan.price == payment.amount` — otherwise you could pay for one month and
  claim the annual plan. Replay is blocked in the database by
  `uq_memberships_payment`, a partial unique index on `memberships.payment_id`:
  one payment can only ever mint one membership, and the second attempt gets a
  `23505` that the route translates into a friendly "already activated".
- **Every service-role read carries its own authorization.** The service-role
  client (`lib/supabase/admin.ts`) bypasses RLS, so RLS provides *no*
  protection on those code paths. Each admin page therefore calls
  `requireAdminPage()` and each admin Server Action calls
  `requireAdminAction()` (both in `lib/auth.ts`) as the first statement, before
  the client is constructed — re-checked at the point of use rather than
  trusted from `app/admin/layout.tsx`.
- **Column privileges do the work a policy can't.** RLS is row-level, so a
  policy cannot say "this row, but not that column" — and two places need
  exactly that:
  - `profiles` — `profiles_update_own` lets you update your own row, and `role`
    is on that row. Without a column grant, any signed-in member could `PATCH`
    themselves to `role = 'admin'` with the public anon key and unlock every
    admin policy in both SQL files. `update` is therefore revoked at the table
    level and re-granted on `full_name`, `phone`, `avatar_url` only. Admin
    promotion is deliberately out-of-band — see `supabase/promote_admin.sql`.
  - `batch_meeting_credentials` — `host_note` is the admin's scratch space (host
    key, dial-in PIN), so `select` is revoked and re-granted on the five
    member-safe columns.

  Privileges and RLS are independent and both must pass, so the grant narrows
  the columns while the policy keeps narrowing the rows. The table-level grant
  has to be revoked first; Postgres will not subtract a single column from it.
- **Meeting links live in their own table.** `batch_meeting_credentials` is
  separate from `batches` so the timetable can be public while the join link is
  not.
- **A policy is a live capability, not documentation.** `bookings` is history
  now, so its member insert/update policies were removed rather than left
  standing — see "Legacy tables".
- **PostgREST exposes `public` functions as RPC**, so a `security definer`
  helper that takes a user id is an oracle over other users' data.
  `has_active_membership(uid)` is therefore `security invoker`; only
  caller-scoped helpers like `is_admin()` are `definer` (and those pin
  `search_path`).
- **The join window is application-level, not a policy.** An entitled member
  can query their credentials row at any hour. This is accepted rather than
  overlooked: the link is deliberately persistent and reused every session, so
  anyone who legitimately joins once already holds it forever. Reimplementing
  the IST recurrence maths in plpgsql would add a second source of truth for
  the window without changing what an entitled member can obtain.
- **Row Level Security** is enabled on every table. Users can read only their
  own memberships, payments and appointments, and cannot write any of them —
  those are all written by the server with the service-role key. The one
  deliberate exception is `appointments_insert_any`, which lets even `anon`
  insert, because the public contact form has to work for people without
  accounts. Admin access is gated by a `role` column checked in RLS policies,
  in `middleware.ts`, in `app/admin/layout.tsx`, and again in every protected
  page and action.

## Legacy tables

`class_schedules` and `bookings` are still in `schema.sql` and still read in
four places: `/admin/bookings`, `/admin/schedules`, the confirmed-booking count
on the `/admin` overview, and the "Earlier bookings" list on `/dashboard`. They
are kept **for history**: anything booked before the switch to batches stays
visible instead of vanishing from members' accounts.

Nothing writes them any more — `/api/bookings` was deleted — and that is now
*enforced*, not just conventional. The `bookings_insert_own` and
`bookings_update_own_or_admin` policies were dropped, because a policy is a
live capability rather than documentation: while they existed, any signed-in
user could `POST /rest/v1/bookings` with the anon key and invent confirmed
bookings for themselves, which would surface in `/admin/bookings` and move
`class_schedules.booked_count` through the `trg_sync_booked_count` trigger.
Members keep `select` on their own rows; only an admin can now write.

Dropping the tables outright is safe once you don't need the history, but it's
two tables, four pages and a trigger, so it's left as a deliberate decision
rather than done silently.

## What's scaffolded vs. what needs finishing before production

This is a genuine, working implementation of every flow in the brief — not
placeholders — but a few things are intentionally left for you to extend
using the same patterns already in the codebase:

- **Membership expiry emails** (`sendMembershipExpiryEmail`) are written and
  ready, but need a scheduled job (e.g. a Supabase cron function or a
  Vercel Cron hitting a new `/api/cron/membership-expiry` route) to call
  them a few days before `memberships.end_date`. This matters more than it
  used to: a lapsed membership now silently removes the join link, so a
  member should hear about it before their next class rather than at it.
- **Attendance** isn't recorded. The batch model knows who *should* be in a
  session but never learns who turned up, since the join happens in Zoom/Meet
  rather than in the app. If you want it, the honest version is an admin
  mark-attendance view per occurrence, not something inferred from link clicks.
- **Removing a member from a batch sends no email**, while adding one does. The
  asymmetry is worth closing: on removal the batch just disappears from their
  dashboard, so the member's experience of an admin action is silence, and the
  failure mode is someone turning up to a class they're no longer in. If you add
  it, don't name the batch's other members.
- **Blog and class content** ship empty until you add rows via the admin
  dashboard, the seed script, or directly in Supabase.
- Real brand photography should replace the Unsplash placeholders in
  `components/home/ServicesSection.tsx`, `components/layout/MobileMenu.tsx`,
  `/about`, `/services`, and the `/classes/[slug]` fallback image before launch.
#   L i v i n g - a p p  
 