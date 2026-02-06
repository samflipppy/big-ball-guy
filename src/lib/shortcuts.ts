// Central keyboard shortcut registry

export interface Shortcut {
  keys: string; // e.g. 'Cmd+K', 'Cmd+Shift+Z', 'Escape', '1'
  description: string;
  action: string; // identifier for the action, e.g. 'search', 'save'
  category: 'General' | 'Canvas Tools' | 'Navigation' | 'Playbook';
}

// ---- Built-in shortcuts ----

export const SHORTCUTS: Shortcut[] = [
  // General
  { keys: 'Cmd+K', description: 'Open search', action: 'search', category: 'General' },
  { keys: 'Cmd+S', description: 'Save current play', action: 'save', category: 'General' },
  { keys: 'Cmd+Z', description: 'Undo', action: 'undo', category: 'General' },
  { keys: 'Cmd+Shift+Z', description: 'Redo', action: 'redo', category: 'General' },
  { keys: 'Escape', description: 'Close modal / Deselect', action: 'escape', category: 'General' },
  { keys: '?', description: 'Show keyboard shortcuts', action: 'show-shortcuts', category: 'General' },

  // Playbook
  { keys: 'Cmd+N', description: 'New play', action: 'new-play', category: 'Playbook' },
  { keys: '1', description: 'Quick pick formation 1', action: 'quick-formation-1', category: 'Playbook' },
  { keys: '2', description: 'Quick pick formation 2', action: 'quick-formation-2', category: 'Playbook' },
  { keys: '3', description: 'Quick pick formation 3', action: 'quick-formation-3', category: 'Playbook' },
  { keys: '4', description: 'Quick pick formation 4', action: 'quick-formation-4', category: 'Playbook' },
  { keys: '5', description: 'Quick pick formation 5', action: 'quick-formation-5', category: 'Playbook' },
  { keys: '6', description: 'Quick pick formation 6', action: 'quick-formation-6', category: 'Playbook' },
  { keys: '7', description: 'Quick pick formation 7', action: 'quick-formation-7', category: 'Playbook' },
  { keys: '8', description: 'Quick pick formation 8', action: 'quick-formation-8', category: 'Playbook' },
  { keys: '9', description: 'Quick pick formation 9', action: 'quick-formation-9', category: 'Playbook' },

  // Canvas Tools (placeholder for future canvas-specific shortcuts)
  { keys: 'V', description: 'Select tool', action: 'tool-select', category: 'Canvas Tools' },
  { keys: 'R', description: 'Draw route tool', action: 'tool-draw-route', category: 'Canvas Tools' },
  { keys: 'B', description: 'Draw blocking tool', action: 'tool-draw-block', category: 'Canvas Tools' },
  { keys: 'E', description: 'Eraser tool', action: 'tool-eraser', category: 'Canvas Tools' },

  // Navigation
  { keys: 'Cmd+\\', description: 'Toggle sidebar', action: 'toggle-sidebar', category: 'Navigation' },
];

// ---- Dynamic registry for runtime shortcuts ----

const registeredShortcuts: Shortcut[] = [];

/**
 * Register an additional shortcut at runtime.
 * Returns an unregister function for cleanup.
 */
export function registerShortcut(shortcut: Shortcut): () => void {
  registeredShortcuts.push(shortcut);
  return () => unregisterShortcut(shortcut.action);
}

/**
 * Unregister a runtime shortcut by its action id.
 */
export function unregisterShortcut(action: string): void {
  const index = registeredShortcuts.findIndex((s) => s.action === action);
  if (index !== -1) {
    registeredShortcuts.splice(index, 1);
  }
}

/**
 * Get all shortcuts (built-in + dynamically registered).
 */
export function getAllShortcuts(): Shortcut[] {
  return [...SHORTCUTS, ...registeredShortcuts];
}

/**
 * Get shortcuts grouped by category.
 */
export function getShortcutsByCategory(): Record<string, Shortcut[]> {
  const all = getAllShortcuts();
  const grouped: Record<string, Shortcut[]> = {};
  for (const shortcut of all) {
    if (!grouped[shortcut.category]) {
      grouped[shortcut.category] = [];
    }
    grouped[shortcut.category].push(shortcut);
  }
  return grouped;
}

/**
 * Parse a shortcut keys string into modifier flags and the main key.
 */
export function parseShortcutKeys(keys: string): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
} {
  const parts = keys.split('+');
  const modifiers = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: '',
  };

  for (const part of parts) {
    const lower = part.trim().toLowerCase();
    if (lower === 'cmd' || lower === 'ctrl' || lower === 'meta') {
      modifiers.meta = true;
      modifiers.ctrl = true; // Support both Mac Cmd and Win Ctrl
    } else if (lower === 'shift') {
      modifiers.shift = true;
    } else if (lower === 'alt' || lower === 'option') {
      modifiers.alt = true;
    } else {
      modifiers.key = part.trim();
    }
  }

  return modifiers;
}

/**
 * Check if a keyboard event matches a shortcut key definition.
 */
export function matchesShortcut(event: KeyboardEvent, keys: string): boolean {
  const parsed = parseShortcutKeys(keys);

  // Check modifiers
  const needsMeta = parsed.meta || parsed.ctrl;
  const hasMeta = event.metaKey || event.ctrlKey;
  if (needsMeta !== hasMeta) return false;
  if (parsed.shift !== event.shiftKey) return false;
  if (parsed.alt !== event.altKey) return false;

  // Check key
  return event.key.toLowerCase() === parsed.key.toLowerCase();
}
