import { describe, it, expect, vi } from 'vitest';
import {
  copyRoute,
  pasteRoute,
  canPasteRoute,
  type RouteClipboard,
} from '@/lib/route-clipboard';
import type { Route, RoutePoint, PlayerAssignment } from '@/types';

// Mock generateId for deterministic tests
vi.mock('@/lib/utils', () => ({
  generateId: () => 'mock-id-123',
}));

function makeRoute(points?: RoutePoint[]): Route {
  return {
    id: 'route-1',
    name: 'Slant',
    type: 'slant',
    points: points ?? [
      { x: 100, y: 200, type: 'line' },
      { x: 120, y: 180, type: 'line' },
      { x: 150, y: 160, type: 'line' },
    ],
  };
}

function makeAssignment(route?: Route): PlayerAssignment {
  return {
    playerId: 'player-1',
    route: route ?? makeRoute(),
  };
}

function makeClipboard(overrides?: Partial<RouteClipboard>): RouteClipboard {
  return {
    route: makeRoute(),
    sourcePosition: 'WR',
    sourceLocation: { x: 100, y: 200 },
    copiedAt: Date.now(),
    ...overrides,
  };
}

describe('route-clipboard', () => {
  // ---- copyRoute ----
  describe('copyRoute', () => {
    it('serializes a route to clipboard format', () => {
      const assignment = makeAssignment();
      const result = copyRoute(assignment, { x: 100, y: 200 }, 'WR');

      expect(result).not.toBeNull();
      expect(result!.route.type).toBe('slant');
      expect(result!.sourcePosition).toBe('WR');
      expect(result!.sourceLocation).toEqual({ x: 100, y: 200 });
      expect(result!.copiedAt).toBeGreaterThan(0);
    });

    it('returns null if assignment has no route', () => {
      const assignment: PlayerAssignment = { playerId: 'p1' };
      const result = copyRoute(assignment);
      expect(result).toBeNull();
    });

    it('deep copies the route points', () => {
      const assignment = makeAssignment();
      const result = copyRoute(assignment, { x: 0, y: 0 });

      result!.route.points[0].x = 999;
      expect(assignment.route!.points[0].x).toBe(100);
    });

    it('uses default location when not provided', () => {
      const assignment = makeAssignment();
      const result = copyRoute(assignment);

      expect(result!.sourceLocation).toEqual({ x: 0, y: 0 });
    });
  });

  // ---- pasteRoute ----
  describe('pasteRoute', () => {
    it('creates a new assignment with offset-adjusted route', () => {
      const clipboard = makeClipboard({
        sourceLocation: { x: 100, y: 200 },
      });
      const result = pasteRoute(clipboard, 'player-2', { x: 200, y: 300 });

      expect(result.playerId).toBe('player-2');
      expect(result.route).toBeDefined();

      // Points should be offset by (100, 100) = (200-100, 300-200)
      expect(result.route!.points[0].x).toBe(200);
      expect(result.route!.points[0].y).toBe(300);
      expect(result.route!.points[1].x).toBe(220);
      expect(result.route!.points[1].y).toBe(280);
    });

    it('generates a new route ID', () => {
      const clipboard = makeClipboard();
      const result = pasteRoute(clipboard, 'player-2', { x: 100, y: 200 });

      expect(result.route!.id).toBe('mock-id-123');
      expect(result.route!.id).not.toBe(clipboard.route.id);
    });

    it('preserves route metadata (name, type, color)', () => {
      const clipboard = makeClipboard({
        route: { ...makeRoute(), color: '#ff0000' },
      });
      const result = pasteRoute(clipboard, 'player-2', { x: 100, y: 200 });

      expect(result.route!.name).toBe('Slant');
      expect(result.route!.type).toBe('slant');
      expect(result.route!.color).toBe('#ff0000');
    });

    it('applies zero offset when target is at same location', () => {
      const clipboard = makeClipboard({
        sourceLocation: { x: 100, y: 200 },
      });
      const result = pasteRoute(clipboard, 'player-2', { x: 100, y: 200 });

      expect(result.route!.points[0]).toEqual({ x: 100, y: 200, type: 'line' });
    });
  });

  // ---- canPasteRoute ----
  describe('canPasteRoute', () => {
    it('returns true for same position type', () => {
      const clipboard = makeClipboard({ sourcePosition: 'WR' });
      expect(canPasteRoute(clipboard, 'WR')).toBe(true);
    });

    it('returns true for compatible positions (both receivers)', () => {
      const clipboard = makeClipboard({ sourcePosition: 'WR' });
      expect(canPasteRoute(clipboard, 'TE')).toBe(true);
      expect(canPasteRoute(clipboard, 'RB')).toBe(true);
      expect(canPasteRoute(clipboard, 'H')).toBe(true);
    });

    it('returns false for incompatible positions', () => {
      const clipboard = makeClipboard({ sourcePosition: 'LT' });
      expect(canPasteRoute(clipboard, 'CB')).toBe(false);
    });

    it('returns true when source or target position is not specified', () => {
      const clipboard = makeClipboard({ sourcePosition: undefined });
      expect(canPasteRoute(clipboard, 'WR')).toBe(true);

      const clipboard2 = makeClipboard({ sourcePosition: 'WR' });
      expect(canPasteRoute(clipboard2, undefined)).toBe(true);
    });

    it('returns true for QB as source or target', () => {
      const clipboard = makeClipboard({ sourcePosition: 'QB' });
      expect(canPasteRoute(clipboard, 'DE')).toBe(true);

      const clipboard2 = makeClipboard({ sourcePosition: 'DE' });
      expect(canPasteRoute(clipboard2, 'QB')).toBe(true);
    });

    it('returns true for compatible defensive positions', () => {
      const clipboard = makeClipboard({ sourcePosition: 'CB' });
      expect(canPasteRoute(clipboard, 'SS')).toBe(true);
      expect(canPasteRoute(clipboard, 'FS')).toBe(true);
    });

    it('returns true for compatible lineman positions', () => {
      const clipboard = makeClipboard({ sourcePosition: 'LT' });
      expect(canPasteRoute(clipboard, 'RG')).toBe(true);
      expect(canPasteRoute(clipboard, 'C')).toBe(true);
    });
  });
});
