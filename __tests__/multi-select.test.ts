import { describe, it, expect } from 'vitest';
import {
  createSelection,
  moveSelection,
  getBoundingBox,
  alignSelection,
  type PlayerWithLocation,
  type SelectionGroup,
} from '@/lib/multi-select';

function makePlayers(): PlayerWithLocation[] {
  return [
    { playerId: 'p1', location: { x: 100, y: 100 } },
    { playerId: 'p2', location: { x: 200, y: 150 } },
    { playerId: 'p3', location: { x: 300, y: 200 } },
    { playerId: 'p4', location: { x: 400, y: 100 } },
    { playerId: 'p5', location: { x: 500, y: 300 } },
  ];
}

describe('multi-select', () => {
  // ---- createSelection ----
  describe('createSelection', () => {
    it('creates a selection group from player IDs', () => {
      const selection = createSelection(['p1', 'p2', 'p3']);
      expect(selection.playerIds).toEqual(['p1', 'p2', 'p3']);
      expect(selection.createdAt).toBeGreaterThan(0);
    });

    it('deduplicates player IDs', () => {
      const selection = createSelection(['p1', 'p2', 'p1', 'p3', 'p2']);
      expect(selection.playerIds).toEqual(['p1', 'p2', 'p3']);
    });

    it('creates empty selection for empty array', () => {
      const selection = createSelection([]);
      expect(selection.playerIds).toEqual([]);
    });
  });

  // ---- moveSelection ----
  describe('moveSelection', () => {
    it('moves all selected players by the given delta', () => {
      const players = makePlayers();
      const selection = createSelection(['p1', 'p3']);
      const result = moveSelection(players, selection, { dx: 50, dy: -25 });

      const p1 = result.find((p) => p.playerId === 'p1')!;
      const p3 = result.find((p) => p.playerId === 'p3')!;
      expect(p1.location).toEqual({ x: 150, y: 75 });
      expect(p3.location).toEqual({ x: 350, y: 175 });
    });

    it('does not move unselected players', () => {
      const players = makePlayers();
      const selection = createSelection(['p1']);
      const result = moveSelection(players, selection, { dx: 100, dy: 100 });

      const p2 = result.find((p) => p.playerId === 'p2')!;
      expect(p2.location).toEqual({ x: 200, y: 150 });
    });

    it('does not mutate the original players array', () => {
      const players = makePlayers();
      const selection = createSelection(['p1']);
      moveSelection(players, selection, { dx: 999, dy: 999 });
      expect(players[0].location).toEqual({ x: 100, y: 100 });
    });

    it('handles zero delta', () => {
      const players = makePlayers();
      const selection = createSelection(['p1', 'p2']);
      const result = moveSelection(players, selection, { dx: 0, dy: 0 });

      expect(result.find((p) => p.playerId === 'p1')!.location).toEqual({
        x: 100,
        y: 100,
      });
    });
  });

  // ---- getBoundingBox ----
  describe('getBoundingBox', () => {
    it('returns the correct bounding box', () => {
      const players = makePlayers();
      const bbox = getBoundingBox(players, ['p1', 'p3', 'p5']);

      expect(bbox).toEqual({
        x: 100,
        y: 100,
        width: 400,
        height: 200,
      });
    });

    it('returns null for empty player IDs', () => {
      const players = makePlayers();
      expect(getBoundingBox(players, [])).toBeNull();
    });

    it('returns null when no matching players found', () => {
      const players = makePlayers();
      expect(getBoundingBox(players, ['nonexistent'])).toBeNull();
    });

    it('returns zero-size box for single player', () => {
      const players = makePlayers();
      const bbox = getBoundingBox(players, ['p1']);

      expect(bbox).toEqual({
        x: 100,
        y: 100,
        width: 0,
        height: 0,
      });
    });

    it('calculates correct bbox for two players', () => {
      const players = makePlayers();
      const bbox = getBoundingBox(players, ['p1', 'p4']);

      expect(bbox).toEqual({
        x: 100,
        y: 100,
        width: 300,
        height: 0,
      });
    });
  });

  // ---- alignSelection ----
  describe('alignSelection', () => {
    it('aligns left: all selected players get the minimum x', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1', 'p2', 'p3'], 'left');

      const selected = result.filter((p) =>
        ['p1', 'p2', 'p3'].includes(p.playerId),
      );
      selected.forEach((p) => {
        expect(p.location.x).toBe(100);
      });
    });

    it('aligns right: all selected players get the maximum x', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1', 'p2', 'p3'], 'right');

      const selected = result.filter((p) =>
        ['p1', 'p2', 'p3'].includes(p.playerId),
      );
      selected.forEach((p) => {
        expect(p.location.x).toBe(300);
      });
    });

    it('aligns top: all selected players get the minimum y', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1', 'p2', 'p3'], 'top');

      const selected = result.filter((p) =>
        ['p1', 'p2', 'p3'].includes(p.playerId),
      );
      selected.forEach((p) => {
        expect(p.location.y).toBe(100);
      });
    });

    it('aligns bottom: all selected players get the maximum y', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1', 'p2', 'p3'], 'bottom');

      const selected = result.filter((p) =>
        ['p1', 'p2', 'p3'].includes(p.playerId),
      );
      selected.forEach((p) => {
        expect(p.location.y).toBe(200);
      });
    });

    it('aligns center-h: all selected players get the horizontal center x', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1', 'p2', 'p3'], 'center-h');

      const selected = result.filter((p) =>
        ['p1', 'p2', 'p3'].includes(p.playerId),
      );
      // Center x = (100 + 300) / 2 = 200
      selected.forEach((p) => {
        expect(p.location.x).toBe(200);
      });
    });

    it('aligns center-v: all selected players get the vertical center y', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1', 'p2', 'p3'], 'center-v');

      const selected = result.filter((p) =>
        ['p1', 'p2', 'p3'].includes(p.playerId),
      );
      // Center y = (100 + 200) / 2 = 150
      selected.forEach((p) => {
        expect(p.location.y).toBe(150);
      });
    });

    it('does not affect unselected players', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1', 'p2'], 'left');

      const p4 = result.find((p) => p.playerId === 'p4')!;
      expect(p4.location).toEqual({ x: 400, y: 100 });
    });

    it('returns unchanged positions for single-player selection', () => {
      const players = makePlayers();
      const result = alignSelection(players, ['p1'], 'left');

      const p1 = result.find((p) => p.playerId === 'p1')!;
      expect(p1.location).toEqual({ x: 100, y: 100 });
    });

    it('does not mutate the original players', () => {
      const players = makePlayers();
      alignSelection(players, ['p1', 'p2', 'p3'], 'left');
      expect(players[1].location.x).toBe(200);
    });
  });
});
