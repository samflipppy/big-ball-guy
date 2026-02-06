'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { WRISTBAND_DEFAULTS } from '@/lib/constants';
import type { CallSheet, Play, WristbandConfig } from '@/types';

export interface WristbandGeneratorProps {
  callSheet: CallSheet;
  plays: Play[];
  initialConfig?: Partial<WristbandConfig>;
}

export function WristbandGenerator({ callSheet, plays, initialConfig }: WristbandGeneratorProps) {
  const [config, setConfig] = useState<WristbandConfig>({
    callSheetId: callSheet.id,
    columns: initialConfig?.columns ?? WRISTBAND_DEFAULTS.columns,
    rows: initialConfig?.rows ?? WRISTBAND_DEFAULTS.rows,
    fontSize: initialConfig?.fontSize ?? WRISTBAND_DEFAULTS.fontSize,
    showDiagram: initialConfig?.showDiagram ?? false,
    showFormation: initialConfig?.showFormation ?? true,
  });

  const [previewMode, setPreviewMode] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const playMap = useMemo(() => {
    return new Map(plays.map((p) => [p.id, p]));
  }, [plays]);

  // Flatten all plays from the call sheet into a sequential list
  const allPlays = useMemo(() => {
    const result: { play: Play | undefined; sectionName: string; number: number }[] = [];
    let counter = 1;
    callSheet.sections.forEach((section) => {
      section.plays.forEach((playRef) => {
        result.push({
          play: playMap.get(playRef.playId),
          sectionName: section.name,
          number: counter++,
        });
      });
    });
    return result;
  }, [callSheet, playMap]);

  // Build grid cells: fill rows x columns
  const gridCells = useMemo(() => {
    const totalCells = config.rows * config.columns;
    const cells: typeof allPlays = [];
    for (let i = 0; i < totalCells; i++) {
      if (i < allPlays.length) {
        cells.push(allPlays[i]);
      } else {
        cells.push({ play: undefined, sectionName: '', number: 0 });
      }
    }
    return cells;
  }, [allPlays, config.rows, config.columns]);

  const updateConfig = useCallback((updates: Partial<WristbandConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-4" data-testid="wristband-generator">
      {/* Configuration Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 print:hidden">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Columns:</label>
          <input
            type="number"
            min={1}
            max={8}
            value={config.columns}
            onChange={(e) => updateConfig({ columns: Math.max(1, Math.min(8, parseInt(e.target.value, 10) || 1)) })}
            className="w-14 text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            data-testid="config-columns"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Rows:</label>
          <input
            type="number"
            min={1}
            max={16}
            value={config.rows}
            onChange={(e) => updateConfig({ rows: Math.max(1, Math.min(16, parseInt(e.target.value, 10) || 1)) })}
            className="w-14 text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            data-testid="config-rows"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-600 dark:text-zinc-400">Font Size:</label>
          <input
            type="number"
            min={5}
            max={14}
            value={config.fontSize}
            onChange={(e) => updateConfig({ fontSize: Math.max(5, Math.min(14, parseInt(e.target.value, 10) || 7)) })}
            className="w-14 text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            data-testid="config-font-size"
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showDiagram}
            onChange={(e) => updateConfig({ showDiagram: e.target.checked })}
            className="rounded border-zinc-300"
            data-testid="config-show-diagram"
          />
          Show Diagram
        </label>

        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showFormation}
            onChange={(e) => updateConfig({ showFormation: e.target.checked })}
            className="rounded border-zinc-300"
            data-testid="config-show-formation"
          />
          Show Formation
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg transition-colors',
              previewMode
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
            )}
            data-testid="preview-toggle"
          >
            {previewMode ? 'Preview On' : 'Preview Off'}
          </button>

          <button
            onClick={handlePrint}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
            data-testid="print-btn"
          >
            Print
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 print:hidden">
        <span data-testid="plays-count">{allPlays.length} plays</span>
        <span data-testid="grid-size">{config.rows} x {config.columns} grid</span>
        <span data-testid="cells-filled">{Math.min(allPlays.length, config.rows * config.columns)} / {config.rows * config.columns} cells filled</span>
      </div>

      {/* Wristband Preview / Print Area */}
      <div
        ref={printRef}
        className={cn(
          'wristband-grid border-2 border-zinc-900 dark:border-zinc-100 bg-white',
          previewMode && 'max-w-lg mx-auto',
        )}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
        }}
        data-testid="wristband-grid"
      >
        {gridCells.map((cell, index) => (
          <div
            key={index}
            className={cn(
              'border border-zinc-900 dark:border-zinc-100 flex flex-col items-center justify-center text-center overflow-hidden',
              cell.play ? 'bg-white' : 'bg-zinc-100',
            )}
            style={{
              minHeight: `${WRISTBAND_DEFAULTS.cellHeight}px`,
              padding: '2px',
            }}
            data-testid={`wristband-cell-${index}`}
          >
            {cell.play ? (
              <>
                {config.showDiagram && (
                  <div
                    className="w-full bg-green-800 rounded-sm flex items-center justify-center mb-0.5"
                    style={{ height: '20px' }}
                  >
                    <span className="text-white" style={{ fontSize: '5px' }}>
                      {cell.play.name.substring(0, 4).toUpperCase()}
                    </span>
                  </div>
                )}
                <span
                  className="font-bold text-zinc-900 leading-tight"
                  style={{ fontSize: `${config.fontSize}pt` }}
                  data-testid={`cell-number-${index}`}
                >
                  {cell.number}
                </span>
                <span
                  className="font-semibold text-zinc-900 leading-tight truncate w-full"
                  style={{ fontSize: `${Math.max(config.fontSize - 1, 5)}pt` }}
                  data-testid={`cell-name-${index}`}
                >
                  {cell.play.name}
                </span>
                {config.showFormation && (
                  <span
                    className="text-zinc-600 leading-tight truncate w-full"
                    style={{ fontSize: `${Math.max(config.fontSize - 2, 4)}pt` }}
                    data-testid={`cell-formation-${index}`}
                  >
                    {cell.play.personnel}
                  </span>
                )}
              </>
            ) : (
              <span className="text-zinc-300" style={{ fontSize: `${config.fontSize}pt` }}>
                -
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .wristband-grid,
          .wristband-grid * {
            visibility: visible;
          }
          .wristband-grid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            border-width: 1px;
          }
          .wristband-grid > div {
            border-width: 0.5px;
          }
        }
      `}</style>
    </div>
  );
}

export default WristbandGenerator;
