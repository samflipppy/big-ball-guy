/**
 * Image Optimization for Thumbnails (#224)
 *
 * Provides helpers for resizing play-diagram canvases to thumbnail
 * sizes, compressing image blobs, creating placeholders, and
 * maintaining an LRU cache for thumbnail data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThumbnailResult {
  blob: Blob;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// LRU Thumbnail Cache
// ---------------------------------------------------------------------------

export class ThumbnailCache {
  private cache: Map<string, Blob> = new Map();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): Blob | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: Blob): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first key)
      const firstKey = this.cache.keys().next().value as string;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ---------------------------------------------------------------------------
// Thumbnail generation
// ---------------------------------------------------------------------------

/**
 * Resize the contents of a source canvas to fit within `maxWidth x maxHeight`
 * while preserving aspect ratio. Returns a Blob via `toBlob`.
 */
export async function generateThumbnail(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
): Promise<ThumbnailResult> {
  const srcWidth = canvas.width;
  const srcHeight = canvas.height;

  const scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  const targetWidth = Math.round(srcWidth * scale);
  const targetHeight = Math.round(srcHeight * scale);

  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;

  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });

  return { blob, width: targetWidth, height: targetHeight };
}

// ---------------------------------------------------------------------------
// Compression
// ---------------------------------------------------------------------------

/**
 * Re-encode a Blob through a canvas element at the given JPEG quality
 * (0-1). Useful for shrinking play-diagram thumbnails before caching.
 */
export async function compressImage(
  blob: Blob,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.drawImage(bitmap, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
      'image/jpeg',
      quality,
    );
  });
}

// ---------------------------------------------------------------------------
// Placeholder
// ---------------------------------------------------------------------------

/**
 * Create a tiny solid-colour placeholder image as a data-URL string.
 * Useful as a blur-up placeholder while the real thumbnail loads.
 */
export function createPlaceholder(
  width: number,
  height: number,
  color = '#e5e7eb',
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

/**
 * Deterministic cache key for a play thumbnail so we can bust on edits.
 */
export function getCacheKey(playId: string, version: number): string {
  return `thumb_${playId}_v${version}`;
}
