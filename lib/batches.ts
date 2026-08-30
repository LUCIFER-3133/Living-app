/**
 * Batch session maths.
 *
 * Batches store a weekly recurrence (`weekdays`) plus a wall-clock IST
 * `start_time` / `end_time`. This module turns that into concrete UTC
 * instants so the UI can count down to them and decide when to reveal the
 * join link.
 *
 * WHY THE MANUAL OFFSET
 *   The app is deployed on servers that usually run in UTC, while every class
 *   time is quoted in IST. Using `new Date(...)` with local parts would give a
 *   different answer on a UTC server than on the admin's machine. IST is a
 *   fixed +05:30 with no daylight saving, so a constant offset is exact and
 *   avoids pulling in a timezone library.
 *
 *   If Living Yoga ever teaches from another timezone, change
 *   `STUDIO_OFFSET_MINUTES` — it is the single source of truth here.
 */

import type { Batch, Weekday } from '@/types/database';

/** IST = UTC+05:30. No DST, so a fixed offset is exact. */
export const STUDIO_OFFSET_MINUTES = 5 * 60 + 30;

const MINUTE = 60_000;
const DAY_MS = 86_400_000;

/** How long before a session starts the join link becomes available. */
export const JOIN_WINDOW_BEFORE_MINUTES = 60;

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface BatchSession {
  batchId: string;
  /** Actual UTC instant the session starts. */
  start: Date;
  /** Actual UTC instant the session ends. */
  end: Date;
  /** IST calendar date, "YYYY-MM-DD" — the key used for cancellations. */
  sessionDate: string;
  isCancelled: boolean;
}

export type SessionPhase = 'upcoming' | 'joinable' | 'live' | 'ended';

// ── IST calendar helpers ────────────────────────────────────────────────────

/** The Y/M/D + weekday that `instant` falls on *in studio time*. */
function studioParts(instant: Date) {
  const shifted = new Date(instant.getTime() + STUDIO_OFFSET_MINUTES * MINUTE);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay() as Weekday,
  };
}

/** Parse "HH:MM" or "HH:MM:SS" into minutes past midnight. */
function parseClock(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/**
 * The UTC instant of a given studio-time wall clock on a given studio-time
 * calendar date. Because we build from UTC parts and subtract a fixed offset,
 * the result is identical no matter what timezone the caller runs in.
 */
function studioInstant(year: number, month: number, day: number, minutesPastMidnight: number): Date {
  const asIfUtc = Date.UTC(year, month, day, 0, minutesPastMidnight);
  return new Date(asIfUtc - STUDIO_OFFSET_MINUTES * MINUTE);
}

/** "YYYY-MM-DD" for a studio-time calendar date. */
function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Formats an instant as a studio-time clock, e.g. "6:00 am". */
export function formatStudioTime(time: string): string {
  const total = parseClock(time);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
}

/** "Mon · Wed · Fri", ordered Monday-first so weeks read naturally. */
export function formatWeekdays(weekdays: Weekday[]): string {
  const mondayFirst = (d: Weekday) => (d === 0 ? 7 : d);
  return [...weekdays]
    .sort((a, b) => mondayFirst(a) - mondayFirst(b))
    .map((d) => WEEKDAY_SHORT[d])
    .join(' · ');
}

export function getDurationMinutes(batch: Pick<Batch, 'start_time' | 'end_time'>): number {
  const mins = parseClock(batch.end_time) - parseClock(batch.start_time);
  // A batch that ends "before" it starts crosses midnight.
  return mins > 0 ? mins : mins + 24 * 60;
}

// ── Session enumeration ─────────────────────────────────────────────────────

/**
 * Upcoming sessions for a batch, soonest first.
 *
 * A session counts as upcoming until it *ends*, so a class already in progress
 * still shows up (with a live "Join" button) rather than vanishing at its
 * start time.
 */
export function getUpcomingSessions(
  batch: Pick<Batch, 'id' | 'weekdays' | 'start_time' | 'end_time' | 'starts_on' | 'ends_on' | 'status'>,
  options: { now?: Date; limit?: number; horizonDays?: number; cancelledDates?: Iterable<string> } = {}
): BatchSession[] {
  const { now = new Date(), limit = 5, horizonDays = 28 } = options;
  const cancelled = new Set(options.cancelledDates ?? []);

  if (batch.status !== 'active' || batch.weekdays.length === 0) return [];

  const startMins = parseClock(batch.start_time);
  const durationMins = getDurationMinutes(batch);
  const allowedDays = new Set<number>(batch.weekdays);

  const sessions: BatchSession[] = [];
  const today = studioParts(now);

  for (let offset = 0; offset <= horizonDays && sessions.length < limit; offset += 1) {
    // Walk forward in whole studio-days. Date.UTC normalises month rollover.
    const cursor = new Date(Date.UTC(today.year, today.month, today.day + offset));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const day = cursor.getUTCDate();
    const weekday = cursor.getUTCDay();

    if (!allowedDays.has(weekday)) continue;

    const date = isoDate(year, month, day);
    if (batch.starts_on && date < batch.starts_on) continue;
    if (batch.ends_on && date > batch.ends_on) break;

    const start = studioInstant(year, month, day, startMins);
    const end = new Date(start.getTime() + durationMins * MINUTE);
    if (end.getTime() <= now.getTime()) continue; // already finished

    sessions.push({ batchId: batch.id, start, end, sessionDate: date, isCancelled: cancelled.has(date) });
  }

  return sessions;
}

export function getNextSession(
  batch: Parameters<typeof getUpcomingSessions>[0],
  options: Parameters<typeof getUpcomingSessions>[1] = {}
): BatchSession | null {
  // Skipped dates shouldn't be offered as "next", but we still need enough
  // candidates to find the first one that isn't cancelled.
  const sessions = getUpcomingSessions(batch, { ...options, limit: Math.max(options.limit ?? 1, 8) });
  return sessions.find((s) => !s.isCancelled) ?? null;
}

// ── Join window ─────────────────────────────────────────────────────────────

/**
 * Where a session sits relative to now.
 *   upcoming — too early; link stays hidden
 *   joinable — inside the pre-class window
 *   live     — under way
 *   ended    — finished
 */
export function getSessionPhase(session: Pick<BatchSession, 'start' | 'end'>, now: Date = new Date()): SessionPhase {
  const t = now.getTime();
  const start = session.start.getTime();
  const end = session.end.getTime();

  if (t >= end) return 'ended';
  if (t >= start) return 'live';
  if (start - t <= JOIN_WINDOW_BEFORE_MINUTES * MINUTE) return 'joinable';
  return 'upcoming';
}

/** The single gate on whether meeting credentials may be shown. */
export function canJoinNow(session: Pick<BatchSession, 'start' | 'end'>, now: Date = new Date()): boolean {
  const phase = getSessionPhase(session, now);
  return phase === 'joinable' || phase === 'live';
}

/** The instant the join link unlocks. */
export function joinOpensAt(session: Pick<BatchSession, 'start'>): Date {
  return new Date(session.start.getTime() - JOIN_WINDOW_BEFORE_MINUTES * MINUTE);
}

// ── Human-friendly formatting ───────────────────────────────────────────────

/** "Today", "Tomorrow", or "Mon, 25 Aug" — all in studio time. */
export function formatSessionDay(session: Pick<BatchSession, 'start'>, now: Date = new Date()): string {
  const s = studioParts(session.start);
  const t = studioParts(now);

  const sessionMidnight = Date.UTC(s.year, s.month, s.day);
  const todayMidnight = Date.UTC(t.year, t.month, t.day);
  const diffDays = Math.round((sessionMidnight - todayMidnight) / DAY_MS);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(session.start);
}

/** An instant as a studio-time clock, e.g. "5:00 am" — for computed times
 *  like the moment a join link unlocks. */
export function formatStudioClock(instant: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
    .format(instant)
    .toLowerCase();
}

/** Coarse countdown: "in 3 days", "in 2 hr 10 min", "in 4 min", "now". */
export function formatCountdown(target: Date, now: Date = new Date()): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return 'now';

  const totalMinutes = Math.floor(ms / MINUTE);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hr` : ''}`;
  if (hours > 0) return `in ${hours} hr${minutes > 0 ? ` ${minutes} min` : ''}`;
  return `in ${Math.max(minutes, 1)} min`;
}
