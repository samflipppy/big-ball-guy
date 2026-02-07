import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateApiKey,
  rotateApiKey,
  validateApiKey,
  revokeApiKey,
  getActiveKeys,
  clearKeyStore,
  getKeyStore,
} from '@/lib/security/api-keys';
import type { ApiKey } from '@/lib/security/api-keys';

describe('api-keys', () => {
  beforeEach(() => {
    clearKeyStore();
  });

  // --- generateApiKey ---

  describe('generateApiKey', () => {
    it('generates a key with bbg_ prefix', () => {
      const key = generateApiKey('team-1', 'My Key', ['read']);
      expect(key.key).toMatch(/^bbg_/);
    });

    it('creates a key with correct properties', () => {
      const key = generateApiKey('team-1', 'Test Key', ['read', 'write']);
      expect(key.teamId).toBe('team-1');
      expect(key.name).toBe('Test Key');
      expect(key.permissions).toEqual(['read', 'write']);
      expect(key.isActive).toBe(true);
      expect(key.lastUsedAt).toBeNull();
      expect(key.id).toMatch(/^key_/);
      expect(key.createdAt).toBeTruthy();
      expect(key.expiresAt).toBeTruthy();
    });

    it('stores the key in the internal store', () => {
      const key = generateApiKey('team-1', 'Stored Key', ['read']);
      expect(getKeyStore().has(key.id)).toBe(true);
    });

    it('generates unique keys each time', () => {
      const key1 = generateApiKey('team-1', 'Key 1', ['read']);
      const key2 = generateApiKey('team-1', 'Key 2', ['read']);
      expect(key1.id).not.toBe(key2.id);
      expect(key1.key).not.toBe(key2.key);
    });

    it('throws if teamId is empty', () => {
      expect(() => generateApiKey('', 'Name', ['read'])).toThrow('teamId is required');
    });

    it('throws if name is empty', () => {
      expect(() => generateApiKey('team-1', '', ['read'])).toThrow('name is required');
    });

    it('throws if name is only whitespace', () => {
      expect(() => generateApiKey('team-1', '   ', ['read'])).toThrow('name is required');
    });

    it('throws if permissions array is empty', () => {
      expect(() => generateApiKey('team-1', 'Name', [])).toThrow(
        'At least one permission is required',
      );
    });

    it('trims the name', () => {
      const key = generateApiKey('team-1', '  My Key  ', ['read']);
      expect(key.name).toBe('My Key');
    });

    it('sets expiry in the future', () => {
      const key = generateApiKey('team-1', 'Name', ['read']);
      const expiresAt = new Date(key.expiresAt);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('accepts custom expiry days', () => {
      const key = generateApiKey('team-1', 'Name', ['read'], 30);
      const created = new Date(key.createdAt);
      const expires = new Date(key.expiresAt);
      const diffDays = (expires.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
      expect(Math.round(diffDays)).toBe(30);
    });

    it('creates a copy of permissions array', () => {
      const perms = ['read', 'write'];
      const key = generateApiKey('team-1', 'Name', perms);
      perms.push('admin');
      expect(key.permissions).toEqual(['read', 'write']);
    });
  });

  // --- rotateApiKey ---

  describe('rotateApiKey', () => {
    it('creates a new key and keeps old key active during grace period', () => {
      const oldKey = generateApiKey('team-1', 'Rotate Me', ['read']);
      const result = rotateApiKey(oldKey.id);

      expect(result.newKey.key).not.toBe(result.oldKey.key);
      expect(result.newKey.teamId).toBe('team-1');
      expect(result.newKey.name).toBe('Rotate Me');
      expect(result.newKey.permissions).toEqual(['read']);
      expect(result.newKey.isActive).toBe(true);
    });

    it('sets a grace period on the old key', () => {
      const oldKey = generateApiKey('team-1', 'Rotate Me', ['read']);
      const result = rotateApiKey(oldKey.id);
      expect(result.gracePeriodEndsAt).toBeTruthy();
      const graceEnd = new Date(result.gracePeriodEndsAt);
      expect(graceEnd.getTime()).toBeGreaterThan(Date.now());
    });

    it('throws for non-existent key', () => {
      expect(() => rotateApiKey('non-existent')).toThrow('API key not found');
    });

    it('throws for inactive key', () => {
      const key = generateApiKey('team-1', 'Revoked', ['read']);
      revokeApiKey(key.id);
      expect(() => rotateApiKey(key.id)).toThrow('Cannot rotate an inactive key');
    });

    it('old key expiry is updated to grace period end', () => {
      const key = generateApiKey('team-1', 'Key', ['read']);
      const originalExpiry = key.expiresAt;
      const result = rotateApiKey(key.id);
      expect(result.oldKey.expiresAt).not.toBe(originalExpiry);
      expect(result.oldKey.expiresAt).toBe(result.gracePeriodEndsAt);
    });
  });

  // --- validateApiKey ---

  describe('validateApiKey', () => {
    it('validates a valid key successfully', () => {
      const key = generateApiKey('team-1', 'Valid', ['read']);
      const result = validateApiKey(key.key);
      expect(result.valid).toBe(true);
      expect(result.keyData).toBeDefined();
      expect(result.keyData!.id).toBe(key.id);
    });

    it('updates lastUsedAt on successful validation', () => {
      const key = generateApiKey('team-1', 'Used', ['read']);
      expect(key.lastUsedAt).toBeNull();
      validateApiKey(key.key);
      const stored = getKeyStore().get(key.id)!;
      expect(stored.lastUsedAt).not.toBeNull();
    });

    it('rejects empty key', () => {
      const result = validateApiKey('');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Key is required');
    });

    it('rejects key without bbg_ prefix', () => {
      const result = validateApiKey('invalid_key_format');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid key format');
    });

    it('rejects unknown key', () => {
      const result = validateApiKey('bbg_nonexistentkey123456789012');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Key not found');
    });

    it('rejects revoked key', () => {
      const key = generateApiKey('team-1', 'Revoked', ['read']);
      revokeApiKey(key.id);
      const result = validateApiKey(key.key);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Key has been revoked');
    });

    it('rejects expired key', () => {
      // Create a key that expires immediately
      const key = generateApiKey('team-1', 'Expired', ['read'], 0);
      // Manually set expiry to the past
      const stored = getKeyStore().get(key.id)!;
      stored.expiresAt = new Date(Date.now() - 1000).toISOString();

      const result = validateApiKey(key.key);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Key has expired');
    });
  });

  // --- revokeApiKey ---

  describe('revokeApiKey', () => {
    it('deactivates an active key', () => {
      const key = generateApiKey('team-1', 'Revoke Me', ['read']);
      expect(key.isActive).toBe(true);
      revokeApiKey(key.id);
      const stored = getKeyStore().get(key.id)!;
      expect(stored.isActive).toBe(false);
    });

    it('throws for non-existent key', () => {
      expect(() => revokeApiKey('non-existent')).toThrow('API key not found');
    });
  });

  // --- getActiveKeys ---

  describe('getActiveKeys', () => {
    it('returns active keys for a team', () => {
      generateApiKey('team-1', 'Key 1', ['read']);
      generateApiKey('team-1', 'Key 2', ['write']);
      generateApiKey('team-2', 'Other Team', ['read']);

      const keys = getActiveKeys('team-1');
      expect(keys).toHaveLength(2);
      expect(keys.every((k: ApiKey) => k.teamId === 'team-1')).toBe(true);
    });

    it('excludes revoked keys', () => {
      const key1 = generateApiKey('team-1', 'Active', ['read']);
      const key2 = generateApiKey('team-1', 'Revoked', ['read']);
      revokeApiKey(key2.id);

      const keys = getActiveKeys('team-1');
      expect(keys).toHaveLength(1);
      expect(keys[0].id).toBe(key1.id);
    });

    it('excludes expired keys', () => {
      const key = generateApiKey('team-1', 'Expired', ['read']);
      const stored = getKeyStore().get(key.id)!;
      stored.expiresAt = new Date(Date.now() - 1000).toISOString();

      const keys = getActiveKeys('team-1');
      expect(keys).toHaveLength(0);
    });

    it('returns empty array for team with no keys', () => {
      const keys = getActiveKeys('team-no-keys');
      expect(keys).toEqual([]);
    });
  });
});
