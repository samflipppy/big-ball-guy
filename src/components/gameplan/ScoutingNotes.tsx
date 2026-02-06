'use client';

import React, { useState } from 'react';
import type { ScoutingNote } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================
// ScoutingNotes — A panel for adding text notes on players
// ============================================================

export interface ScoutingNotesProps {
  playerId: string;
  notes: ScoutingNote[];
  onAddNote: (note: Omit<ScoutingNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteNote: (noteId: string) => void;
  className?: string;
}

const SENTIMENTS = ['weakness', 'strength', 'neutral'] as const;

const SENTIMENT_STYLES: Record<string, string> = {
  weakness: 'border-l-red-500 bg-red-50 dark:bg-red-950/30',
  strength: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
  neutral: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
};

const SENTIMENT_BADGES: Record<string, string> = {
  weakness: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  strength: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  neutral: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export function ScoutingNotes({
  playerId,
  notes,
  onAddNote,
  onDeleteNote,
  className,
}: ScoutingNotesProps) {
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState<ScoutingNote['sentiment']>('neutral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    onAddNote({
      gamePlanId: '',
      type: 'player',
      targetId: playerId,
      content: trimmed,
      sentiment,
      tags: [],
      teamId: '',
    });

    setContent('');
    setSentiment('neutral');
  };

  return (
    <div className={cn('flex flex-col gap-3', className)} data-testid="scouting-notes">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Scouting Notes
      </h3>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-xs text-gray-500" data-testid="empty-message">
          No notes yet. Add one below.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="notes-list">
          {notes.map((note) => (
            <li
              key={note.id}
              className={cn(
                'relative rounded border-l-4 p-2 text-sm',
                SENTIMENT_STYLES[note.sentiment] ?? SENTIMENT_STYLES.neutral,
              )}
              data-testid="note-item"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1">{note.content}</p>
                <button
                  type="button"
                  className="shrink-0 text-gray-400 hover:text-red-600"
                  aria-label={`Delete note: ${note.content}`}
                  onClick={() => onDeleteNote(note.id)}
                  data-testid="delete-note-btn"
                >
                  &times;
                </button>
              </div>
              <span
                className={cn(
                  'mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium',
                  SENTIMENT_BADGES[note.sentiment] ?? SENTIMENT_BADGES.neutral,
                )}
              >
                {note.sentiment}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2" data-testid="add-note-form">
        <textarea
          className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          placeholder="Add a scouting note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          data-testid="note-input"
        />
        <div className="flex items-center gap-2">
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value as ScoutingNote['sentiment'])}
            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
            data-testid="sentiment-select"
          >
            {SENTIMENTS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={!content.trim()}
            data-testid="add-note-btn"
          >
            Add Note
          </button>
        </div>
      </form>
    </div>
  );
}
