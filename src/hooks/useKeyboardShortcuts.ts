'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getAllShortcuts, matchesShortcut, type Shortcut } from '@/lib/shortcuts';

export type ShortcutHandler = (action: string, event: KeyboardEvent) => void;

interface UseKeyboardShortcutsOptions {
  /** Handler called when any registered shortcut is triggered */
  onShortcut: ShortcutHandler;
  /** Whether the shortcuts are currently active (default true) */
  enabled?: boolean;
}

/**
 * Hook that registers global keyboard shortcuts.
 *
 * - Prevents shortcuts when typing in inputs/textareas/contenteditable
 * - Supports modifier keys (Cmd/Ctrl, Shift, Alt)
 * - Returns registered shortcuts for help display
 */
export function useKeyboardShortcuts({
  onShortcut,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handlerRef = useRef(onShortcut);
  handlerRef.current = onShortcut;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip shortcuts when typing in form elements
      if (isTypingInInput(event)) {
        // Still allow Escape in inputs
        if (event.key !== 'Escape') return;
      }

      const shortcuts = getAllShortcuts();
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut.keys)) {
          event.preventDefault();
          handlerRef.current(shortcut.action, event);
          return;
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  const shortcuts = getAllShortcuts();

  return { shortcuts };
}

/**
 * Returns true if the event target is a text input, textarea, or
 * contenteditable element — meaning the user is typing.
 */
function isTypingInInput(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }

  return false;
}

export function getGroupedShortcuts(): Record<string, Shortcut[]> {
  const shortcuts = getAllShortcuts();
  const grouped: Record<string, Shortcut[]> = {};
  for (const shortcut of shortcuts) {
    if (!grouped[shortcut.category]) {
      grouped[shortcut.category] = [];
    }
    grouped[shortcut.category].push(shortcut);
  }
  return grouped;
}
