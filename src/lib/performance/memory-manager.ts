// ============================================================
// #228 — Memory Management
// Utilities for monitoring heap usage, detecting memory leaks,
// providing GC hints, and pruning caches.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemorySnapshot {
  heapUsed: number;  // bytes
  heapTotal: number; // bytes
  heapLimit: number; // bytes
  timestamp: number; // ms epoch
}

export type GarbageCollectionHint = 'aggressive' | 'normal' | 'relaxed';

export interface CleanupRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

// ---------------------------------------------------------------------------
// getMemoryUsage
// ---------------------------------------------------------------------------

/**
 * Return current memory usage from `performance.memory` (Chrome) or
 * a sensible mock when the API is unavailable (e.g. Firefox, Node).
 */
export function getMemoryUsage(): MemorySnapshot {
  // Chrome exposes performance.memory (non-standard)
  if (
    typeof performance !== 'undefined' &&
    (performance as unknown as Record<string, unknown>).memory
  ) {
    const mem = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    return {
      heapUsed: mem.usedJSHeapSize,
      heapTotal: mem.totalJSHeapSize,
      heapLimit: mem.jsHeapSizeLimit,
      timestamp: Date.now(),
    };
  }

  // Fallback mock
  return {
    heapUsed: 0,
    heapTotal: 0,
    heapLimit: 0,
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// detectMemoryLeak
// ---------------------------------------------------------------------------

/**
 * Analyse a series of memory snapshots to determine whether heap usage
 * is monotonically increasing (potential leak).
 *
 * @param snapshots - ordered list of snapshots (oldest first)
 * @param windowSize - minimum number of consecutive increases to flag a leak (default 5)
 * @returns object with `leakDetected` flag and supporting data
 */
export function detectMemoryLeak(
  snapshots: MemorySnapshot[],
  windowSize: number = 5,
): { leakDetected: boolean; growthRate: number; message: string } {
  if (snapshots.length < windowSize) {
    return {
      leakDetected: false,
      growthRate: 0,
      message: `Insufficient data: need at least ${windowSize} snapshots, got ${snapshots.length}`,
    };
  }

  // Check for consecutive increases within the window
  const tail = snapshots.slice(-windowSize);
  let consecutiveIncreases = 0;
  for (let i = 1; i < tail.length; i++) {
    if (tail[i].heapUsed > tail[i - 1].heapUsed) {
      consecutiveIncreases++;
    }
  }

  const first = tail[0];
  const last = tail[tail.length - 1];
  const elapsed = last.timestamp - first.timestamp;
  const growth = last.heapUsed - first.heapUsed;
  const growthRate = elapsed > 0 ? (growth / elapsed) * 1000 : 0; // bytes per second

  const leakDetected = consecutiveIncreases === windowSize - 1;

  return {
    leakDetected,
    growthRate,
    message: leakDetected
      ? `Potential memory leak: heap grew by ${growth} bytes over ${tail.length} snapshots (${growthRate.toFixed(0)} bytes/s)`
      : `No leak detected: ${consecutiveIncreases}/${windowSize - 1} consecutive increases`,
  };
}

// ---------------------------------------------------------------------------
// suggestCleanup
// ---------------------------------------------------------------------------

/**
 * Return cleanup recommendations based on current memory usage.
 */
export function suggestCleanup(usage: MemorySnapshot): CleanupRecommendation[] {
  const recommendations: CleanupRecommendation[] = [];
  const usageRatio = usage.heapLimit > 0 ? usage.heapUsed / usage.heapLimit : 0;

  if (usageRatio > 0.9) {
    recommendations.push({
      action: 'Clear all non-essential caches',
      priority: 'high',
      reason: `Heap usage at ${(usageRatio * 100).toFixed(0)}% of limit`,
    });
    recommendations.push({
      action: 'Dispose offscreen canvas elements',
      priority: 'high',
      reason: 'Canvas buffers consume significant memory',
    });
  } else if (usageRatio > 0.7) {
    recommendations.push({
      action: 'Prune LRU caches to 50% capacity',
      priority: 'medium',
      reason: `Heap usage at ${(usageRatio * 100).toFixed(0)}% of limit`,
    });
    recommendations.push({
      action: 'Release unused image thumbnails',
      priority: 'medium',
      reason: 'Image data can be regenerated on demand',
    });
  } else if (usageRatio > 0.5) {
    recommendations.push({
      action: 'Consider lazy-loading large data sets',
      priority: 'low',
      reason: `Heap usage at ${(usageRatio * 100).toFixed(0)}% of limit`,
    });
  }

  if (usage.heapTotal > 0 && usage.heapUsed / usage.heapTotal < 0.5) {
    recommendations.push({
      action: 'Heap is fragmented — consider compacting data structures',
      priority: 'low',
      reason: `Only ${((usage.heapUsed / usage.heapTotal) * 100).toFixed(0)}% of allocated heap is used`,
    });
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// getGCHint
// ---------------------------------------------------------------------------

/**
 * Suggest a garbage collection strategy based on memory pressure.
 */
export function getGCHint(usage: MemorySnapshot): GarbageCollectionHint {
  if (usage.heapLimit <= 0) return 'normal';

  const pressure = usage.heapUsed / usage.heapLimit;

  if (pressure > 0.85) return 'aggressive';
  if (pressure > 0.6) return 'normal';
  return 'relaxed';
}

// ---------------------------------------------------------------------------
// pruneCache
// ---------------------------------------------------------------------------

/**
 * Prune a Map-based cache down to `maxEntries` using an LRU-like strategy
 * (oldest inserted keys are removed first — Map iteration order).
 *
 * @returns the number of entries removed
 */
export function pruneCache(cache: Map<string, unknown>, maxEntries: number): number {
  if (cache.size <= maxEntries) return 0;

  const toRemove = cache.size - maxEntries;
  let removed = 0;
  const keys = cache.keys();

  for (const key of keys) {
    if (removed >= toRemove) break;
    cache.delete(key);
    removed++;
  }

  return removed;
}
