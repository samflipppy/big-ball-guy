/**
 * Device-level encryption utilities using the Web Crypto API.
 *
 * Provides AES-256-GCM encryption/decryption, PBKDF2 key derivation,
 * and SHA-256 hashing for local data protection.
 *
 * Note: Uses Web Crypto API when available, with mock fallbacks
 * for environments where it is not present (e.g., test environments).
 */

// --- Types ---

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  algorithm: string;
}

export interface EncryptionResult {
  encrypted: EncryptedData;
  success: boolean;
}

// --- Constants ---

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;

// --- Helpers ---

function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  return null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateRandomBytes(length: number): Uint8Array {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    return array;
  }
  // Fallback for environments without crypto
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

// --- Core Functions ---

/**
 * Generate a new AES-256-GCM encryption key using the Web Crypto API.
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }

  return subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns the encrypted data with IV for decryption.
 */
export async function encryptData(
  data: string,
  key: CryptoKey,
): Promise<EncryptedData> {
  if (!data) {
    throw new Error('Data is required for encryption');
  }

  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const iv = generateRandomBytes(IV_LENGTH);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const encrypted = await subtle.encrypt(
    { name: ALGORITHM, iv: iv as Uint8Array<ArrayBuffer> },
    key,
    encodedData,
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    algorithm: ALGORITHM,
  };
}

/**
 * Decrypt data that was encrypted with AES-256-GCM.
 */
export async function decryptData(
  encrypted: EncryptedData,
  key: CryptoKey,
): Promise<string> {
  if (!encrypted || !encrypted.ciphertext || !encrypted.iv) {
    throw new Error('Valid encrypted data is required for decryption');
  }

  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));

  const decrypted = await subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Derive an encryption key from a password using PBKDF2.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  if (!password) {
    throw new Error('Password is required');
  }

  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const encoder = new TextEncoder();
  const passwordKey = await subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as Uint8Array<ArrayBuffer>,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Generate a SHA-256 hash of a string.
 */
export async function hashData(data: string): Promise<string> {
  if (!data) {
    throw new Error('Data is required for hashing');
  }

  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const encoder = new TextEncoder();
  const hashBuffer = await subtle.digest('SHA-256', encoder.encode(data));
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Generate a random salt for key derivation.
 */
export function generateSalt(): Uint8Array {
  return generateRandomBytes(SALT_LENGTH);
}

/**
 * Export constants for testing.
 */
export const ENCRYPTION_CONSTANTS = {
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
} as const;
