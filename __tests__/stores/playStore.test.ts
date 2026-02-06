import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAppStore, useHistoryStore } from '@/stores/playStore';
import type { Play } from '@/types';

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: overrides.id ?? 'play-1',
    name: overrides.name ?? 'Test Play',
    formationId: 'form-1',
    assignments: [],
    tags: [],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useAppStore.setState({
      currentTeamId: null,
      currentPlayId: null,
      currentMode: 'playbook',
      sidebarOpen: true,
      darkMode: false,
      canvasTool: 'select',
      plays: [],
      formations: [],
      concepts: [],
      gameplans: [],
    });
  });

  describe('setCurrentMode', () => {
    it('sets the current mode', () => {
      act(() => {
        useAppStore.getState().setCurrentMode('gameplan');
      });
      expect(useAppStore.getState().currentMode).toBe('gameplan');
    });

    it('can cycle through all modes', () => {
      const modes = ['sketch', 'playbook', 'gameplan', 'practice', 'gameday'] as const;
      for (const mode of modes) {
        act(() => {
          useAppStore.getState().setCurrentMode(mode);
        });
        expect(useAppStore.getState().currentMode).toBe(mode);
      }
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebar from open to closed', () => {
      expect(useAppStore.getState().sidebarOpen).toBe(true);
      act(() => {
        useAppStore.getState().toggleSidebar();
      });
      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });

    it('toggles sidebar from closed to open', () => {
      act(() => {
        useAppStore.getState().toggleSidebar();
      });
      expect(useAppStore.getState().sidebarOpen).toBe(false);
      act(() => {
        useAppStore.getState().toggleSidebar();
      });
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('toggleDarkMode', () => {
    it('toggles dark mode on', () => {
      expect(useAppStore.getState().darkMode).toBe(false);
      act(() => {
        useAppStore.getState().toggleDarkMode();
      });
      expect(useAppStore.getState().darkMode).toBe(true);
    });

    it('toggles dark mode off', () => {
      act(() => {
        useAppStore.getState().toggleDarkMode();
      });
      act(() => {
        useAppStore.getState().toggleDarkMode();
      });
      expect(useAppStore.getState().darkMode).toBe(false);
    });
  });

  describe('setCanvasTool', () => {
    it('sets the canvas tool', () => {
      act(() => {
        useAppStore.getState().setCanvasTool('draw-route');
      });
      expect(useAppStore.getState().canvasTool).toBe('draw-route');
    });

    it('can set to eraser', () => {
      act(() => {
        useAppStore.getState().setCanvasTool('eraser');
      });
      expect(useAppStore.getState().canvasTool).toBe('eraser');
    });

    it('can set to pan', () => {
      act(() => {
        useAppStore.getState().setCanvasTool('pan');
      });
      expect(useAppStore.getState().canvasTool).toBe('pan');
    });
  });

  describe('play CRUD', () => {
    it('addPlay adds a play to the list', () => {
      const play = makePlay();
      act(() => {
        useAppStore.getState().addPlay(play);
      });
      expect(useAppStore.getState().plays).toHaveLength(1);
      expect(useAppStore.getState().plays[0]).toEqual(play);
    });

    it('addPlay appends to existing plays', () => {
      const play1 = makePlay({ id: 'play-1', name: 'Play One' });
      const play2 = makePlay({ id: 'play-2', name: 'Play Two' });
      act(() => {
        useAppStore.getState().addPlay(play1);
        useAppStore.getState().addPlay(play2);
      });
      expect(useAppStore.getState().plays).toHaveLength(2);
    });

    it('updatePlay updates an existing play', () => {
      const play = makePlay();
      act(() => {
        useAppStore.getState().addPlay(play);
      });

      const updated = { ...play, name: 'Updated Play' };
      act(() => {
        useAppStore.getState().updatePlay(updated);
      });

      expect(useAppStore.getState().plays[0].name).toBe('Updated Play');
      expect(useAppStore.getState().plays).toHaveLength(1);
    });

    it('updatePlay does not modify other plays', () => {
      const play1 = makePlay({ id: 'play-1', name: 'Play One' });
      const play2 = makePlay({ id: 'play-2', name: 'Play Two' });
      act(() => {
        useAppStore.getState().addPlay(play1);
        useAppStore.getState().addPlay(play2);
      });

      const updated = { ...play1, name: 'Updated One' };
      act(() => {
        useAppStore.getState().updatePlay(updated);
      });

      expect(useAppStore.getState().plays[0].name).toBe('Updated One');
      expect(useAppStore.getState().plays[1].name).toBe('Play Two');
    });

    it('removePlay removes a play by id', () => {
      const play1 = makePlay({ id: 'play-1' });
      const play2 = makePlay({ id: 'play-2' });
      act(() => {
        useAppStore.getState().addPlay(play1);
        useAppStore.getState().addPlay(play2);
      });

      act(() => {
        useAppStore.getState().removePlay('play-1');
      });

      expect(useAppStore.getState().plays).toHaveLength(1);
      expect(useAppStore.getState().plays[0].id).toBe('play-2');
    });

    it('removePlay with non-existent id does nothing', () => {
      const play = makePlay();
      act(() => {
        useAppStore.getState().addPlay(play);
      });

      act(() => {
        useAppStore.getState().removePlay('non-existent');
      });

      expect(useAppStore.getState().plays).toHaveLength(1);
    });

    it('setPlays replaces all plays', () => {
      const play1 = makePlay({ id: 'play-1' });
      act(() => {
        useAppStore.getState().addPlay(play1);
      });

      const newPlays = [
        makePlay({ id: 'play-a' }),
        makePlay({ id: 'play-b' }),
      ];
      act(() => {
        useAppStore.getState().setPlays(newPlays);
      });

      expect(useAppStore.getState().plays).toHaveLength(2);
      expect(useAppStore.getState().plays[0].id).toBe('play-a');
    });
  });
});

describe('useHistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({ past: [], future: [] });
  });

  describe('pushHistory', () => {
    it('adds entry to past stack', () => {
      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'move-player',
          before: { x: 0, y: 0 },
          after: { x: 10, y: 10 },
        });
      });

      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().past[0].action).toBe('move-player');
    });

    it('generates id and timestamp for entries', () => {
      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'test',
          before: null,
          after: null,
        });
      });

      const entry = useHistoryStore.getState().past[0];
      expect(entry.id).toBeDefined();
      expect(typeof entry.id).toBe('string');
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it('clears future on new action', () => {
      // Push, undo, then push again
      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'first',
          before: null,
          after: null,
        });
      });
      act(() => {
        useHistoryStore.getState().undo();
      });
      expect(useHistoryStore.getState().future).toHaveLength(1);

      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'new',
          before: null,
          after: null,
        });
      });
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });
  });

  describe('undo', () => {
    it('moves last past entry to future', () => {
      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'action-1',
          before: 'before-1',
          after: 'after-1',
        });
      });

      let entry: unknown;
      act(() => {
        entry = useHistoryStore.getState().undo();
      });

      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(1);
      expect((entry as { action: string }).action).toBe('action-1');
    });

    it('returns undefined when past is empty', () => {
      let entry: unknown;
      act(() => {
        entry = useHistoryStore.getState().undo();
      });

      expect(entry).toBeUndefined();
    });

    it('handles multiple undos in sequence', () => {
      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'first',
          before: null,
          after: null,
        });
        useHistoryStore.getState().pushHistory({
          action: 'second',
          before: null,
          after: null,
        });
      });

      act(() => {
        useHistoryStore.getState().undo();
      });
      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().future).toHaveLength(1);

      act(() => {
        useHistoryStore.getState().undo();
      });
      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(2);
    });
  });

  describe('redo', () => {
    it('moves first future entry back to past', () => {
      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'action-1',
          before: 'before-1',
          after: 'after-1',
        });
      });
      act(() => {
        useHistoryStore.getState().undo();
      });

      let entry: unknown;
      act(() => {
        entry = useHistoryStore.getState().redo();
      });

      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().future).toHaveLength(0);
      expect((entry as { action: string }).action).toBe('action-1');
    });

    it('returns undefined when future is empty', () => {
      let entry: unknown;
      act(() => {
        entry = useHistoryStore.getState().redo();
      });
      expect(entry).toBeUndefined();
    });
  });

  describe('clearHistory', () => {
    it('clears both past and future', () => {
      act(() => {
        useHistoryStore.getState().pushHistory({
          action: 'a',
          before: null,
          after: null,
        });
        useHistoryStore.getState().pushHistory({
          action: 'b',
          before: null,
          after: null,
        });
      });
      act(() => {
        useHistoryStore.getState().undo();
      });

      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().future).toHaveLength(1);

      act(() => {
        useHistoryStore.getState().clearHistory();
      });

      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });
  });
});
