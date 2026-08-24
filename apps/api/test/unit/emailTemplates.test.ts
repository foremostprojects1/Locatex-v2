import { describe, expect, it } from 'vitest';
import { TEMPLATE_NAMES, renderEmail } from '../../src/infrastructure/mail/templates.js';

const context = {
  appBaseUrl: 'https://locatex.in',
  brandName: 'LocateX',
  supportEmail: 'support@locatex.in',
};

describe('the transactional emails', () => {
  it('covers every template the system can ask for', () => {
    expect(TEMPLATE_NAMES).toHaveLength(12);
  });

  it('always produces a subject and both bodies', () => {
    for (const template of TEMPLATE_NAMES) {
      const rendered = renderEmail(template, {}, context);

      expect(rendered.subject.length, `${template} has no subject`).toBeGreaterThan(5);
      expect(rendered.html, `${template} has no html`).toContain('<html');
      // A message with no plain-text alternative scores worse with spam filters, and
      // Gmail's own sender guidance asks for one.
      expect(rendered.text.length, `${template} has no text part`).toBeGreaterThan(20);
    }
  });

  it('never renders "undefined" when a field is missing', () => {
    for (const template of TEMPLATE_NAMES) {
      const rendered = renderEmail(template, {}, context);
      expect(rendered.html, template).not.toContain('undefined');
      expect(rendered.text, template).not.toContain('undefined');
      expect(rendered.subject, template).not.toContain('undefined');
    }
  });

  it('escapes what a stranger typed, so a name cannot carry markup', () => {
    const rendered = renderEmail(
      'contact-received',
      { fullName: 'Admin', from: '<img src=x onerror=alert(1)>', subject: 'general', preview: 'hi' },
      context,
    );

    expect(rendered.html).not.toContain('<img src=x');
    expect(rendered.html).toContain('&lt;img src=x');
  });

  it('puts the one link that matters in both bodies', () => {
    const rendered = renderEmail(
      'verify-email',
      { fullName: 'Ramesh', url: 'https://locatex.in/verify-email?token=abc123' },
      context,
    );

    expect(rendered.html).toContain('https://locatex.in/verify-email?token=abc123');
    expect(rendered.text).toContain('https://locatex.in/verify-email?token=abc123');
    expect(rendered.subject).toBe('Confirm your email address');
  });

  it('carries the administrator’s reason to the broker verbatim', () => {
    const reason = 'The survey number does not match the 7/12 extract.';
    const rendered = renderEmail(
      'property-rejected',
      { fullName: 'Ramesh', title: 'Farmland near Morbi', reason, propertyId: 'ABC' },
      context,
    );

    expect(rendered.html).toContain('7/12');
    expect(rendered.text).toContain(reason);
    // And a way back in, so a rejection is a correction rather than a dead end.
    expect(rendered.html).toContain('/add-property?property=ABC');
  });

  /**
   * Only two templates are meant to carry a caller-supplied link. Every other one builds
   * its own from `appBaseUrl`, and must ignore a `url` it is handed — otherwise a
   * mis-addressed call could put a single-use reset token into an unrelated email.
   */
  it('ignores a link handed to a template that has none of its own', () => {
    const linkBearing = new Set(['verify-email', 'reset-password']);

    for (const template of TEMPLATE_NAMES) {
      if (linkBearing.has(template)) continue;
      const rendered = renderEmail(
        template,
        { url: 'https://locatex.in/reset-password?token=secret' },
        context,
      );
      expect(rendered.text, template).not.toContain('token=secret');
      expect(rendered.html, template).not.toContain('token=secret');
    }
  });
});
