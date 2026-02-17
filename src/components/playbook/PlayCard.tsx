'use client';

import { useState, useCallback } from 'react';
import { cn, formatDate } from '@/lib/utils';
import type { Play, Formation } from '@/types';

export type PlayCardSize = 'small' | 'medium';

interface PlayCardProps {
  play: Play;
  formation?: Formation;
  size?: PlayCardSize;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

function PlayThumbnail({
  formation,
  className,
}: {
  formation?: Formation;
  className?: string;
}) {
  if (!formation) {
    return (
      <div className={cn('flex items-center justify-center rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-400', className)}>
        <span className="text-xs">No formation</span>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 800 500"
      className={cn('rounded bg-emerald-900', className)}
      data-testid="play-thumbnail"
    >
      <line
        x1={0} y1={248} x2={800} y2={248}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={2}
      />
      {formation.players.map((p) => (
        <circle
          key={p.id}
          cx={p.location.x}
          cy={p.location.y}
          r={10}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function PlayCard({
  play,
  formation,
  size = 'small',
  selected = false,
  onSelect,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}: PlayCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleClick = useCallback(() => {
    onClick?.(play.id);
  }, [onClick, play.id]);

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(play.id);
    },
    [onSelect, play.id],
  );

  if (size === 'medium') {
    // List view - row layout
    return (
      <div
        className={cn(
          'group flex items-center gap-4 rounded-lg border px-4 py-3 transition-all',
          selected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500'
            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm',
          className,
        )}
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        data-testid={`play-card-${play.id}`}
        role="button"
        tabIndex={0}
      >
        {/* Checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(play.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600"
            data-testid={`play-select-${play.id}`}
          />
        )}

        {/* Thumbnail */}
        <PlayThumbnail formation={formation} className="h-12 w-20 flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{play.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formation?.name ?? 'Unknown'}</span>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{play.personnel}</span>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="text-xs text-zinc-400">{formatDate(play.updatedAt)}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="hidden gap-1 sm:flex">
          {play.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', tagColor(tag))}
            >
              {tag}
            </span>
          ))}
          {play.tags.length > 3 && (
            <span className="text-[10px] text-zinc-400">+{play.tags.length - 3}</span>
          )}
        </div>

        {/* Quick actions */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity',
            showActions ? 'opacity-100' : 'opacity-0',
          )}
          data-testid="play-actions"
        >
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(play.id);
              }}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300"
              title="Edit"
              data-testid={`play-edit-${play.id}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(play.id);
              }}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300"
              title="Duplicate"
              data-testid={`play-duplicate-${play.id}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(play.id);
              }}
              className="rounded p-1.5 text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500"
              title="Delete"
              data-testid={`play-delete-${play.id}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid view - card layout (size === 'small')
  return (
    <div
      className={cn(
        'group flex flex-col rounded-lg border transition-all overflow-hidden',
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500'
          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md',
        className,
      )}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`play-card-${play.id}`}
      role="button"
      tabIndex={0}
    >
      {/* Thumbnail */}
      <div className="relative">
        <PlayThumbnail formation={formation} className="h-28 w-full" />

        {/* Checkbox overlay */}
        {onSelect && (
          <div className="absolute left-2 top-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(play.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-white/50 bg-white/70 text-blue-600"
              data-testid={`play-select-${play.id}`}
            />
          </div>
        )}

        {/* Quick actions overlay */}
        <div
          className={cn(
            'absolute right-2 top-2 flex items-center gap-0.5 transition-opacity',
            showActions ? 'opacity-100' : 'opacity-0',
          )}
          data-testid="play-actions"
        >
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(play.id);
              }}
              className="rounded bg-white/90 p-1 text-zinc-500 shadow-sm hover:text-zinc-700"
              title="Edit"
              data-testid={`play-edit-${play.id}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(play.id);
              }}
              className="rounded bg-white/90 p-1 text-zinc-500 shadow-sm hover:text-zinc-700"
              title="Duplicate"
              data-testid={`play-duplicate-${play.id}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(play.id);
              }}
              className="rounded bg-white/90 p-1 text-zinc-500 shadow-sm hover:text-red-500"
              title="Delete"
              data-testid={`play-delete-${play.id}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{play.name}</h4>
        <p className="text-xs text-zinc-500 truncate">
          {formation?.name ?? 'Unknown Formation'} · {play.personnel}
        </p>
        {play.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {play.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', tagColor(tag))}
              >
                {tag}
              </span>
            ))}
            {play.tags.length > 2 && (
              <span className="text-[10px] text-zinc-400">+{play.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
