import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateShareToken,
  validateShareToken,
  revokeShareToken,
  getTokenMetadata,
  clearTokenStore,
  type ShareOptions,
} from '@/lib/security/share-tokens';

describe('share-tokens', () => {
  beforeEach(() => {
    clearTokenStore();
    vi.restoreAllMocks();
  });

  // --- generateShareToken ---

  describe('generateShareToken', () => {
    it('returns a string token of length 48', () => {
      const token = generateShareToken('play-1', { permissions: 'view' });
      expect(typeof token).toBe('string');
      expect(token.length).toBe(48);
    });

    it('generates unique tokens for each call', () => {
      const t1 = generateShareToken('play-1', { permissions: 'view' });
      const t2 = generateShareToken('play-1', { permissions: 'view' });
      expect(t1).not.toBe(t2);
    });

    it('throws if playId is empty', () => {
      expect(() => generateShareToken('', { permissions: 'view' })).toThrow('playId is required');
    });

    it('stores metadata accessible via getTokenMetadata', () => {
      const token = generateShareToken('play-1', {
        permissions: 'edit',
        maxViews: 10,
        expiresIn: 3600_000,
      });
      const meta = getTokenMetadata(token);
      expect(meta).not.toBeNull();
      expect(meta!.playId).toBe('play-1');
      expect(meta!.permissions).toBe('edit');
      expect(meta!.maxViews).toBe(10);
      expect(meta!.expiresAt).not.toBeNull();
      expect(meta!.viewCount).toBe(0);
      expect(meta!.revoked).toBe(false);
    });

    it('sets expiresAt to null when expiresIn is not provided', () => {
      const token = generateShareToken('play-1', { permissions: 'view' });
      const meta = getTokenMetadata(token);
      expect(meta!.expiresAt).toBeNull();
    });

    it('stores password flag when password is provided', () => {
      const token = generateShareToken('play-1', {
        permissions: 'view',
        password: 'secret123',
      });
      const meta = getTokenMetadata(token);
      expect(meta!.hasPassword).toBe(true);
    });
  });

  // --- validateShareToken ---

  describe('validateShareToken', () => {
    it('validates a valid token successfully', () => {
      const token = generateShareToken('play-1', { permissions: 'view' });
      const result = validateShareToken(token);
      expect(result.valid).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.playId).toBe('play-1');
    });

    it('increments view count on each successful validation', () => {
      const token = generateShareToken('play-1', { permissions: 'view' });
      validateShareToken(token);
      validateShareToken(token);
      const result = validateShareToken(token);
      expect(result.metadata!.viewCount).toBe(3);
    });

    it('returns invalid for non-existent token', () => {
      const result = validateShareToken('non-existent-token');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('returns invalid for empty token', () => {
      const result = validateShareToken('');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('required');
    });

    it('returns invalid for expired token', () => {
      vi.useFakeTimers();
      const token = generateShareToken('play-1', {
        permissions: 'view',
        expiresIn: 1000, // 1 second
      });

      vi.advanceTimersByTime(2000); // advance 2 seconds past expiry

      const result = validateShareToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');

      vi.useRealTimers();
    });

    it('returns invalid when max views exceeded', () => {
      const token = generateShareToken('play-1', {
        permissions: 'view',
        maxViews: 2,
      });

      validateShareToken(token); // view 1
      validateShareToken(token); // view 2
      const result = validateShareToken(token); // view 3 - should fail
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Maximum views');
    });

    it('requires password when token has one', () => {
      const token = generateShareToken('play-1', {
        permissions: 'view',
        password: 'mypassword',
      });

      const noPassword = validateShareToken(token);
      expect(noPassword.valid).toBe(false);
      expect(noPassword.reason).toContain('Password is required');
    });

    it('validates correct password', () => {
      const token = generateShareToken('play-1', {
        permissions: 'view',
        password: 'mypassword',
      });

      const result = validateShareToken(token, 'mypassword');
      expect(result.valid).toBe(true);
    });

    it('rejects incorrect password', () => {
      const token = generateShareToken('play-1', {
        permissions: 'view',
        password: 'mypassword',
      });

      const result = validateShareToken(token, 'wrongpassword');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid password');
    });

    it('returns invalid for revoked token', () => {
      const token = generateShareToken('play-1', { permissions: 'view' });
      revokeShareToken(token);
      const result = validateShareToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('revoked');
    });
  });

  // --- revokeShareToken ---

  describe('revokeShareToken', () => {
    it('revokes an existing token and returns true', () => {
      const token = generateShareToken('play-1', { permissions: 'view' });
      const revoked = revokeShareToken(token);
      expect(revoked).toBe(true);

      const meta = getTokenMetadata(token);
      expect(meta!.revoked).toBe(true);
    });

    it('returns false for non-existent token', () => {
      const revoked = revokeShareToken('does-not-exist');
      expect(revoked).toBe(false);
    });
  });

  // --- getTokenMetadata ---

  describe('getTokenMetadata', () => {
    it('returns null for non-existent token', () => {
      expect(getTokenMetadata('nope')).toBeNull();
    });

    it('returns metadata without incrementing view count', () => {
      const token = generateShareToken('play-1', { permissions: 'comment' });
      const meta1 = getTokenMetadata(token);
      const meta2 = getTokenMetadata(token);
      expect(meta1!.viewCount).toBe(0);
      expect(meta2!.viewCount).toBe(0);
    });
  });
});
