import { Resend } from 'resend';

// Lazy singleton — the Resend SDK throws immediately if constructed with
// no API key, which previously crashed the *entire* importing route
// (payment verification!) before it ever reached the actual booking/
// membership logic. Email is meant to be best-effort and non-blocking,
// so we only construct the client when actually sending, and only if a
// key is configured.
let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Living Yoga <hello@livingyoga.in>';
