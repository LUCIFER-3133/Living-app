'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * A value the member needs to paste into Zoom — passcode or meeting ID.
 * Typing a passcode by hand on a phone, one minute before class, is exactly
 * the friction that makes people give up and skip the session.
 */
export default function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard needs a secure context; the value is on screen either way.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className="group inline-flex items-center gap-2 rounded-lg glass-panel px-3 py-2 text-left transition-colors hover:bg-white/75"
    >
      <span>
        <span className="block text-[10px] uppercase tracking-wider text-ink/40">{label}</span>
        <span className="block font-body text-sm font-semibold tracking-wide text-ink">{value}</span>
      </span>
      {copied ? (
        <Check size={14} className="shrink-0 text-moss" />
      ) : (
        <Copy size={14} className="shrink-0 text-ink/35 group-hover:text-ink/60" />
      )}
    </button>
  );
}
