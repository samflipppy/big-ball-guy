'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

// --- Export Types ---
export type ExportContentType =
  | 'single_play'
  | 'full_playbook'
  | 'game_plan'
  | 'call_sheet'
  | 'wristband'
  | 'practice_script';

export type ExportFormat = 'pdf' | 'png' | 'print';

export type LayoutOption = '1-up' | '2-up' | '4-up' | '9-up';

export interface ExportOptions {
  contentType: ExportContentType;
  format: ExportFormat;
  layout: LayoutOption;
  includePlayNames: boolean;
  includeFormationNames: boolean;
  includeCoachingNotes: boolean;
  includeDefensiveOverlay: boolean;
  includePlayerLabels: boolean;
}

export interface ExportManagerProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void | Promise<void>;
  availableTypes?: ExportContentType[];
}

const EXPORT_TYPE_LABELS: Record<ExportContentType, string> = {
  single_play: 'Single Play',
  full_playbook: 'Full Playbook',
  game_plan: 'Game Plan',
  call_sheet: 'Call Sheet',
  wristband: 'Wristband',
  practice_script: 'Practice Script',
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF',
  png: 'PNG',
  print: 'Print',
};

const LAYOUT_LABELS: Record<LayoutOption, string> = {
  '1-up': '1 per page',
  '2-up': '2-up',
  '4-up': '4-up',
  '9-up': '9-up grid',
};

const LAYOUT_GRID_CLASSES: Record<LayoutOption, string> = {
  '1-up': 'grid-cols-1',
  '2-up': 'grid-cols-2',
  '4-up': 'grid-cols-2',
  '9-up': 'grid-cols-3',
};

const LAYOUT_CELL_COUNTS: Record<LayoutOption, number> = {
  '1-up': 1,
  '2-up': 2,
  '4-up': 4,
  '9-up': 9,
};

const ALL_EXPORT_TYPES: ExportContentType[] = [
  'single_play',
  'full_playbook',
  'game_plan',
  'call_sheet',
  'wristband',
  'practice_script',
];

const MULTI_PLAY_TYPES: ExportContentType[] = [
  'full_playbook',
  'game_plan',
  'call_sheet',
  'practice_script',
];

function isMultiPlayType(contentType: ExportContentType): boolean {
  return MULTI_PLAY_TYPES.includes(contentType);
}

export function ExportManager({
  open,
  onClose,
  onExport,
  availableTypes = ALL_EXPORT_TYPES,
}: ExportManagerProps) {
  const [contentType, setContentType] = useState<ExportContentType>(
    availableTypes[0] ?? 'single_play',
  );
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [layout, setLayout] = useState<LayoutOption>('1-up');
  const [includePlayNames, setIncludePlayNames] = useState(true);
  const [includeFormationNames, setIncludeFormationNames] = useState(true);
  const [includeCoachingNotes, setIncludeCoachingNotes] = useState(true);
  const [includeDefensiveOverlay, setIncludeDefensiveOverlay] = useState(false);
  const [includePlayerLabels, setIncludePlayerLabels] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const buildOptions = useCallback((): ExportOptions => {
    return {
      contentType,
      format,
      layout: isMultiPlayType(contentType) ? layout : '1-up',
      includePlayNames,
      includeFormationNames,
      includeCoachingNotes,
      includeDefensiveOverlay,
      includePlayerLabels,
    };
  }, [
    contentType,
    format,
    layout,
    includePlayNames,
    includeFormationNames,
    includeCoachingNotes,
    includeDefensiveOverlay,
    includePlayerLabels,
  ]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport(buildOptions());
    } finally {
      setIsExporting(false);
    }
  }, [onExport, buildOptions]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const showLayoutOptions = isMultiPlayType(contentType);

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader>Export Playbook</ModalHeader>

      <ModalBody className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Export Type Selector */}
        <section data-testid="export-type-section">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Export Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                data-testid={`export-type-${type}`}
                onClick={() => setContentType(type)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                  contentType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-700',
                )}
              >
                {EXPORT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </section>

        {/* Format Options */}
        <section data-testid="format-section">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Format
          </label>
          <div className="flex gap-2">
            {(['pdf', 'png', 'print'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                data-testid={`format-${fmt}`}
                onClick={() => setFormat(fmt)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  format === fmt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-700',
                )}
              >
                {FORMAT_LABELS[fmt]}
              </button>
            ))}
          </div>
        </section>

        {/* Layout Options (only for multi-play exports) */}
        {showLayoutOptions && (
          <section data-testid="layout-section">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Layout
            </label>
            <div className="flex gap-2">
              {(['1-up', '2-up', '4-up', '9-up'] as LayoutOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  data-testid={`layout-${opt}`}
                  onClick={() => setLayout(opt)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                    layout === opt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-700',
                  )}
                >
                  {LAYOUT_LABELS[opt]}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Include / Exclude Toggles */}
        <section data-testid="toggle-section">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Include
          </label>
          <div className="space-y-2">
            <ToggleSwitch
              id="include-play-names"
              label="Play Names"
              checked={includePlayNames}
              onChange={setIncludePlayNames}
            />
            <ToggleSwitch
              id="include-formation-names"
              label="Formation Names"
              checked={includeFormationNames}
              onChange={setIncludeFormationNames}
            />
            <ToggleSwitch
              id="include-coaching-notes"
              label="Coaching Notes"
              checked={includeCoachingNotes}
              onChange={setIncludeCoachingNotes}
            />
            <ToggleSwitch
              id="include-defensive-overlay"
              label="Defensive Overlay"
              checked={includeDefensiveOverlay}
              onChange={setIncludeDefensiveOverlay}
            />
            <ToggleSwitch
              id="include-player-labels"
              label="Player Labels"
              checked={includePlayerLabels}
              onChange={setIncludePlayerLabels}
            />
          </div>
        </section>

        {/* Preview Area */}
        <section data-testid="preview-section">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Preview
          </label>
          <div
            className="border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 p-4 min-h-[200px]"
            data-testid="export-preview"
          >
            <div
              className={cn(
                'grid gap-2',
                showLayoutOptions
                  ? LAYOUT_GRID_CLASSES[layout]
                  : 'grid-cols-1',
              )}
            >
              {Array.from({ length: showLayoutOptions ? LAYOUT_CELL_COUNTS[layout] : 1 }).map(
                (_, i) => (
                  <PreviewCell
                    key={i}
                    index={i}
                    showPlayName={includePlayNames}
                    showFormationName={includeFormationNames}
                    showNotes={includeCoachingNotes}
                    showDefense={includeDefensiveOverlay}
                    showLabels={includePlayerLabels}
                  />
                ),
              )}
            </div>
          </div>
        </section>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={handlePrint}
          disabled={isExporting}
          data-testid="print-button"
        >
          Print
        </Button>
        <Button
          variant="primary"
          onClick={handleExport}
          loading={isExporting}
          data-testid="export-button"
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// --- Toggle Switch sub-component ---

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSwitch({ id, label, checked, onChange }: ToggleSwitchProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between py-1.5 cursor-pointer group"
    >
      <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          data-testid={`toggle-${id}`}
        />
        <div
          className={cn(
            'w-9 h-5 rounded-full transition-colors',
            checked
              ? 'bg-blue-600'
              : 'bg-zinc-300 dark:bg-zinc-600',
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </div>
    </label>
  );
}

// --- Preview Cell sub-component ---

interface PreviewCellProps {
  index: number;
  showPlayName: boolean;
  showFormationName: boolean;
  showNotes: boolean;
  showDefense: boolean;
  showLabels: boolean;
}

function PreviewCell({
  index,
  showPlayName,
  showFormationName,
  showNotes,
  showDefense,
  showLabels,
}: PreviewCellProps) {
  return (
    <div
      className="border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800 p-2 flex flex-col gap-1"
      data-testid={`preview-cell-${index}`}
    >
      {/* Mini field placeholder */}
      <div className="relative bg-green-800 rounded aspect-[16/10] flex items-center justify-center overflow-hidden">
        {/* Yard lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-1 px-0 pointer-events-none">
          {Array.from({ length: 5 }).map((_, j) => (
            <div
              key={j}
              className="w-full border-t border-white/20"
            />
          ))}
        </div>

        {/* Offense dots */}
        {showLabels && (
          <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 flex gap-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="w-2 h-2 rounded-full bg-blue-400 flex items-center justify-center"
              >
                <span className="text-[3px] text-white font-bold leading-none">O</span>
              </div>
            ))}
          </div>
        )}

        {/* Defense dots */}
        {showDefense && (
          <div className="absolute top-[25%] left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div
                key={j}
                className="w-2 h-2 rounded-full bg-red-400"
              />
            ))}
          </div>
        )}
      </div>

      {/* Metadata below the field */}
      {showPlayName && (
        <p className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 truncate" data-testid={`preview-play-name-${index}`}>
          Play {index + 1}
        </p>
      )}
      {showFormationName && (
        <p className="text-[8px] text-zinc-500 dark:text-zinc-400 truncate" data-testid={`preview-formation-name-${index}`}>
          Formation
        </p>
      )}
      {showNotes && (
        <p className="text-[8px] text-zinc-400 dark:text-zinc-500 italic truncate" data-testid={`preview-notes-${index}`}>
          Coaching notes...
        </p>
      )}
    </div>
  );
}

export default ExportManager;
