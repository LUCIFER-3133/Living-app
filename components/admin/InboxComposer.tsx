import { sendInboxMessage } from '@/lib/actions/inbox';

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'active', label: 'Active members only' },
  { value: 'inactive', label: 'Lapsed / no membership' },
] as const;

export default function InboxComposer() {
  return (
    <form action={sendInboxMessage} className="space-y-5 glass-card p-6">
      <div>
        <label className="text-sm font-medium text-ink">Send to</label>
        <select name="audience" defaultValue="all" className="input-field">
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Title</label>
        <input name="title" required maxLength={120} className="input-field" placeholder="Studio closed this Sunday" />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Message</label>
        <textarea name="body" required rows={5} className="input-field resize-none" placeholder="What you want members to know…" />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Link (optional)</label>
        <input name="link" className="input-field" placeholder="/membership" />
        <p className="mt-1 text-xs text-ink/45">An in-app path, e.g. /membership or /classes — shown as a button on the message.</p>
      </div>

      <div className="pt-2">
        <button type="submit" className="btn-primary">
          <span>Send message</span>
        </button>
      </div>
    </form>
  );
}
