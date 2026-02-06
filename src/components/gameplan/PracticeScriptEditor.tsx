'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import type { PracticeScript, PracticePeriod, Play } from '@/types';

const PERIOD_TYPES: PracticePeriod['type'][] = [
  'individual',
  'install',
  'team',
  'seven-on-seven',
  'scout',
  'situational',
];

const PERIOD_TYPE_LABELS: Record<PracticePeriod['type'], string> = {
  individual: 'Individual',
  install: 'Install',
  team: 'Team',
  'seven-on-seven': '7-on-7',
  scout: 'Scout Team',
  situational: 'Situational',
};

const PERIOD_TYPE_COLORS: Record<PracticePeriod['type'], string> = {
  individual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  install: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  team: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'seven-on-seven': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  scout: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  situational: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
};

export interface PracticeScriptEditorProps {
  script: PracticeScript;
  plays: Play[];
  onChange: (script: PracticeScript) => void;
  onAddPlayToPeriod: (periodId: string) => void;
}

export function PracticeScriptEditor({
  script,
  plays,
  onChange,
  onAddPlayToPeriod,
}: PracticeScriptEditorProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(script.periods.map((p) => p.id)),
  );

  const totalTime = useMemo(() => {
    return script.periods.reduce((sum, p) => sum + p.duration, 0);
  }, [script.periods]);

  const totalPlays = useMemo(() => {
    return script.periods.reduce((sum, p) => sum + p.plays.length, 0);
  }, [script.periods]);

  const togglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodId)) {
        next.delete(periodId);
      } else {
        next.add(periodId);
      }
      return next;
    });
  }, []);

  const addPeriod = useCallback(() => {
    const newPeriod: PracticePeriod = {
      id: generateId(),
      name: `Period ${script.periods.length + 1}`,
      duration: 10,
      type: 'team',
      plays: [],
      notes: '',
      order: script.periods.length,
    };
    const updated = {
      ...script,
      periods: [...script.periods, newPeriod],
      updatedAt: new Date().toISOString(),
    };
    onChange(updated);
    setExpandedPeriods((prev) => new Set(prev).add(newPeriod.id));
  }, [script, onChange]);

  const removePeriod = useCallback(
    (periodId: string) => {
      const filtered = script.periods.filter((p) => p.id !== periodId);
      const reordered = filtered.map((p, i) => ({ ...p, order: i }));
      onChange({
        ...script,
        periods: reordered,
        updatedAt: new Date().toISOString(),
      });
    },
    [script, onChange],
  );

  const updatePeriod = useCallback(
    (periodId: string, updates: Partial<PracticePeriod>) => {
      const periods = script.periods.map((p) =>
        p.id === periodId ? { ...p, ...updates } : p,
      );
      onChange({ ...script, periods, updatedAt: new Date().toISOString() });
    },
    [script, onChange],
  );

  const reorderPeriod = useCallback(
    (fromIndex: number, toIndex: number) => {
      const periods = [...script.periods];
      const [moved] = periods.splice(fromIndex, 1);
      periods.splice(toIndex, 0, moved);
      const reordered = periods.map((p, i) => ({ ...p, order: i }));
      onChange({ ...script, periods: reordered, updatedAt: new Date().toISOString() });
    },
    [script, onChange],
  );

  const removePlayFromPeriod = useCallback(
    (periodId: string, playId: string) => {
      const periods = script.periods.map((p) => {
        if (p.id !== periodId) return p;
        const filtered = p.plays.filter((pr) => pr.playId !== playId);
        return { ...p, plays: filtered.map((pr, i) => ({ ...pr, order: i })) };
      });
      onChange({ ...script, periods, updatedAt: new Date().toISOString() });
    },
    [script, onChange],
  );

  const getPlay = useCallback(
    (playId: string): Play | undefined => {
      return plays.find((p) => p.id === playId);
    },
    [plays],
  );

  const handlePeriodDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('period-index', String(index));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handlePeriodDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('period-index'), 10);
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        reorderPeriod(fromIndex, toIndex);
      }
    },
    [reorderPeriod],
  );

  const formatTime = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  return (
    <div className="space-y-4" data-testid="practice-script-editor">
      {/* Header Stats */}
      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Total Time</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100" data-testid="total-time">
              {formatTime(totalTime)}
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Periods</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100" data-testid="period-count">
              {script.periods.length}
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Total Plays</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100" data-testid="total-plays">
              {totalPlays}
            </span>
          </div>
        </div>
        <button
          onClick={addPeriod}
          className="text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          data-testid="add-period-btn"
        >
          Add Period
        </button>
      </div>

      {/* Periods */}
      {script.periods.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 dark:text-zinc-500" data-testid="empty-script">
          <p className="text-sm">No periods yet. Add a period to start building your practice script.</p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="periods-list">
          {script.periods.map((period, index) => {
            const isExpanded = expandedPeriods.has(period.id);
            return (
              <div
                key={period.id}
                draggable
                onDragStart={(e) => handlePeriodDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handlePeriodDrop(e, index)}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
                data-testid={`period-${period.id}`}
              >
                {/* Period Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => togglePeriod(period.id)}
                  data-testid={`period-header-${period.id}`}
                >
                  <svg
                    className="w-4 h-4 text-zinc-400 cursor-grab"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Drag handle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>

                  <svg
                    className={cn('w-4 h-4 text-zinc-500 transition-transform', isExpanded && 'rotate-90')}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  <input
                    type="text"
                    value={period.name}
                    onChange={(e) => updatePeriod(period.id, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-900 dark:text-zinc-100 flex-shrink-0"
                    data-testid={`period-name-${period.id}`}
                  />

                  <span
                    className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                      PERIOD_TYPE_COLORS[period.type],
                    )}
                    data-testid={`period-type-badge-${period.id}`}
                  >
                    {PERIOD_TYPE_LABELS[period.type]}
                  </span>

                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-auto flex-shrink-0">
                    {period.duration}min | {period.plays.length} plays
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePeriod(period.id);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                    data-testid={`remove-period-${period.id}`}
                    aria-label="Remove period"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Period Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800">
                    {/* Period Settings */}
                    <div className="flex flex-wrap gap-3 py-3">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-zinc-500 dark:text-zinc-400">Type:</label>
                        <select
                          value={period.type}
                          onChange={(e) =>
                            updatePeriod(period.id, { type: e.target.value as PracticePeriod['type'] })
                          }
                          className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          data-testid={`period-type-select-${period.id}`}
                        >
                          {PERIOD_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {PERIOD_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-zinc-500 dark:text-zinc-400">Duration:</label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={period.duration}
                          onChange={(e) =>
                            updatePeriod(period.id, { duration: Math.max(1, parseInt(e.target.value, 10) || 1) })
                          }
                          className="text-xs w-14 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          data-testid={`period-duration-${period.id}`}
                        />
                        <span className="text-xs text-zinc-500">min</span>
                      </div>
                    </div>

                    {/* Plays in period */}
                    {period.plays.length === 0 ? (
                      <div className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-500" data-testid={`empty-period-${period.id}`}>
                        No plays in this period
                      </div>
                    ) : (
                      <div className="space-y-1 mb-2">
                        {period.plays.map((playRef) => {
                          const play = getPlay(playRef.playId);
                          return (
                            <div
                              key={playRef.playId}
                              className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-50 dark:bg-zinc-800 text-xs"
                              data-testid={`period-play-${playRef.playId}`}
                            >
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 flex-1 truncate">
                                {play?.name ?? 'Unknown Play'}
                              </span>
                              <span className="text-zinc-500 dark:text-zinc-400">{play?.personnel ?? ''}</span>
                              <button
                                onClick={() => removePlayFromPeriod(period.id, playRef.playId)}
                                className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                                data-testid={`remove-period-play-${playRef.playId}`}
                                aria-label={`Remove ${play?.name ?? 'play'}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => onAddPlayToPeriod(period.id)}
                      className="text-xs px-2 py-1 rounded border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600 transition-colors w-full"
                      data-testid={`add-play-to-period-${period.id}`}
                    >
                      + Add Play
                    </button>

                    {/* Period Notes */}
                    <textarea
                      value={period.notes ?? ''}
                      onChange={(e) => updatePeriod(period.id, { notes: e.target.value })}
                      placeholder="Period notes..."
                      className="w-full text-xs p-2 mt-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={2}
                      data-testid={`period-notes-${period.id}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          [data-testid="practice-script-editor"] {
            break-inside: avoid;
          }
          [data-testid="practice-script-editor"] button {
            display: none;
          }
          [data-testid="practice-script-editor"] textarea {
            border: none;
            resize: none;
          }
        }
      `}</style>
    </div>
  );
}

export default PracticeScriptEditor;
