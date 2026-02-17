'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StorageQuotaInfo {
  /** Bytes used */
  usage: number;
  /** Total quota in bytes */
  quota: number;
  /** 0-100 */
  percentUsed: number;
  /** >= 80% */
  isWarning: boolean;
  /** >= 95% */
  isCritical: boolean;
}

export interface UseStorageQuotaOptions {
  /** Poll interval in ms (default 30 000) */
  pollInterval?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_POLL_INTERVAL = 30_000;
const WARNING_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 95;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Polls `navigator.storage.estimate()` and returns current quota info.
 */
export function useStorageQuota(
  options: UseStorageQuotaOptions = {},
): StorageQuotaInfo {
  const { pollInterval = DEFAULT_POLL_INTERVAL } = options;

  const [info, setInfo] = useState<StorageQuotaInfo>({
    usage: 0,
    quota: 0,
    percentUsed: 0,
    isWarning: false,
    isCritical: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const estimate = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;

    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;

      setInfo({
        usage,
        quota,
        percentUsed,
        isWarning: percentUsed >= WARNING_THRESHOLD,
        isCritical: percentUsed >= CRITICAL_THRESHOLD,
      });
    } catch {
      // Storage API may throw in some contexts — leave state unchanged
    }
  }, []);

  useEffect(() => {
    // Initial estimate
    estimate();

    // Poll
    intervalRef.current = setInterval(estimate, pollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [estimate, pollInterval]);

  return info;
}
