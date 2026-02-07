/**
 * Server-Side Caching Strategy (#137)
 *
 * Provides cache configuration presets, key generation, staleness checks,
 * and an in-memory TTL cache with max-size eviction.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheConfig {
  key: string;
  ttlSeconds: number;
  staleWhileRevalidate: boolean;
}

// ---------------------------------------------------------------------------
// Preset configs
// ---------------------------------------------------------------------------

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  plays_list: {
    key: 'plays_list',
    ttlSeconds: 60,
    staleWhileRevalidate: true,
  },
  formation_library: {
    key: 'formation_library',
    ttlSeconds: 300,
    staleWhileRevalidate: true,
  },
  user_preferences: {
    key: 'user_preferences',
    ttlSeconds: 120,
    staleWhileRevalidate: false,
  },
  shared_play: {
    key: 'shared_play',
    ttlSeconds: 600,
    staleWhileRevalidate: true,
  },
};

// ---------------------------------------------------------------------------
// Cache key generation
// ---------------------------------------------------------------------------

/**
 * Creates a deterministic cache key from a prefix and a set of params.
 * Params are sorted alphabetically so insertion order doesn't matter.
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, string>,
): string {
  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const paramString = sortedEntries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return paramString ? `${prefix}:${paramString}` : prefix;
}

// ---------------------------------------------------------------------------
// Staleness check
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the cached timestamp is older than `ttl` seconds.
 *
 * @param cachedAt - epoch ms when the entry was stored
 * @param ttl      - time-to-live in seconds
 */
export function shouldRevalidate(cachedAt: number, ttl: number): boolean {
  const ageMs = Date.now() - cachedAt;
  return ageMs > ttl * 1000;
}

// ---------------------------------------------------------------------------
// In-Memory Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  cachedAt: number; // epoch ms
  ttlMs: number;
}

/**
 * Simple in-memory cache with TTL-based expiry and max-size eviction (LRU-ish).
 */
export class InMemoryCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = Math.max(1, maxSize);
  }

  /**
   * Store a value with a given TTL (in seconds).
   */
  set(key: string, value: T, ttlSeconds: number): void {
    // Evict oldest if at capacity and key doesn't already exist
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      cachedAt: Date.now(),
      ttlMs: ttlSeconds * 1000,
    });
  }

  /**
   * Retrieve a value. Returns `undefined` if not found or expired.
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Remove a single entry.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Remove all entries.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Current number of entries (including potentially expired ones that
   * haven't been accessed yet).
   */
  get size(): number {
    return this.store.size;
  }

  // ------ internal ------

  private evictOldest(): void {
    // Map iterates in insertion order, so the first key is the oldest
    const firstKey = this.store.keys().next().value;
    if (firstKey !== undefined) {
      this.store.delete(firstKey);
    }
  }
}
