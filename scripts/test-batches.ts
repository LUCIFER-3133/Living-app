/**
 * Assertions for lib/batches.ts — the join-window maths.
 *
 * This is security-relevant, not just cosmetic: `canJoinNow` is what decides
 * whether the dashboard fetches a meeting link at all, so an off-by-one here
 * either hides the link from a member mid-class or hands it out early.
 *
 * Run it — no bundler, no test framework, works with the repo's Windows-installed
 * node_modules:
 *
 *   node --experimental-strip-types --no-warnings scripts/test-batches.ts
 *
 * (`--no-warnings` only silences Node's "this is experimental" and
 * "typeless package.json" notices — the repo is CommonJS for Next's sake.)
 *
 * Every case below is timezone-independent by design (batch times are IST
 * wall-clock, converted with a fixed offset). Prove it by re-running under a
 * different server clock — the output must be byte-identical apart from the
 * reported TZ:
 *
 *   TZ=UTC                 node --experimental-strip-types --no-warnings scripts/test-batches.ts
 *   TZ=America/Los_Angeles node --experimental-strip-types --no-warnings scripts/test-batches.ts
 *   TZ=Pacific/Kiritimati  node --experimental-strip-types --no-warnings scripts/test-batches.ts
 */

import {
  getUpcomingSessions,
  getNextSession,
  getSessionPhase,
  canJoinNow,
  joinOpensAt,
  getDurationMinutes,
  formatWeekdays,
  formatStudioTime,
  formatStudioClock,
  JOIN_WINDOW_BEFORE_MINUTES,
  // The explicit `.ts` extension is required: Node sees module syntax here and
  // loads the file as ESM, which has no extensionless resolution. That is also
  // why tsconfig sets `allowImportingTsExtensions` (safe under `noEmit`).
} from '../lib/batches.ts';

let passed = 0;
const failures: string[] = [];

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) passed += 1;
  else failures.push(`${label}\n    expected ${e}\n    actual   ${a}`);
}

/** A Mon/Wed/Fri 06:00–07:00 IST batch with no end date. */
const mwf = {
  id: 'b1',
  weekdays: [1, 3, 5] as never,
  start_time: '06:00:00',
  end_time: '07:00:00',
  starts_on: '2026-01-01',
  ends_on: null,
  status: 'active' as const,
};

// Mon 24 Aug 2026 03:00 IST == Sun 23 Aug 2026 21:30 UTC.
const now = new Date('2026-08-23T21:30:00Z');

// ── Basic formatting ────────────────────────────────────────────────────────
check('formatWeekdays MWF', formatWeekdays(mwf.weekdays), 'Mon · Wed · Fri');
check('formatWeekdays is Monday-first, so Sunday lands last', formatWeekdays([0, 6, 1] as never), 'Mon · Sat · Sun');
check('formatWeekdays sorts unordered input', formatWeekdays([5, 1, 3] as never), 'Mon · Wed · Fri');
check('formatStudioTime 06:00', formatStudioTime('06:00:00'), '6:00 am');
check('formatStudioTime 18:30', formatStudioTime('18:30:00'), '6:30 pm');
check('duration 60 min', getDurationMinutes(mwf), 60);

// ── Enumeration ─────────────────────────────────────────────────────────────
const next4 = getUpcomingSessions(mwf, { now, limit: 4 });
check(
  'next 4 session dates',
  next4.map((s) => s.sessionDate),
  ['2026-08-24', '2026-08-26', '2026-08-28', '2026-08-31']
);
check(
  'session start is 06:00 IST == 00:30 UTC',
  next4[0].start.toISOString(),
  '2026-08-24T00:30:00.000Z'
);
check('session end is one hour later', next4[0].end.toISOString(), '2026-08-24T01:30:00.000Z');
check('limit is honoured', getUpcomingSessions(mwf, { now, limit: 2 }).length, 2);

// A class that has already finished today must not be listed. 08:00 IST is
// after the 06:00–07:00 slot, so the next session is Wednesday.
const afterClass = new Date('2026-08-24T02:30:00Z'); // Mon 08:00 IST
check(
  'finished session drops off',
  getUpcomingSessions(mwf, { now: afterClass, limit: 1 })[0].sessionDate,
  '2026-08-26'
);

// ...but a session in progress stays, so the Join button survives until the end.
const midClass = new Date('2026-08-24T01:00:00Z'); // Mon 06:30 IST
check(
  'in-progress session stays listed',
  getUpcomingSessions(mwf, { now: midClass, limit: 1 })[0].sessionDate,
  '2026-08-24'
);

// ── Status and date bounds ──────────────────────────────────────────────────
check('paused batch has no sessions', getUpcomingSessions({ ...mwf, status: 'paused' }, { now }).length, 0);
check('archived batch has no sessions', getUpcomingSessions({ ...mwf, status: 'archived' }, { now }).length, 0);
check('no weekdays means no sessions', getUpcomingSessions({ ...mwf, weekdays: [] as never }, { now }).length, 0);
check(
  'ended batch has no sessions',
  getUpcomingSessions({ ...mwf, ends_on: '2026-08-01' }, { now }).length,
  0
);
check(
  'batch starting later skips earlier dates',
  getUpcomingSessions({ ...mwf, starts_on: '2026-08-27' }, { now, limit: 1 })[0].sessionDate,
  '2026-08-28'
);
check(
  'last session on ends_on is included',
  getUpcomingSessions({ ...mwf, ends_on: '2026-08-26' }, { now }).map((s) => s.sessionDate),
  ['2026-08-24', '2026-08-26']
);

// ── horizonDays ─────────────────────────────────────────────────────────────
// A batch that starts next term is invisible at the 28-day default, which is
// why the member dashboard and the admin list both widen the horizon.
const nextTerm = { ...mwf, starts_on: '2026-11-02' };
check('beyond default horizon: empty', getUpcomingSessions(nextTerm, { now }).length, 0);
check(
  'wider horizon finds it',
  getUpcomingSessions(nextTerm, { now, horizonDays: 120, limit: 1 })[0].sessionDate,
  '2026-11-02'
);

// ── Cancellations ───────────────────────────────────────────────────────────
const withSkip = getUpcomingSessions(mwf, { now, limit: 3, cancelledDates: ['2026-08-26'] });
check('cancelled flag set', withSkip.map((s) => s.isCancelled), [false, true, false]);
check('cancelled session still listed', withSkip.length, 3);
check(
  'getNextSession skips a cancelled date',
  getNextSession(mwf, { now, cancelledDates: ['2026-08-24'] })!.sessionDate,
  '2026-08-26'
);
check(
  'getNextSession skips a run of cancelled dates',
  getNextSession(mwf, { now, cancelledDates: ['2026-08-24', '2026-08-26', '2026-08-28'] })!.sessionDate,
  '2026-08-31'
);
check('getNextSession returns null when nothing runs', getNextSession({ ...mwf, status: 'paused' }, { now }), null);

// ── The join window: 60 minutes before start, until the session ends ───────
check('window constant', JOIN_WINDOW_BEFORE_MINUTES, 60);

const s0 = getNextSession(mwf, { now })!;
const at = (minutesFromStart: number) => new Date(s0.start.getTime() + minutesFromStart * 60_000);

check('joinOpensAt is start minus 60 min', joinOpensAt(s0).toISOString(), '2026-08-23T23:30:00.000Z');

for (const [mins, expected] of [
  [-120, false],
  [-61, false],
  [-60, true], // exactly on the boundary: open
  [-59, true],
  [-1, true],
  [0, true],
  [30, true],
  [59, true],
  [60, false], // session has ended
  [90, false],
] as const) {
  check(`canJoinNow at T${mins >= 0 ? '+' : ''}${mins}m`, canJoinNow(s0, at(mins)), expected);
}

for (const [mins, expected] of [
  [-120, 'upcoming'],
  [-61, 'upcoming'],
  [-60, 'joinable'],
  [-1, 'joinable'],
  [0, 'live'],
  [59, 'live'],
  [60, 'ended'],
] as const) {
  check(`phase at T${mins >= 0 ? '+' : ''}${mins}m`, getSessionPhase(s0, at(mins)), expected);
}

check('formatStudioClock of unlock time', formatStudioClock(joinOpensAt(s0)), '5:00 am');

// ── A class that crosses midnight ───────────────────────────────────────────
// 22:30–00:15 IST: the end instant belongs to the next calendar day, and the
// session must stay joinable across the date boundary.
const lateNight = { ...mwf, weekdays: [1] as never, start_time: '22:30:00', end_time: '00:15:00' };
check('midnight-crossing duration', getDurationMinutes(lateNight), 105);
const late = getUpcomingSessions(lateNight, { now, limit: 1 })[0];
check('midnight session date is the start date', late.sessionDate, '2026-08-24');
check('midnight session start', late.start.toISOString(), '2026-08-24T17:00:00.000Z');
check('midnight session end rolls over', late.end.toISOString(), '2026-08-24T18:45:00.000Z');
check('joinable just before midnight IST', canJoinNow(late, new Date('2026-08-24T18:25:00Z')), true);
check('not joinable after it ends', canJoinNow(late, new Date('2026-08-24T18:46:00Z')), false);

// ── Report ─────────────────────────────────────────────────────────────────
const tz = process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
if (failures.length === 0) {
  console.log(`✓ ${passed} assertions passed (server TZ: ${tz})`);
} else {
  console.error(`✗ ${failures.length} of ${passed + failures.length} assertions failed (server TZ: ${tz})\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exitCode = 1;
}
