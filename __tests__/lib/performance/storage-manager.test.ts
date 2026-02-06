import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStorageEstimate,
  suggestCleanup,
  getStorageWarning,
  type StorageEstimate,
} from '@/lib/performance/storage-manager';

describe('storage-manager', () => {
  // -----------------------------------------------------------------------
  // getStorageEstimate
  // -----------------------------------------------------------------------
  describe('getStorageEstimate', () => {
    beforeEach(() => {
      // Default mock for navigator.storage.estimate
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            usage: 50_000_000,
            quota: 100_000_000,
          }),
        },
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns usage, quota, and percentUsed', async () => {
      const result = await getStorageEstimate();
      expect(result.usage).toBe(50_000_000);
      expect(result.quota).toBe(100_000_000);
      expect(result.percentUsed).toBe(50);
    });

    it('returns zeros when navigator.storage is unavailable', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toEqual({ usage: 0, quota: 0, percentUsed: 0 });
    });

    it('handles estimate returning undefined values', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({}),
        },
        configurable: true,
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result.usage).toBe(0);
      expect(result.quota).toBe(0);
      expect(result.percentUsed).toBe(0);
    });

    it('calculates percentUsed correctly for high usage', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            usage: 900_000_000,
            quota: 1_000_000_000,
          }),
        },
        configurable: true,
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result.percentUsed).toBe(90);
    });
  });

  // -----------------------------------------------------------------------
  // suggestCleanup
  // -----------------------------------------------------------------------
  describe('suggestCleanup', () => {
    it('returns critical-level recommendations at 90%+ usage', () => {
      const estimate: StorageEstimate = {
        usage: 900,
        quota: 1000,
        percentUsed: 90,
      };
      const recs = suggestCleanup(estimate);
      expect(recs.length).toBeGreaterThanOrEqual(2);
      expect(recs.some((r) => r.storeName === 'practiceScripts')).toBe(true);
      expect(recs.some((r) => r.storeName === 'plays')).toBe(true);
    });

    it('returns moderate recommendations at 70-89% usage', () => {
      const estimate: StorageEstimate = {
        usage: 750,
        quota: 1000,
        percentUsed: 75,
      };
      const recs = suggestCleanup(estimate);
      expect(recs.length).toBeGreaterThanOrEqual(1);
      expect(recs.some((r) => r.storeName === 'scoutingNotes')).toBe(true);
    });

    it('returns informational message at 50-69% usage', () => {
      const estimate: StorageEstimate = {
        usage: 550,
        quota: 1000,
        percentUsed: 55,
      };
      const recs = suggestCleanup(estimate);
      expect(recs).toHaveLength(1);
      expect(recs[0].action).toContain('no immediate action');
    });

    it('returns no recommendations below 50%', () => {
      const estimate: StorageEstimate = {
        usage: 200,
        quota: 1000,
        percentUsed: 20,
      };
      const recs = suggestCleanup(estimate);
      expect(recs).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // getStorageWarning
  // -----------------------------------------------------------------------
  describe('getStorageWarning', () => {
    it('returns critical warning at 90%+', () => {
      const warning = getStorageWarning({ usage: 900, quota: 1000, percentUsed: 95 });
      expect(warning.level).toBe('critical');
      expect(warning.percentUsed).toBe(95);
    });

    it('returns warning at 70-89%', () => {
      const warning = getStorageWarning({ usage: 750, quota: 1000, percentUsed: 75 });
      expect(warning.level).toBe('warning');
    });

    it('returns info below 70%', () => {
      const warning = getStorageWarning({ usage: 300, quota: 1000, percentUsed: 30 });
      expect(warning.level).toBe('info');
    });

    it('includes a human-readable message', () => {
      const warning = getStorageWarning({ usage: 900, quota: 1000, percentUsed: 92 });
      expect(warning.message).toBeTruthy();
      expect(typeof warning.message).toBe('string');
    });
  });
});
