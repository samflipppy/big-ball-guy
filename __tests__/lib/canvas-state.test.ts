import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveCanvasState,
  loadCanvasState,
  clearCanvasState,
  getDefaultCanvasState,
  clampZoom,
  type CanvasViewState,
} from '@/lib/canvas-state';

// ---------------------------------------------------------------------------
// localStorage stub — jsdom provides one but we want to spy on it
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getDefaultCanvasState
// ---------------------------------------------------------------------------

describe('getDefaultCanvasState', () => {
  it('returns zoom 1', () => {
    expect(getDefaultCanvasState().zoom).toBe(1);
  });

  it('returns panX 0', () => {
    expect(getDefaultCanvasState().panX).toBe(0);
  });

  it('returns panY 0', () => {
    expect(getDefaultCanvasState().panY).toBe(0);
  });

  it('includes a lastModified ISO string', () => {
    const state = getDefaultCanvasState();
    expect(() => new Date(state.lastModified)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// saveCanvasState / loadCanvasState round-trip
// ---------------------------------------------------------------------------

describe('saveCanvasState + loadCanvasState', () => {
  const state: CanvasViewState = {
    zoom: 2,
    panX: 100,
    panY: -50,
    lastModified: '2026-01-15T10:00:00Z',
  };

  it('round-trips a state object through localStorage', () => {
    saveCanvasState('play-1', state);
    const loaded = loadCanvasState('play-1');
    expect(loaded.zoom).toBe(2);
    expect(loaded.panX).toBe(100);
    expect(loaded.panY).toBe(-50);
  });

  it('returns default state when nothing is saved', () => {
    const loaded = loadCanvasState('nonexistent');
    expect(loaded.zoom).toBe(1);
    expect(loaded.panX).toBe(0);
  });

  it('returns default state for empty playId', () => {
    const loaded = loadCanvasState('');
    expect(loaded.zoom).toBe(1);
  });

  it('does not throw when saving with empty playId', () => {
    expect(() => saveCanvasState('', state)).not.toThrow();
  });

  it('clamps zoom on load if out of range', () => {
    const bigZoom: CanvasViewState = { ...state, zoom: 10 };
    saveCanvasState('play-2', bigZoom);
    const loaded = loadCanvasState('play-2');
    expect(loaded.zoom).toBe(4); // max
  });

  it('returns default when stored data is malformed JSON', () => {
    localStorage.setItem('bbg_canvas_state_play-3', '{not valid json');
    const loaded = loadCanvasState('play-3');
    expect(loaded.zoom).toBe(1);
  });

  it('returns default when stored data is missing fields', () => {
    localStorage.setItem('bbg_canvas_state_play-4', JSON.stringify({ zoom: 'not a number' }));
    const loaded = loadCanvasState('play-4');
    expect(loaded.zoom).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// clearCanvasState
// ---------------------------------------------------------------------------

describe('clearCanvasState', () => {
  it('removes persisted state for a play', () => {
    const state: CanvasViewState = {
      zoom: 1.5,
      panX: 0,
      panY: 0,
      lastModified: new Date().toISOString(),
    };
    saveCanvasState('play-5', state);
    expect(loadCanvasState('play-5').zoom).toBe(1.5);

    clearCanvasState('play-5');
    expect(loadCanvasState('play-5').zoom).toBe(1); // default
  });

  it('does not throw for nonexistent key', () => {
    expect(() => clearCanvasState('no-such-play')).not.toThrow();
  });

  it('does not throw for empty playId', () => {
    expect(() => clearCanvasState('')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// clampZoom
// ---------------------------------------------------------------------------

describe('clampZoom', () => {
  it('returns value unchanged when within default range', () => {
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(2.5)).toBe(2.5);
  });

  it('clamps to minimum 0.25 by default', () => {
    expect(clampZoom(0.1)).toBe(0.25);
  });

  it('clamps to maximum 4 by default', () => {
    expect(clampZoom(10)).toBe(4);
  });

  it('uses custom min/max when provided', () => {
    expect(clampZoom(0.1, 0.5, 2)).toBe(0.5);
    expect(clampZoom(5, 0.5, 2)).toBe(2);
  });

  it('returns 1 for NaN', () => {
    expect(clampZoom(NaN)).toBe(1);
  });

  it('handles negative zoom values', () => {
    expect(clampZoom(-1)).toBe(0.25);
  });

  it('handles exact boundary values', () => {
    expect(clampZoom(0.25)).toBe(0.25);
    expect(clampZoom(4)).toBe(4);
  });
});
