'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { generateScoutCards, groupBySituation, sortByFrequency } from '@/lib/scout-cards';
import type { ScoutCard } from '@/lib/scout-cards';
import type { TendencyEntry, Play, Formation } from '@/types';

export interface ScoutCardBuilderProps {
  tendencies: TendencyEntry[];
  plays: Play[];
  formations: Formation[];
  onSave: (cards: ScoutCard[]) => void;
}

type ViewMode = 'grouped' | 'frequency';

export function ScoutCardBuilder({
  tendencies,
  plays,
  formations,
  onSave,
}: ScoutCardBuilderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Generate scout cards from tendencies
  const generatedCards = useMemo(
    () => generateScoutCards(tendencies, plays, formations),
    [tendencies, plays, formations],
  );

  // If user hasn't reordered, use the generated order
  const orderedCards = useMemo(() => {
    if (cardOrder.length === 0) return generatedCards;
    const cardMap = new Map(generatedCards.map((c) => [c.id, c]));
    const ordered: ScoutCard[] = [];
    for (const id of cardOrder) {
      const card = cardMap.get(id);
      if (card) ordered.push(card);
    }
    // Append any new cards not in the order yet
    for (const card of generatedCards) {
      if (!cardOrder.includes(card.id)) ordered.push(card);
    }
    return ordered;
  }, [generatedCards, cardOrder]);

  // Group by situation for the grouped view
  const grouped = useMemo(
    () => groupBySituation(orderedCards),
    [orderedCards],
  );

  // Flat list sorted by frequency
  const byFrequency = useMemo(
    () => sortByFrequency(orderedCards),
    [orderedCards],
  );

  // Drag handlers
  const handleDragStart = useCallback((cardId: string) => {
    setDraggedId(cardId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) return;

      const currentOrder =
        cardOrder.length > 0 ? [...cardOrder] : orderedCards.map((c) => c.id);
      const dragIndex = currentOrder.indexOf(draggedId);
      const targetIndex = currentOrder.indexOf(targetId);

      if (dragIndex === -1 || targetIndex === -1) return;

      currentOrder.splice(dragIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedId);
      setCardOrder(currentOrder);
    },
    [draggedId, cardOrder, orderedCards],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave(orderedCards);
  }, [onSave, orderedCards]);

  if (generatedCards.length === 0) {
    return (
      <div className="p-8 text-center" data-testid="scout-card-builder">
        <p className="text-zinc-400 text-sm" data-testid="empty-scout-cards">
          No scout cards generated. Add tendency data to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="scout-card-builder">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Scout Cards
          </h2>
          <span className="text-sm text-zinc-500" data-testid="card-count">
            ({generatedCards.length} cards)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-md border border-zinc-300 dark:border-zinc-600 overflow-hidden">
            <button
              className={cn(
                'px-3 py-1.5 text-xs font-medium',
                viewMode === 'grouped'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
              )}
              onClick={() => setViewMode('grouped')}
              data-testid="view-grouped"
            >
              By Situation
            </button>
            <button
              className={cn(
                'px-3 py-1.5 text-xs font-medium',
                viewMode === 'frequency'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
              )}
              onClick={() => setViewMode('frequency')}
              data-testid="view-frequency"
            >
              By Frequency
            </button>
          </div>

          <button
            className="px-4 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-md"
            onClick={handleSave}
            data-testid="save-scout-cards"
          >
            Save Cards
          </button>
        </div>
      </div>

      {/* Cards display */}
      {viewMode === 'grouped' ? (
        <div className="space-y-6" data-testid="grouped-view">
          {Array.from(grouped.entries()).map(([situation, cards]) => (
            <div key={situation} data-testid={`situation-group-${situation}`}>
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-2 border-b border-zinc-200 dark:border-zinc-700 pb-1">
                {situation}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
                {cards.map((card) => (
                  <ScoutCardItem
                    key={card.id}
                    card={card}
                    isDragging={draggedId === card.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4"
          data-testid="frequency-view"
        >
          {byFrequency.map((card) => (
            <ScoutCardItem
              key={card.id}
              card={card}
              isDragging={draggedId === card.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .scout-card-item {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Individual scout card component
// ============================================================

interface ScoutCardItemProps {
  card: ScoutCard;
  isDragging: boolean;
  onDragStart: (cardId: string) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
}

function ScoutCardItem({
  card,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}: ScoutCardItemProps) {
  // Frequency color: higher frequency = more intense color
  const frequencyColor =
    card.frequency >= 40
      ? 'text-red-600 dark:text-red-400'
      : card.frequency >= 20
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

  return (
    <div
      className={cn(
        'scout-card-item border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm print:shadow-none cursor-grab',
        isDragging && 'opacity-50',
      )}
      draggable
      onDragStart={() => onDragStart(card.id)}
      onDragOver={(e) => onDragOver(e, card.id)}
      onDragEnd={onDragEnd}
      data-testid={`scout-card-${card.id}`}
    >
      {/* Situation label */}
      <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400" data-testid="scout-card-situation">
          {card.situation}
        </span>
      </div>

      {/* Play diagram placeholder */}
      <div className="h-28 bg-green-800 flex items-center justify-center" data-testid="scout-card-diagram">
        <span className="text-white text-xs font-bold">{card.playName}</span>
      </div>

      {/* Footer: frequency + notes */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
            {card.playName}
          </span>
          <span
            className={cn('text-sm font-bold tabular-nums', frequencyColor)}
            data-testid="scout-card-frequency"
          >
            {card.frequency}%
          </span>
        </div>
        {card.notes && (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate" data-testid="scout-card-notes">
            {card.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export default ScoutCardBuilder;
