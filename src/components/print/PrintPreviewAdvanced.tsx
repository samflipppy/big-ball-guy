'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Play, Formation } from '@/types';
import {
  PRINT_LAYOUT_LIST,
  PRINT_LAYOUTS,
  type PrintLayoutId,
  type PlayWithFormation,
  type PrintPage,
} from '@/lib/print-layouts';

// ============================================================
// Types
// ============================================================

export interface PageBreak {
  id: string;
  afterPlayIndex: number;
}

export type AdvancedOrientation = 'portrait' | 'landscape';

export interface PrintPreviewAdvancedProps {
  plays: Play[];
  formations: Formation[] | Map<string, Formation>;
  layout?: PrintLayoutId;
  onPrint?: () => void;
}

// ============================================================
// Component
// ============================================================

export function PrintPreviewAdvanced({
  plays,
  formations,
  layout: initialLayout,
  onPrint,
}: PrintPreviewAdvancedProps) {
  const [layoutId, setLayoutId] = useState<PrintLayoutId>(initialLayout ?? 'single-play');
  const [orientation, setOrientation] = useState<AdvancedOrientation>('portrait');
  const [pageBreaks, setPageBreaks] = useState<PageBreak[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(50);

  // Build formation map
  const formationMap = useMemo(() => {
    if (formations instanceof Map) return formations;
    const map = new Map<string, Formation>();
    for (const f of formations) {
      map.set(f.id, f);
    }
    return map;
  }, [formations]);

  // Build plays with formations
  const playsWithFormations: PlayWithFormation[] = useMemo(() => {
    const result: PlayWithFormation[] = [];
    for (const play of plays) {
      const formation = formationMap.get(play.formationId);
      if (formation) {
        result.push({ play, formation });
      }
    }
    return result;
  }, [plays, formationMap]);

  // Split plays into pages based on layout + custom page breaks
  const pages: PrintPage[] = useMemo(() => {
    if (playsWithFormations.length === 0) return [];
    const layout = PRINT_LAYOUTS[layoutId];
    if (!layout) return [];

    if (pageBreaks.length === 0) {
      return layout.renderPages(playsWithFormations, {
        orientation: orientation,
      });
    }

    // Custom page breaks: split plays and render each chunk separately
    const breakIndices = pageBreaks
      .map((pb) => pb.afterPlayIndex)
      .filter((idx) => idx >= 0 && idx < playsWithFormations.length)
      .sort((a, b) => a - b);

    const chunks: PlayWithFormation[][] = [];
    let start = 0;
    for (const breakIdx of breakIndices) {
      const end = breakIdx + 1;
      if (end > start && end <= playsWithFormations.length) {
        chunks.push(playsWithFormations.slice(start, end));
        start = end;
      }
    }
    if (start < playsWithFormations.length) {
      chunks.push(playsWithFormations.slice(start));
    }

    const allPages: PrintPage[] = [];
    for (const chunk of chunks) {
      const chunkPages = layout.renderPages(chunk, {
        orientation: orientation,
      });
      allPages.push(...chunkPages);
    }
    return allPages;
  }, [playsWithFormations, layoutId, orientation, pageBreaks]);

  const totalPages = pages.length;

  // Navigation
  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  // Page breaks
  const addPageBreak = useCallback(
    (afterPlayIndex: number) => {
      const exists = pageBreaks.some((pb) => pb.afterPlayIndex === afterPlayIndex);
      if (exists) return;

      const id = `pb-${afterPlayIndex}-${Date.now()}`;
      const newBreaks = [...pageBreaks, { id, afterPlayIndex }].sort(
        (a, b) => a.afterPlayIndex - b.afterPlayIndex,
      );
      setPageBreaks(newBreaks);
      setCurrentPage(0);
    },
    [pageBreaks],
  );

  const removePageBreak = useCallback(
    (id: string) => {
      setPageBreaks(pageBreaks.filter((pb) => pb.id !== id));
      setCurrentPage(0);
    },
    [pageBreaks],
  );

  // Orientation toggle
  const toggleOrientation = useCallback(() => {
    setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'));
    setCurrentPage(0);
  }, []);

  // Print
  const handlePrint = useCallback(() => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  }, [onPrint]);

  // Zoom
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(200, z + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(25, z - 25));
  }, []);

  return (
    <div data-testid="print-preview-advanced" className="flex h-full flex-col">
      {/* Toolbar */}
      <div
        data-testid="advanced-toolbar"
        className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {/* Left: Layout + Orientation */}
        <div className="flex items-center gap-3">
          <select
            data-testid="layout-selector"
            value={layoutId}
            onChange={(e) => {
              setLayoutId(e.target.value as PrintLayoutId);
              setCurrentPage(0);
            }}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {PRINT_LAYOUT_LIST.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <button
            data-testid="orientation-toggle"
            onClick={toggleOrientation}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
          </button>
        </div>

        {/* Center: Page navigation */}
        <div className="flex items-center gap-2">
          <button
            data-testid="prev-page-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="rounded px-2 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span data-testid="page-count" className="text-sm">
            {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '0 / 0'}
          </span>
          <button
            data-testid="next-page-btn"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="rounded px-2 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>

        {/* Right: Zoom + Print */}
        <div className="flex items-center gap-2">
          <button
            data-testid="zoom-out-btn"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
            className="rounded px-2 py-1 text-sm disabled:opacity-40"
          >
            -
          </button>
          <span data-testid="zoom-level" className="text-sm">
            {zoom}%
          </span>
          <button
            data-testid="zoom-in-btn"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="rounded px-2 py-1 text-sm disabled:opacity-40"
          >
            +
          </button>
          <button
            data-testid="print-btn"
            onClick={handlePrint}
            className="ml-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Print
          </button>
        </div>
      </div>

      {/* Page break controls */}
      <div
        data-testid="page-break-controls"
        className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Page Breaks:
          </span>
          {playsWithFormations.length > 1 &&
            playsWithFormations.slice(0, -1).map((pwf, idx) => {
              const existing = pageBreaks.find((pb) => pb.afterPlayIndex === idx);
              return (
                <button
                  key={`break-${idx}`}
                  data-testid={`page-break-toggle-${idx}`}
                  onClick={() => {
                    if (existing) {
                      removePageBreak(existing.id);
                    } else {
                      addPageBreak(idx);
                    }
                  }}
                  className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                    existing
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  After: {pwf.play.name}
                  {existing ? ' (active)' : ''}
                </button>
              );
            })}
          {playsWithFormations.length <= 1 && (
            <span className="text-xs text-zinc-400">Need at least 2 plays for page breaks</span>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div
        data-testid="preview-area"
        className="flex flex-1 items-start justify-center overflow-auto bg-zinc-100 p-8 dark:bg-zinc-800"
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <div data-testid="page-container" className="shadow-2xl">
            {totalPages > 0 && pages[currentPage] && (
              <div
                data-testid="page-preview"
                className="bg-white"
                style={{
                  width: orientation === 'portrait' ? '8.5in' : '11in',
                  height: orientation === 'portrait' ? '11in' : '8.5in',
                  padding: '0.5in',
                }}
              >
                <div className="text-sm text-zinc-500">
                  Page {currentPage + 1} of {totalPages}
                </div>
              </div>
            )}
            {totalPages === 0 && (
              <div
                className="flex items-center justify-center rounded-md bg-white text-zinc-400"
                style={{
                  width: orientation === 'portrait' ? '8.5in' : '11in',
                  height: orientation === 'portrait' ? '11in' : '8.5in',
                }}
              >
                No plays to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintPreviewAdvanced;
