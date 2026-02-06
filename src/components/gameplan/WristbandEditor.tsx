'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Play } from '@/types';

// ============================================================
// Types
// ============================================================

export interface WristbandCell {
  playId: string;
  playName: string;
  index: number;
}

export interface WristbandLayout {
  cells: WristbandCell[];
  columns: number;
}

export interface TeamColors {
  primary: string;
  secondary: string;
}

export interface WristbandEditorProps {
  plays: Play[];
  columns?: number;
  onLayoutChange?: (layout: WristbandLayout) => void;
  teamColors?: TeamColors;
}

// ============================================================
// Helpers
// ============================================================

function buildCells(plays: Play[]): WristbandCell[] {
  return plays.map((play, index) => ({
    playId: play.id,
    playName: play.name,
    index,
  }));
}

function reorder(cells: WristbandCell[], fromIndex: number, toIndex: number): WristbandCell[] {
  const result = [...cells];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result.map((cell, i) => ({ ...cell, index: i }));
}

// ============================================================
// Component
// ============================================================

export function WristbandEditor({
  plays,
  columns: initialColumns = 4,
  onLayoutChange,
  teamColors,
}: WristbandEditorProps) {
  const [cols, setCols] = useState<number>(Math.min(Math.max(initialColumns, 3), 6));
  const [cells, setCells] = useState<WristbandCell[]>(() => buildCells(plays));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const primaryColor = teamColors?.primary ?? '#1e3a5f';
  const secondaryColor = teamColors?.secondary ?? '#ffffff';

  const rows = useMemo(() => Math.ceil(cells.length / cols), [cells.length, cols]);

  const emitLayoutChange = useCallback(
    (newCells: WristbandCell[], newCols: number) => {
      onLayoutChange?.({
        cells: newCells,
        columns: newCols,
      });
    },
    [onLayoutChange],
  );

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragIndex === null || dragIndex === targetIndex) {
        setDragIndex(null);
        return;
      }
      const newCells = reorder(cells, dragIndex, targetIndex);
      setCells(newCells);
      setDragIndex(null);
      emitLayoutChange(newCells, cols);
    },
    [dragIndex, cells, cols, emitLayoutChange],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleColumnChange = useCallback(
    (newCols: number) => {
      const clamped = Math.min(Math.max(newCols, 3), 6);
      setCols(clamped);
      emitLayoutChange(cells, clamped);
    },
    [cells, emitLayoutChange],
  );

  const handleExport = useCallback(() => {
    window.print();
  }, []);

  return (
    <div data-testid="wristband-editor" className="flex flex-col gap-4">
      {/* Toolbar */}
      <div
        data-testid="wristband-toolbar"
        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Columns:
            <select
              data-testid="columns-select"
              value={cols}
              onChange={(e) => handleColumnChange(Number(e.target.value))}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {[3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Orientation:
            <select
              data-testid="orientation-select"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span data-testid="play-count" className="text-sm text-zinc-500 dark:text-zinc-400">
            {cells.length} plays / {rows} rows
          </span>
          <button
            data-testid="export-btn"
            onClick={handleExport}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: primaryColor, color: secondaryColor }}
          >
            Export for Print
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        data-testid="wristband-grid"
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {cells.map((cell, idx) => (
          <div
            key={cell.playId}
            data-testid={`wristband-cell-${idx}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className="flex cursor-grab flex-col items-center justify-center border border-dashed border-zinc-300 p-2 transition-colors active:cursor-grabbing dark:border-zinc-600"
            style={{
              backgroundColor: dragIndex === idx ? '#e5e7eb' : '#ffffff',
              minHeight: '60px',
            }}
          >
            {/* Mini thumbnail placeholder */}
            <div
              data-testid={`cell-thumbnail-${idx}`}
              className="mb-1 h-8 w-full rounded"
              style={{ backgroundColor: '#2d5a27' }}
            />
            {/* Play name */}
            <span
              data-testid={`cell-name-${idx}`}
              className="text-center text-xs font-semibold leading-tight"
              style={{ color: primaryColor }}
            >
              {cell.playName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WristbandEditor;
