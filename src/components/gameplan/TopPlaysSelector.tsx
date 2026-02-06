'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Play, Formation } from '@/types';
import type { DefensiveFront } from '@/lib/defenses';

// --- Types ---

export interface TopPlaysEntry {
  formationId: string;
  frontId: string;
  playIds: string[];
}

export interface TopPlaysSelectorProps {
  formations: Formation[];
  fronts: DefensiveFront[];
  plays: Play[];
  onSave: (entries: TopPlaysEntry[]) => void;
}

const MAX_PLAYS = 5;

/**
 * Compute a simple effectiveness score for a play vs a front.
 * Uses tag matching to suggest relevant plays.
 */
function computeEffectiveness(play: Play, front: DefensiveFront): number {
  let score = 0;
  const frontNameLower = front.name.toLowerCase();
  const playTags = play.tags.map((t) => t.toLowerCase());

  // Reward run plays vs heavy fronts
  if (playTags.includes('run') && (frontNameLower.includes('3-4') || frontNameLower.includes('5-2'))) {
    score += 1;
  }
  // Reward pass plays vs light fronts
  if (playTags.includes('pass') && (frontNameLower.includes('nickel') || frontNameLower.includes('dime'))) {
    score += 1;
  }
  // Reward zone-beaters vs zone-heavy fronts
  if (playTags.includes('zone-beater') || playTags.includes('cover-3-beater')) {
    score += 1;
  }
  // Reward man-beaters vs man-coverage fronts
  if (playTags.includes('man-beater') && frontNameLower.includes('man')) {
    score += 1;
  }
  // General tag bonuses
  if (playTags.includes('quick game')) score += 0.5;
  if (playTags.includes('high-percentage')) score += 0.5;

  return score;
}

/**
 * TopPlaysSelector: For each formation x defense front combination,
 * select the best 5 plays. Matrix layout with drag-to-reorder support,
 * auto-suggestion, gap highlighting, and export capability.
 */
export function TopPlaysSelector({
  formations,
  fronts,
  plays,
  onSave,
}: TopPlaysSelectorProps) {
  // State: map of "formationId::frontId" -> ordered play IDs
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [draggedPlay, setDraggedPlay] = useState<{ cellKey: string; index: number } | null>(null);

  // Build a key for each formation/front combo
  const cellKey = useCallback((fId: string, frId: string) => `${fId}::${frId}`, []);

  // Get plays for a formation
  const playsByFormation = useMemo(() => {
    const map: Record<string, Play[]> = {};
    for (const f of formations) {
      map[f.id] = plays.filter((p) => p.formationId === f.id);
    }
    return map;
  }, [formations, plays]);

  // Auto-suggest plays for a cell based on effectiveness
  const getSuggestions = useCallback(
    (formationId: string, front: DefensiveFront): Play[] => {
      const formationPlays = playsByFormation[formationId] || [];
      const scored = formationPlays.map((p) => ({
        play: p,
        score: computeEffectiveness(p, front),
      }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, MAX_PLAYS).map((s) => s.play);
    },
    [playsByFormation],
  );

  // Get current selection for a cell, or empty array
  const getSelection = useCallback(
    (key: string): string[] => selections[key] ?? [],
    [selections],
  );

  // Auto-fill a cell with suggestions
  const handleAutoFill = useCallback(
    (formationId: string, front: DefensiveFront) => {
      const key = cellKey(formationId, front.id);
      const suggested = getSuggestions(formationId, front);
      setSelections((prev) => ({
        ...prev,
        [key]: suggested.map((p) => p.id),
      }));
    },
    [cellKey, getSuggestions],
  );

  // Toggle a play in a cell
  const handleTogglePlay = useCallback(
    (key: string, playId: string) => {
      setSelections((prev) => {
        const current = prev[key] ?? [];
        if (current.includes(playId)) {
          return { ...prev, [key]: current.filter((id) => id !== playId) };
        }
        if (current.length >= MAX_PLAYS) return prev;
        return { ...prev, [key]: [...current, playId] };
      });
    },
    [],
  );

  // Remove a play from a cell
  const handleRemovePlay = useCallback(
    (key: string, playId: string) => {
      setSelections((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).filter((id) => id !== playId),
      }));
    },
    [],
  );

  // Drag handlers for reordering within a cell
  const handleDragStart = useCallback(
    (key: string, index: number) => {
      setDraggedPlay({ cellKey: key, index });
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, key: string, targetIndex: number) => {
      e.preventDefault();
      if (!draggedPlay || draggedPlay.cellKey !== key) return;

      const sourceIndex = draggedPlay.index;
      if (sourceIndex === targetIndex) return;

      setSelections((prev) => {
        const current = [...(prev[key] ?? [])];
        const [moved] = current.splice(sourceIndex, 1);
        current.splice(targetIndex, 0, moved);
        return { ...prev, [key]: current };
      });
      setDraggedPlay({ cellKey: key, index: targetIndex });
    },
    [draggedPlay],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedPlay(null);
  }, []);

  // Save handler
  const handleSave = useCallback(() => {
    const entries: TopPlaysEntry[] = [];
    for (const [key, playIds] of Object.entries(selections)) {
      const [formationId, frontId] = key.split('::');
      if (playIds.length > 0) {
        entries.push({ formationId, frontId, playIds });
      }
    }
    onSave(entries);
  }, [selections, onSave]);

  // Export as text for quick reference card
  const handleExport = useCallback(() => {
    const lines: string[] = ['TOP PLAYS QUICK REFERENCE', '='.repeat(40), ''];
    for (const f of formations) {
      for (const fr of fronts) {
        const key = cellKey(f.id, fr.id);
        const selected = getSelection(key);
        if (selected.length > 0) {
          lines.push(`${f.name} vs ${fr.name}:`);
          selected.forEach((playId, i) => {
            const play = plays.find((p) => p.id === playId);
            lines.push(`  ${i + 1}. ${play?.name ?? playId}`);
          });
          lines.push('');
        }
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top-plays-reference.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [formations, fronts, plays, cellKey, getSelection]);

  // Count gaps (cells with fewer than 5 plays)
  const gapCount = useMemo(() => {
    let gaps = 0;
    for (const f of formations) {
      for (const fr of fronts) {
        const key = cellKey(f.id, fr.id);
        const selected = getSelection(key);
        if (selected.length < MAX_PLAYS) gaps++;
      }
    }
    return gaps;
  }, [formations, fronts, cellKey, getSelection]);

  const playMap = useMemo(() => {
    const map = new Map<string, Play>();
    for (const p of plays) map.set(p.id, p);
    return map;
  }, [plays]);

  if (formations.length === 0 || fronts.length === 0) {
    return (
      <div className="p-8 text-center" data-testid="top-plays-selector">
        <p className="text-sm text-zinc-400" data-testid="top-plays-empty">
          Add formations and defensive fronts to build your top plays matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="top-plays-selector">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Top 5 Plays Selector
          </h2>
          <p className="text-sm text-zinc-500">
            {formations.length} formations &times; {fronts.length} fronts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {gapCount > 0 && (
            <span
              className="text-sm text-amber-600 dark:text-amber-400 font-medium"
              data-testid="gap-count"
            >
              {gapCount} gaps remaining
            </span>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 text-sm font-medium border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            data-testid="export-top-plays"
          >
            Export
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md"
            data-testid="save-top-plays"
          >
            Save
          </button>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]" data-testid="top-plays-matrix">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-bold text-zinc-600 dark:text-zinc-400 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                Formation
              </th>
              {fronts.map((fr) => (
                <th
                  key={fr.id}
                  className="p-2 text-center text-sm font-bold text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
                  data-testid={`front-header-${fr.id}`}
                >
                  {fr.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formations.map((f) => (
              <tr key={f.id}>
                <td
                  className="p-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap sticky left-0 bg-white dark:bg-zinc-900 z-10"
                  data-testid={`formation-row-${f.id}`}
                >
                  {f.name}
                </td>
                {fronts.map((fr) => {
                  const key = cellKey(f.id, fr.id);
                  const selected = getSelection(key);
                  const isActive = activeCell === key;
                  const hasGap = selected.length < MAX_PLAYS;

                  return (
                    <td key={fr.id} className="p-1">
                      <div
                        className={cn(
                          'border rounded-lg p-2 min-h-[80px] transition-all cursor-pointer',
                          hasGap
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30'
                            : 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30',
                          isActive && 'ring-2 ring-blue-500',
                        )}
                        onClick={() => setActiveCell(isActive ? null : key)}
                        data-testid={`cell-${f.id}-${fr.id}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${f.name} vs ${fr.name}: ${selected.length} of ${MAX_PLAYS} plays selected`}
                      >
                        {/* Play count badge */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cn(
                              'text-xs font-bold',
                              hasGap
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-green-600 dark:text-green-400',
                            )}
                            data-testid={`cell-count-${f.id}-${fr.id}`}
                          >
                            {selected.length}/{MAX_PLAYS}
                          </span>
                          {hasGap && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoFill(f.id, fr);
                              }}
                              className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              data-testid={`auto-fill-${f.id}-${fr.id}`}
                            >
                              Auto-fill
                            </button>
                          )}
                        </div>

                        {/* Selected plays list (draggable) */}
                        <div className="space-y-0.5">
                          {selected.map((playId, idx) => {
                            const play = playMap.get(playId);
                            return (
                              <div
                                key={playId}
                                className={cn(
                                  'flex items-center gap-1 text-xs rounded px-1 py-0.5 cursor-grab',
                                  draggedPlay?.cellKey === key && draggedPlay.index === idx
                                    ? 'opacity-50 bg-blue-100 dark:bg-blue-900'
                                    : 'bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700',
                                )}
                                draggable
                                onDragStart={() => handleDragStart(key, idx)}
                                onDragOver={(e) => handleDragOver(e, key, idx)}
                                onDragEnd={handleDragEnd}
                                data-testid={`play-item-${key}-${idx}`}
                              >
                                <span className="text-zinc-400 font-mono w-3">{idx + 1}.</span>
                                <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                  {play?.name ?? playId}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePlay(key, playId);
                                  }}
                                  className="text-zinc-400 hover:text-red-500 text-[10px] leading-none"
                                  aria-label={`Remove ${play?.name ?? playId}`}
                                  data-testid={`remove-play-${key}-${idx}`}
                                >
                                  x
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active cell detail panel */}
      {activeCell && (
        <div
          className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900"
          data-testid="cell-detail-panel"
        >
          {(() => {
            const [formationId, frontId] = activeCell.split('::');
            const formation = formations.find((f) => f.id === formationId);
            const front = fronts.find((fr) => fr.id === frontId);
            const selected = getSelection(activeCell);
            const availablePlays = (playsByFormation[formationId] || []).filter(
              (p) => !selected.includes(p.id),
            );

            return (
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {formation?.name ?? formationId} vs {front?.name ?? frontId}
                </h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Select up to {MAX_PLAYS - selected.length} more plays
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {availablePlays.map((play) => (
                    <button
                      key={play.id}
                      type="button"
                      onClick={() => handleTogglePlay(activeCell, play.id)}
                      disabled={selected.length >= MAX_PLAYS}
                      className={cn(
                        'text-left px-2 py-1.5 text-xs rounded border transition-colors',
                        'border-zinc-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-950',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                      data-testid={`available-play-${play.id}`}
                    >
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {play.name}
                      </span>
                      {play.tags.length > 0 && (
                        <span className="ml-1 text-zinc-400">
                          ({play.tags.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </button>
                  ))}
                  {availablePlays.length === 0 && (
                    <p className="text-xs text-zinc-400 col-span-2" data-testid="no-available-plays">
                      No more plays available for this formation.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default TopPlaysSelector;
