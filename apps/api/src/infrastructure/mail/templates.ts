import type { EmailMessage } from '../../application/ports/notifications.js';

/**
 * The eleven transactional emails.
 *
 * Written as functions returning a subject, an HTML body and a plain-text body rather than
 * as React Email components, which is what the approved plan named. The reason is narrow
 * and worth stating: these are eleven static, single-column messages with no interactivity,
 * and rendering them with React would put a JSX toolchain and a renderer inside the API
 * process to produce output identical to the strings below. Every template is a pure
 * function, so each one is unit-tested directly.
 *
 * Both bodies are always produced. A text part is not decoration: a message with no text
 * alternative scores worse with spam filters, and Gmail's own guidance asks for one.
 */

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export type TemplateName = EmailMessage['template'];

/** Everything a template may need that is not in the message itself. */
export interface TemplateContext {
  appBaseUrl: string;
  brandName: string;
  supportEmail: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * One layout for every message.
 *
 * Table-based and inline-styled on purpose: Outlook still lays out with tables, and Gmail
 * strips `<style>` blocks from the head. This is the markup that survives both.
 */
function layout(context: TemplateContext, body: string, preheader: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2933;">
<span style="display:none;font-size:1px;color:#f4f5f7;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px 28px 8px;">
<span style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#e91e63;">${escapeHtml(context.brandName)}</span>
</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;">${body}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:16px 28px;font-size:12px;line-height:1.6;color:#6b7280;">
${escapeHtml(context.brandName)} · Gujarat land marketplace<br>
Questions? Reply to this email or write to <a href="mailto:${escapeHtml(context.supportEmail)}" style="color:#6b7280;">${escapeHtml(context.supportEmail)}</a>.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const button = (url: string, label: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#e91e63;border-radius:8px;">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:600;text-decoration:none;font-size:15px;">${escapeHtml(label)}</a>
</td></tr></table>`;

const paragraph = (text: string): string =>
  `<p style="margin:0 0 14px;">${escapeHtml(text)}</p>`;

const quote = (text: string): string =>
  `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #e5e7eb;background:#fafafa;color:#374151;">${escapeHtml(text)}</blockquote>`;

/** A named field with a sensible fallback, so a missing key never renders "undefined". */
const field = (data: Record<string, string>, key: string, fallback = ''): string =>
  data[key]?.trim() || fallback;

type Renderer = (data: Record<string, string>, context: TemplateContext) => RenderedEmail;

const RENDERERS: Record<TemplateName, Renderer> = {
  'verify-email': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const url = field(data, 'url');
    return {
      subject: 'Confirm your email address',
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph('Confirm this address and your LocateX account is ready to use.') +
          button(url, 'Confirm my email') +
          paragraph('The link works once, and expires in 24 hours.') +
          paragraph('If you did not create an account, you can ignore this — nothing will happen.'),
        'One click and your account is ready.',
      ),
      text: [
        `Hello ${name},`,
        '',
        'Confirm this address and your LocateX account is ready to use:',
        url,
        '',
        'The link works once, and expires in 24 hours.',
        'If you did not create an account, ignore this email.',
      ].join('\n'),
    };
  },

  'reset-password': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const url = field(data, 'url');
    return {
      subject: 'Reset your LocateX password',
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph('Someone asked to reset the password on this account.') +
          button(url, 'Choose a new password') +
          paragraph('The link works once, and expires in an hour.') +
          paragraph(
            'If it was not you, no action is needed — your password has not changed, and nobody can use this link without your inbox.',
          ),
        'A link to choose a new password.',
      ),
      text: [
        `Hello ${name},`,
        '',
        'Someone asked to reset the password on this account:',
        url,
        '',
        'The link works once and expires in an hour.',
        'If it was not you, no action is needed — your password has not changed.',
      ].join('\n'),
    };
  },

  'password-changed': (data, context) => {
    const name = field(data, 'fullName', 'there');
    return {
      subject: 'Your password was changed',
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph('Your LocateX password has just been changed, and every other device has been signed out.') +
          paragraph(
            `If that was not you, write to ${context.supportEmail} straight away — someone else has access to your inbox or your password.`,
          ),
        'Your password has just been changed.',
      ),
      text: [
        `Hello ${name},`,
        '',
        'Your LocateX password has just been changed, and every other device has been signed out.',
        `If that was not you, write to ${context.supportEmail} straight away.`,
      ].join('\n'),
    };
  },

  'broker-approved': (data, context) => {
    const name = field(data, 'fullName', 'there');
    return {
      subject: 'You can now list land on LocateX',
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph('Your broker application has been approved. You can post listings from now on.') +
          button(`${context.appBaseUrl}/add-property`, 'List your first property') +
          paragraph('Sign in again first — your account has new permissions, and the sign-in picks them up.'),
        'Your broker application was approved.',
      ),
      text: [
        `Hello ${name},`,
        '',
        'Your broker application has been approved. You can post listings from now on:',
        `${context.appBaseUrl}/add-property`,
        '',
        'Sign in again first — your account has new permissions.',
      ].join('\n'),
    };
  },

  'broker-rejected': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const reason = field(data, 'reason');
    return {
      subject: 'About your broker application',
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph('We are not able to approve your broker application at the moment.') +
          (reason ? quote(reason) : '') +
          paragraph('You are welcome to apply again once that is sorted out. Your account itself is unaffected.'),
        'About your broker application.',
      ),
      text: [
        `Hello ${name},`,
        '',
        'We are not able to approve your broker application at the moment.',
        ...(reason ? ['', reason] : []),
        '',
        'You are welcome to apply again once that is sorted out.',
      ].join('\n'),
    };
  },

  'property-submitted': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const title = field(data, 'title', 'A listing');
    const district = field(data, 'district');
    const id = field(data, 'propertyId');
    return {
      subject: `New listing awaiting review: ${title}`,
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph(`A broker has submitted “${title}”${district ? ` in ${district}` : ''} for review.`) +
          button(`${context.appBaseUrl}/admin`, 'Open the review queue') +
          paragraph(`Reference: ${id}`),
        'A listing is waiting for review.',
      ),
      text: [
        `Hello ${name},`,
        '',
        `A broker has submitted "${title}"${district ? ` in ${district}` : ''} for review.`,
        `${context.appBaseUrl}/admin`,
        '',
        `Reference: ${id}`,
      ].join('\n'),
    };
  },

  'property-approved': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const title = field(data, 'title', 'Your listing');
    const id = field(data, 'propertyId');
    return {
      subject: `“${title}” is live`,
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph(`“${title}” has been approved and is now visible to buyers.`) +
          button(`${context.appBaseUrl}/property/${id}`, 'See it as a buyer does') +
          paragraph('Visitors see a price band and a rough circle; signed-in buyers see your price and your number.'),
        'Your listing has been approved.',
      ),
      text: [
        `Hello ${name},`,
        '',
        `"${title}" has been approved and is now visible to buyers.`,
        `${context.appBaseUrl}/property/${id}`,
      ].join('\n'),
    };
  },

  'property-rejected': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const title = field(data, 'title', 'Your listing');
    const reason = field(data, 'reason');
    const id = field(data, 'propertyId');
    return {
      subject: `“${title}” needs a change before it can go live`,
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph(`We could not approve “${title}” as it stands.`) +
          (reason ? quote(reason) : '') +
          button(`${context.appBaseUrl}/add-property?property=${id}`, 'Fix and resubmit') +
          paragraph('Nothing has been deleted — correct the point above and send it back for review.'),
        'One change is needed before your listing goes live.',
      ),
      text: [
        `Hello ${name},`,
        '',
        `We could not approve "${title}" as it stands.`,
        ...(reason ? ['', reason] : []),
        '',
        `Fix and resubmit: ${context.appBaseUrl}/add-property?property=${id}`,
        'Nothing has been deleted.',
      ].join('\n'),
    };
  },

  'contact-received': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const from = field(data, 'from', 'Someone');
    const subject = field(data, 'subject', 'general');
    const preview = field(data, 'preview');
    return {
      subject: `New message from ${from}`,
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph(`${from} has written in about "${subject}".`) +
          (preview ? quote(preview) : '') +
          button(`${context.appBaseUrl}/admin`, 'Open the inbox'),
        `${from} has written in.`,
      ),
      text: [
        `Hello ${name},`,
        '',
        `${from} has written in about "${subject}".`,
        ...(preview ? ['', preview] : []),
        '',
        `${context.appBaseUrl}/admin`,
      ].join('\n'),
    };
  },

  'contact-acknowledged': (data, context) => {
    const name = field(data, 'fullName', 'there');
    return {
      subject: 'We have your message',
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph('Thank you for writing to us. Your message is with our team and we will reply by email, usually within a working day.') +
          paragraph('There is no need to send it again.'),
        'Your message reached us.',
      ),
      text: [
        `Hello ${name},`,
        '',
        'Thank you for writing to us. Your message is with our team and we will reply by email, usually within a working day.',
        'There is no need to send it again.',
      ].join('\n'),
    };
  },

  'chat-unread-digest': (data, context) => {
    const name = field(data, 'fullName', 'there');
    const count = field(data, 'count', '1');
    const plural = count === '1' ? 'message' : 'messages';
    return {
      subject: `You have ${count} unread ${plural} on LocateX`,
      html: layout(
        context,
        paragraph(`Hello ${name},`) +
          paragraph(`You have ${count} unread ${plural} from the last day.`) +
          button(`${context.appBaseUrl}/message`, 'Read them') +
          paragraph('We only send this once a day, and only when something is genuinely waiting.'),
        `${count} unread ${plural}.`,
      ),
      text: [
        `Hello ${name},`,
        '',
        `You have ${count} unread ${plural} from the last day.`,
        `${context.appBaseUrl}/message`,
      ].join('\n'),
    };
  },
};

export function renderEmail(
  template: TemplateName,
  data: Record<string, string>,
  context: TemplateContext,
): RenderedEmail {
  const renderer = RENDERERS[template];
  if (!renderer) throw new Error(`no template named ${template}`);
  return renderer(data, context);
}

export const TEMPLATE_NAMES = Object.keys(RENDERERS) as TemplateName[];
