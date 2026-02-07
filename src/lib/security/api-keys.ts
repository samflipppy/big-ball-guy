/**
 * API Key management with rotation support.
 *
 * Provides key generation, rotation with grace periods,
 * validation, and revocation for team-scoped API keys.
 */

// --- Types ---

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  teamId: string;
  permissions: string[];
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
}

export interface RotationResult {
  oldKey: ApiKey;
  newKey: ApiKey;
  gracePeriodEndsAt: string;
}

// --- Constants ---

const KEY_PREFIX = 'bbg_';
const KEY_LENGTH = 32;
const DEFAULT_EXPIRY_DAYS = 90;
const GRACE_PERIOD_HOURS = 24;

// --- In-memory store ---

const keyStore: Map<string, ApiKey> = new Map();

/**
 * Get the internal key store (for testing purposes).
 */
export function getKeyStore(): Map<string, ApiKey> {
  return keyStore;
}

/**
 * Clear all keys from the store (for testing purposes).
 */
export function clearKeyStore(): void {
  keyStore.clear();
}

// --- Helpers ---

function generateRandomHex(length: number): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateId(): string {
  return `key_${generateRandomHex(12)}`;
}

// --- Core Functions ---

/**
 * Generate a new API key for a team.
 */
export function generateApiKey(
  teamId: string,
  name: string,
  permissions: string[],
  expiryDays: number = DEFAULT_EXPIRY_DAYS,
): ApiKey {
  if (!teamId) {
    throw new Error('teamId is required');
  }
  if (!name || name.trim().length === 0) {
    throw new Error('name is required');
  }
  if (!permissions || permissions.length === 0) {
    throw new Error('At least one permission is required');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  const apiKey: ApiKey = {
    id: generateId(),
    key: `${KEY_PREFIX}${generateRandomHex(KEY_LENGTH)}`,
    name: name.trim(),
    teamId,
    permissions: [...permissions],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastUsedAt: null,
    isActive: true,
  };

  keyStore.set(apiKey.id, apiKey);
  return apiKey;
}

/**
 * Rotate an API key: generate a new key and mark the old one
 * as expired with a grace period.
 */
export function rotateApiKey(oldKeyId: string): RotationResult {
  const oldKey = keyStore.get(oldKeyId);

  if (!oldKey) {
    throw new Error(`API key not found: ${oldKeyId}`);
  }

  if (!oldKey.isActive) {
    throw new Error('Cannot rotate an inactive key');
  }

  // Create new key with same team/name/permissions
  const newKey = generateApiKey(oldKey.teamId, oldKey.name, oldKey.permissions);

  // Set grace period on old key instead of immediately deactivating
  const gracePeriodEnd = new Date(
    Date.now() + GRACE_PERIOD_HOURS * 60 * 60 * 1000,
  );
  oldKey.expiresAt = gracePeriodEnd.toISOString();

  return {
    oldKey,
    newKey,
    gracePeriodEndsAt: gracePeriodEnd.toISOString(),
  };
}

/**
 * Validate an API key string.
 * Checks the key exists, is active, and hasn't expired.
 * Updates lastUsedAt on successful validation.
 */
export function validateApiKey(key: string): {
  valid: boolean;
  keyData?: ApiKey;
  reason?: string;
} {
  if (!key) {
    return { valid: false, reason: 'Key is required' };
  }

  if (!key.startsWith(KEY_PREFIX)) {
    return { valid: false, reason: 'Invalid key format' };
  }

  // Find the key in the store
  let foundKey: ApiKey | undefined;
  for (const stored of keyStore.values()) {
    if (stored.key === key) {
      foundKey = stored;
      break;
    }
  }

  if (!foundKey) {
    return { valid: false, reason: 'Key not found' };
  }

  if (!foundKey.isActive) {
    return { valid: false, reason: 'Key has been revoked' };
  }

  const now = new Date();
  const expiresAt = new Date(foundKey.expiresAt);
  if (now > expiresAt) {
    return { valid: false, reason: 'Key has expired' };
  }

  // Update lastUsedAt
  foundKey.lastUsedAt = now.toISOString();

  return { valid: true, keyData: foundKey };
}

/**
 * Immediately revoke an API key.
 */
export function revokeApiKey(keyId: string): void {
  const key = keyStore.get(keyId);

  if (!key) {
    throw new Error(`API key not found: ${keyId}`);
  }

  key.isActive = false;
}

/**
 * Get all active API keys for a team.
 */
export function getActiveKeys(teamId: string): ApiKey[] {
  const keys: ApiKey[] = [];
  const now = new Date();

  for (const key of keyStore.values()) {
    if (
      key.teamId === teamId &&
      key.isActive &&
      new Date(key.expiresAt) > now
    ) {
      keys.push(key);
    }
  }

  return keys;
}
