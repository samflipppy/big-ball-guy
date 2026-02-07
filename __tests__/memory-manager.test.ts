import { describe, it, expect } from 'vitest';
import {
  getMemoryUsage,
  detectMemoryLeak,
  suggestCleanup,
  getGCHint,
  pruneCache,
} from '@/lib/performance/memory-manager';
import type { MemorySnapshot, GarbageCollectionHint, CleanupRecommendation } from '@/lib/performance/memory-manager';

// Helper to create a snapshot with specific values
function makeSnapshot(
  heapUsed: number,
  heapTotal: number,
  heapLimit: number,
  timestamp: number,
): MemorySnapshot {
  return { heapUsed, heapTotal, heapLimit, timestamp };
}

describe('memory-manager', () => {
  // ---- getMemoryUsage ----
  describe('getMemoryUsage', () => {
    it('returns a MemorySnapshot with a timestamp', () => {
      const snap = getMemoryUsage();
      expect(snap).toHaveProperty('heapUsed');
      expect(snap).toHaveProperty('heapTotal');
      expect(snap).toHaveProperty('heapLimit');
      expect(snap.timestamp).toBeGreaterThan(0);
    });

    it('returns zero values in environments without performance.memory', () => {
      // jsdom does not have performance.memory
      const snap = getMemoryUsage();
      expect(snap.heapUsed).toBe(0);
      expect(snap.heapTotal).toBe(0);
      expect(snap.heapLimit).toBe(0);
    });
  });

  // ---- detectMemoryLeak ----
  describe('detectMemoryLeak', () => {
    it('returns no leak when there are insufficient snapshots', () => {
      const result = detectMemoryLeak([makeSnapshot(100, 200, 1000, 1000)]);
      expect(result.leakDetected).toBe(false);
      expect(result.message).toContain('Insufficient data');
    });

    it('detects a leak when heap grows monotonically', () => {
      const snapshots = Array.from({ length: 6 }, (_, i) =>
        makeSnapshot(100 + i * 50, 500, 1000, 1000 + i * 1000),
      );
      const result = detectMemoryLeak(snapshots, 5);
      expect(result.leakDetected).toBe(true);
      expect(result.growthRate).toBeGreaterThan(0);
      expect(result.message).toContain('Potential memory leak');
    });

    it('reports no leak when heap fluctuates', () => {
      const snapshots = [
        makeSnapshot(100, 500, 1000, 1000),
        makeSnapshot(200, 500, 1000, 2000),
        makeSnapshot(150, 500, 1000, 3000), // decrease
        makeSnapshot(250, 500, 1000, 4000),
        makeSnapshot(200, 500, 1000, 5000), // decrease
      ];
      const result = detectMemoryLeak(snapshots, 5);
      expect(result.leakDetected).toBe(false);
    });

    it('respects custom windowSize', () => {
      // Only 3 increasing snapshots — not enough for window of 5
      const snapshots = [
        makeSnapshot(100, 500, 1000, 1000),
        makeSnapshot(200, 500, 1000, 2000),
        makeSnapshot(300, 500, 1000, 3000),
      ];
      const result = detectMemoryLeak(snapshots, 3);
      expect(result.leakDetected).toBe(true);
    });
  });

  // ---- suggestCleanup ----
  describe('suggestCleanup', () => {
    it('returns high-priority recommendations when usage > 90%', () => {
      const snap = makeSnapshot(950, 1000, 1000, Date.now());
      const recs = suggestCleanup(snap);
      const high = recs.filter((r) => r.priority === 'high');
      expect(high.length).toBeGreaterThan(0);
    });

    it('returns medium-priority recommendations when usage is 70-90%', () => {
      const snap = makeSnapshot(800, 1000, 1000, Date.now());
      const recs = suggestCleanup(snap);
      const medium = recs.filter((r) => r.priority === 'medium');
      expect(medium.length).toBeGreaterThan(0);
    });

    it('returns low-priority recommendations when usage is 50-70%', () => {
      const snap = makeSnapshot(600, 1000, 1000, Date.now());
      const recs = suggestCleanup(snap);
      const low = recs.filter((r) => r.priority === 'low');
      expect(low.length).toBeGreaterThan(0);
    });

    it('returns empty array when heap limit is 0', () => {
      const snap = makeSnapshot(0, 0, 0, Date.now());
      const recs = suggestCleanup(snap);
      expect(recs).toHaveLength(0);
    });
  });

  // ---- getGCHint ----
  describe('getGCHint', () => {
    it('returns aggressive when pressure > 85%', () => {
      const snap = makeSnapshot(900, 1000, 1000, Date.now());
      expect(getGCHint(snap)).toBe('aggressive');
    });

    it('returns normal when pressure is 60-85%', () => {
      const snap = makeSnapshot(700, 1000, 1000, Date.now());
      expect(getGCHint(snap)).toBe('normal');
    });

    it('returns relaxed when pressure < 60%', () => {
      const snap = makeSnapshot(500, 1000, 1000, Date.now());
      expect(getGCHint(snap)).toBe('relaxed');
    });

    it('returns normal when heapLimit is 0', () => {
      const snap = makeSnapshot(0, 0, 0, Date.now());
      expect(getGCHint(snap)).toBe('normal');
    });
  });

  // ---- pruneCache ----
  describe('pruneCache', () => {
    it('removes oldest entries when cache exceeds maxEntries', () => {
      const cache = new Map<string, unknown>();
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4);
      cache.set('e', 5);

      const removed = pruneCache(cache, 3);
      expect(removed).toBe(2);
      expect(cache.size).toBe(3);
      // oldest entries (a, b) should be removed
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
    });

    it('returns 0 when cache is within limit', () => {
      const cache = new Map<string, unknown>();
      cache.set('x', 1);
      cache.set('y', 2);
      const removed = pruneCache(cache, 5);
      expect(removed).toBe(0);
      expect(cache.size).toBe(2);
    });

    it('can prune to zero entries', () => {
      const cache = new Map<string, unknown>();
      cache.set('a', 1);
      cache.set('b', 2);
      const removed = pruneCache(cache, 0);
      expect(removed).toBe(2);
      expect(cache.size).toBe(0);
    });
  });
});
