'use client';

import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { TendencyEntry } from '@/types';

// --- Nine-Box Grid types ---

export type PlayDirection = 'left' | 'middle' | 'right';
export type PlayCategory = 'Run' | 'Short Pass' | 'Deep Pass';

export interface NineBoxCell {
  row: PlayCategory;
  column: PlayDirection;
  playCount: number;
  percentage: number;
  keyPlays: string[];
  entries: TendencyEntry[];
}

export interface NineBoxSummaryProps {
  tendencies: TendencyEntry[];
  onCellClick?: (cell: NineBoxCell) => void;
}

const ROWS: PlayCategory[] = ['Run', 'Short Pass', 'Deep Pass'];
const COLUMNS: PlayDirection[] = ['left', 'middle', 'right'];

const COLUMN_LABELS: Record<PlayDirection, string> = {
  left: 'Left',
  middle: 'Middle',
  right: 'Right',
};

/**
 * Classify a TendencyEntry into one of the three row categories.
 * Uses the playType field from the tendency data.
 */
function classifyPlayType(entry: TendencyEntry): PlayCategory {
  const pt = entry.playType.toLowerCase();
  if (pt.includes('deep') || pt.includes('long')) return 'Deep Pass';
  if (pt.includes('short') || pt.includes('quick') || pt.includes('screen')) return 'Short Pass';
  if (pt.includes('pass') || pt.includes('throw')) return 'Short Pass';
  return 'Run';
}

/**
 * Get the direction for a tendency entry, defaulting to 'middle' if not specified.
 */
function getDirection(entry: TendencyEntry): PlayDirection {
  return entry.direction ?? 'middle';
}

/**
 * Compute the intensity color class based on percentage.
 * Higher percentages get warmer/more intense colors.
 */
function getIntensityClasses(percentage: number): string {
  if (percentage >= 20) return 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800';
  if (percentage >= 15) return 'bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-800';
  if (percentage >= 10) return 'bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800';
  if (percentage >= 5) return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
  return 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700';
}

/**
 * NineBoxSummary: 3x3 grid matrix summarizing opponent tendencies.
 *
 * Rows:    Run | Short Pass | Deep Pass
 * Columns: Left | Middle | Right
 *
 * Each cell shows play count, percentage, key plays, and color-coded intensity.
 * Click a cell to see the detailed play list.
 * Print-friendly layout included.
 */
export function NineBoxSummary({ tendencies, onCellClick }: NineBoxSummaryProps) {
  // Build the 3x3 matrix
  const { grid, totalPlays } = useMemo(() => {
    const total = tendencies.reduce((sum, t) => sum + t.sampleSize, 0);
    const cells: NineBoxCell[][] = ROWS.map((row) =>
      COLUMNS.map((col) => {
        const matching = tendencies.filter(
          (t) => classifyPlayType(t) === row && getDirection(t) === col,
        );
        const playCount = matching.reduce((sum, t) => sum + t.sampleSize, 0);
        const percentage = total > 0 ? Math.round((playCount / total) * 100) : 0;

        // Gather key play names from notes or formation fields, deduplicated
        const keyPlaySet = new Set<string>();
        for (const m of matching) {
          if (m.notes) keyPlaySet.add(m.notes);
          else if (m.formation) keyPlaySet.add(m.formation);
        }

        return {
          row,
          column: col,
          playCount,
          percentage,
          keyPlays: Array.from(keyPlaySet).slice(0, 3),
          entries: matching,
        };
      }),
    );
    return { grid: cells, totalPlays: total };
  }, [tendencies]);

  const handleCellClick = useCallback(
    (cell: NineBoxCell) => {
      onCellClick?.(cell);
    },
    [onCellClick],
  );

  if (tendencies.length === 0) {
    return (
      <div className="p-8 text-center" data-testid="nine-box-summary">
        <p className="text-sm text-zinc-400" data-testid="nine-box-empty">
          No tendency data available. Add scouting data to generate the nine-box summary.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 print:gap-2" data-testid="nine-box-summary">
      {/* Header */}
      <div className="flex items-center justify-between print:mb-2">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Opponent Tendency Summary
          </h2>
          <p className="text-sm text-zinc-500" data-testid="nine-box-total">
            {totalPlays} total plays analyzed
          </p>
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" data-testid="nine-box-grid">
          <thead>
            <tr>
              {/* Empty top-left corner */}
              <th className="w-28 p-2" />
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="p-2 text-center text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                  data-testid={`nine-box-col-header-${col}`}
                >
                  {COLUMN_LABELS[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIdx) => (
              <tr key={row}>
                <td
                  className="p-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                  data-testid={`nine-box-row-header-${row}`}
                >
                  {row}
                </td>
                {COLUMNS.map((col, colIdx) => {
                  const cell = grid[rowIdx][colIdx];
                  return (
                    <td key={col} className="p-1">
                      <button
                        type="button"
                        onClick={() => handleCellClick(cell)}
                        className={cn(
                          'w-full rounded-lg border p-3 text-left transition-all hover:ring-2 hover:ring-blue-500/50 cursor-pointer print:hover:ring-0',
                          getIntensityClasses(cell.percentage),
                        )}
                        data-testid={`nine-box-cell-${row}-${col}`}
                        aria-label={`${row} ${COLUMN_LABELS[col]}: ${cell.playCount} plays, ${cell.percentage}%`}
                      >
                        {/* Play count and percentage */}
                        <div className="flex items-baseline justify-between mb-1">
                          <span
                            className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100"
                            data-testid={`nine-box-count-${row}-${col}`}
                          >
                            {cell.playCount}
                          </span>
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              cell.percentage >= 20
                                ? 'text-red-600 dark:text-red-400'
                                : cell.percentage >= 10
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-zinc-500 dark:text-zinc-400',
                            )}
                            data-testid={`nine-box-pct-${row}-${col}`}
                          >
                            {cell.percentage}%
                          </span>
                        </div>

                        {/* Key plays */}
                        {cell.keyPlays.length > 0 && (
                          <div className="space-y-0.5">
                            {cell.keyPlays.map((play, i) => (
                              <p
                                key={i}
                                className="text-xs text-zinc-600 dark:text-zinc-400 truncate"
                                data-testid={`nine-box-play-${row}-${col}-${i}`}
                              >
                                {play}
                              </p>
                            ))}
                          </div>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          [data-testid="nine-box-summary"] {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default NineBoxSummary;
