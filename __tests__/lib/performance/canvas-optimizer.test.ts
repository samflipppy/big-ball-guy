import { describe, it, expect } from 'vitest';
import {
  shouldRenderPlayer,
  getVisiblePlayers,
  getLOD,
  batchRenderPlayers,
  type Viewport,
} from '@/lib/performance/canvas-optimizer';
import type { Position } from '@/types';

const viewport: Viewport = { x: 0, y: 0, width: 800, height: 600 };

describe('canvas-optimizer', () => {
  // -----------------------------------------------------------------------
  // shouldRenderPlayer
  // -----------------------------------------------------------------------
  describe('shouldRenderPlayer', () => {
    it('returns true for a player inside the viewport', () => {
      const player: Position = { x: 400, y: 300 };
      expect(shouldRenderPlayer(player, viewport, 1)).toBe(true);
    });

    it('returns false for a player far outside the viewport', () => {
      const player: Position = { x: 2000, y: 2000 };
      expect(shouldRenderPlayer(player, viewport, 1)).toBe(false);
    });

    it('includes players within the margin at zoom 1', () => {
      // margin = 50/1 = 50, so x=-40 should still be inside
      const player: Position = { x: -40, y: 300 };
      expect(shouldRenderPlayer(player, viewport, 1)).toBe(true);
    });

    it('expands margin when zoom is small', () => {
      // zoom=0.25 -> margin=200, so x=-150 is still in bounds
      const player: Position = { x: -150, y: 300 };
      expect(shouldRenderPlayer(player, viewport, 0.25)).toBe(true);
    });

    it('handles very small zoom without errors', () => {
      const player: Position = { x: 400, y: 300 };
      expect(shouldRenderPlayer(player, viewport, 0.01)).toBe(true);
    });

    it('returns false for a player just beyond the right edge + margin', () => {
      // margin = 50/1 = 50, right boundary = 800+50 = 850
      const player: Position = { x: 860, y: 300 };
      expect(shouldRenderPlayer(player, viewport, 1)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // getVisiblePlayers
  // -----------------------------------------------------------------------
  describe('getVisiblePlayers', () => {
    it('filters out players that are outside the viewport', () => {
      const players: Position[] = [
        { x: 100, y: 100 },
        { x: 5000, y: 5000 },
        { x: 400, y: 300 },
      ];
      const result = getVisiblePlayers(players, viewport, 1);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ x: 100, y: 100 });
      expect(result).toContainEqual({ x: 400, y: 300 });
    });

    it('returns an empty array when no players are visible', () => {
      const players: Position[] = [
        { x: 9999, y: 9999 },
        { x: -9999, y: -9999 },
      ];
      expect(getVisiblePlayers(players, viewport, 1)).toHaveLength(0);
    });

    it('returns all players when they are all visible', () => {
      const players: Position[] = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ];
      expect(getVisiblePlayers(players, viewport, 1)).toHaveLength(3);
    });

    it('handles an empty player array', () => {
      expect(getVisiblePlayers([], viewport, 1)).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // getLOD
  // -----------------------------------------------------------------------
  describe('getLOD', () => {
    it('returns "high" for zoom >= 1', () => {
      expect(getLOD(1)).toBe('high');
      expect(getLOD(2)).toBe('high');
    });

    it('returns "medium" for zoom between 0.5 and 1', () => {
      expect(getLOD(0.5)).toBe('medium');
      expect(getLOD(0.75)).toBe('medium');
    });

    it('returns "low" for zoom below 0.5', () => {
      expect(getLOD(0.25)).toBe('low');
      expect(getLOD(0.1)).toBe('low');
    });
  });

  // -----------------------------------------------------------------------
  // batchRenderPlayers
  // -----------------------------------------------------------------------
  describe('batchRenderPlayers', () => {
    it('returns a BatchGroup with the given LOD level', () => {
      const players: Position[] = [{ x: 1, y: 2 }];
      const group = batchRenderPlayers(players, 'high');
      expect(group.lod).toBe('high');
    });

    it('copies the players array (not the same reference)', () => {
      const players: Position[] = [{ x: 1, y: 2 }];
      const group = batchRenderPlayers(players, 'low');
      expect(group.players).not.toBe(players);
      expect(group.players).toEqual(players);
    });

    it('includes all players in the batch', () => {
      const players: Position[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      const group = batchRenderPlayers(players, 'medium');
      expect(group.players).toHaveLength(3);
    });
  });
});
