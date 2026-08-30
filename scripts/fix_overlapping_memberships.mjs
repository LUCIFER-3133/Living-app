// One-off repair script for a bug fixed in /api/memberships/verify: buying a
// second membership while one was already active used to create a new
// 'active' row starting immediately, overlapping the existing one instead of
// queuing after it — so the second purchase was invisible everywhere and the
// paid-for days were silently wasted.
//
// This finds every user with overlapping active memberships and rewrites
// their start/end dates into a proper back-to-back chain, in the order they
// were purchased, keeping the number of days each one paid for unchanged.
//
// Run from the project root (needs NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY, both already in .env.local):
//
//   node --env-file=.env.local scripts/fix_overlapping_memberships.mjs
//
// That's a dry run — it only prints what it would change. Once the output
// looks right, apply it with:
//
//   node --env-file=.env.local scripts/fix_overlapping_memberships.mjs --apply
//
// Safe to run more than once — a user with no overlap is left untouched.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false } });

const APPLY = process.argv.includes('--apply');
const today = new Date().toISOString().slice(0, 10);

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function dayDiff(a, b) {
  return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86_400_000);
}

const { data: memberships, error } = await admin
  .from('memberships')
  .select('id, user_id, status, start_date, end_date, created_at, plan:membership_plans(name)')
  .eq('status', 'active')
  .gte('end_date', today)
  .order('user_id', { ascending: true })
  .order('created_at', { ascending: true });

if (error) {
  console.error('Query failed:', error);
  process.exit(1);
}

const byUser = new Map();
for (const m of memberships) {
  const list = byUser.get(m.user_id) ?? [];
  list.push(m);
  byUser.set(m.user_id, list);
}

let usersAffected = 0;
let rowsChanged = 0;
const updates = [];

for (const [userId, list] of byUser) {
  if (list.length < 2) continue;
  // Purchase order (created_at asc) is the order they should chain in —
  // the first one purchased stays where it is (or where it already is if
  // it's the one currently in effect); each later purchase is pushed to
  // start right after the previous one ends, keeping its original paid
  // duration intact.
  let userChanged = false;
  let chainEnd = null;
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const originalDuration = dayDiff(m.start_date, m.end_date);
    let newStart = m.start_date;
    if (chainEnd && newStart <= chainEnd) {
      newStart = addDays(chainEnd, 1);
    }
    const newEnd = addDays(newStart, originalDuration);
    if (newStart !== m.start_date || newEnd !== m.end_date) {
      updates.push({
        id: m.id,
        userId,
        plan: m.plan?.name,
        old: { start: m.start_date, end: m.end_date },
        new: { start: newStart, end: newEnd },
      });
      userChanged = true;
      rowsChanged++;
    }
    chainEnd = newEnd;
  }
  if (userChanged) usersAffected++;
}

console.log(`Found ${usersAffected} user(s) with overlapping active memberships, ${rowsChanged} row(s) to fix.`);
for (const u of updates) {
  console.log(`  user=${u.userId} plan="${u.plan}" membership=${u.id}: ${u.old.start}→${u.old.end}  becomes  ${u.new.start}→${u.new.end}`);
}

if (!APPLY) {
  console.log('\nDry run only — pass --apply to write these changes.');
  process.exit(0);
}

for (const u of updates) {
  const { error: updErr } = await admin
    .from('memberships')
    .update({ start_date: u.new.start, end_date: u.new.end })
    .eq('id', u.id);
  if (updErr) {
    console.error(`Failed to update ${u.id}:`, updErr);
  } else {
    console.log(`Updated ${u.id}`);
  }
}
console.log('Done.');
