'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { GamePlanSection as GamePlanSectionType, Play } from '@/types';

export interface GamePlanSectionProps {
  section: GamePlanSectionType;
  plays: Play[];
  onUpdateSituation: (sectionId: string, situation: string) => void;
  onUpdateNotes: (sectionId: string, notes: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onRemovePlay: (sectionId: string, playId: string) => void;
  onReorderPlay: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onAddPlayClick: (sectionId: string) => void;
  onDragStart?: (sectionId: string, playIndex: number) => void;
  onDrop?: (sectionId: string, playIndex: number) => void;
}

export function GamePlanSection({
  section,
  plays,
  onUpdateSituation,
  onUpdateNotes,
  onRemoveSection,
  onRemovePlay,
  onReorderPlay,
  onAddPlayClick,
  onDragStart,
  onDrop,
}: GamePlanSectionProps) {
  const [isEditingSituation, setIsEditingSituation] = useState(false);
  const [situationDraft, setSituationDraft] = useState(section.situation);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const escapePressedRef = React.useRef(false);

  const handleSituationSubmit = useCallback(() => {
    if (escapePressedRef.current) {
      escapePressedRef.current = false;
      return;
    }
    const trimmed = situationDraft.trim();
    if (trimmed && trimmed !== section.situation) {
      onUpdateSituation(section.id, trimmed);
    } else {
      setSituationDraft(section.situation);
    }
    setIsEditingSituation(false);
  }, [situationDraft, section.id, section.situation, onUpdateSituation]);

  const handleSituationKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSituationSubmit();
      } else if (e.key === 'Escape') {
        escapePressedRef.current = true;
        setSituationDraft(section.situation);
        setIsEditingSituation(false);
      }
    },
    [handleSituationSubmit, section.situation],
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDropOnPlay = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        onReorderPlay(section.id, fromIndex, toIndex);
      }
      onDrop?.(section.id, toIndex);
    },
    [section.id, onReorderPlay, onDrop],
  );

  const handlePlayDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData('text/plain', String(index));
      e.dataTransfer.effectAllowed = 'move';
      onDragStart?.(section.id, index);
    },
    [section.id, onDragStart],
  );

  const getPlayForRef = useCallback(
    (playId: string): Play | undefined => {
      return plays.find((p) => p.id === playId);
    },
    [plays],
  );

  return (
    <div
      className="border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
      data-testid={`gameplan-section-${section.id}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1">
          <svg
            className="w-4 h-4 text-zinc-400 cursor-grab"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Drag handle"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>

          {isEditingSituation ? (
            <input
              type="text"
              value={situationDraft}
              onChange={(e) => setSituationDraft(e.target.value)}
              onBlur={handleSituationSubmit}
              onKeyDown={handleSituationKeyDown}
              className="text-sm font-semibold bg-white dark:bg-zinc-900 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="situation-input"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setSituationDraft(section.situation);
                setIsEditingSituation(true);
              }}
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              data-testid="situation-label"
            >
              {section.situation}
            </button>
          )}

          <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
            {section.plays.length} {section.plays.length === 1 ? 'play' : 'plays'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddPlayClick(section.id)}
            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            data-testid="add-play-btn"
          >
            Add Play
          </button>
          <button
            onClick={() => onRemoveSection(section.id)}
            className="text-xs p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            data-testid="remove-section-btn"
            aria-label="Remove section"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Play List */}
      <div className="p-2 min-h-[60px]">
        {section.plays.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-zinc-400 dark:text-zinc-500" data-testid="empty-section">
            Drag plays here or click &quot;Add Play&quot;
          </div>
        ) : (
          <div className="space-y-1">
            {section.plays.map((playRef, index) => {
              const play = getPlayForRef(playRef.playId);
              return (
                <div
                  key={playRef.playId}
                  draggable
                  onDragStart={(e) => handlePlayDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDropOnPlay(e, index)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md border transition-colors cursor-grab',
                    'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
                    'hover:border-blue-300 dark:hover:border-blue-700',
                    dragOverIndex === index && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                  )}
                  data-testid={`play-card-${playRef.playId}`}
                >
                  <svg
                    className="w-3 h-3 text-zinc-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>

                  {/* Mini thumbnail placeholder */}
                  <div className="w-10 h-7 bg-green-800 rounded flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-[6px] font-bold">
                      {play ? play.name.substring(0, 3).toUpperCase() : '???'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {play?.name ?? 'Unknown Play'}
                    </p>
                    {playRef.notes && (
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {playRef.notes}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-400 flex-shrink-0">
                    {play?.personnel ?? ''}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePlay(section.id, playRef.playId);
                    }}
                    className="p-0.5 rounded text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                    data-testid={`remove-play-${playRef.playId}`}
                    aria-label={`Remove play ${play?.name ?? playRef.playId}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="px-4 pb-3">
        <textarea
          value={section.notes ?? ''}
          onChange={(e) => onUpdateNotes(section.id, e.target.value)}
          placeholder="Coaching notes for this situation..."
          className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={2}
          data-testid="section-notes"
        />
      </div>
    </div>
  );
}

export default GamePlanSection;
