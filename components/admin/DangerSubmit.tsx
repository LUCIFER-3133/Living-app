'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

/**
 * Submit button for destructive admin actions: asks once, then disables itself
 * while the Server Action runs so a double-click can't fire it twice.
 *
 * Client-side because `confirm()` and pending state both need the browser. This
 * is a misclick guard, not an access control — every delete action re-checks
 * admin on its first line, and a browser dialog is trivially bypassed. It is
 * also inert in the moment before hydration, since Next progressively enhances
 * Server Action forms and a native POST carries no onClick with it. Both are
 * fine for what this is; neither would be fine if it were load-bearing.
 *
 * `useFormStatus` reads the nearest enclosing <form>, so this must be rendered
 * inside the form it submits (which is also the only place it makes sense).
 */
export default function DangerSubmit({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // preventDefault, not `return false`: this is React's synthetic handler,
      // where only preventDefault actually stops the submission.
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={`disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
    >
      {children}
    </button>
  );
}
