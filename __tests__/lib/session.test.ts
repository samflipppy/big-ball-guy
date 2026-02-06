import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveSessionState,
  saveSessionStateImmediate,
  restoreSessionState,
  getRecentlyEdited,
  addToRecentlyEdited,
  clearSessionState,
  type SessionState,
  type RecentItem,
} from '@/lib/session';

// ---- Helpers ----

function makeSessionState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    currentPlayId: 'play-1',
    currentFormationId: 'form-1',
    canvasZoom: 1,
    canvasPanX: 0,
    canvasPanY: 0,
    tool: 'select',
    sidebarOpen: true,
    timestamp: Date.now(),
    ...overrides,
  };
}

// ---- Tests ----

describe('session', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -- saveSessionState (debounced) --

  describe('saveSessionState()', () => {
    it('does not save immediately (debounced)', () => {
      const state = makeSessionState();
      saveSessionState(state);
      // Nothing in storage yet
      expect(localStorage.getItem('playbook_session_state')).toBeNull();
    });

    it('saves after the 2-second debounce', () => {
      const state = makeSessionState();
      saveSessionState(state);
      vi.advanceTimersByTime(2000);
      const stored = localStorage.getItem('playbook_session_state');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.currentPlayId).toBe('play-1');
    });

    it('resets the timer on subsequent calls', () => {
      saveSessionState(makeSessionState({ currentPlayId: 'a' }));
      vi.advanceTimersByTime(1500);
      saveSessionState(makeSessionState({ currentPlayId: 'b' }));
      vi.advanceTimersByTime(1500);
      // First timer expired, but was cleared
      expect(localStorage.getItem('playbook_session_state')).toBeNull();
      vi.advanceTimersByTime(500);
      const parsed = JSON.parse(localStorage.getItem('playbook_session_state')!);
      expect(parsed.currentPlayId).toBe('b');
    });
  });

  // -- saveSessionStateImmediate --

  describe('saveSessionStateImmediate()', () => {
    it('saves immediately', () => {
      const state = makeSessionState({ currentPlayId: 'instant' });
      saveSessionStateImmediate(state);
      const stored = localStorage.getItem('playbook_session_state');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).currentPlayId).toBe('instant');
    });

    it('cancels any pending debounced save', () => {
      saveSessionState(makeSessionState({ currentPlayId: 'debounced' }));
      saveSessionStateImmediate(makeSessionState({ currentPlayId: 'immediate' }));
      vi.advanceTimersByTime(3000);
      const parsed = JSON.parse(localStorage.getItem('playbook_session_state')!);
      expect(parsed.currentPlayId).toBe('immediate');
    });
  });

  // -- restoreSessionState --

  describe('restoreSessionState()', () => {
    it('returns null when nothing is stored', () => {
      expect(restoreSessionState()).toBeNull();
    });

    it('returns the saved session state', () => {
      const state = makeSessionState({ tool: 'draw-route' });
      saveSessionStateImmediate(state);
      const restored = restoreSessionState();
      expect(restored).not.toBeNull();
      expect(restored!.tool).toBe('draw-route');
      expect(restored!.currentPlayId).toBe('play-1');
    });

    it('returns null for corrupt data', () => {
      localStorage.setItem('playbook_session_state', '{{broken json');
      expect(restoreSessionState()).toBeNull();
    });

    it('returns null when timestamp is missing', () => {
      localStorage.setItem('playbook_session_state', JSON.stringify({ currentPlayId: 'x' }));
      expect(restoreSessionState()).toBeNull();
    });
  });

  // -- getRecentlyEdited / addToRecentlyEdited --

  describe('getRecentlyEdited()', () => {
    it('returns empty array when nothing is stored', () => {
      expect(getRecentlyEdited()).toEqual([]);
    });

    it('returns items in most-recent-first order', () => {
      addToRecentlyEdited({ id: 'a', type: 'play', name: 'Play A', timestamp: 100 });
      addToRecentlyEdited({ id: 'b', type: 'gameplan', name: 'GP B', timestamp: 200 });
      const items = getRecentlyEdited();
      expect(items[0].id).toBe('b');
      expect(items[1].id).toBe('a');
    });

    it('returns corrupt data as empty array', () => {
      localStorage.setItem('playbook_recently_edited', 'not json');
      expect(getRecentlyEdited()).toEqual([]);
    });
  });

  describe('addToRecentlyEdited()', () => {
    it('adds a new item', () => {
      addToRecentlyEdited({ id: '1', type: 'play', name: 'Play 1' });
      const items = getRecentlyEdited();
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Play 1');
      expect(items[0].type).toBe('play');
      expect(typeof items[0].timestamp).toBe('number');
    });

    it('updates timestamp for existing item by id', () => {
      addToRecentlyEdited({ id: '1', type: 'play', name: 'Play 1', timestamp: 100 });
      addToRecentlyEdited({ id: '1', type: 'play', name: 'Play 1 Updated', timestamp: 200 });
      const items = getRecentlyEdited();
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Play 1 Updated');
      expect(items[0].timestamp).toBe(200);
    });

    it('moves re-added item to the front', () => {
      addToRecentlyEdited({ id: 'a', type: 'play', name: 'A', timestamp: 100 });
      addToRecentlyEdited({ id: 'b', type: 'gameplan', name: 'B', timestamp: 200 });
      addToRecentlyEdited({ id: 'a', type: 'play', name: 'A', timestamp: 300 });
      const items = getRecentlyEdited();
      expect(items[0].id).toBe('a');
      expect(items[1].id).toBe('b');
    });

    it('caps the list at 10 items', () => {
      for (let i = 0; i < 15; i++) {
        addToRecentlyEdited({
          id: `item-${i}`,
          type: 'play',
          name: `Play ${i}`,
          timestamp: i * 100,
        });
      }
      const items = getRecentlyEdited();
      expect(items).toHaveLength(10);
      // Most recent item is first
      expect(items[0].id).toBe('item-14');
    });

    it('supports all three types', () => {
      addToRecentlyEdited({ id: '1', type: 'play', name: 'P' });
      addToRecentlyEdited({ id: '2', type: 'gameplan', name: 'G' });
      addToRecentlyEdited({ id: '3', type: 'practice', name: 'Pr' });
      const items = getRecentlyEdited();
      expect(items.map((i) => i.type)).toEqual(['practice', 'gameplan', 'play']);
    });
  });

  // -- clearSessionState --

  describe('clearSessionState()', () => {
    it('removes session state', () => {
      saveSessionStateImmediate(makeSessionState());
      expect(restoreSessionState()).not.toBeNull();
      clearSessionState();
      expect(restoreSessionState()).toBeNull();
    });

    it('removes recently edited items', () => {
      addToRecentlyEdited({ id: '1', type: 'play', name: 'X' });
      expect(getRecentlyEdited()).toHaveLength(1);
      clearSessionState();
      expect(getRecentlyEdited()).toEqual([]);
    });

    it('cancels any pending debounced save', () => {
      saveSessionState(makeSessionState());
      clearSessionState();
      vi.advanceTimersByTime(3000);
      expect(restoreSessionState()).toBeNull();
    });
  });
});
