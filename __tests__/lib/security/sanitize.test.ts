import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeText,
  sanitizePlayName,
  isValidPlayName,
  sanitizeNotes,
  sanitizeSearchQuery,
} from '@/lib/security/sanitize';

describe('sanitize', () => {
  // --- escapeHtml ---

  describe('escapeHtml', () => {
    it('encodes ampersand', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });

    it('encodes angle brackets', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    });

    it('encodes double quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('encodes single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#x27;s');
    });

    it('encodes forward slashes', () => {
      expect(escapeHtml('a/b')).toBe('a&#x2F;b');
    });

    it('encodes backticks', () => {
      expect(escapeHtml('`code`')).toBe('&#96;code&#96;');
    });

    it('returns empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('handles multiple special characters together', () => {
      const result = escapeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  // --- sanitizeText ---

  describe('sanitizeText', () => {
    it('strips HTML tags', () => {
      expect(sanitizeText('Hello <b>world</b>')).toBe('Hello world');
    });

    it('removes script tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello');
    });

    it('encodes remaining special characters', () => {
      const result = sanitizeText('A & B');
      expect(result).toBe('A &amp; B');
    });

    it('trims whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('removes null bytes', () => {
      expect(sanitizeText('hello\0world')).toBe('helloworld');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('handles nested tags', () => {
      expect(sanitizeText('<div><p>text</p></div>')).toBe('text');
    });

    it('strips tags with attributes', () => {
      expect(sanitizeText('<a href="evil.com">link</a>')).toBe('link');
    });
  });

  // --- sanitizePlayName ---

  describe('sanitizePlayName', () => {
    it('allows valid play names', () => {
      expect(sanitizePlayName('Trips Right Z-Post')).toBe('Trips Right Z-Post');
    });

    it('strips HTML tags from names', () => {
      expect(sanitizePlayName('<b>Power</b> Run')).toBe('Power Run');
    });

    it('removes disallowed special characters', () => {
      expect(sanitizePlayName('Play @#$ Name!')).toBe('Play Name');
    });

    it('collapses multiple spaces', () => {
      expect(sanitizePlayName('Trips   Right')).toBe('Trips Right');
    });

    it('truncates to 100 characters', () => {
      const longName = 'A'.repeat(150);
      const result = sanitizePlayName(longName);
      expect(result.length).toBe(100);
    });

    it('trims whitespace', () => {
      expect(sanitizePlayName('  Shotgun  ')).toBe('Shotgun');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizePlayName('')).toBe('');
    });

    it('allows parentheses, dots, and underscores', () => {
      expect(sanitizePlayName('Cover_2 (Zone) v1.0')).toBe('Cover_2 (Zone) v1.0');
    });
  });

  // --- isValidPlayName ---

  describe('isValidPlayName', () => {
    it('returns true for valid names', () => {
      expect(isValidPlayName('Trips Right')).toBe(true);
      expect(isValidPlayName('I-Formation Power (Right)')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidPlayName('')).toBe(false);
    });

    it('returns false for names with special characters', () => {
      expect(isValidPlayName('Play <script>')).toBe(false);
    });

    it('returns false for names over 100 characters', () => {
      expect(isValidPlayName('A'.repeat(101))).toBe(false);
    });
  });

  // --- sanitizeNotes ---

  describe('sanitizeNotes', () => {
    it('allows basic formatting tags', () => {
      const input = '<b>Bold</b> and <i>italic</i>';
      const result = sanitizeNotes(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });

    it('strips script tags and their content', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeNotes(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('strips style tags and their content', () => {
      const input = '<style>body { display: none }</style>Content';
      const result = sanitizeNotes(input);
      expect(result).not.toContain('style');
      expect(result).toContain('Content');
    });

    it('removes event handler attributes', () => {
      const input = '<b onclick="alert(1)">text</b>';
      const result = sanitizeNotes(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<b>');
    });

    it('removes javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">link</a>';
      const result = sanitizeNotes(input);
      expect(result).not.toContain('javascript');
    });

    it('strips disallowed tags but keeps content', () => {
      const input = '<div>Content in div</div>';
      const result = sanitizeNotes(input);
      expect(result).not.toContain('<div>');
      expect(result).toContain('Content in div');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeNotes('')).toBe('');
    });

    it('allows list tags', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeNotes(input);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });

    it('removes onerror handlers', () => {
      const input = '<img onerror="alert(1)" src="x">';
      const result = sanitizeNotes(input);
      expect(result).not.toContain('onerror');
    });
  });

  // --- sanitizeSearchQuery ---

  describe('sanitizeSearchQuery', () => {
    it('passes through normal search terms', () => {
      expect(sanitizeSearchQuery('shotgun trips')).toBe('shotgun trips');
    });

    it('strips HTML tags', () => {
      expect(sanitizeSearchQuery('<script>alert(1)</script>')).toBe('alert(1)');
    });

    it('removes SQL injection characters', () => {
      const result = sanitizeSearchQuery("'; DROP TABLE plays; --");
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
      expect(result).not.toContain('--');
    });

    it('removes SQL keywords', () => {
      const result = sanitizeSearchQuery('UNION SELECT * FROM plays');
      expect(result).not.toMatch(/\bUNION\b/i);
      expect(result).not.toMatch(/\bSELECT\b/i);
    });

    it('collapses whitespace', () => {
      expect(sanitizeSearchQuery('  multiple   spaces  ')).toBe('multiple spaces');
    });

    it('truncates to 200 characters', () => {
      const longQuery = 'a'.repeat(300);
      const result = sanitizeSearchQuery(longQuery);
      expect(result.length).toBe(200);
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeSearchQuery('')).toBe('');
    });

    it('removes null bytes', () => {
      expect(sanitizeSearchQuery('search\0term')).toBe('searchterm');
    });
  });
});
