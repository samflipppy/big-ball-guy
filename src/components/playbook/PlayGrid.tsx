'use client';

import { cn } from '@/lib/utils';
import PlayCard from './PlayCard';
import type { Play, Formation } from '@/types';
import type { ViewMode, SortField, SortDirection } from '@/hooks/usePlaybook';

interface PlayGridProps {
  plays: Play[];
  formations: Formation[];
  viewMode: ViewMode;
  selectedPlayIds: string[];
  sortField: SortField;
  sortDirection: SortDirection;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onSelectPlay: (id: string) => void;
  onClickPlay: (id: string) => void;
  onEditPlay?: (id: string) => void;
  onDuplicatePlay?: (id: string) => void;
  onDeletePlay?: (id: string) => void;
  className?: string;
}

const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: 'Name', field: 'name' },
  { label: 'Created', field: 'createdAt' },
  { label: 'Modified', field: 'updatedAt' },
  { label: 'Formation', field: 'formation' },
];

export default function PlayGrid({
  plays,
  formations,
  viewMode,
  selectedPlayIds,
  sortField,
  sortDirection,
  onViewModeChange,
  onSortChange,
  onSelectPlay,
  onClickPlay,
  onEditPlay,
  onDuplicatePlay,
  onDeletePlay,
  className,
}: PlayGridProps) {
  const getFormation = (formationId: string): Formation | undefined => {
    return formations.find((f) => f.id === formationId);
  };

  if (plays.length === 0) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center py-24', className)}
        data-testid="play-grid-empty"
      >
        <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-6 mb-4">
          <svg className="h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No plays yet</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Create your first play to get started building your playbook.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)} data-testid="play-grid">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 py-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400" data-testid="play-count">
          {plays.length} play{plays.length !== 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-3">
          {/* Sort selector */}
          <div className="flex items-center gap-1">
            <label htmlFor="sort-select" className="text-xs text-zinc-500 dark:text-zinc-400">Sort:</label>
            <select
              id="sort-select"
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as SortField, sortDirection)}
              className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              data-testid="sort-select"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.field} value={opt.field}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')
              }
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-300"
              title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              data-testid="sort-direction"
            >
              {sortDirection === 'asc' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              )}
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-zinc-300 dark:border-zinc-600 p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'rounded px-2 py-1',
                viewMode === 'grid'
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
              )}
              title="Grid view"
              data-testid="view-grid"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'rounded px-2 py-1',
                viewMode === 'list'
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
              )}
              title="List view"
              data-testid="view-list"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Play cards */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'grid' ? (
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            data-testid="play-grid-layout"
          >
            {plays.map((play) => (
              <PlayCard
                key={play.id}
                play={play}
                formation={getFormation(play.formationId)}
                size="small"
                selected={selectedPlayIds.includes(play.id)}
                onSelect={onSelectPlay}
                onClick={onClickPlay}
                onEdit={onEditPlay}
                onDuplicate={onDuplicatePlay}
                onDelete={onDeletePlay}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2" data-testid="play-list-layout">
            {plays.map((play) => (
              <PlayCard
                key={play.id}
                play={play}
                formation={getFormation(play.formationId)}
                size="medium"
                selected={selectedPlayIds.includes(play.id)}
                onSelect={onSelectPlay}
                onClick={onClickPlay}
                onEdit={onEditPlay}
                onDuplicate={onDuplicatePlay}
                onDelete={onDeletePlay}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
