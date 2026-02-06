// ============================================================
// Feature Discovery (#110)
// Tracks which features a user has discovered via localStorage
// ============================================================

const STORAGE_KEY = 'feature-discovery';

export interface FeatureInfo {
  id: string;
  title: string;
  description: string;
  triggerCondition: string;
}

/**
 * All discoverable features in the app with their descriptions and trigger conditions.
 */
export const FEATURES: FeatureInfo[] = [
  {
    id: 'command-palette',
    title: 'Command Palette',
    description: 'Press Cmd+K (or Ctrl+K) to quickly search plays, formations, and run actions.',
    triggerCondition: 'first-open',
  },
  {
    id: 'route-drawing',
    title: 'Route Drawing',
    description: 'Click and drag on the field to draw custom routes for any player.',
    triggerCondition: 'canvas-first-visit',
  },
  {
    id: 'formation-library',
    title: 'Formation Library',
    description: 'Browse and apply pre-built formations or create your own custom formations.',
    triggerCondition: 'playbook-first-visit',
  },
  {
    id: 'drag-reorder',
    title: 'Drag to Reorder',
    description: 'Drag plays to reorder them within your game plan sections.',
    triggerCondition: 'gameplan-first-visit',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Use Ctrl+Z to undo, Ctrl+S to save, and arrow keys to navigate between plays.',
    triggerCondition: 'first-edit',
  },
  {
    id: 'dark-mode',
    title: 'Dark Mode',
    description: 'Toggle dark mode from the settings or use the palette action for easier viewing.',
    triggerCondition: 'first-open',
  },
  {
    id: 'export-pdf',
    title: 'Export to PDF',
    description: 'Export your playbook, game plan, or wristband cards as a printable PDF.',
    triggerCondition: 'playbook-has-plays',
  },
  {
    id: 'defensive-overlay',
    title: 'Defensive Overlay',
    description: 'Add defensive fronts and coverages to visualize your plays against specific looks.',
    triggerCondition: 'play-editor-first-visit',
  },
];

/**
 * Retrieves the set of discovered feature IDs from localStorage.
 */
function getDiscoveredSet(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return new Set(parsed);
    return new Set();
  } catch {
    return new Set();
  }
}

/**
 * Persists the discovered set to localStorage.
 */
function saveDiscoveredSet(discovered: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered]));
  } catch {
    // localStorage unavailable or full
  }
}

/**
 * Marks a feature as discovered by the user.
 */
export function markDiscovered(featureId: string): void {
  const discovered = getDiscoveredSet();
  discovered.add(featureId);
  saveDiscoveredSet(discovered);
}

/**
 * Returns whether a feature has been discovered by the user.
 */
export function isDiscovered(featureId: string): boolean {
  return getDiscoveredSet().has(featureId);
}

/**
 * Returns the list of feature IDs that have not yet been discovered.
 */
export function getUndiscovered(): string[] {
  const discovered = getDiscoveredSet();
  return FEATURES.filter((f) => !discovered.has(f.id)).map((f) => f.id);
}

/**
 * Resets all discovery state (mainly for testing).
 */
export function resetDiscovery(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}
