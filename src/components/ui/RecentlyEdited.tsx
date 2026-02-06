'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getRecentlyEdited, clearSessionState, type RecentItem } from '@/lib/session';

// ---- Icon helpers ----

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function GamePlanIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

function PracticeIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function iconForType(type: RecentItem['type']) {
  switch (type) {
    case 'play':
      return <PlayIcon className="text-blue-500" />;
    case 'gameplan':
      return <GamePlanIcon className="text-amber-500" />;
    case 'practice':
      return <PracticeIcon className="text-green-500" />;
  }
}

// ---- Relative time ----

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

// ---- Component ----

export interface RecentlyEditedProps {
  className?: string;
  onNavigate?: (item: RecentItem) => void;
}

export function RecentlyEdited({ className, onNavigate }: RecentlyEditedProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RecentItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getRecentlyEdited());
  }, []);

  // Load items on mount and when dropdown opens
  useEffect(() => {
    refresh();
  }, [open, refresh]);

  const handleClear = () => {
    clearSessionState();
    setItems([]);
    setOpen(false);
  };

  const handleItemClick = (item: RecentItem) => {
    onNavigate?.(item);
    setOpen(false);
  };

  return (
    <div className={cn('relative', className)} data-testid="recently-edited">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
          'dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
        )}
        aria-label="Recently edited"
        aria-expanded={open}
        data-testid="recently-edited-trigger"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Recent
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-zinc-200 bg-white shadow-lg',
            'dark:border-zinc-700 dark:bg-zinc-900',
          )}
          data-testid="recently-edited-dropdown"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-700">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recently Edited
            </span>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                data-testid="clear-recent-button"
              >
                Clear Recent
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto py-1" role="list">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500" data-testid="empty-recent">
                No recently edited items
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                      'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                    )}
                    data-testid={`recent-item-${item.id}`}
                  >
                    <span className="shrink-0">{iconForType(item.type)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </span>
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                        {item.type} &middot; {formatRelativeTime(item.timestamp)}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default RecentlyEdited;
