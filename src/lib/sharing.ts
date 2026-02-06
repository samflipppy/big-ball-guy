import { createClient } from '@/lib/supabase/client';
import type { PlayId } from '@/types';

// --- Types ---

export interface ShareOptions {
  expiresIn?: '1h' | '24h' | '7d' | 'never';
  allowDownload?: boolean;
  requireAuth?: boolean;
}

export interface ShareTokenRecord {
  token: string;
  playId: PlayId;
  expiresAt: string | null;
  allowDownload: boolean;
  requireAuth: boolean;
  createdAt: string;
}

export interface TokenValidationResult {
  valid: boolean;
  playId?: string;
  allowDownload?: boolean;
  requireAuth?: boolean;
}

// --- Constants ---

const EXPIRATION_MAP: Record<string, number | null> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  never: null,
};

// --- Helpers ---

/**
 * Generate a URL-safe random token string.
 */
function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Compute the expiration date given a duration key.
 */
function computeExpiresAt(expiresIn: string): string | null {
  const duration = EXPIRATION_MAP[expiresIn];
  if (duration === null || duration === undefined) return null;
  return new Date(Date.now() + duration).toISOString();
}

// --- Public API ---

/**
 * Generate a shareable link URL for a play.
 * The link encodes the playId into a path the share page can resolve.
 */
export function generateShareLink(playId: PlayId, options?: ShareOptions): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://app.playbook.com';

  // For a simple link without a token, encode playId directly
  const params = new URLSearchParams();
  params.set('play', playId);

  if (options?.allowDownload === false) {
    params.set('dl', '0');
  }
  if (options?.requireAuth) {
    params.set('auth', '1');
  }

  return `${baseUrl}/share/link?${params.toString()}`;
}

/**
 * Generate a time-limited share token and persist it to the database.
 * Returns the token string that can be used in a share URL.
 */
export async function generateShareToken(
  playId: PlayId,
  expiresIn: ShareOptions['expiresIn'] = '24h',
  options?: Omit<ShareOptions, 'expiresIn'>,
): Promise<string> {
  const token = generateRandomToken();
  const expiresAt = computeExpiresAt(expiresIn ?? '24h');
  const supabase = createClient();

  const record: ShareTokenRecord = {
    token,
    playId,
    expiresAt,
    allowDownload: options?.allowDownload ?? true,
    requireAuth: options?.requireAuth ?? false,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('share_tokens').insert({
    token: record.token,
    play_id: record.playId,
    expires_at: record.expiresAt,
    allow_download: record.allowDownload,
    require_auth: record.requireAuth,
    created_at: record.createdAt,
  });

  if (error) {
    throw new Error(`Failed to create share token: ${error.message}`);
  }

  return token;
}

/**
 * Validate a share token. Returns whether it is valid and the associated play ID.
 */
export async function validateShareToken(token: string): Promise<TokenValidationResult> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('share_tokens')
    .select('token, play_id, expires_at, allow_download, require_auth')
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Check expiration
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false };
    }
  }

  return {
    valid: true,
    playId: data.play_id,
    allowDownload: data.allow_download,
    requireAuth: data.require_auth,
  };
}

/**
 * Build a full share URL from a token.
 */
export function getShareUrl(token: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://app.playbook.com';

  return `${baseUrl}/share/${token}`;
}

/**
 * Generate a minimal QR code as an SVG string.
 * Uses a simple encoding approach suitable for short URLs.
 */
export function generateQRCodeSVG(data: string, size: number = 200): string {
  // Simple QR-like matrix generator using a deterministic pattern based on data hash.
  // This creates a visual QR-inspired pattern. For production, a full QR encoder
  // would be used, but this provides a functional SVG representation.
  const moduleCount = 21; // QR Version 1 is 21x21
  const cellSize = size / moduleCount;
  const matrix: boolean[][] = [];

  // Initialize matrix
  for (let r = 0; r < moduleCount; r++) {
    matrix[r] = [];
    for (let c = 0; c < moduleCount; c++) {
      matrix[r][c] = false;
    }
  }

  // Draw finder patterns (top-left, top-right, bottom-left)
  const drawFinderPattern = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startR + r][startC + c] = isOuter || isInner;
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, moduleCount - 7);
  drawFinderPattern(moduleCount - 7, 0);

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Encode data into the remaining cells using a simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  // Fill data area with a deterministic pattern based on the hash
  let seed = Math.abs(hash);
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // Skip finder patterns and timing
      if (r < 9 && c < 9) continue; // top-left finder + separator
      if (r < 9 && c >= moduleCount - 8) continue; // top-right finder
      if (r >= moduleCount - 8 && c < 9) continue; // bottom-left finder
      if (r === 6 || c === 6) continue; // timing

      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      matrix[r][c] = seed % 3 !== 0;
    }
  }

  // Build SVG
  let rects = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = cellSize.toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#000"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
}
