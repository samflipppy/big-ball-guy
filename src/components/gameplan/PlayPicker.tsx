'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PERSONNEL_GROUPS } from '@/lib/constants';
import type { Play, Formation } from '@/types';

export interface PlayPickerProps {
  plays: Play[];
  formations: Formation[];
  recentPlayIds: string[];
  onSelect: (playIds: string[]) => void;
  onClose: () => void;
  excludePlayIds?: string[];
}

export function PlayPicker({
  plays,
  formations,
  recentPlayIds,
  onSelect,
  onClose,
  excludePlayIds = [],
}: PlayPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterFormation, setFilterFormation] = useState('');
  const [filterPersonnel, setFilterPersonnel] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showRecent, setShowRecent] = useState(false);

  // Gather all unique tags from plays
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    plays.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [plays]);

  // Available plays (excluding already added)
  const availablePlays = useMemo(() => {
    return plays.filter((p) => !excludePlayIds.includes(p.id));
  }, [plays, excludePlayIds]);

  // Filter plays
  const filteredPlays = useMemo(() => {
    let result = showRecent
      ? availablePlays.filter((p) => recentPlayIds.includes(p.id))
      : availablePlays;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.category?.toLowerCase().includes(q),
      );
    }

    if (filterFormation) {
      result = result.filter((p) => p.formationId === filterFormation);
    }

    if (filterPersonnel) {
      result = result.filter((p) => p.personnel === filterPersonnel);
    }

    if (filterTag) {
      result = result.filter((p) => p.tags.includes(filterTag));
    }

    return result;
  }, [availablePlays, search, filterFormation, filterPersonnel, filterTag, showRecent, recentPlayIds]);

  const toggleSelection = useCallback((playId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playId)) {
        next.delete(playId);
      } else {
        next.add(playId);
      }
      return next;
    });
  }, []);

  const handleAddSelected = useCallback(() => {
    onSelect(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, onSelect]);

  const getFormationName = useCallback(
    (formationId: string) => {
      return formations.find((f) => f.id === formationId)?.name ?? 'Unknown';
    },
    [formations],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="play-picker-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" data-testid="play-picker-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Select Plays</h2>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleAddSelected}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                data-testid="add-selected-btn"
              >
                Add Selected ({selectedIds.size})
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              data-testid="close-picker-btn"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 space-y-2">
          <input
            type="text"
            placeholder="Search plays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="play-search-input"
            autoFocus
          />

          <div className="flex flex-wrap gap-2">
            <select
              value={filterFormation}
              onChange={(e) => setFilterFormation(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              data-testid="filter-formation"
            >
              <option value="">All Formations</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <select
              value={filterPersonnel}
              onChange={(e) => setFilterPersonnel(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              data-testid="filter-personnel"
            >
              <option value="">All Personnel</option>
              {PERSONNEL_GROUPS.map((pg) => (
                <option key={pg.code} value={pg.code}>
                  {pg.code} ({pg.description})
                </option>
              ))}
            </select>

            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              data-testid="filter-tag"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowRecent(!showRecent)}
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors',
                showRecent
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700',
              )}
              data-testid="recent-toggle"
            >
              Recent
            </button>
          </div>
        </div>

        {/* Play Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPlays.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-zinc-400 dark:text-zinc-500" data-testid="no-plays-message">
              No plays found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="play-grid">
              {filteredPlays.map((play) => (
                <button
                  key={play.id}
                  onClick={() => toggleSelection(play.id)}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border transition-all text-left',
                    selectedIds.has(play.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-zinc-800',
                  )}
                  data-testid={`play-option-${play.id}`}
                >
                  {/* Mini thumbnail */}
                  <div className="w-full h-16 bg-green-800 rounded mb-2 flex items-center justify-center relative">
                    <span className="text-white text-xs font-bold">{play.name.substring(0, 6)}</span>
                    {selectedIds.has(play.id) && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate w-full text-center">
                    {play.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {getFormationName(play.formationId)} - {play.personnel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {filteredPlays.length} {filteredPlays.length === 1 ? 'play' : 'plays'} available
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              data-testid="cancel-btn"
            >
              Cancel
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleAddSelected}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                data-testid="add-selected-footer-btn"
              >
                Add {selectedIds.size} {selectedIds.size === 1 ? 'Play' : 'Plays'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayPicker;
