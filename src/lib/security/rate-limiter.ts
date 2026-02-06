/**
 * Rate limiter using a sliding window algorithm.
 *
 * Tracks request counts per key within a configurable time window
 * and enforces rate limits for various application endpoints.
 */

// --- Types ---

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface WindowEntry {
  timestamp: number;
}

// --- Rate Limiter Class ---

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private windows: Map<string, WindowEntry[]>;

  constructor(maxRequests: number, windowMs: number) {
    if (maxRequests <= 0) {
      throw new Error('maxRequests must be a positive number');
    }
    if (windowMs <= 0) {
      throw new Error('windowMs must be a positive number');
    }

    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.windows = new Map();
  }

  /**
   * Remove expired entries outside the sliding window for a given key.
   */
  private pruneExpired(key: string, now: number): WindowEntry[] {
    const entries = this.windows.get(key) || [];
    const cutoff = now - this.windowMs;
    const valid = entries.filter((e) => e.timestamp > cutoff);
    this.windows.set(key, valid);
    return valid;
  }

  /**
   * Check the current rate limit status for a key without consuming a request.
   */
  checkLimit(key: string): RateLimitResult {
    const now = Date.now();
    const entries = this.pruneExpired(key, now);
    const count = entries.length;
    const remaining = Math.max(0, this.maxRequests - count);
    const allowed = count < this.maxRequests;

    // resetAt: when the oldest entry in the window expires
    const resetAt =
      entries.length > 0
        ? entries[0].timestamp + this.windowMs
        : now + this.windowMs;

    return { allowed, remaining, resetAt };
  }

  /**
   * Consume one request from the quota for a key.
   * Returns the updated rate limit status.
   */
  consume(key: string): RateLimitResult {
    const now = Date.now();
    const entries = this.pruneExpired(key, now);

    if (entries.length >= this.maxRequests) {
      const resetAt = entries[0].timestamp + this.windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    entries.push({ timestamp: now });
    this.windows.set(key, entries);

    const remaining = Math.max(0, this.maxRequests - entries.length);
    const resetAt = entries[0].timestamp + this.windowMs;

    return { allowed: true, remaining, resetAt };
  }

  /**
   * Reset the rate limit for a specific key.
   */
  reset(key: string): void {
    this.windows.delete(key);
  }

  /**
   * Clear all tracked rate limit data.
   */
  clearAll(): void {
    this.windows.clear();
  }

  /**
   * Get the configured max requests.
   */
  getMaxRequests(): number {
    return this.maxRequests;
  }

  /**
   * Get the configured window in milliseconds.
   */
  getWindowMs(): number {
    return this.windowMs;
  }
}

// --- Preset configurations ---

/** Authentication endpoints: 5 requests per minute */
export const AUTH_LIMITER = new RateLimiter(5, 60 * 1000);

/** General API endpoints: 100 requests per minute */
export const API_LIMITER = new RateLimiter(100, 60 * 1000);

/** Export endpoints: 10 requests per minute */
export const EXPORT_LIMITER = new RateLimiter(10, 60 * 1000);
