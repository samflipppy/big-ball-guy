import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCSRFToken,
  validateCSRFToken,
  CSRFMiddleware,
  revokeCSRFToken,
  clearCSRFTokens,
  CSRF_HEADER_NAME,
  CSRF_COOKIE_NAME,
  CSRF_TOKEN_LENGTH,
  type CSRFMiddlewareRequest,
} from '@/lib/security/csrf';

describe('csrf', () => {
  beforeEach(() => {
    clearCSRFTokens();
  });

  // --- generateCSRFToken ---

  describe('generateCSRFToken', () => {
    it('generates a token of the expected length', () => {
      const token = generateCSRFToken('session-1');
      expect(token.length).toBe(CSRF_TOKEN_LENGTH);
    });

    it('generates unique tokens each call', () => {
      const t1 = generateCSRFToken('session-1');
      const t2 = generateCSRFToken('session-1');
      expect(t1).not.toBe(t2);
    });

    it('works without a session token parameter', () => {
      const token = generateCSRFToken();
      expect(token.length).toBe(CSRF_TOKEN_LENGTH);
    });

    it('generates only alphanumeric characters', () => {
      const token = generateCSRFToken('session-1');
      expect(token).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  // --- validateCSRFToken ---

  describe('validateCSRFToken', () => {
    it('validates a token with its correct session', () => {
      const token = generateCSRFToken('session-1');
      const result = validateCSRFToken(token, 'session-1');
      expect(result.valid).toBe(true);
    });

    it('rejects a token with wrong session', () => {
      const token = generateCSRFToken('session-1');
      const result = validateCSRFToken(token, 'session-2');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('does not match');
    });

    it('rejects an empty token', () => {
      const result = validateCSRFToken('', 'session-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('missing');
    });

    it('rejects an empty session token', () => {
      const token = generateCSRFToken('session-1');
      const result = validateCSRFToken(token, '');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('missing');
    });

    it('rejects a non-existent token', () => {
      const result = validateCSRFToken('fake-token', 'session-1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not found');
    });
  });

  // --- CSRFMiddleware ---

  describe('CSRFMiddleware', () => {
    it('allows GET requests without CSRF token', () => {
      const request: CSRFMiddlewareRequest = {
        method: 'GET',
        headers: {},
      };
      const result = CSRFMiddleware(request);
      expect(result.allowed).toBe(true);
    });

    it('allows HEAD requests without CSRF token', () => {
      const request: CSRFMiddlewareRequest = {
        method: 'HEAD',
        headers: {},
      };
      expect(CSRFMiddleware(request).allowed).toBe(true);
    });

    it('allows OPTIONS requests without CSRF token', () => {
      const request: CSRFMiddlewareRequest = {
        method: 'OPTIONS',
        headers: {},
      };
      expect(CSRFMiddleware(request).allowed).toBe(true);
    });

    it('blocks POST without CSRF header', () => {
      const request: CSRFMiddlewareRequest = {
        method: 'POST',
        headers: {},
        cookies: { [CSRF_COOKIE_NAME]: 'some-token' },
      };
      const result = CSRFMiddleware(request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing CSRF token in header');
    });

    it('blocks POST without CSRF cookie', () => {
      const token = generateCSRFToken('session-1');
      const request: CSRFMiddlewareRequest = {
        method: 'POST',
        headers: { [CSRF_HEADER_NAME]: token },
        cookies: {},
      };
      const result = CSRFMiddleware(request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing CSRF token in cookie');
    });

    it('blocks POST when header and cookie tokens differ', () => {
      const token = generateCSRFToken('session-1');
      const request: CSRFMiddlewareRequest = {
        method: 'POST',
        headers: { [CSRF_HEADER_NAME]: token },
        cookies: { [CSRF_COOKIE_NAME]: 'different-token' },
      };
      const result = CSRFMiddleware(request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('mismatch');
    });

    it('allows POST with matching header and cookie tokens', () => {
      const token = generateCSRFToken('session-1');
      const request: CSRFMiddlewareRequest = {
        method: 'POST',
        headers: { [CSRF_HEADER_NAME]: token },
        cookies: { [CSRF_COOKIE_NAME]: token },
      };
      const result = CSRFMiddleware(request);
      expect(result.allowed).toBe(true);
    });

    it('validates PUT requests the same as POST', () => {
      const token = generateCSRFToken('session-1');
      const request: CSRFMiddlewareRequest = {
        method: 'PUT',
        headers: { [CSRF_HEADER_NAME]: token },
        cookies: { [CSRF_COOKIE_NAME]: token },
      };
      expect(CSRFMiddleware(request).allowed).toBe(true);
    });

    it('validates DELETE requests the same as POST', () => {
      const request: CSRFMiddlewareRequest = {
        method: 'DELETE',
        headers: {},
        cookies: {},
      };
      expect(CSRFMiddleware(request).allowed).toBe(false);
    });

    it('validates PATCH requests', () => {
      const token = generateCSRFToken('session-1');
      const request: CSRFMiddlewareRequest = {
        method: 'PATCH',
        headers: { [CSRF_HEADER_NAME]: token },
        cookies: { [CSRF_COOKIE_NAME]: token },
      };
      expect(CSRFMiddleware(request).allowed).toBe(true);
    });

    it('is case-insensitive for HTTP methods', () => {
      const request: CSRFMiddlewareRequest = {
        method: 'get',
        headers: {},
      };
      expect(CSRFMiddleware(request).allowed).toBe(true);
    });
  });

  // --- revokeCSRFToken ---

  describe('revokeCSRFToken', () => {
    it('revokes an existing token', () => {
      const token = generateCSRFToken('session-1');
      const revoked = revokeCSRFToken(token);
      expect(revoked).toBe(true);

      // Token should no longer validate
      const result = validateCSRFToken(token, 'session-1');
      expect(result.valid).toBe(false);
    });

    it('returns false for non-existent token', () => {
      expect(revokeCSRFToken('nope')).toBe(false);
    });
  });
});
