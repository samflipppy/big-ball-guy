'use client';

import React, { useCallback } from 'react';
import type { CanvasTool } from '@/types';
import { useAppStore } from '@/stores/playStore';
import { useHistoryStore } from '@/stores/playStore';

interface ToolButton {
  tool: CanvasTool;
  label: string;
  icon: string;
  shortcut: string;
}

const TOOL_BUTTONS: ToolButton[] = [
  { tool: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { tool: 'draw-route', label: 'Draw Route', icon: '〰', shortcut: 'R' },
  { tool: 'draw-block', label: 'Draw Block', icon: '▬', shortcut: 'B' },
  { tool: 'draw-motion', label: 'Draw Motion', icon: '⤻', shortcut: 'M' },
  { tool: 'eraser', label: 'Eraser', icon: '⌫', shortcut: 'E' },
  { tool: 'pan', label: 'Pan', icon: '✋', shortcut: 'H' },
];

export interface DrawingToolsProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function DrawingTools({
  orientation = 'horizontal',
  className = '',
}: DrawingToolsProps) {
  const canvasTool = useAppStore((s) => s.canvasTool);
  const setCanvasTool = useAppStore((s) => s.setCanvasTool);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const past = useHistoryStore((s) => s.past);
  const future = useHistoryStore((s) => s.future);

  const handleToolClick = useCallback(
    (tool: CanvasTool) => {
      setCanvasTool(tool);
    },
    [setCanvasTool],
  );

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  // Keyboard shortcut handler — intended to be attached by parent
  // via useEffect on window keydown, or used directly
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      switch (key) {
        case 'V':
          setCanvasTool('select');
          break;
        case 'R':
          setCanvasTool('draw-route');
          break;
        case 'B':
          setCanvasTool('draw-block');
          break;
        case 'M':
          setCanvasTool('draw-motion');
          break;
        case 'E':
          setCanvasTool('eraser');
          break;
        case 'H':
          setCanvasTool('pan');
          break;
        case 'Z':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'Y':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            redo();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCanvasTool, undo, redo]);

  const isHorizontal = orientation === 'horizontal';
  const containerClass = isHorizontal
    ? 'flex flex-row items-center gap-1'
    : 'flex flex-col items-center gap-1';

  return (
    <div
      className={`${containerClass} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 shadow-sm ${className}`}
      role="toolbar"
      aria-label="Drawing tools"
    >
      {TOOL_BUTTONS.map((btn) => (
        <button
          key={btn.tool}
          type="button"
          onClick={() => handleToolClick(btn.tool)}
          title={`${btn.label} (${btn.shortcut})`}
          aria-label={btn.label}
          aria-pressed={canvasTool === btn.tool}
          className={`
            flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium
            transition-colors duration-100
            ${
              canvasTool === btn.tool
                ? 'bg-blue-600 text-white shadow-inner'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
          data-tool={btn.tool}
        >
          <span aria-hidden="true">{btn.icon}</span>
        </button>
      ))}

      {/* Separator */}
      <div
        className={
          isHorizontal
            ? 'w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1'
            : 'h-px w-6 bg-gray-200 dark:bg-gray-600 my-1'
        }
        role="separator"
      />

      {/* Undo */}
      <button
        type="button"
        onClick={handleUndo}
        disabled={past.length === 0}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className={`
          flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium
          transition-colors duration-100
          ${
            past.length === 0
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
        `}
        data-tool="undo"
      >
        <span aria-hidden="true">↩</span>
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={handleRedo}
        disabled={future.length === 0}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        className={`
          flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium
          transition-colors duration-100
          ${
            future.length === 0
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
        `}
        data-tool="redo"
      >
        <span aria-hidden="true">↪</span>
      </button>
    </div>
  );
}

export default DrawingTools;
