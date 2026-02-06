import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Supabase mock ---
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: mockSelect,
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

// Mock crypto.getRandomValues for deterministic token generation
const mockGetRandomValues = vi.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = i % 256;
  }
  return array;
});
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
    randomUUID: () => 'mock-uuid',
  },
});

import {
  generateShareLink,
  generateShareToken,
  validateShareToken,
  getShareUrl,
  generateQRCodeSVG,
} from '@/lib/sharing';

describe('sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  describe('generateShareLink', () => {
    it('generates a URL containing the playId', () => {
      const url = generateShareLink('play-123');
      expect(url).toContain('play=play-123');
    });

    it('includes the /share/link path', () => {
      const url = generateShareLink('play-456');
      expect(url).toContain('/share/link');
    });

    it('sets dl=0 when allowDownload is false', () => {
      const url = generateShareLink('play-789', { allowDownload: false });
      expect(url).toContain('dl=0');
    });

    it('sets auth=1 when requireAuth is true', () => {
      const url = generateShareLink('play-auth', { requireAuth: true });
      expect(url).toContain('auth=1');
    });

    it('does not include dl param when allowDownload is true (default)', () => {
      const url = generateShareLink('play-dl', { allowDownload: true });
      expect(url).not.toContain('dl=');
    });

    it('does not include auth param when requireAuth is false (default)', () => {
      const url = generateShareLink('play-noauth');
      expect(url).not.toContain('auth=');
    });
  });

  describe('generateShareToken', () => {
    it('generates a token string', async () => {
      const token = await generateShareToken('play-token');
      expect(typeof token).toBe('string');
      expect(token.length).toBe(32);
    });

    it('inserts a record into the share_tokens table', async () => {
      await generateShareToken('play-db');
      expect(mockFrom).toHaveBeenCalledWith('share_tokens');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          play_id: 'play-db',
          allow_download: true,
          require_auth: false,
        }),
      );
    });

    it('sets expiration based on expiresIn parameter', async () => {
      await generateShareToken('play-exp', '1h');
      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.expires_at).not.toBeNull();
      // The expiration should be roughly 1 hour from now
      const expiresAt = new Date(insertArg.expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      expect(diffMs).toBeGreaterThan(3500000); // roughly 1 hour
      expect(diffMs).toBeLessThan(3700000);
    });

    it('sets null expiration for "never"', async () => {
      await generateShareToken('play-never', 'never');
      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.expires_at).toBeNull();
    });

    it('passes allowDownload and requireAuth options', async () => {
      await generateShareToken('play-opts', '24h', {
        allowDownload: false,
        requireAuth: true,
      });
      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.allow_download).toBe(false);
      expect(insertArg.require_auth).toBe(true);
    });

    it('throws an error if insert fails', async () => {
      mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });
      await expect(generateShareToken('play-fail')).rejects.toThrow('Failed to create share token: DB error');
    });
  });

  describe('validateShareToken', () => {
    it('returns valid=true for a valid, non-expired token', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      mockSingle.mockResolvedValueOnce({
        data: {
          token: 'valid-token',
          play_id: 'play-valid',
          expires_at: futureDate,
          allow_download: true,
          require_auth: false,
        },
        error: null,
      });

      const result = await validateShareToken('valid-token');
      expect(result.valid).toBe(true);
      expect(result.playId).toBe('play-valid');
      expect(result.allowDownload).toBe(true);
      expect(result.requireAuth).toBe(false);
    });

    it('returns valid=false for an expired token', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      mockSingle.mockResolvedValueOnce({
        data: {
          token: 'expired-token',
          play_id: 'play-exp',
          expires_at: pastDate,
          allow_download: true,
          require_auth: false,
        },
        error: null,
      });

      const result = await validateShareToken('expired-token');
      expect(result.valid).toBe(false);
    });

    it('returns valid=true for a token with null expiration (never expires)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          token: 'forever-token',
          play_id: 'play-forever',
          expires_at: null,
          allow_download: true,
          require_auth: false,
        },
        error: null,
      });

      const result = await validateShareToken('forever-token');
      expect(result.valid).toBe(true);
      expect(result.playId).toBe('play-forever');
    });

    it('returns valid=false when token is not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await validateShareToken('missing-token');
      expect(result.valid).toBe(false);
    });
  });

  describe('getShareUrl', () => {
    it('generates a URL with the token in the path', () => {
      const url = getShareUrl('abc123');
      expect(url).toContain('/share/abc123');
    });
  });

  describe('generateQRCodeSVG', () => {
    it('returns an SVG string', () => {
      const svg = generateQRCodeSVG('https://example.com/share/test');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('includes viewBox attribute', () => {
      const svg = generateQRCodeSVG('test', 200);
      expect(svg).toContain('viewBox="0 0 200 200"');
    });

    it('uses the specified size', () => {
      const svg = generateQRCodeSVG('test', 300);
      expect(svg).toContain('width="300"');
      expect(svg).toContain('height="300"');
    });

    it('contains rect elements for QR modules', () => {
      const svg = generateQRCodeSVG('test-data');
      expect(svg).toContain('<rect');
    });

    it('has a white background rect', () => {
      const svg = generateQRCodeSVG('test');
      expect(svg).toContain('fill="#fff"');
    });

    it('generates different patterns for different data', () => {
      const svg1 = generateQRCodeSVG('data-one');
      const svg2 = generateQRCodeSVG('data-two');
      expect(svg1).not.toBe(svg2);
    });
  });
});
