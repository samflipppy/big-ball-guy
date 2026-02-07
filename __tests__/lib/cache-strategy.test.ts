import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CACHE_CONFIGS,
  generateCacheKey,
  shouldRevalidate,
  InMemoryCache,
} from '@/lib/cache-strategy';

// ---------------------------------------------------------------------------
// CACHE_CONFIGS
// ---------------------------------------------------------------------------

describe('CACHE_CONFIGS', () => {
  it('contains the four preset configs', () => {
    expect(CACHE_CONFIGS).toHaveProperty('plays_list');
    expect(CACHE_CONFIGS).toHaveProperty('formation_library');
    expect(CACHE_CONFIGS).toHaveProperty('user_preferences');
    expect(CACHE_CONFIGS).toHaveProperty('shared_play');
  });

  it('plays_list has 60s TTL', () => {
    expect(CACHE_CONFIGS.plays_list.ttlSeconds).toBe(60);
  });

  it('formation_library has 300s TTL', () => {
    expect(CACHE_CONFIGS.formation_library.ttlSeconds).toBe(300);
  });

  it('shared_play uses staleWhileRevalidate', () => {
    expect(CACHE_CONFIGS.shared_play.staleWhileRevalidate).toBe(true);
  });

  it('user_preferences does not use staleWhileRevalidate', () => {
    expect(CACHE_CONFIGS.user_preferences.staleWhileRevalidate).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateCacheKey
// ---------------------------------------------------------------------------

describe('generateCacheKey', () => {
  it('returns prefix only when params are empty', () => {
    expect(generateCacheKey('plays', {})).toBe('plays');
  });

  it('includes encoded params', () => {
    const key = generateCacheKey('plays', { teamId: 't1', category: 'run' });
    expect(key).toContain('plays:');
    expect(key).toContain('teamId=t1');
    expect(key).toContain('category=run');
  });

  it('sorts params alphabetically for determinism', () => {
    const key1 = generateCacheKey('plays', { b: '2', a: '1' });
    const key2 = generateCacheKey('plays', { a: '1', b: '2' });
    expect(key1).toBe(key2);
  });

  it('encodes special characters', () => {
    const key = generateCacheKey('test', { 'foo bar': 'a&b' });
    expect(key).toContain('foo%20bar=a%26b');
  });

  it('produces different keys for different prefixes', () => {
    const k1 = generateCacheKey('alpha', { x: '1' });
    const k2 = generateCacheKey('beta', { x: '1' });
    expect(k1).not.toBe(k2);
  });

  it('produces different keys for different params', () => {
    const k1 = generateCacheKey('test', { a: '1' });
    const k2 = generateCacheKey('test', { a: '2' });
    expect(k1).not.toBe(k2);
  });
});

// ---------------------------------------------------------------------------
// shouldRevalidate
// ---------------------------------------------------------------------------

describe('shouldRevalidate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when entry is fresh', () => {
    const cachedAt = Date.now() - 10_000; // 10s ago
    expect(shouldRevalidate(cachedAt, 60)).toBe(false);
  });

  it('returns true when entry is stale', () => {
    const cachedAt = Date.now() - 120_000; // 120s ago
    expect(shouldRevalidate(cachedAt, 60)).toBe(true);
  });

  it('returns true at exact expiry boundary', () => {
    const cachedAt = Date.now() - 60_001; // just past 60s
    expect(shouldRevalidate(cachedAt, 60)).toBe(true);
  });

  it('returns false at exact TTL', () => {
    const cachedAt = Date.now() - 60_000; // exactly 60s
    expect(shouldRevalidate(cachedAt, 60)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// InMemoryCache
// ---------------------------------------------------------------------------

describe('InMemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves a value', () => {
    const cache = new InMemoryCache<string>();
    cache.set('key1', 'value1', 60);
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns undefined for missing keys', () => {
    const cache = new InMemoryCache<string>();
    expect(cache.get('nope')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    const cache = new InMemoryCache<string>();
    cache.set('key1', 'value1', 10); // 10s TTL

    vi.advanceTimersByTime(11_000);

    expect(cache.get('key1')).toBeUndefined();
  });

  it('returns value before TTL expires', () => {
    const cache = new InMemoryCache<string>();
    cache.set('key1', 'value1', 10);

    vi.advanceTimersByTime(9_000);

    expect(cache.get('key1')).toBe('value1');
  });

  it('delete removes an entry', () => {
    const cache = new InMemoryCache<string>();
    cache.set('key1', 'value1', 60);
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('delete returns false for non-existent key', () => {
    const cache = new InMemoryCache<string>();
    expect(cache.delete('nope')).toBe(false);
  });

  it('clear removes all entries', () => {
    const cache = new InMemoryCache<string>();
    cache.set('a', '1', 60);
    cache.set('b', '2', 60);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('evicts oldest entry when max size is reached', () => {
    const cache = new InMemoryCache<string>(2);
    cache.set('a', '1', 60);
    cache.set('b', '2', 60);
    cache.set('c', '3', 60); // should evict 'a'
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
  });

  it('does not evict when updating an existing key', () => {
    const cache = new InMemoryCache<string>(2);
    cache.set('a', '1', 60);
    cache.set('b', '2', 60);
    cache.set('a', 'updated', 60); // update, not insert
    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBe('updated');
  });

  it('tracks size correctly', () => {
    const cache = new InMemoryCache<number>();
    expect(cache.size).toBe(0);
    cache.set('x', 1, 60);
    expect(cache.size).toBe(1);
    cache.set('y', 2, 60);
    expect(cache.size).toBe(2);
    cache.delete('x');
    expect(cache.size).toBe(1);
  });

  it('enforces minimum maxSize of 1', () => {
    const cache = new InMemoryCache<string>(0);
    cache.set('a', '1', 60);
    expect(cache.get('a')).toBe('1');
    // Adding a second should evict the first since maxSize is clamped to 1
    cache.set('b', '2', 60);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
  });
});
