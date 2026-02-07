/**
 * Canvas Zoom Persistence (#260)
 *
 * Saves / loads per-play canvas view state (zoom, pan) to localStorage
 * so users return to the same view when re-opening a play.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasViewState {
  zoom: number;
  panX: number;
  panY: number;
  lastModified: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'bbg_canvas_state_';
const DEFAULT_ZOOM = 1;
const DEFAULT_PAN = 0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(playId: string): string {
  return `${STORAGE_PREFIX}${playId}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the default canvas view state (zoom 1, no pan).
 */
export function getDefaultCanvasState(): CanvasViewState {
  return {
    zoom: DEFAULT_ZOOM,
    panX: DEFAULT_PAN,
    panY: DEFAULT_PAN,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Persist the canvas view state for a given play to localStorage.
 */
export function saveCanvasState(playId: string, state: CanvasViewState): void {
  if (!playId) return;

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(storageKey(playId), serialized);
  } catch {
    // localStorage may be full or unavailable — silently ignore
  }
}

/**
 * Load the persisted canvas view state for a play.
 * Returns the default state if nothing is stored or the data is corrupted.
 */
export function loadCanvasState(playId: string): CanvasViewState {
  if (!playId) return getDefaultCanvasState();

  try {
    const raw = localStorage.getItem(storageKey(playId));
    if (!raw) return getDefaultCanvasState();

    const parsed = JSON.parse(raw) as CanvasViewState;

    // Sanity-check the parsed data
    if (
      typeof parsed.zoom !== 'number' ||
      typeof parsed.panX !== 'number' ||
      typeof parsed.panY !== 'number'
    ) {
      return getDefaultCanvasState();
    }

    return {
      ...parsed,
      zoom: clampZoom(parsed.zoom),
    };
  } catch {
    return getDefaultCanvasState();
  }
}

/**
 * Remove the persisted canvas state for a play.
 */
export function clearCanvasState(playId: string): void {
  if (!playId) return;

  try {
    localStorage.removeItem(storageKey(playId));
  } catch {
    // ignore
  }
}

/**
 * Constrain a zoom value within the allowed range.
 *
 * @param zoom  - the raw zoom value
 * @param min   - minimum zoom (default 0.25)
 * @param max   - maximum zoom (default 4)
 */
export function clampZoom(
  zoom: number,
  min: number = MIN_ZOOM,
  max: number = MAX_ZOOM,
): number {
  if (Number.isNaN(zoom)) return DEFAULT_ZOOM;
  return Math.min(max, Math.max(min, zoom));
}
