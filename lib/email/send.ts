import { getResendClient, FROM_EMAIL } from './resend';
import {
  appointmentRequestedEmail,
  generalEnquiryReceivedEmail,
  appointmentDecisionEmail,
  batchAssignmentEmail,
  paymentSuccessEmail,
  membershipActivationEmail,
  membershipExpiryEmail,
  passwordResetEmail,
} from './templates';

// Every function below is a thin, typed wrapper so call sites (API routes,
// webhook handlers) never touch Resend's raw API directly. Errors are
// caught and logged rather than thrown — a failed confirmation email
// should never roll back a successful booking or payment.
async function safeSend(to: string, subject: string, html: string) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (err) {
    console.error(`[email] failed to send "${subject}" to ${to}:`, err);
  }
}

export const sendAppointmentRequestedEmail = (to: string, name: string, date: string, time: string) =>
  safeSend(to, 'Appointment request received — Living Yoga', appointmentRequestedEmail(name, date, time));

export const sendGeneralEnquiryReceivedEmail = (to: string, name: string) =>
  safeSend(to, 'We got your message — Living Yoga', generalEnquiryReceivedEmail(name));

export const sendAppointmentDecisionEmail = (
  to: string,
  name: string,
  approved: boolean,
  date: string,
  time: string
) =>
  safeSend(
    to,
    approved ? 'Your appointment is confirmed — Living Yoga' : 'Update on your appointment — Living Yoga',
    appointmentDecisionEmail(name, approved, date, time)
  );

export const sendBatchAssignmentEmail = (
  to: string,
  name: string,
  className: string,
  days: string,
  time: string,
  instructor: string
) =>
  safeSend(
    to,
    `You're in: ${className} — Living Yoga`,
    batchAssignmentEmail(name, className, days, time, instructor)
  );

export const sendPaymentSuccessEmail = (to: string, name: string, amount: string, reference: string) =>
  safeSend(to, 'Payment received — Living Yoga', paymentSuccessEmail(name, amount, reference));

export const sendMembershipActivationEmail = (to: string, name: string, planName: string, endDate: string) =>
  safeSend(to, `Welcome to ${planName} — Living Yoga`, membershipActivationEmail(name, planName, endDate));

export const sendMembershipExpiryEmail = (to: string, name: string, planName: string, endDate: string) =>
  safeSend(to, 'Your membership is ending soon — Living Yoga', membershipExpiryEmail(name, planName, endDate));

export const sendPasswordResetEmail = (to: string, resetUrl: string) =>
  safeSend(to, 'Reset your Living Yoga password', passwordResetEmail(resetUrl));
