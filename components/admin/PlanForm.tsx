import { Trash2 } from 'lucide-react';
import { savePlan, deletePlan } from '@/lib/actions/memberships';
import DangerSubmit from '@/components/admin/DangerSubmit';
import type { MembershipPlan } from '@/types/database';

export default function PlanForm({ existing }: { existing?: MembershipPlan }) {
  return (
    <div className="max-w-xl space-y-6">
      <form action={savePlan} className="space-y-5 glass-card p-6">
        {existing && <input type="hidden" name="id" value={existing.id} />}

        <div>
          <label className="text-sm font-medium text-ink">Plan name</label>
          <input name="name" defaultValue={existing?.name} required className="input-field" placeholder="Unlimited" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Short description</label>
          <input name="description" defaultValue={existing?.description ?? ''} className="input-field" placeholder="Unlimited classes · all styles" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink">Price (₹)</label>
            <input name="price" type="number" min={0} defaultValue={existing?.price ?? 999} required className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Billing interval</label>
            <select name="billing_interval" defaultValue={existing?.billing_interval ?? 'monthly'} className="input-field">
              <option value="monthly">Monthly</option>
              <option value="quarterly">3 Months</option>
              <option value="half_yearly">6 Months</option>
              <option value="yearly">Annual</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Features (one per line)</label>
          <textarea
            name="features"
            defaultValue={existing?.features?.join('\n') ?? ''}
            rows={5}
            className="input-field resize-none"
            placeholder={'Unlimited live classes\nPriority booking\nMonthly Q&A'}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Status</label>
          <select name="status" defaultValue={existing?.status ?? 'active'} className="input-field">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary">
            <span>{existing ? 'Save changes' : 'Create plan'}</span>
          </button>
        </div>
      </form>

      {/*
        Destructive action deliberately outside the main form. A <form> inside a
        <form> is invalid HTML: the browser's parser silently drops the inner
        start tag, so "Delete plan" ended up being a submit button for the
        savePlan form — which is what made React throw "A React form was
        unexpectedly submitted."
      */}
      {existing && (
        <form action={deletePlan} className="rounded-lg border border-ink/10 p-5">
          <input type="hidden" name="id" value={existing.id} />
          <p className="font-body text-sm font-semibold text-ink">Delete this plan</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            Takes the plan off <strong>/membership</strong> so nobody can buy it again. If anyone has ever
            been on it, the plan is deactivated rather than deleted, so their billing history stays intact.
          </p>
          <DangerSubmit
            message="Delete this membership plan? If any member has ever been on it, it will be deactivated instead of deleted."
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-700"
          >
            <Trash2 size={14} /> Delete plan
          </DangerSubmit>
        </form>
      )}
    </div>
  );
}
