import { describe, it, expect } from 'vitest';
import {
  generateCSPHeader,
  generateNonce,
  validateCSP,
  SecurityHeaders,
} from '@/lib/security/csp';

describe('csp', () => {
  // --- SecurityHeaders ---

  describe('SecurityHeaders', () => {
    it('has X-Frame-Options set to DENY', () => {
      expect(SecurityHeaders['X-Frame-Options']).toBe('DENY');
    });

    it('has X-Content-Type-Options set to nosniff', () => {
      expect(SecurityHeaders['X-Content-Type-Options']).toBe('nosniff');
    });

    it('has Referrer-Policy set', () => {
      expect(SecurityHeaders['Referrer-Policy']).toBe(
        'strict-origin-when-cross-origin',
      );
    });

    it('has Permissions-Policy blocking sensitive features', () => {
      const policy = SecurityHeaders['Permissions-Policy'];
      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
    });

    it('has Strict-Transport-Security with includeSubDomains', () => {
      const hsts = SecurityHeaders['Strict-Transport-Security'];
      expect(hsts).toContain('max-age=');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('has X-XSS-Protection enabled', () => {
      expect(SecurityHeaders['X-XSS-Protection']).toBe('1; mode=block');
    });
  });

  // --- generateCSPHeader ---

  describe('generateCSPHeader', () => {
    it('generates a production CSP with strict directives', () => {
      const csp = generateCSPHeader('production');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('production CSP does not contain unsafe-eval', () => {
      const csp = generateCSPHeader('production');
      expect(csp).not.toContain('unsafe-eval');
    });

    it('production CSP does not contain unsafe-inline', () => {
      const csp = generateCSPHeader('production');
      expect(csp).not.toContain('unsafe-inline');
    });

    it('production CSP allows Supabase connections', () => {
      const csp = generateCSPHeader('production');
      expect(csp).toContain('https://*.supabase.co');
    });

    it('production CSP allows data: and blob: for images', () => {
      const csp = generateCSPHeader('production');
      expect(csp).toContain('img-src');
      expect(csp).toContain('data:');
      expect(csp).toContain('blob:');
    });

    it('generates a development CSP with relaxed directives', () => {
      const csp = generateCSPHeader('development');
      expect(csp).toContain("'unsafe-eval'");
      expect(csp).toContain("'unsafe-inline'");
    });

    it('development CSP allows localhost connections', () => {
      const csp = generateCSPHeader('development');
      expect(csp).toContain('http://localhost:*');
      expect(csp).toContain('ws://localhost:*');
    });

    it('development CSP allows self for frame-ancestors', () => {
      const csp = generateCSPHeader('development');
      expect(csp).toContain("frame-ancestors 'self'");
    });

    it('includes nonce in production script-src when provided', () => {
      const nonce = 'abc123';
      const csp = generateCSPHeader('production', nonce);
      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it('includes nonce in production style-src when provided', () => {
      const nonce = 'xyz789';
      const csp = generateCSPHeader('production', nonce);
      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it('includes strict-dynamic in production script-src', () => {
      const csp = generateCSPHeader('production');
      expect(csp).toContain("'strict-dynamic'");
    });

    it('throws for invalid environment', () => {
      expect(() =>
        generateCSPHeader('staging' as 'production'),
      ).toThrow('Invalid environment');
    });
  });

  // --- generateNonce ---

  describe('generateNonce', () => {
    it('generates a 32-character nonce', () => {
      const nonce = generateNonce();
      expect(nonce.length).toBe(32);
    });

    it('generates alphanumeric characters only', () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('generates unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('is non-empty', () => {
      const nonce = generateNonce();
      expect(nonce.length).toBeGreaterThan(0);
    });
  });

  // --- validateCSP ---

  describe('validateCSP', () => {
    it('validates a correct CSP string', () => {
      const csp = "default-src 'self'; script-src 'self'; style-src 'self'";
      const result = validateCSP(csp);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns directives found in the CSP', () => {
      const csp = "default-src 'self'; script-src 'self' 'strict-dynamic'";
      const result = validateCSP(csp);
      expect(result.directives).toContain('default-src');
      expect(result.directives).toContain('script-src');
    });

    it('flags unknown directives as errors', () => {
      const csp = "default-src 'self'; fake-directive 'self'";
      const result = validateCSP(csp);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown directive: fake-directive');
    });

    it('warns about unsafe-inline in script-src', () => {
      const csp = "script-src 'self' 'unsafe-inline'";
      const result = validateCSP(csp);
      expect(result.warnings.some((w) => w.includes('unsafe-inline'))).toBe(true);
    });

    it('warns about unsafe-eval in script-src', () => {
      const csp = "script-src 'self' 'unsafe-eval'";
      const result = validateCSP(csp);
      expect(result.warnings.some((w) => w.includes('unsafe-eval'))).toBe(true);
    });

    it('warns about wildcard sources', () => {
      const csp = "default-src *";
      const result = validateCSP(csp);
      expect(result.warnings.some((w) => w.includes('wildcard'))).toBe(true);
    });

    it('warns about missing default-src', () => {
      const csp = "script-src 'self'";
      const result = validateCSP(csp);
      expect(result.warnings.some((w) => w.includes('default-src'))).toBe(true);
    });

    it('returns invalid for empty CSP', () => {
      const result = validateCSP('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CSP string is empty');
    });

    it('validates the generated production CSP', () => {
      const csp = generateCSPHeader('production');
      const result = validateCSP(csp);
      expect(result.valid).toBe(true);
    });

    it('validates the generated development CSP with warnings', () => {
      const csp = generateCSPHeader('development');
      const result = validateCSP(csp);
      expect(result.valid).toBe(true);
      // Dev CSP has unsafe-inline and unsafe-eval warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
