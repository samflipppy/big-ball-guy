/**
 * Secure share link token management.
 *
 * Generates cryptographically random tokens for sharing plays,
 * with support for expiration, view limits, password protection,
 * and granular permissions.
 */

import type { PlayId } from '@/types';

// --- Types ---

export type SharePermission = 'view' | 'comment' | 'edit';

export interface ShareOptions {
  expiresIn?: number; // milliseconds until expiry
  maxViews?: number;
  password?: string;
  permissions: SharePermission;
}

export interface ShareTokenMetadata {
  token: string;
  playId: PlayId;
  permissions: SharePermission;
  createdAt: number;
  expiresAt: number | null;
  maxViews: number | null;
  viewCount: number;
  hasPassword: boolean;
  revoked: boolean;
}

export interface ShareTokenValidationResult {
  valid: boolean;
  metadata?: ShareTokenMetadata;
  reason?: string;
}

// --- Internal store ---

interface StoredToken extends ShareTokenMetadata {
  passwordHash: string | null;
}

const tokenStore = new Map<string, StoredToken>();

// --- Helpers ---

/**
 * Generate a cryptographically random token string.
 */
function generateRandomBytes(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Simple hash for password storage (in production, use bcrypt/argon2).
 * This is a basic hash for the in-memory store.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

// --- Public API ---

/**
 * Generate a share token for a play with the given options.
 */
export function generateShareToken(
  playId: PlayId,
  options: ShareOptions,
): string {
  if (!playId) {
    throw new Error('playId is required');
  }
  if (!options.permissions) {
    throw new Error('permissions is required');
  }

  const token = generateRandomBytes(48);
  const now = Date.now();

  const stored: StoredToken = {
    token,
    playId,
    permissions: options.permissions,
    createdAt: now,
    expiresAt: options.expiresIn ? now + options.expiresIn : null,
    maxViews: options.maxViews ?? null,
    viewCount: 0,
    hasPassword: !!options.password,
    passwordHash: options.password ? simpleHash(options.password) : null,
    revoked: false,
  };

  tokenStore.set(token, stored);
  return token;
}

/**
 * Validate a share token. Checks expiry, view count, revocation status.
 * Increments the view count on successful validation.
 */
export function validateShareToken(
  token: string,
  password?: string,
): ShareTokenValidationResult {
  if (!token) {
    return { valid: false, reason: 'Token is required' };
  }

  const stored = tokenStore.get(token);

  if (!stored) {
    return { valid: false, reason: 'Token not found' };
  }

  if (stored.revoked) {
    return { valid: false, reason: 'Token has been revoked' };
  }

  // Check expiration
  if (stored.expiresAt !== null && Date.now() > stored.expiresAt) {
    return { valid: false, reason: 'Token has expired' };
  }

  // Check max views
  if (stored.maxViews !== null && stored.viewCount >= stored.maxViews) {
    return { valid: false, reason: 'Maximum views exceeded' };
  }

  // Check password
  if (stored.hasPassword) {
    if (!password) {
      return { valid: false, reason: 'Password is required' };
    }
    if (simpleHash(password) !== stored.passwordHash) {
      return { valid: false, reason: 'Invalid password' };
    }
  }

  // Increment view count
  stored.viewCount += 1;

  const metadata: ShareTokenMetadata = {
    token: stored.token,
    playId: stored.playId,
    permissions: stored.permissions,
    createdAt: stored.createdAt,
    expiresAt: stored.expiresAt,
    maxViews: stored.maxViews,
    viewCount: stored.viewCount,
    hasPassword: stored.hasPassword,
    revoked: stored.revoked,
  };

  return { valid: true, metadata };
}

/**
 * Revoke a share token, making it permanently invalid.
 */
export function revokeShareToken(token: string): boolean {
  const stored = tokenStore.get(token);
  if (!stored) {
    return false;
  }

  stored.revoked = true;
  return true;
}

/**
 * Get metadata for a token without incrementing view count or checking validity.
 */
export function getTokenMetadata(token: string): ShareTokenMetadata | null {
  const stored = tokenStore.get(token);
  if (!stored) return null;

  return {
    token: stored.token,
    playId: stored.playId,
    permissions: stored.permissions,
    createdAt: stored.createdAt,
    expiresAt: stored.expiresAt,
    maxViews: stored.maxViews,
    viewCount: stored.viewCount,
    hasPassword: stored.hasPassword,
    revoked: stored.revoked,
  };
}

/**
 * Clear all tokens from the store (for testing).
 */
export function clearTokenStore(): void {
  tokenStore.clear();
}
