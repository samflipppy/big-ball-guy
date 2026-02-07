'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useStorageQuota } from '@/hooks/useStorageQuota';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StorageIndicatorProps {
  /** Expand to show detailed per-store breakdown */
  showDetails?: boolean;
  /** Called when user clicks "Clear old data" */
  onClearOldData?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Compact storage-usage indicator with an optional expanded detail view.
 */
export function StorageIndicator({
  showDetails = false,
  onClearOldData,
  className,
}: StorageIndicatorProps) {
  const { usage, quota, percentUsed, isWarning, isCritical } = useStorageQuota();
  const [expanded, setExpanded] = useState(showDetails);

  const barColor = isCritical
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-blue-500';

  const statusText = isCritical
    ? 'Storage almost full'
    : isWarning
      ? 'Storage getting full'
      : 'Storage';

  return (
    <div
      className={cn('rounded-md border p-2 text-xs', className)}
      data-testid="storage-indicator"
    >
      {/* Header row */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2"
        onClick={() => setExpanded((prev) => !prev)}
        data-testid="storage-indicator-toggle"
        aria-expanded={expanded}
      >
        <span
          className={cn(
            'font-medium',
            isCritical && 'text-red-600 dark:text-red-400',
            isWarning && !isCritical && 'text-amber-600 dark:text-amber-400',
          )}
          data-testid="storage-status-text"
        >
          {statusText}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400" data-testid="storage-percent">
          {percentUsed}%
        </span>
      </button>

      {/* Progress bar */}
      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="progressbar"
        aria-valuenow={percentUsed}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="storage-bar"
      >
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
          data-testid="storage-bar-fill"
        />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 space-y-1" data-testid="storage-details">
          <p className="text-zinc-600 dark:text-zinc-400" data-testid="storage-usage-detail">
            {formatBytes(usage)} of {formatBytes(quota)} used
          </p>

          {(isWarning || isCritical) && onClearOldData && (
            <button
              type="button"
              onClick={onClearOldData}
              className="mt-1 rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
              data-testid="storage-clear-btn"
            >
              Clear old data
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default StorageIndicator;
