import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMembershipExpiryEmail } from '@/lib/email/send';
import { formatDate } from '@/lib/utils';

// GET /api/cron/membership-expiry
// Meant to be hit once a day by a scheduler (see vercel.json) — not by a
// person or the app itself. Does two things that nothing previously did:
//
//   1. Auto-expires memberships whose end_date has passed. Nothing else in
//      the app ever flipped status from 'active' to 'expired' on its own —
//      it would just sit there forever unless an admin noticed and fixed it
//      by hand.
//   2. Sends the "your membership is ending soon" email — sendMembershipExpiryEmail
//      existed in lib/email/send.ts but nothing ever called it. Fires exactly
//      once per membership: it only matches rows whose end_date is *exactly*
//      3 days out, so a membership can only ever match on one daily run.
//
// Protected by CRON_SECRET so this isn't a publicly triggerable endpoint —
// Vercel Cron sends it automatically as a Bearer token when the env var is
// set (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/membership-expiry] CRON_SECRET is not set — this endpoint is unprotected.');
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const warnDate = new Date();
  warnDate.setDate(warnDate.getDate() + 3);
  const warnDateStr = warnDate.toISOString().slice(0, 10);

  // 1. Auto-expire lapsed memberships.
  const { data: expired, error: expireError } = await admin
    .from('memberships')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('end_date', today)
    .select('id');

  if (expireError) console.error('[cron/membership-expiry] expire step failed:', expireError);

  // 2. Warn members whose membership ends in exactly 3 days.
  const { data: expiringSoon, error: expiringError } = await admin
    .from('memberships')
    .select('id, user_id, end_date, plan:membership_plans(name)')
    .eq('status', 'active')
    .eq('end_date', warnDateStr);

  if (expiringError) console.error('[cron/membership-expiry] expiring-soon query failed:', expiringError);

  let emailsSent = 0;
  let emailsFailed = 0;
  for (const m of expiringSoon ?? []) {
    try {
      const [{ data: profile }, { data: authUser }] = await Promise.all([
        admin.from('profiles').select('full_name').eq('id', m.user_id).single(),
        admin.auth.admin.getUserById(m.user_id),
      ]);
      const email = authUser?.user?.email;
      if (!email) {
        emailsFailed++;
        continue;
      }
      const name = profile?.full_name || email;
      const planName = (m.plan as any)?.name ?? 'your plan';
      await sendMembershipExpiryEmail(email, name, planName, formatDate(m.end_date));
      emailsSent++;
    } catch (err) {
      console.error(`[cron/membership-expiry] failed to email membership ${m.id}:`, err);
      emailsFailed++;
    }
  }

  // Housekeeping for the rate-limit table (supabase/rate_limits.sql) — not
  // required for correctness, just keeps it from growing forever.
  await admin.rpc('cleanup_rate_limits').then(
    () => {},
    (err) => console.error('[cron/membership-expiry] rate-limit cleanup failed:', err)
  );

  return NextResponse.json({
    ok: true,
    expiredCount: expired?.length ?? 0,
    expiringSoonFound: expiringSoon?.length ?? 0,
    emailsSent,
    emailsFailed,
  });
}
