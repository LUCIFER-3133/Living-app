import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMembershipExpiryEmail } from '@/lib/email/send';
import { formatDate } from '@/lib/utils';
import { getUpcomingSessions, formatStudioTime } from '@/lib/batches';
import type { Batch, YogaClass } from '@/types/database';

// GET /api/cron/membership-expiry
// Meant to be hit once a day by a scheduler (see vercel.json) — not by a
// person or the app itself. Despite the path (kept as-is so the existing
// CRON_SECRET/Vercel Cron wiring doesn't need to change), this now does
// four things:
//
//   1. Auto-expires memberships whose end_date has passed. Nothing else in
//      the app ever flipped status from 'active' to 'expired' on its own —
//      it would just sit there forever unless an admin noticed and fixed it
//      by hand.
//   2. Emails + inbox-messages "your membership is ending soon" for
//      memberships expiring in exactly 3 days — fires once per membership,
//      since only an exact 3-day match can ever hit on a given daily run.
//   3. Inbox-messages every active batch member who has a live class today
//      (skipping any date cancelled in batch_cancellations) — one message
//      per member per batch per day, deduped against anything already sent
//      today so a cron retry can't spam the same reminder twice.
//   4. Rate-limit table housekeeping.
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
  const renewalInboxRows: { user_id: string; category: 'membership_renewal'; title: string; body: string; link: string }[] = [];
  for (const m of expiringSoon ?? []) {
    const planName = (m.plan as any)?.name ?? 'your plan';
    const endDateLabel = formatDate(m.end_date);

    renewalInboxRows.push({
      user_id: m.user_id,
      category: 'membership_renewal',
      title: 'Your membership ends in 3 days',
      body: `${planName} ends on ${endDateLabel}. Renew now to keep your live batch access without a gap.`,
      link: '/membership',
    });

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
      await sendMembershipExpiryEmail(email, name, planName, endDateLabel);
      emailsSent++;
    } catch (err) {
      console.error(`[cron/membership-expiry] failed to email membership ${m.id}:`, err);
      emailsFailed++;
    }
  }

  // 3. Daily class reminders — every active batch with a session today,
  // messaged to its active members.
  type BatchForReminder = Pick<Batch, 'id' | 'name' | 'weekdays' | 'start_time' | 'end_time' | 'starts_on' | 'ends_on' | 'status'> & {
    class?: Pick<YogaClass, 'name'> | null;
  };

  const [{ data: batches }, { data: cancellationsToday }, { data: sentToday }] = await Promise.all([
    admin
      .from('batches')
      .select('id, name, weekdays, start_time, end_time, starts_on, ends_on, status, class:classes(name)')
      .eq('status', 'active'),
    admin.from('batch_cancellations').select('batch_id').eq('session_date', today),
    // Dedup guard: what class_reminder titles has each user already gotten
    // today (in case this cron gets triggered more than once in a day).
    admin
      .from('inbox_messages')
      .select('user_id, title')
      .eq('category', 'class_reminder')
      .gte('created_at', `${today}T00:00:00.000Z`),
  ]);

  const cancelledBatchIdsToday = new Set((cancellationsToday ?? []).map((c) => c.batch_id));
  const alreadySentToday = new Set((sentToday ?? []).map((r) => `${r.user_id}|${r.title}`));

  const batchesToday = ((batches ?? []) as unknown as BatchForReminder[]).filter((b) => {
    if (cancelledBatchIdsToday.has(b.id)) return false;
    // A batch's own status/weekdays/date-range fully determine whether it
    // meets today — reusing this instead of re-deriving IST weekday math
    // here keeps one source of truth (lib/batches.ts) for both the
    // dashboard countdown and this reminder.
    const sessions = getUpcomingSessions(b, { limit: 1, horizonDays: 1 });
    return sessions.length > 0 && sessions[0].sessionDate === today;
  });

  let classRemindersSent = 0;
  if (batchesToday.length > 0) {
    const { data: members } = await admin
      .from('batch_members')
      .select('batch_id, user_id')
      .eq('status', 'active')
      .in('batch_id', batchesToday.map((b) => b.id));

    const classReminderRows: { user_id: string; category: 'class_reminder'; title: string; body: string; link: string }[] = [];
    for (const b of batchesToday) {
      const title = `Class today: ${b.name}`;
      const membersForBatch = (members ?? []).filter((m) => m.batch_id === b.id);
      for (const m of membersForBatch) {
        const key = `${m.user_id}|${title}`;
        if (alreadySentToday.has(key)) continue;
        alreadySentToday.add(key); // guard within this same run too
        classReminderRows.push({
          user_id: m.user_id,
          category: 'class_reminder',
          title,
          body: `${b.class?.name ?? b.name} is today at ${formatStudioTime(b.start_time)}. The join link unlocks 1 hour before class on your dashboard.`,
          link: '/dashboard',
        });
      }
    }

    if (classReminderRows.length > 0) {
      const { error: reminderError } = await admin.from('inbox_messages').insert(classReminderRows);
      if (reminderError) console.error('[cron/membership-expiry] class reminder insert failed:', reminderError);
      else classRemindersSent = classReminderRows.length;
    }
  }

  if (renewalInboxRows.length > 0) {
    const { error: renewalInboxError } = await admin.from('inbox_messages').insert(renewalInboxRows);
    if (renewalInboxError) console.error('[cron/membership-expiry] renewal inbox insert failed:', renewalInboxError);
  }

  // 4. Housekeeping for the rate-limit table (supabase/rate_limits.sql) —
  // not required for correctness, just keeps it from growing forever.
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
    batchesWithClassToday: batchesToday.length,
    classRemindersSent,
  });
}
