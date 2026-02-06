'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// ============================================================
// CanvasContextMenu — Right-click context menu for the canvas
// ============================================================

export type CanvasContextAction =
  | 'mirror-play'
  | 'duplicate-play'
  | 'select-all'
  | 'clear-routes'
  | 'clear-blocking'
  | 'reset-formation'
  | 'edit-route'
  | 'clear-route'
  | 'duplicate-assignment';

interface MenuItem {
  action: CanvasContextAction;
  label: string;
  shortcut?: string;
}

const CANVAS_MENU_ITEMS: MenuItem[] = [
  { action: 'mirror-play', label: 'Mirror Play', shortcut: 'Ctrl+M' },
  { action: 'duplicate-play', label: 'Duplicate Play', shortcut: 'Ctrl+D' },
  { action: 'select-all', label: 'Select All', shortcut: 'Ctrl+A' },
  { action: 'clear-routes', label: 'Clear Routes' },
  { action: 'clear-blocking', label: 'Clear Blocking' },
  { action: 'reset-formation', label: 'Reset Formation' },
];

const PLAYER_MENU_ITEMS: MenuItem[] = [
  { action: 'edit-route', label: 'Edit Route' },
  { action: 'clear-route', label: 'Clear Route' },
  { action: 'duplicate-assignment', label: 'Duplicate Player Assignment' },
];

export interface CanvasContextMenuProps {
  x: number;
  y: number;
  target: 'canvas' | 'player';
  onAction: (action: CanvasContextAction) => void;
  onClose: () => void;
  playerId?: string;
}

export function CanvasContextMenu({
  x,
  y,
  target,
  onAction,
  onClose,
  playerId,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const items = target === 'player'
    ? [...PLAYER_MENU_ITEMS, ...CANVAS_MENU_ITEMS]
    : CANVAS_MENU_ITEMS;

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  const handleItemClick = (action: CanvasContextAction) => {
    onAction(action);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={target === 'player' ? 'Player context menu' : 'Canvas context menu'}
      className="fixed z-50 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 text-sm"
      style={{ left: x, top: y }}
      data-testid="context-menu"
    >
      {target === 'player' && playerId && (
        <div className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
          Player: {playerId}
        </div>
      )}

      {items.map((item, index) => (
        <React.Fragment key={item.action}>
          {/* Add separator between player and canvas items */}
          {target === 'player' && index === PLAYER_MENU_ITEMS.length && (
            <div
              className="h-px bg-gray-100 dark:bg-gray-700 my-1"
              role="separator"
            />
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-between"
            onClick={() => handleItemClick(item.action)}
            data-testid={`context-menu-${item.action}`}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-4">
                {item.shortcut}
              </span>
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

export default CanvasContextMenu;
