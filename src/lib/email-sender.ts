/**
 * Email Play/Playbook (#289)
 *
 * Compose, validate, and preview emails containing plays and playbooks.
 */

import type { Play } from '@/types';

// ---- Types ----

export interface EmailAttachment {
  name: string;
  type: string;
  data: string; // base64-encoded data
}

export interface EmailData {
  to: string[];
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

// ---- Constants ----

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 50;

// ---- Public API ----

/**
 * Validate a list of email recipient addresses.
 * Returns an object with valid emails, invalid emails, and overall validity.
 */
export function validateEmailRecipients(
  emails: string[],
): { valid: boolean; validEmails: string[]; invalidEmails: string[]; error?: string } {
  if (emails.length === 0) {
    return {
      valid: false,
      validEmails: [],
      invalidEmails: [],
      error: 'At least one recipient is required',
    };
  }

  if (emails.length > MAX_RECIPIENTS) {
    return {
      valid: false,
      validEmails: [],
      invalidEmails: [],
      error: `Maximum ${MAX_RECIPIENTS} recipients allowed`,
    };
  }

  const validEmails: string[] = [];
  const invalidEmails: string[] = [];

  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (EMAIL_REGEX.test(trimmed)) {
      validEmails.push(trimmed);
    } else {
      invalidEmails.push(email);
    }
  }

  return {
    valid: invalidEmails.length === 0,
    validEmails,
    invalidEmails,
    error: invalidEmails.length > 0
      ? `Invalid email addresses: ${invalidEmails.join(', ')}`
      : undefined,
  };
}

/**
 * Compose an email containing a single play.
 */
export function composePlayEmail(
  play: Play,
  recipients: string[],
  message?: string,
): EmailData {
  const validation = validateEmailRecipients(recipients);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid recipients');
  }

  const subject = `Play: ${play.name}`;
  const playDetails = [
    `Play: ${play.name}`,
    `Formation: ${play.formationId}`,
    play.category ? `Category: ${play.category}` : null,
    play.personnel ? `Personnel: ${play.personnel}` : null,
    play.tags.length > 0 ? `Tags: ${play.tags.join(', ')}` : null,
    play.notes ? `\nNotes: ${play.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const body = message
    ? `${message}\n\n---\n\n${playDetails}`
    : playDetails;

  return {
    to: validation.validEmails,
    subject,
    body,
  };
}

/**
 * Compose an email containing multiple plays (a playbook).
 */
export function composePlaybookEmail(
  plays: Play[],
  recipients: string[],
  subject: string,
): EmailData {
  const validation = validateEmailRecipients(recipients);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid recipients');
  }

  if (plays.length === 0) {
    throw new Error('At least one play is required');
  }

  if (!subject || subject.trim() === '') {
    throw new Error('Subject is required');
  }

  const playList = plays
    .map((play, index) => {
      const parts = [
        `${index + 1}. ${play.name}`,
        `   Formation: ${play.formationId}`,
        play.category ? `   Category: ${play.category}` : null,
        play.personnel ? `   Personnel: ${play.personnel}` : null,
        play.notes ? `   Notes: ${play.notes}` : null,
      ];
      return parts.filter(Boolean).join('\n');
    })
    .join('\n\n');

  const body = `Playbook containing ${plays.length} play${plays.length === 1 ? '' : 's'}:\n\n${playList}`;

  return {
    to: validation.validEmails,
    subject,
    body,
  };
}

/**
 * Generate an HTML preview of an EmailData object.
 */
export function generateEmailPreview(emailData: EmailData): string {
  const escapedTo = emailData.to
    .map((e) => e.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join(', ');
  const escapedSubject = emailData.subject
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const escapedBody = emailData.body
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const attachmentSection =
    emailData.attachments && emailData.attachments.length > 0
      ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <strong>Attachments:</strong>
        <ul>${emailData.attachments.map((a) => `<li>${a.name} (${a.type})</li>`).join('')}</ul>
      </div>`
      : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Email Preview</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
    <div style="margin-bottom: 8px;"><strong>To:</strong> ${escapedTo}</div>
    <div><strong>Subject:</strong> ${escapedSubject}</div>
  </div>
  <div style="padding: 16px; line-height: 1.6;">
    ${escapedBody}
  </div>
  ${attachmentSection}
</body>
</html>`;
}
