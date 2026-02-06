'use client';

import { useCallback, useEffect } from 'react';
import { useHistoryStore } from '@/stores/playStore';

export function useUndoRedo(
  onUndo: (before: unknown) => void,
  onRedo: (after: unknown) => void,
) {
  const { undo, redo, past, future, pushHistory } = useHistoryStore();

  const handleUndo = useCallback(() => {
    const entry = undo();
    if (entry) {
      onUndo(entry.before);
    }
  }, [undo, onUndo]);

  const handleRedo = useCallback(() => {
    const entry = redo();
    if (entry) {
      onRedo(entry.after);
    }
  }, [redo, onRedo]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pushHistory,
  };
}
