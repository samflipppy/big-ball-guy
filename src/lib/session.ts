import type { CanvasTool, PlayId, FormationId } from '@/types';

// ---- Types ----

export interface SessionState {
  currentPlayId: PlayId | null;
  currentFormationId: FormationId | null;
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  tool: CanvasTool;
  sidebarOpen: boolean;
  timestamp: number;
}

export interface RecentItem {
  id: string;
  type: 'play' | 'gameplan' | 'practice';
  name: string;
  timestamp: number;
}

// ---- Constants ----

const SESSION_KEY = 'playbook_session_state';
const RECENT_KEY = 'playbook_recently_edited';
const MAX_RECENT_ITEMS = 10;
const DEBOUNCE_MS = 2000;

// ---- Helpers ----

function isLocalStorageAvailable(): boolean {
  try {
    const key = '__ls_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ---- Session State ----

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Persist the current editing context to localStorage.
 * Saves are debounced at 2 seconds so rapid changes don't thrash storage.
 */
export function saveSessionState(state: SessionState): void {
  if (!isLocalStorageAvailable()) return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      const payload: SessionState = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {
      // Storage full or unavailable — silently ignore
    }
    saveTimeout = null;
  }, DEBOUNCE_MS);
}

/**
 * Immediately save session state without debouncing.
 * Useful for tests and forced saves (e.g. before unload).
 */
export function saveSessionStateImmediate(state: SessionState): void {
  if (!isLocalStorageAvailable()) return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  try {
    const payload: SessionState = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Restore a previously saved session state, or null if none exists.
 */
export function restoreSessionState(): SessionState | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionState;
    // Basic validation
    if (typeof parsed.timestamp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Return the last 10 recently edited plays / game plans / practice scripts.
 */
export function getRecentlyEdited(): RecentItem[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as RecentItem[];
    if (!Array.isArray(items)) return [];
    return items.slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

/**
 * Add or update a recently-edited item.
 * If the item already exists (by id) the timestamp is updated and the list is
 * re-sorted by most-recent-first. The list is capped at 10 items.
 */
export function addToRecentlyEdited(item: Omit<RecentItem, 'timestamp'> & { timestamp?: number }): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const items = getRecentlyEdited();
    const now = item.timestamp ?? Date.now();

    // Remove existing entry with same id
    const filtered = items.filter((i) => i.id !== item.id);

    const entry: RecentItem = {
      id: item.id,
      type: item.type,
      name: item.name,
      timestamp: now,
    };

    // Prepend and cap
    const updated = [entry, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // Silently ignore
  }
}

/**
 * Clear all session state (both the editing context and recent list).
 */
export function clearSessionState(): void {
  if (!isLocalStorageAvailable()) return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Silently ignore
  }
}
