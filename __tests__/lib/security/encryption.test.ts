import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateEncryptionKey,
  encryptData,
  decryptData,
  deriveKeyFromPassword,
  hashData,
  generateSalt,
  ENCRYPTION_CONSTANTS,
} from '@/lib/security/encryption';
import type { EncryptedData } from '@/lib/security/encryption';

// --- Web Crypto API Mocks ---

const mockKeyData = vi.hoisted(() => ({
  type: 'secret' as const,
  extractable: true,
  algorithm: { name: 'AES-GCM', length: 256 },
  usages: ['encrypt', 'decrypt'] as KeyUsage[],
}));

const mockEncryptedBuffer = vi.hoisted(() => {
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  return data.buffer;
});

const mockDecryptedBuffer = vi.hoisted(() => {
  const encoder = new TextEncoder();
  return encoder.encode('Hello, World!').buffer;
});

const mockHashBuffer = vi.hoisted(() => {
  const data = new Uint8Array(32).fill(42);
  return data.buffer;
});

function createMockCryptoKey(usages: KeyUsage[] = ['encrypt', 'decrypt']): CryptoKey {
  return {
    type: 'secret',
    extractable: true,
    algorithm: { name: 'AES-GCM', length: 256 },
    usages,
  } as unknown as CryptoKey;
}

function setupCryptoMocks() {
  const mockSubtle = {
    generateKey: vi.fn().mockResolvedValue(createMockCryptoKey()),
    encrypt: vi.fn().mockResolvedValue(mockEncryptedBuffer),
    decrypt: vi.fn().mockResolvedValue(mockDecryptedBuffer),
    importKey: vi.fn().mockResolvedValue(createMockCryptoKey(['deriveKey'])),
    deriveKey: vi.fn().mockResolvedValue(createMockCryptoKey()),
    digest: vi.fn().mockResolvedValue(mockHashBuffer),
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: {
      subtle: mockSubtle,
      getRandomValues: (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
    },
    writable: true,
    configurable: true,
  });

  return mockSubtle;
}

describe('encryption', () => {
  let mockSubtle: ReturnType<typeof setupCryptoMocks>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSubtle = setupCryptoMocks();
  });

  // --- Constants ---

  describe('ENCRYPTION_CONSTANTS', () => {
    it('uses AES-GCM algorithm', () => {
      expect(ENCRYPTION_CONSTANTS.ALGORITHM).toBe('AES-GCM');
    });

    it('uses 256-bit key length', () => {
      expect(ENCRYPTION_CONSTANTS.KEY_LENGTH).toBe(256);
    });

    it('uses 12-byte IV length', () => {
      expect(ENCRYPTION_CONSTANTS.IV_LENGTH).toBe(12);
    });

    it('uses 100000 PBKDF2 iterations', () => {
      expect(ENCRYPTION_CONSTANTS.PBKDF2_ITERATIONS).toBe(100000);
    });

    it('uses 16-byte salt length', () => {
      expect(ENCRYPTION_CONSTANTS.SALT_LENGTH).toBe(16);
    });
  });

  // --- generateEncryptionKey ---

  describe('generateEncryptionKey', () => {
    it('generates a CryptoKey', async () => {
      const key = await generateEncryptionKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('calls subtle.generateKey with AES-GCM params', async () => {
      await generateEncryptionKey();
      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt'],
      );
    });

    it('throws when Web Crypto is not available', async () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: { subtle: undefined },
        writable: true,
        configurable: true,
      });
      await expect(generateEncryptionKey()).rejects.toThrow(
        'Web Crypto API is not available',
      );
      // Restore
      setupCryptoMocks();
    });
  });

  // --- encryptData ---

  describe('encryptData', () => {
    it('returns encrypted data with ciphertext, iv, and algorithm', async () => {
      const key = createMockCryptoKey();
      const result = await encryptData('test data', key);

      expect(result.ciphertext).toBeTruthy();
      expect(result.iv).toBeTruthy();
      expect(result.algorithm).toBe('AES-GCM');
    });

    it('calls subtle.encrypt with AES-GCM', async () => {
      const key = createMockCryptoKey();
      await encryptData('hello', key);

      expect(mockSubtle.encrypt).toHaveBeenCalledTimes(1);
      const callArgs = mockSubtle.encrypt.mock.calls[0];
      expect(callArgs[0].name).toBe('AES-GCM');
    });

    it('throws for empty data', async () => {
      const key = createMockCryptoKey();
      await expect(encryptData('', key)).rejects.toThrow(
        'Data is required for encryption',
      );
    });

    it('returns base64-encoded ciphertext', async () => {
      const key = createMockCryptoKey();
      const result = await encryptData('data', key);
      // Base64 should not contain characters outside the base64 alphabet
      expect(result.ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('returns base64-encoded iv', async () => {
      const key = createMockCryptoKey();
      const result = await encryptData('data', key);
      expect(result.iv).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  // --- decryptData ---

  describe('decryptData', () => {
    it('decrypts data and returns string', async () => {
      const key = createMockCryptoKey();
      const encrypted: EncryptedData = {
        ciphertext: btoa(String.fromCharCode(1, 2, 3, 4)),
        iv: btoa(String.fromCharCode(5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)),
        algorithm: 'AES-GCM',
      };

      const result = await decryptData(encrypted, key);
      expect(result).toBe('Hello, World!');
    });

    it('calls subtle.decrypt', async () => {
      const key = createMockCryptoKey();
      const encrypted: EncryptedData = {
        ciphertext: btoa('abc'),
        iv: btoa('iv1234567890'),
        algorithm: 'AES-GCM',
      };

      await decryptData(encrypted, key);
      expect(mockSubtle.decrypt).toHaveBeenCalledTimes(1);
    });

    it('throws for null encrypted data', async () => {
      const key = createMockCryptoKey();
      await expect(
        decryptData(null as unknown as EncryptedData, key),
      ).rejects.toThrow('Valid encrypted data is required');
    });

    it('throws for encrypted data without ciphertext', async () => {
      const key = createMockCryptoKey();
      await expect(
        decryptData({ ciphertext: '', iv: 'abc', algorithm: 'AES-GCM' }, key),
      ).rejects.toThrow('Valid encrypted data is required');
    });

    it('throws for encrypted data without iv', async () => {
      const key = createMockCryptoKey();
      await expect(
        decryptData({ ciphertext: 'abc', iv: '', algorithm: 'AES-GCM' }, key),
      ).rejects.toThrow('Valid encrypted data is required');
    });
  });

  // --- deriveKeyFromPassword ---

  describe('deriveKeyFromPassword', () => {
    it('derives a key from password and salt', async () => {
      const salt = new Uint8Array(16).fill(1);
      const key = await deriveKeyFromPassword('mypassword', salt);
      expect(key).toBeDefined();
    });

    it('calls importKey then deriveKey', async () => {
      const salt = new Uint8Array(16).fill(1);
      await deriveKeyFromPassword('password', salt);

      expect(mockSubtle.importKey).toHaveBeenCalledTimes(1);
      expect(mockSubtle.deriveKey).toHaveBeenCalledTimes(1);
    });

    it('uses PBKDF2 for key derivation', async () => {
      const salt = new Uint8Array(16).fill(1);
      await deriveKeyFromPassword('password', salt);

      const deriveCallArgs = mockSubtle.deriveKey.mock.calls[0];
      expect(deriveCallArgs[0].name).toBe('PBKDF2');
      expect(deriveCallArgs[0].iterations).toBe(100000);
      expect(deriveCallArgs[0].hash).toBe('SHA-256');
    });

    it('throws for empty password', async () => {
      const salt = new Uint8Array(16);
      await expect(deriveKeyFromPassword('', salt)).rejects.toThrow(
        'Password is required',
      );
    });
  });

  // --- hashData ---

  describe('hashData', () => {
    it('returns a base64-encoded hash', async () => {
      const hash = await hashData('test data');
      expect(hash).toBeTruthy();
      expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('calls subtle.digest with SHA-256', async () => {
      await hashData('input');
      expect(mockSubtle.digest).toHaveBeenCalledTimes(1);
      expect(mockSubtle.digest.mock.calls[0][0]).toBe('SHA-256');
    });

    it('throws for empty data', async () => {
      await expect(hashData('')).rejects.toThrow('Data is required for hashing');
    });
  });

  // --- generateSalt ---

  describe('generateSalt', () => {
    it('generates a Uint8Array', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
    });

    it('generates salt of correct length', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(16);
    });

    it('generates different salts each time', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      // Extremely unlikely to be the same
      const same = salt1.every((val, i) => val === salt2[i]);
      expect(same).toBe(false);
    });
  });
});
