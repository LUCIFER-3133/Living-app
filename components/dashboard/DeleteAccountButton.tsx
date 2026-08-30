'use client';

import { useFormStatus } from 'react-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteOwnAccount } from '@/lib/actions/account';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (
          !window.confirm(
            "Delete your account? You'll be logged out immediately and any active membership will be cancelled. This can't be undone from here — contact us if you change your mind."
          )
        ) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      Delete my account
    </button>
  );
}

export default function DeleteAccountButton() {
  return (
    <form action={deleteOwnAccount}>
      <SubmitButton />
    </form>
  );
}
