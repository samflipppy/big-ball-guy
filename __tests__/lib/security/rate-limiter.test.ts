import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RateLimiter,
  AUTH_LIMITER,
  API_LIMITER,
  EXPORT_LIMITER,
} from '@/lib/security/rate-limiter';

describe('rate-limiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(5, 60_000); // 5 requests per 60 seconds
    vi.restoreAllMocks();
  });

  // --- Constructor validation ---

  describe('constructor', () => {
    it('creates a limiter with valid parameters', () => {
      const rl = new RateLimiter(10, 1000);
      expect(rl.getMaxRequests()).toBe(10);
      expect(rl.getWindowMs()).toBe(1000);
    });

    it('throws if maxRequests is zero or negative', () => {
      expect(() => new RateLimiter(0, 1000)).toThrow('maxRequests must be a positive number');
      expect(() => new RateLimiter(-1, 1000)).toThrow('maxRequests must be a positive number');
    });

    it('throws if windowMs is zero or negative', () => {
      expect(() => new RateLimiter(5, 0)).toThrow('windowMs must be a positive number');
      expect(() => new RateLimiter(5, -100)).toThrow('windowMs must be a positive number');
    });
  });

  // --- checkLimit ---

  describe('checkLimit', () => {
    it('reports full quota for a new key', () => {
      const result = limiter.checkLimit('user-1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('does not consume a request when checking', () => {
      limiter.checkLimit('user-1');
      limiter.checkLimit('user-1');
      limiter.checkLimit('user-1');
      const result = limiter.checkLimit('user-1');
      expect(result.remaining).toBe(5); // still full
    });

    it('reflects consumed requests in remaining count', () => {
      limiter.consume('user-1');
      limiter.consume('user-1');
      const result = limiter.checkLimit('user-1');
      expect(result.remaining).toBe(3);
      expect(result.allowed).toBe(true);
    });

    it('reports not allowed when quota is exhausted', () => {
      for (let i = 0; i < 5; i++) {
        limiter.consume('user-1');
      }
      const result = limiter.checkLimit('user-1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  // --- consume ---

  describe('consume', () => {
    it('returns allowed true when quota is available', () => {
      const result = limiter.consume('user-1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('decrements remaining on each consume', () => {
      limiter.consume('user-1');
      limiter.consume('user-1');
      const result = limiter.consume('user-1');
      expect(result.remaining).toBe(2);
    });

    it('returns allowed false when quota is exhausted', () => {
      for (let i = 0; i < 5; i++) {
        limiter.consume('user-1');
      }
      const result = limiter.consume('user-1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('provides a resetAt timestamp', () => {
      const before = Date.now();
      const result = limiter.consume('user-1');
      expect(result.resetAt).toBeGreaterThanOrEqual(before);
      expect(result.resetAt).toBeLessThanOrEqual(before + 60_000 + 100);
    });

    it('tracks keys independently', () => {
      for (let i = 0; i < 5; i++) {
        limiter.consume('user-1');
      }
      const result1 = limiter.consume('user-1');
      const result2 = limiter.consume('user-2');
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });
  });

  // --- Sliding window expiry ---

  describe('sliding window', () => {
    it('allows requests after the window expires', () => {
      const shortLimiter = new RateLimiter(2, 100); // 2 per 100ms

      // Exhaust quota
      shortLimiter.consume('key');
      shortLimiter.consume('key');
      expect(shortLimiter.consume('key').allowed).toBe(false);

      // Advance time past the window
      vi.useFakeTimers();
      vi.advanceTimersByTime(150);

      const result = shortLimiter.consume('key');
      expect(result.allowed).toBe(true);

      vi.useRealTimers();
    });

    it('prunes expired entries on check', () => {
      const shortLimiter = new RateLimiter(2, 100);

      shortLimiter.consume('key');
      shortLimiter.consume('key');

      vi.useFakeTimers();
      vi.advanceTimersByTime(150);

      const result = shortLimiter.checkLimit('key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      vi.useRealTimers();
    });
  });

  // --- reset / clearAll ---

  describe('reset and clearAll', () => {
    it('resets a specific key', () => {
      limiter.consume('user-1');
      limiter.consume('user-1');
      limiter.reset('user-1');
      const result = limiter.checkLimit('user-1');
      expect(result.remaining).toBe(5);
    });

    it('clearAll resets all keys', () => {
      limiter.consume('user-1');
      limiter.consume('user-2');
      limiter.clearAll();
      expect(limiter.checkLimit('user-1').remaining).toBe(5);
      expect(limiter.checkLimit('user-2').remaining).toBe(5);
    });
  });

  // --- Preset configs ---

  describe('preset limiters', () => {
    it('AUTH_LIMITER allows 5 requests per minute', () => {
      expect(AUTH_LIMITER.getMaxRequests()).toBe(5);
      expect(AUTH_LIMITER.getWindowMs()).toBe(60_000);
    });

    it('API_LIMITER allows 100 requests per minute', () => {
      expect(API_LIMITER.getMaxRequests()).toBe(100);
      expect(API_LIMITER.getWindowMs()).toBe(60_000);
    });

    it('EXPORT_LIMITER allows 10 requests per minute', () => {
      expect(EXPORT_LIMITER.getMaxRequests()).toBe(10);
      expect(EXPORT_LIMITER.getWindowMs()).toBe(60_000);
    });
  });
});
