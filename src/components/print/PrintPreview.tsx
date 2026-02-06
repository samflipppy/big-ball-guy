'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  PRINT_LAYOUT_LIST,
  PRINT_LAYOUTS,
  type PrintLayoutId,
  type PlayWithFormation,
  type PrintPage,
  type PrintOptions,
} from '@/lib/print-layouts';
import type { Play, Formation } from '@/types';

export interface PrintPreviewProps {
  plays: Play[];
  formations: Formation[] | Map<string, Formation>;
  layout?: PrintLayoutId;
  open: boolean;
  onClose: () => void;
}

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 1; // 0.5 (50%)

export function PrintPreview({ plays, formations, layout: initialLayout, open, onClose }: PrintPreviewProps) {
  const [layoutId, setLayoutId] = useState<PrintLayoutId>(initialLayout ?? 'single-play');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [options, setOptions] = useState<Partial<PrintOptions>>({});
  const previewRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

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

  // Render pages
  const pages: PrintPage[] = useMemo(() => {
    if (playsWithFormations.length === 0) return [];
    const layout = PRINT_LAYOUTS[layoutId];
    if (!layout) return [];
    return layout.renderPages(playsWithFormations, options);
  }, [playsWithFormations, layoutId, options]);

  const totalPages = pages.length;
  const zoom = ZOOM_LEVELS[zoomIndex];

  // Reset page when layout changes
  useEffect(() => {
    setCurrentPage(0);
  }, [layoutId]);

  // Clamp current page
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  // Inject page HTML into preview container
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container) return;
    container.innerHTML = '';

    if (pages.length > 0 && pages[currentPage]) {
      const pageEl = pages[currentPage].element.cloneNode(true) as HTMLElement;
      container.appendChild(pageEl);
    }
  }, [pages, currentPage]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentPage((p) => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, totalPages]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const handleZoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Print Preview"
      data-testid="print-preview-modal"
    >
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4">
        {/* Left: Layout selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="layout-select" className="text-sm font-medium text-zinc-300">
            Layout:
          </label>
          <select
            id="layout-select"
            value={layoutId}
            onChange={(e) => setLayoutId(e.target.value as PrintLayoutId)}
            className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            data-testid="layout-selector"
          >
            {PRINT_LAYOUT_LIST.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={cn(
              'rounded-md px-2 py-1 text-sm text-zinc-300 transition-colors',
              currentPage === 0
                ? 'cursor-not-allowed opacity-40'
                : 'hover:bg-zinc-700',
            )}
            aria-label="Previous page"
            data-testid="prev-page-btn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="min-w-[80px] text-center text-sm text-zinc-300" data-testid="page-count">
            {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '0 / 0'}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className={cn(
              'rounded-md px-2 py-1 text-sm text-zinc-300 transition-colors',
              currentPage >= totalPages - 1
                ? 'cursor-not-allowed opacity-40'
                : 'hover:bg-zinc-700',
            )}
            aria-label="Next page"
            data-testid="next-page-btn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right: Zoom + Print + Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            className={cn(
              'rounded-md px-2 py-1 text-sm text-zinc-300 transition-colors',
              zoomIndex === 0 ? 'cursor-not-allowed opacity-40' : 'hover:bg-zinc-700',
            )}
            aria-label="Zoom out"
            data-testid="zoom-out-btn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
            </svg>
          </button>

          <span className="min-w-[48px] text-center text-xs text-zinc-400" data-testid="zoom-level">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            className={cn(
              'rounded-md px-2 py-1 text-sm text-zinc-300 transition-colors',
              zoomIndex === ZOOM_LEVELS.length - 1 ? 'cursor-not-allowed opacity-40' : 'hover:bg-zinc-700',
            )}
            aria-label="Zoom in"
            data-testid="zoom-in-btn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </button>

          <div className="mx-2 h-5 w-px bg-zinc-700" />

          <button
            onClick={handlePrint}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            data-testid="print-btn"
          >
            Print
          </button>

          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
            aria-label="Close print preview"
            data-testid="close-btn"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={previewRef}
        className="flex flex-1 items-start justify-center overflow-auto bg-zinc-800 p-8"
        data-testid="preview-area"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 150ms ease',
          }}
        >
          <div
            ref={pageContainerRef}
            className="shadow-2xl"
            data-testid="page-container"
          />
          {totalPages === 0 && (
            <div className="flex h-[11in] w-[8.5in] items-center justify-center rounded-md bg-white text-zinc-400">
              No plays to preview
            </div>
          )}
        </div>
      </div>

      {/* @media print styles — hide toolbar, show pages */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          [data-testid="page-container"],
          [data-testid="page-container"] * {
            visibility: visible !important;
          }
          [data-testid="page-container"] {
            position: absolute;
            left: 0;
            top: 0;
            transform: none !important;
          }
          [data-testid="print-preview-modal"] {
            position: static !important;
            background: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PrintPreview;
