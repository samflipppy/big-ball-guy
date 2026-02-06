import { describe, it, expect } from 'vitest';
import type { Play } from '@/types';
import {
  validateEmailRecipients,
  composePlayEmail,
  composePlaybookEmail,
  generateEmailPreview,
  type EmailData,
} from '@/lib/email-sender';

// ---- Test helpers ----

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'HB Dive',
    formationId: 'form-i-right',
    assignments: [],
    tags: ['run', 'short-yardage'],
    personnel: '21',
    teamId: 'team-1',
    category: 'Run',
    notes: 'Quick hitter up the middle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('email-sender', () => {
  describe('validateEmailRecipients', () => {
    it('validates correct email addresses', () => {
      const result = validateEmailRecipients(['coach@school.edu', 'oc@team.com']);
      expect(result.valid).toBe(true);
      expect(result.validEmails.length).toBe(2);
      expect(result.invalidEmails.length).toBe(0);
    });

    it('rejects invalid email addresses', () => {
      const result = validateEmailRecipients(['not-an-email', 'also@bad']);
      expect(result.valid).toBe(false);
      expect(result.invalidEmails.length).toBe(2);
    });

    it('separates valid and invalid emails', () => {
      const result = validateEmailRecipients(['good@email.com', 'bad-email', 'ok@test.org']);
      expect(result.valid).toBe(false);
      expect(result.validEmails).toEqual(['good@email.com', 'ok@test.org']);
      expect(result.invalidEmails).toEqual(['bad-email']);
    });

    it('returns an error when no recipients are provided', () => {
      const result = validateEmailRecipients([]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('At least one recipient');
    });

    it('returns an error when exceeding max recipients', () => {
      const emails = Array.from({ length: 51 }, (_, i) => `user${i}@test.com`);
      const result = validateEmailRecipients(emails);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum');
    });

    it('normalizes emails to lowercase', () => {
      const result = validateEmailRecipients(['Coach@School.EDU']);
      expect(result.validEmails[0]).toBe('coach@school.edu');
    });

    it('trims whitespace from emails', () => {
      const result = validateEmailRecipients(['  coach@school.edu  ']);
      expect(result.validEmails[0]).toBe('coach@school.edu');
    });

    it('includes error message listing invalid emails', () => {
      const result = validateEmailRecipients(['nope', 'valid@test.com', 'alsonope']);
      expect(result.error).toContain('nope');
      expect(result.error).toContain('alsonope');
    });
  });

  describe('composePlayEmail', () => {
    it('creates email data with play name in subject', () => {
      const play = makePlay({ name: 'Sweep Left' });
      const email = composePlayEmail(play, ['coach@test.com']);
      expect(email.subject).toContain('Sweep Left');
    });

    it('includes play details in the body', () => {
      const play = makePlay({ name: 'Power Right', formationId: 'form-1', personnel: '21' });
      const email = composePlayEmail(play, ['coach@test.com']);
      expect(email.body).toContain('Power Right');
      expect(email.body).toContain('form-1');
      expect(email.body).toContain('21');
    });

    it('includes custom message when provided', () => {
      const play = makePlay();
      const email = composePlayEmail(play, ['coach@test.com'], 'Check out this play!');
      expect(email.body).toContain('Check out this play!');
    });

    it('includes tags in the body', () => {
      const play = makePlay({ tags: ['passing', 'redzone'] });
      const email = composePlayEmail(play, ['coach@test.com']);
      expect(email.body).toContain('passing');
      expect(email.body).toContain('redzone');
    });

    it('includes notes in the body', () => {
      const play = makePlay({ notes: 'Run this on 3rd and short' });
      const email = composePlayEmail(play, ['coach@test.com']);
      expect(email.body).toContain('Run this on 3rd and short');
    });

    it('throws for invalid recipients', () => {
      const play = makePlay();
      expect(() => composePlayEmail(play, ['bad-email'])).toThrow();
    });

    it('sets correct recipients', () => {
      const play = makePlay();
      const email = composePlayEmail(play, ['a@test.com', 'b@test.com']);
      expect(email.to).toEqual(['a@test.com', 'b@test.com']);
    });

    it('includes category when present', () => {
      const play = makePlay({ category: 'Run' });
      const email = composePlayEmail(play, ['c@test.com']);
      expect(email.body).toContain('Category: Run');
    });
  });

  describe('composePlaybookEmail', () => {
    it('creates email with all plays listed', () => {
      const plays = [makePlay({ name: 'Play A' }), makePlay({ name: 'Play B' })];
      const email = composePlaybookEmail(plays, ['coach@test.com'], 'Playbook');
      expect(email.body).toContain('Play A');
      expect(email.body).toContain('Play B');
    });

    it('includes play count in body', () => {
      const plays = [makePlay(), makePlay(), makePlay()];
      const email = composePlaybookEmail(plays, ['coach@test.com'], 'Weekly Playbook');
      expect(email.body).toContain('3 plays');
    });

    it('uses the provided subject', () => {
      const email = composePlaybookEmail([makePlay()], ['c@test.com'], 'Game Week 5');
      expect(email.subject).toBe('Game Week 5');
    });

    it('throws for empty plays array', () => {
      expect(() => composePlaybookEmail([], ['c@test.com'], 'Test')).toThrow('At least one play');
    });

    it('throws for empty subject', () => {
      expect(() => composePlaybookEmail([makePlay()], ['c@test.com'], '')).toThrow('Subject is required');
    });

    it('throws for invalid recipients', () => {
      expect(() => composePlaybookEmail([makePlay()], ['bad'], 'Test')).toThrow();
    });

    it('numbers each play in the listing', () => {
      const plays = [makePlay({ name: 'First' }), makePlay({ name: 'Second' })];
      const email = composePlaybookEmail(plays, ['c@test.com'], 'Plays');
      expect(email.body).toContain('1. First');
      expect(email.body).toContain('2. Second');
    });

    it('includes formation IDs per play', () => {
      const plays = [makePlay({ formationId: 'shotgun-trips' })];
      const email = composePlaybookEmail(plays, ['c@test.com'], 'Plays');
      expect(email.body).toContain('shotgun-trips');
    });
  });

  describe('generateEmailPreview', () => {
    it('returns valid HTML', () => {
      const emailData: EmailData = {
        to: ['coach@test.com'],
        subject: 'Test Subject',
        body: 'Test body content',
      };
      const html = generateEmailPreview(emailData);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('includes the recipient in the preview', () => {
      const emailData: EmailData = {
        to: ['coach@example.com'],
        subject: 'Subject',
        body: 'Body',
      };
      const html = generateEmailPreview(emailData);
      expect(html).toContain('coach@example.com');
    });

    it('includes the subject in the preview', () => {
      const emailData: EmailData = {
        to: ['c@test.com'],
        subject: 'Game Plan for Friday',
        body: 'Body',
      };
      const html = generateEmailPreview(emailData);
      expect(html).toContain('Game Plan for Friday');
    });

    it('converts newlines to <br> tags in the body', () => {
      const emailData: EmailData = {
        to: ['c@test.com'],
        subject: 'Test',
        body: 'Line 1\nLine 2\nLine 3',
      };
      const html = generateEmailPreview(emailData);
      expect(html).toContain('<br>');
    });

    it('escapes HTML special characters', () => {
      const emailData: EmailData = {
        to: ['c@test.com'],
        subject: '<script>alert("xss")</script>',
        body: 'Body with <tags>',
      };
      const html = generateEmailPreview(emailData);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('shows attachments when present', () => {
      const emailData: EmailData = {
        to: ['c@test.com'],
        subject: 'Test',
        body: 'Body',
        attachments: [
          { name: 'play.png', type: 'image/png', data: 'base64data' },
        ],
      };
      const html = generateEmailPreview(emailData);
      expect(html).toContain('play.png');
      expect(html).toContain('Attachments');
    });

    it('does not show attachment section when no attachments', () => {
      const emailData: EmailData = {
        to: ['c@test.com'],
        subject: 'Test',
        body: 'Body',
      };
      const html = generateEmailPreview(emailData);
      expect(html).not.toContain('Attachments');
    });

    it('includes multiple recipients', () => {
      const emailData: EmailData = {
        to: ['a@test.com', 'b@test.com'],
        subject: 'Test',
        body: 'Body',
      };
      const html = generateEmailPreview(emailData);
      expect(html).toContain('a@test.com');
      expect(html).toContain('b@test.com');
    });
  });
});
