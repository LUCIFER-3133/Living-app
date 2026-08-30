'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { appointmentSchema, type AppointmentInput } from '@/lib/validations';

const SERVICES = [
  'Batch Change / Timing Request',
  'Private 1:1 Session',
  'Class Recommendation',
  'Corporate Wellness',
  'Workshop Enquiry',
  'Other',
];

type FormType = 'general' | 'appointment';

const TABS: { value: FormType; label: string }[] = [
  { value: 'general', label: 'General Enquiry' },
  { value: 'appointment', label: 'Book an Appointment' },
];

type TopicPreset = { tab: FormType; service?: string; message?: string };

// Several CTAs elsewhere ("Request a different batch", "Ask to join this
// batch", "Tell us your timings"...) all land here rather than each owning
// its own form. A `?topic=` (and sometimes `&class=`) tells this form which
// one sent the visitor, so it opens on the right tab with the right service
// and a message already framed for them — instead of a blank form that
// makes them re-type why they came.
function getTopicPreset(topic: string | null, className: string | null): TopicPreset | undefined {
  switch (topic) {
    case 'batch-change':
      return {
        tab: 'appointment',
        service: 'Batch Change / Timing Request',
        message: "I'd like to move to a different batch than the one I'm currently in. My preferred days/times are: ",
      };
    case 'timings':
      return {
        tab: 'appointment',
        service: 'Batch Change / Timing Request',
        message: 'Here are the timings that would work best for me: ',
      };
    case 'join-batch':
      return {
        tab: 'appointment',
        service: 'Batch Change / Timing Request',
        message: className ? `I'd like to join the ${className} batch.` : "I'd like to join a batch.",
      };
    case 'new-batch':
      return {
        tab: 'general',
        message: className
          ? `Is there any chance you could start a batch for ${className}? I'd love to join.`
          : "Is there any chance you could start a new batch? I'd love to join.",
      };
    default:
      return undefined;
  }
}

export default function AppointmentForm() {
  const searchParams = useSearchParams();
  const preset = getTopicPreset(searchParams.get('topic'), searchParams.get('class'));

  const [tab, setTab] = useState<FormType>(preset?.tab ?? 'general');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: preset?.tab ?? 'general',
      service: preset?.service ?? '',
      message: preset?.message ?? '',
    },
  });

  function switchTab(next: FormType) {
    setTab(next);
    setValue('type', next);
    setServerError(null);
  }

  async function onSubmit(values: AppointmentInput) {
    setServerError(null);
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, type: tab }),
    });
    if (!res.ok) {
      const data = await res.json();
      setServerError(typeof data.error === 'string' ? data.error : 'Something went wrong. Please try again.');
      return;
    }
    setSubmitted(true);
    reset({ type: tab });
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-lg bg-canvas-dim p-6 text-center">
        <CheckCircle2 className="mx-auto text-gold" size={26} />
        <p className="mt-3 font-display text-xl">
          {tab === 'appointment' ? 'Request received' : 'Message received'}
        </p>
        <p className="mt-1 text-sm text-ink/60">
          {tab === 'appointment'
            ? "We'll confirm your appointment by email within 24 hours."
            : "We'll get back to you by email within 24 hours."}
        </p>
        <button onClick={() => setSubmitted(false)} className="link-underline mt-4 text-sm text-moss">
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-6 inline-flex rounded-full bg-canvas-dim p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => switchTab(t.value)}
            className={`rounded-full px-4 py-2 font-medium transition-colors ${
              tab === t.value ? 'bg-moss text-canvas shadow-card' : 'text-ink/60 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <input type="hidden" {...register('type')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink">Name</label>
            <input {...register('name')} className="input-field" placeholder="Your name" />
            {errors.name && <p className="mt-1 text-xs text-moss">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-xs text-moss">{errors.email.message}</p>}
          </div>
        </div>

        {tab === 'appointment' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-ink">Phone</label>
                <input {...register('phone')} className="input-field" placeholder="+91 00000 00000" />
                {errors.phone && <p className="mt-1 text-xs text-moss">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Service</label>
                <select {...register('service')} className="input-field" defaultValue={preset?.service ?? ''}>
                  <option value="" disabled>Select one</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.service && <p className="mt-1 text-xs text-moss">{errors.service.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-ink">Preferred date</label>
                <input {...register('preferred_date')} type="date" className="input-field" />
                {errors.preferred_date && <p className="mt-1 text-xs text-moss">{errors.preferred_date.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Preferred time</label>
                <input {...register('preferred_time')} type="time" className="input-field" />
                {errors.preferred_time && <p className="mt-1 text-xs text-moss">{errors.preferred_time.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Message (optional)</label>
              <textarea {...register('message')} rows={3} className="input-field resize-none" placeholder="Anything we should know?" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-ink">Phone (optional)</label>
              <input {...register('phone')} className="input-field" placeholder="+91 00000 00000" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Message</label>
              <textarea
                {...register('message')}
                rows={4}
                className="input-field resize-none"
                placeholder="What would you like to know?"
              />
              {errors.message && <p className="mt-1 text-xs text-moss">{errors.message.message}</p>}
            </div>
          </>
        )}

        {serverError && <p className="text-sm text-moss">{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <span>{tab === 'appointment' ? 'Request Appointment' : 'Send Message'}</span>
          )}
        </button>
      </form>
    </div>
  );
}
