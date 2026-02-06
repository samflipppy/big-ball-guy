'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/types';

export interface SyncStatusBarProps {
  status: SyncStatus;
  className?: string;
}

function getTimeSince(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

type SyncState = 'saved' | 'saving' | 'offline' | 'error';

function deriveSyncState(status: SyncStatus): SyncState {
  if (status.isSyncing) return 'saving';
  if (!status.isOnline) return 'offline';
  if (status.pendingChanges > 0) return 'error';
  return 'saved';
}

const stateConfig: Record<SyncState, { label: string; dotColor: string; textColor: string }> = {
  saved: {
    label: 'All changes saved',
    dotColor: 'bg-green-500',
    textColor: 'text-zinc-500 dark:text-zinc-400',
  },
  saving: {
    label: 'Saving...',
    dotColor: 'bg-amber-500 animate-pulse',
    textColor: 'text-zinc-500 dark:text-zinc-400',
  },
  offline: {
    label: 'Offline — changes saved locally',
    dotColor: 'bg-zinc-400',
    textColor: 'text-zinc-500 dark:text-zinc-400',
  },
  error: {
    label: 'Sync error',
    dotColor: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
  },
};

export function SyncStatusBar({ status, className }: SyncStatusBarProps) {
  const [, setTick] = useState(0);
  const syncState = deriveSyncState(status);
  const config = stateConfig[syncState];
  const timeSince = getTimeSince(status.lastSaved);

  // Re-render every 30s to update "time since last save"
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn('flex items-center gap-2 text-xs', config.textColor, className)}
      role="status"
      aria-live="polite"
      aria-label="Sync status"
    >
      <span
        className={cn('h-2 w-2 rounded-full shrink-0', config.dotColor)}
        aria-hidden="true"
      />
      <span>{config.label}</span>
      {syncState === 'saved' && timeSince && (
        <span className="text-zinc-400 dark:text-zinc-500">
          {timeSince}
        </span>
      )}
    </div>
  );
}

export default SyncStatusBar;
