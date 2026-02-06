'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { SyncStatus } from '@/types';

type IndicatorState = 'hidden' | 'offline' | 'syncing' | 'synced';

export interface OfflineIndicatorProps {
  /** Optional SyncStatus from useAutoSave to show pending change counts */
  syncStatus?: SyncStatus;
  className?: string;
}

/**
 * Floating banner that appears when the user goes offline.
 * Shows pending sync count, animates in/out on online/offline events,
 * and shows a "synced" confirmation when back online.
 */
export function OfflineIndicator({ syncStatus, className }: OfflineIndicatorProps) {
  const [indicatorState, setIndicatorState] = useState<IndicatorState>('hidden');
  const [dismissed, setDismissed] = useState(false);

  const { isOnline } = useNetworkStatus({
    onOffline: useCallback(() => {
      setDismissed(false);
      setIndicatorState('offline');
    }, []),
    onOnline: useCallback(() => {
      setDismissed(false);
      setIndicatorState('syncing');
    }, []),
  });

  // Transition from syncing -> synced -> hidden
  useEffect(() => {
    if (indicatorState !== 'syncing') return;

    const isSyncing = syncStatus?.isSyncing ?? false;
    const pendingChanges = syncStatus?.pendingChanges ?? 0;

    // Wait until sync is actually done
    if (!isSyncing && pendingChanges === 0) {
      setIndicatorState('synced');
    }
  }, [indicatorState, syncStatus?.isSyncing, syncStatus?.pendingChanges]);

  // Auto-hide after showing "synced"
  useEffect(() => {
    if (indicatorState !== 'synced') return;

    const timer = setTimeout(() => {
      setIndicatorState('hidden');
    }, 3000);

    return () => clearTimeout(timer);
  }, [indicatorState]);

  // If we start offline on mount, show the indicator
  useEffect(() => {
    if (!isOnline) {
      setIndicatorState('offline');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render when hidden or dismissed (but re-appear on new offline event)
  if (indicatorState === 'hidden' || dismissed) {
    return null;
  }

  const pendingCount = syncStatus?.pendingChanges ?? 0;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        className,
      )}
      role="status"
      aria-live="polite"
      data-testid="offline-indicator"
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-full px-4 py-2 shadow-lg',
          'text-sm font-medium',
          indicatorState === 'offline' && 'bg-zinc-800 text-white dark:bg-zinc-700',
          indicatorState === 'syncing' && 'bg-amber-500 text-white',
          indicatorState === 'synced' && 'bg-green-600 text-white',
        )}
      >
        {/* Status dot */}
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            indicatorState === 'offline' && 'bg-zinc-400 animate-pulse',
            indicatorState === 'syncing' && 'bg-white animate-pulse',
            indicatorState === 'synced' && 'bg-white',
          )}
          aria-hidden="true"
        />

        {/* Message */}
        <span data-testid="offline-indicator-message">
          {indicatorState === 'offline' && (
            <>
              {"You're offline \u2014 changes saved locally"}
              {pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs" data-testid="pending-count">
                  {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending sync
                </span>
              )}
            </>
          )}
          {indicatorState === 'syncing' && 'Back online \u2014 syncing...'}
          {indicatorState === 'synced' && 'All changes synced'}
        </span>

        {/* Dismiss button (only when offline) */}
        {indicatorState === 'offline' && (
          <button
            onClick={handleDismiss}
            className="ml-1 rounded-full p-1 hover:bg-white/20 transition-colors"
            aria-label="Dismiss offline notification"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default OfflineIndicator;
