// Lightweight branded HTML email templates. Kept dependency-free (no
// react-email) so this scaffold has zero extra build steps, but the shape
// is easy to port to @react-email/components later if you want previews.

const wrapper = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F7F2EA;font-family:Georgia,'Times New Roman',serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F2EA;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#630000;padding:28px 40px;">
                <span style="color:#F7F2EA;font-size:22px;letter-spacing:0.04em;">YOGA<span style="color:#FF6B35;">+</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;color:#171717;font-family:Helvetica,Arial,sans-serif;">
                <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px;color:#171717;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;background:#F7F2EA;color:#4A4A4A;font-family:Helvetica,Arial,sans-serif;font-size:12px;">
                Living Yoga · Ahmedabad, India · Beyond the Mat. Into Life.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const p = (text: string) =>
  `<p style="font-size:15px;line-height:1.6;color:#2A2A2A;margin:0 0 16px;">${text}</p>`;

/**
 * Escape anything user-controlled before it goes into an email body.
 *
 * `profiles.full_name` originates from signup metadata and is member-writable,
 * so it is HTML the member chose. Today every template only ever mails a name
 * back to its own owner, which makes unescaped interpolation self-inflicted
 * rather than dangerous — but the moment one person's name appears in another
 * person's email (an admin digest, a "new member joined" notice) that stops
 * being true. Cheaper to escape now than to remember later.
 */
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Same default as app/layout.ts, app/robots.ts and app/sitemap.ts. Emails are
// rendered on the server, so the NEXT_PUBLIC_ prefix is incidental here.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.livingyoga.in';

export const appointmentRequestedEmail = (name: string, date: string, time: string) =>
  wrapper(
    'Appointment request received',
    p(`Hi ${esc(name)}, thanks for reaching out to Living Yoga. We've received your appointment request for <strong>${esc(date)} at ${esc(time)}</strong>. Our team will confirm within 24 hours.`)
  );

export const generalEnquiryReceivedEmail = (name: string) =>
  wrapper(
    'We got your message',
    p(`Hi ${esc(name)}, thanks for reaching out to Living Yoga. We've received your message and someone from our team will get back to you within 24 hours.`)
  );

export const appointmentDecisionEmail = (name: string, approved: boolean, date: string, time: string) =>
  wrapper(
    approved ? 'Your appointment is confirmed' : 'Update on your appointment request',
    approved
      ? p(`Hi ${esc(name)}, your appointment on <strong>${esc(date)} at ${esc(time)}</strong> is confirmed. We look forward to seeing you.`)
      : p(`Hi ${esc(name)}, unfortunately we're unable to accommodate <strong>${esc(date)} at ${esc(time)}</strong>. Please reply to this email and we'll find another slot together.`)
  );

/**
 * Sent when an admin places a member in a batch. Deliberately does NOT include
 * the meeting link or passcode: email is forwardable and never expires, so the
 * link would outlive the membership that entitles them to it. The dashboard is
 * the only place it appears, and it appears there an hour before class.
 */
export const batchAssignmentEmail = (
  name: string,
  className: string,
  days: string,
  time: string,
  instructor: string
) =>
  wrapper(
    "You're in a batch",
    p(`Hi ${esc(name)}, you've been added to <strong>${esc(className)}</strong> — ${esc(days)} at <strong>${esc(time)}</strong> IST with ${esc(instructor)}.`) +
      p(
        'Your join link appears on your dashboard one hour before each session, so open it a few minutes early rather than looking for a link in this email.'
      ) +
      p(
        `<a href="${SITE_URL}/dashboard" style="color:#630000;font-weight:bold;">Go to my dashboard</a>`
      )
  );

export const paymentSuccessEmail = (name: string, amount: string, reference: string) =>
  wrapper(
    'Payment received',
    p(`Hi ${esc(name)}, we've received your payment of <strong>${esc(amount)}</strong>. Reference: ${esc(reference)}.`)
  );

export const membershipActivationEmail = (name: string, planName: string, endDate: string) =>
  wrapper(
    'Your membership is active',
    p(`Hi ${esc(name)}, your <strong>${esc(planName)}</strong> membership is now active and valid through <strong>${esc(endDate)}</strong>. See you on the mat.`)
  );

export const membershipExpiryEmail = (name: string, planName: string, endDate: string) =>
  wrapper(
    'Your membership is ending soon',
    p(`Hi ${esc(name)}, your <strong>${esc(planName)}</strong> membership ends on <strong>${esc(endDate)}</strong>. Renew from your dashboard to keep your streak going.`)
  );

export const passwordResetEmail = (resetUrl: string) =>
  wrapper(
    'Reset your password',
    p(`We received a request to reset your Living Yoga password. This link expires in 60 minutes.`) +
      `<a href="${esc(resetUrl)}" style="display:inline-block;background:#171717;color:#F7F2EA;padding:12px 24px;border-radius:999px;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:14px;">Reset password</a>`
  );
