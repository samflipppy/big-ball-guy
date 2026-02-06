/**
 * IndexedDB Storage Limits (#222)
 *
 * Utilities for inspecting how much of the browser's storage quota is in
 * use, estimating per-store sizes, and providing cleanup recommendations
 * to keep the app within safe limits.
 */

import { getDB, type StoreName } from '@/lib/db/indexeddb';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StorageEstimate {
  usage: number;
  quota: number;
  percentUsed: number;
}

export type WarningLevel = 'info' | 'warning' | 'critical';

export interface StorageWarning {
  level: WarningLevel;
  message: string;
  percentUsed: number;
}

export interface CleanupRecommendation {
  action: string;
  storeName?: string;
  estimatedSavings?: string;
}

// ---------------------------------------------------------------------------
// Storage inspection
// ---------------------------------------------------------------------------

/**
 * Query the Storage API for the current usage & quota, returning a
 * percentage as well. Falls back to zeros when the API is unavailable.
 */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.storage ||
    !navigator.storage.estimate
  ) {
    return { usage: 0, quota: 0, percentUsed: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

  return { usage, quota, percentUsed };
}

/**
 * Estimate the byte-size of all records stored in a single IDB object
 * store by serialising every record to JSON and summing the lengths.
 */
export async function getStoreSize(storeName: string): Promise<number> {
  const db = await getDB();
  const all = await db.getAll(storeName as StoreName);
  let size = 0;
  for (const record of all) {
    size += new Blob([JSON.stringify(record)]).size;
  }
  return size;
}

// ---------------------------------------------------------------------------
// Cleanup helpers
// ---------------------------------------------------------------------------

/**
 * Given a StorageEstimate, return appropriate cleanup recommendations.
 */
export function suggestCleanup(usage: StorageEstimate): CleanupRecommendation[] {
  const recs: CleanupRecommendation[] = [];

  if (usage.percentUsed >= 90) {
    recs.push({
      action: 'Delete old practice scripts and game plans',
      storeName: 'practiceScripts',
    });
    recs.push({
      action: 'Archive plays from previous seasons',
      storeName: 'plays',
    });
    recs.push({
      action: 'Clear pending sync queue',
      storeName: 'pendingSync',
    });
  } else if (usage.percentUsed >= 70) {
    recs.push({
      action: 'Consider archiving old scouting notes',
      storeName: 'scoutingNotes',
    });
    recs.push({
      action: 'Remove unused formations',
      storeName: 'formations',
    });
  } else if (usage.percentUsed >= 50) {
    recs.push({
      action: 'Storage usage is moderate - no immediate action needed',
    });
  }

  return recs;
}

/**
 * Remove records from sync-sensitive stores whose `createdAt` or
 * `timestamp` is older than the given number of days.
 */
export async function cleanupOldData(daysOld: number): Promise<number> {
  const db = await getDB();
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let removed = 0;

  // Clean up pending sync entries older than the threshold
  const syncEntries = await db.getAll('pendingSync');
  const tx = db.transaction('pendingSync', 'readwrite');
  for (const entry of syncEntries) {
    const record = entry as { id: string; timestamp?: number };
    if (record.timestamp && record.timestamp < cutoff) {
      tx.store.delete(record.id);
      removed++;
    }
  }
  await tx.done;

  return removed;
}

/**
 * Build a StorageWarning from a StorageEstimate.
 */
export function getStorageWarning(estimate: StorageEstimate): StorageWarning {
  if (estimate.percentUsed >= 90) {
    return {
      level: 'critical',
      message: 'Storage is almost full. Please free up space to avoid data loss.',
      percentUsed: estimate.percentUsed,
    };
  }

  if (estimate.percentUsed >= 70) {
    return {
      level: 'warning',
      message: 'Storage usage is high. Consider cleaning up old data.',
      percentUsed: estimate.percentUsed,
    };
  }

  return {
    level: 'info',
    message: 'Storage usage is within normal limits.',
    percentUsed: estimate.percentUsed,
  };
}
