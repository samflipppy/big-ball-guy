'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
  exportPlayAsPng,
  exportPlayAsPdf,
  downloadBlob,
  type ExportOptions,
} from '@/lib/export';
import type { Play, Formation } from '@/types';

// ============================================================
// Types
// ============================================================

export type ExportFormat = 'png' | 'pdf' | 'playbook-pdf';

export type PngSizePreset = 'standard' | 'high-res';

export interface ExportDialogProps {
  play: Play;
  formation: Formation;
  /** All plays + formations for playbook PDF export */
  allPlays?: Play[];
  allFormations?: Formation[];
  open: boolean;
  onClose: () => void;
}

// ============================================================
// Constants
// ============================================================

const PNG_SIZES: Record<PngSizePreset, { width: number; height: number; label: string }> = {
  standard: { width: 800, height: 500, label: 'Standard (800x500)' },
  'high-res': { width: 1600, height: 1000, label: 'High-Res (1600x1000)' },
};

// ============================================================
// Component
// ============================================================

export default function ExportDialog({
  play,
  formation,
  allPlays,
  allFormations,
  open,
  onClose,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [showDefense, setShowDefense] = useState(!!play.defensiveOverlay);
  const [showLabels, setShowLabels] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [pngSize, setPngSize] = useState<PngSizePreset>('standard');
  const [pageSize, setPageSize] = useState<'letter' | 'a4'>('letter');
  const [isExporting, setIsExporting] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Build export options from current state
  const buildOptions = useCallback((): ExportOptions => {
    const size = PNG_SIZES[pngSize];
    return {
      width: format === 'png' ? size.width : 800,
      height: format === 'png' ? size.height : 500,
      showDefense,
      showLabels,
      includeNotes,
      pageSize,
    };
  }, [format, pngSize, showDefense, showLabels, includeNotes, pageSize]);

  // Render preview onto canvas
  useEffect(() => {
    if (!open || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a small preview size
    const previewW = 320;
    const previewH = 200;
    canvas.width = previewW;
    canvas.height = previewH;

    // Import render function and draw preview
    import('@/lib/export').then(({ exportPlayAsPng: _ }) => {
      // We need to render directly — use a lightweight approach
      // Just draw a simple field + play name as preview
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, 0, previewW, previewH);

      // LOS
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      const losY = previewH * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, losY);
      ctx.lineTo(previewW, losY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw players as dots
      const scaleX = previewW / 800;
      const scaleY = previewH / 500;

      for (const player of formation.players) {
        const x = player.location.x * scaleX;
        const y = player.location.y * scaleY;
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (showLabels) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(player.label, x, y);
        }
      }

      // Draw defense
      if (showDefense && play.defensiveOverlay?.players) {
        for (const player of play.defensiveOverlay.players) {
          const x = player.location.x * scaleX;
          const y = player.location.y * scaleY;
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw routes
      for (const assignment of play.assignments) {
        if (assignment.route && assignment.route.points.length > 0) {
          const player = formation.players.find((p) => p.id === assignment.playerId);
          if (!player) continue;

          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(player.location.x * scaleX, player.location.y * scaleY);
          for (const pt of assignment.route.points) {
            ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
          }
          ctx.stroke();
        }
      }

      // Play name overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, previewH - 22, previewW, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(play.name, previewW / 2, previewH - 11);
    });
  }, [open, play, formation, showDefense, showLabels, buildOptions]);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const options = buildOptions();

      if (format === 'png') {
        const blob = await exportPlayAsPng(play, formation, options);
        downloadBlob(blob, `${play.name.replace(/\s+/g, '_')}.png`);
      } else if (format === 'pdf') {
        const blob = await exportPlayAsPdf(play, formation, options);
        downloadBlob(blob, `${play.name.replace(/\s+/g, '_')}.pdf`);
      } else if (format === 'playbook-pdf') {
        // Dynamic import to keep the main bundle smaller
        const { exportPlaybookAsPdf } = await import('@/lib/export');
        const plays = allPlays ?? [play];
        const formations = allFormations ?? [formation];
        const blob = await exportPlaybookAsPdf(plays, formations, options);
        downloadBlob(blob, 'playbook.pdf');
      }

      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [format, play, formation, allPlays, allFormations, buildOptions, onClose]);

  const hasPlaybook = allPlays && allPlays.length > 0;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader>Export Play</ModalHeader>

      <ModalBody className="space-y-5">
        {/* Format Selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Format
          </label>
          <div className="flex gap-2" data-testid="format-selector">
            <button
              onClick={() => setFormat('png')}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                format === 'png'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400',
              )}
              data-testid="format-png"
            >
              PNG Image
            </button>
            <button
              onClick={() => setFormat('pdf')}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                format === 'pdf'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400',
              )}
              data-testid="format-pdf"
            >
              PDF
            </button>
            {hasPlaybook && (
              <button
                onClick={() => setFormat('playbook-pdf')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  format === 'playbook-pdf'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400',
                )}
                data-testid="format-playbook-pdf"
              >
                Playbook PDF
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Preview
          </label>
          <div className="flex justify-center rounded-lg border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <canvas
              ref={previewCanvasRef}
              data-testid="export-preview"
              className="rounded"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Options
          </label>

          {/* PNG Size (only for PNG) */}
          {format === 'png' && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                Image Size
              </label>
              <select
                value={pngSize}
                onChange={(e) => setPngSize(e.target.value as PngSizePreset)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                data-testid="png-size-select"
              >
                <option value="standard">{PNG_SIZES.standard.label}</option>
                <option value="high-res">{PNG_SIZES['high-res'].label}</option>
              </select>
            </div>
          )}

          {/* Page Size (only for PDF) */}
          {(format === 'pdf' || format === 'playbook-pdf') && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'letter' | 'a4')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                data-testid="page-size-select"
              >
                <option value="letter">US Letter</option>
                <option value="a4">A4</option>
              </select>
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={showDefense}
                onChange={(e) => setShowDefense(e.target.checked)}
                className="rounded border-zinc-300"
                data-testid="toggle-defense"
              />
              Include defense
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded border-zinc-300"
                data-testid="toggle-labels"
              />
              Include labels
            </label>
            {(format === 'pdf' || format === 'playbook-pdf') && (
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded border-zinc-300"
                  data-testid="toggle-notes"
                />
                Include notes
              </label>
            )}
          </div>
        </div>

        {/* Playbook info */}
        {format === 'playbook-pdf' && hasPlaybook && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400" data-testid="playbook-info">
            Exporting {allPlays!.length} play{allPlays!.length !== 1 ? 's' : ''} as a multi-page PDF.
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          data-testid="export-cancel"
        >
          Cancel
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
            isExporting
              ? 'bg-zinc-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700',
          )}
          data-testid="export-download"
        >
          {isExporting ? 'Exporting...' : 'Download'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
