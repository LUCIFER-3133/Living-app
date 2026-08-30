'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Batch mutations reject bad input by throwing, and Next replaces server error
 * messages with a generic string in production — so instead of relying on the
 * message getting through, this spells out what actually goes wrong.
 *
 * The boundary covers deletes as well as saves, so the copy stays neutral about
 * which one failed: telling someone whose delete failed to check their weekday
 * selection sends them looking for a problem that isn't there.
 */
export default function BatchesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl">
      <p className="flex items-center gap-2 font-body text-sm font-semibold text-gold-700">
        <AlertTriangle size={15} /> That didn&apos;t go through
      </p>
      <h1 className="mt-3 text-display-sm">Nothing was changed</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/65">
        Your batch is exactly as it was. If you were saving, these are the two things that usually cause it:
      </p>
      <ul className="mt-3 space-y-2 text-sm text-ink/65">
        <li className="rounded-lg bg-white/50 p-3">
          <strong className="font-semibold text-ink">No day selected.</strong> A batch needs at least one day
          of the week.
        </li>
        <li className="rounded-lg bg-white/50 p-3">
          <strong className="font-semibold text-ink">The meeting link.</strong> It has to start with
          <code className="mx-1 rounded bg-ink/5 px-1 py-0.5 text-xs">https://</code>— paste the full Zoom or
          Meet URL.
        </li>
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button onClick={reset} className="btn-primary !px-4 !py-2 !text-xs">
          <RotateCcw size={13} /> <span>Try again</span>
        </button>
        <Link href="/admin/batches" className="text-sm text-ink/55 hover:text-ink">
          Back to all batches
        </Link>
      </div>

      {(error.message || error.digest) && (
        <p className="mt-8 break-words text-[11px] text-ink/35">
          {error.message}
          {error.digest ? ` (${error.digest})` : ''}
        </p>
      )}
    </div>
  );
}
