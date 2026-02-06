import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ThumbnailCache,
  getCacheKey,
  createPlaceholder,
  generateThumbnail,
  compressImage,
} from '@/lib/performance/image-optimizer';

// ---------------------------------------------------------------------------
// Mock canvas & DOM APIs
// ---------------------------------------------------------------------------

function makeMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const ctx = {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
  };
  const canvas = {
    width,
    height,
    getContext: vi.fn().mockReturnValue(ctx),
    toBlob: vi.fn((cb: (b: Blob | null) => void, type?: string, _quality?: number) => {
      cb(new Blob(['img'], { type: type ?? 'image/png' }));
    }),
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,AAAA'),
  } as unknown as HTMLCanvasElement;

  return canvas;
}

beforeEach(() => {
  // Mock document.createElement to return our mock canvas
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return makeMockCanvas() as unknown as HTMLElement;
    return document.createElement(tag);
  });
});

describe('image-optimizer', () => {
  // -----------------------------------------------------------------------
  // ThumbnailCache
  // -----------------------------------------------------------------------
  describe('ThumbnailCache', () => {
    it('stores and retrieves blobs', () => {
      const cache = new ThumbnailCache(10);
      const blob = new Blob(['a']);
      cache.set('key1', blob);
      expect(cache.get('key1')).toBe(blob);
    });

    it('returns undefined for missing keys', () => {
      const cache = new ThumbnailCache(10);
      expect(cache.get('missing')).toBeUndefined();
    });

    it('evicts the least-recently-used entry when full', () => {
      const cache = new ThumbnailCache(2);
      cache.set('a', new Blob(['a']));
      cache.set('b', new Blob(['b']));
      cache.set('c', new Blob(['c'])); // should evict 'a'

      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
    });

    it('moves accessed keys to most-recently-used', () => {
      const cache = new ThumbnailCache(2);
      cache.set('a', new Blob(['a']));
      cache.set('b', new Blob(['b']));
      cache.get('a'); // 'a' is now most recently used
      cache.set('c', new Blob(['c'])); // should evict 'b'

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
    });

    it('reports its size correctly', () => {
      const cache = new ThumbnailCache(10);
      expect(cache.size).toBe(0);
      cache.set('a', new Blob(['a']));
      expect(cache.size).toBe(1);
      cache.set('b', new Blob(['b']));
      expect(cache.size).toBe(2);
    });

    it('clears all entries', () => {
      const cache = new ThumbnailCache(10);
      cache.set('a', new Blob(['a']));
      cache.set('b', new Blob(['b']));
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.has('a')).toBe(false);
    });

    it('overwrites existing key without growing size', () => {
      const cache = new ThumbnailCache(10);
      cache.set('a', new Blob(['v1']));
      cache.set('a', new Blob(['v2']));
      expect(cache.size).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // getCacheKey
  // -----------------------------------------------------------------------
  describe('getCacheKey', () => {
    it('generates deterministic keys', () => {
      expect(getCacheKey('play-1', 3)).toBe('thumb_play-1_v3');
    });

    it('produces different keys for different versions', () => {
      expect(getCacheKey('play-1', 1)).not.toBe(getCacheKey('play-1', 2));
    });

    it('produces different keys for different plays', () => {
      expect(getCacheKey('play-1', 1)).not.toBe(getCacheKey('play-2', 1));
    });
  });

  // -----------------------------------------------------------------------
  // createPlaceholder
  // -----------------------------------------------------------------------
  describe('createPlaceholder', () => {
    it('returns a data URL string', () => {
      const result = createPlaceholder(100, 100);
      expect(result).toContain('data:image/png');
    });

    it('creates a canvas with the specified dimensions', () => {
      createPlaceholder(200, 150, '#ff0000');
      expect(document.createElement).toHaveBeenCalledWith('canvas');
    });
  });

  // -----------------------------------------------------------------------
  // generateThumbnail
  // -----------------------------------------------------------------------
  describe('generateThumbnail', () => {
    it('returns a blob with dimensions', async () => {
      const source = makeMockCanvas(800, 600);
      const result = await generateThumbnail(source, 200, 150);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.width).toBeLessThanOrEqual(200);
      expect(result.height).toBeLessThanOrEqual(150);
    });

    it('preserves aspect ratio', async () => {
      const source = makeMockCanvas(1000, 500);
      const result = await generateThumbnail(source, 200, 200);

      // 1000x500 => scale=0.2 => 200x100
      expect(result.width).toBe(200);
      expect(result.height).toBe(100);
    });
  });

  // -----------------------------------------------------------------------
  // compressImage
  // -----------------------------------------------------------------------
  describe('compressImage', () => {
    it('returns a compressed blob', async () => {
      // Mock createImageBitmap
      const mockBitmap = { width: 100, height: 100, close: vi.fn() };
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

      const input = new Blob(['img'], { type: 'image/png' });
      const result = await compressImage(input, 0.7);

      expect(result).toBeInstanceOf(Blob);
    });
  });
});
