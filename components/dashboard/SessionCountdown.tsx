'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** setTimeout overflows past ~24.8 days and fires immediately, so long waits
 *  are armed in chunks rather than in one go. */
const MAX_TIMER_MS = 60 * 60 * 1000;

/**
 * Live countdown to a session, plus the one piece of client-side logic that
 * matters: refreshing the page at the moment the join window opens.
 *
 * The meeting link is deliberately NOT sent to the browser before that moment —
 * the server omits it from the response entirely. So when the clock reaches the
 * unlock time we ask the server for a fresh render, which is when the link
 * arrives. Same again when the class ends, so the card stops offering a link to
 * a meeting that's over.
 *
 * WHY A TIMER AND NOT THE TICK
 *   The refresh is scheduled for the exact boundary instead of being re-checked
 *   on every tick. A per-tick `now >= opens` test is a threshold, not an edge:
 *   for a member whose membership has lapsed, or a batch whose link the admin
 *   hasn't added yet, the server can never send credentials, so the condition
 *   stays true and would refire once a second for the whole class.
 */
export default function SessionCountdown({
  startsAt,
  endsAt,
  opensAt,
  unlocked,
}: {
  startsAt: string;
  endsAt: string;
  opensAt: string;
  /** Whether the server already rendered this session's join link. */
  unlocked: boolean;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  // Start ticking only after mount: rendering a clock during SSR would
  // hydrate against a stale server timestamp and flash the wrong number.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const opens = new Date(opensAt).getTime();

  // One refresh at the next boundary the server's render depends on. Note the
  // deps deliberately exclude the ticking clock.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Once unlocked, the only thing left to re-fetch is the next session.
    const boundaries = (unlocked ? [end] : [opens, end]).filter((t) => t > Date.now());
    if (boundaries.length === 0) return;
    const boundary = Math.min(...boundaries);

    const arm = () => {
      const remaining = boundary - Date.now();
      if (remaining <= 0) return;
      timer = setTimeout(
        remaining > MAX_TIMER_MS ? arm : () => router.refresh(),
        // Small cushion so the server's own clock is definitely past the line.
        Math.min(remaining, MAX_TIMER_MS) + 500
      );
    };
    arm();

    return () => clearTimeout(timer);
  }, [unlocked, opens, end, router]);

  if (now === null) return null;

  if (now >= end) return <span className="text-ink/45">Session finished</span>;

  if (now >= start) {
    const mins = Math.floor((now - start) / 60_000);
    return (
      <span className="flex items-center gap-1.5 font-semibold text-moss">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-moss" />
        </span>
        Live now{mins > 0 ? ` · started ${mins} min ago` : ''}
      </span>
    );
  }

  const ms = start - now;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Seconds only matter once you're close enough to care.
  const label =
    days > 0
      ? `Starts in ${days} day${days > 1 ? 's' : ''} ${hours} hr`
      : hours > 0
        ? `Starts in ${hours} hr ${minutes} min`
        : `Starts in ${minutes}:${String(seconds).padStart(2, '0')}`;

  return <span className={now >= opens ? 'font-semibold text-moss' : 'text-ink/55'}>{label}</span>;
}
