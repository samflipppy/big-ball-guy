import { describe, it, expect } from 'vitest';
import {
  getWaypoints,
  moveWaypoint,
  insertWaypoint,
  deleteWaypoint,
  smoothRoute,
} from '@/lib/route-editing';
import type { Route, RoutePoint } from '@/types';

function makeRoute(points: RoutePoint[], overrides?: Partial<Route>): Route {
  return {
    id: 'route-1',
    name: 'Test Route',
    type: 'slant',
    points,
    ...overrides,
  };
}

function pt(x: number, y: number, type: RoutePoint['type'] = 'line'): RoutePoint {
  return { x, y, type };
}

describe('route-editing', () => {
  // ---- getWaypoints ----
  describe('getWaypoints', () => {
    it('returns a copy of the route points', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10), pt(20, 0)]);
      const waypoints = getWaypoints(route);

      expect(waypoints).toHaveLength(3);
      expect(waypoints[0]).toEqual({ x: 0, y: 0, type: 'line' });
      expect(waypoints[1]).toEqual({ x: 10, y: 10, type: 'line' });
      expect(waypoints[2]).toEqual({ x: 20, y: 0, type: 'line' });
    });

    it('does not return the same array reference', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10)]);
      const waypoints = getWaypoints(route);

      waypoints[0].x = 999;
      expect(route.points[0].x).toBe(0);
    });

    it('returns empty array for route with no points', () => {
      const route = makeRoute([]);
      expect(getWaypoints(route)).toEqual([]);
    });
  });

  // ---- moveWaypoint ----
  describe('moveWaypoint', () => {
    it('moves a waypoint to a new position', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10), pt(20, 20)]);
      const result = moveWaypoint(route, 1, { x: 50, y: 50 });

      expect(result.points[1].x).toBe(50);
      expect(result.points[1].y).toBe(50);
      // Other points unchanged
      expect(result.points[0]).toEqual(pt(0, 0));
      expect(result.points[2]).toEqual(pt(20, 20));
    });

    it('preserves point type when moving', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10, 'curve'), pt(20, 20)]);
      const result = moveWaypoint(route, 1, { x: 50, y: 50 });
      expect(result.points[1].type).toBe('curve');
    });

    it('does not mutate the original route', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10)]);
      moveWaypoint(route, 0, { x: 99, y: 99 });
      expect(route.points[0].x).toBe(0);
    });

    it('throws RangeError for out-of-bounds index', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10)]);
      expect(() => moveWaypoint(route, 5, { x: 0, y: 0 })).toThrow(RangeError);
      expect(() => moveWaypoint(route, -1, { x: 0, y: 0 })).toThrow(RangeError);
    });
  });

  // ---- insertWaypoint ----
  describe('insertWaypoint', () => {
    it('inserts a waypoint after the given index', () => {
      const route = makeRoute([pt(0, 0), pt(20, 20)]);
      const result = insertWaypoint(route, 0, { x: 10, y: 10 });

      expect(result.points).toHaveLength(3);
      expect(result.points[1]).toEqual({ x: 10, y: 10, type: 'line' });
    });

    it('inserts at the beginning when afterIndex is -1', () => {
      const route = makeRoute([pt(10, 10), pt(20, 20)]);
      const result = insertWaypoint(route, -1, { x: 0, y: 0 });

      expect(result.points).toHaveLength(3);
      expect(result.points[0]).toEqual({ x: 0, y: 0, type: 'line' });
      expect(result.points[1]).toEqual(pt(10, 10));
    });

    it('inserts at the end when afterIndex is the last index', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10)]);
      const result = insertWaypoint(route, 1, { x: 20, y: 20 });

      expect(result.points).toHaveLength(3);
      expect(result.points[2]).toEqual({ x: 20, y: 20, type: 'line' });
    });

    it('throws RangeError for invalid afterIndex', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10)]);
      expect(() => insertWaypoint(route, 5, { x: 0, y: 0 })).toThrow(RangeError);
      expect(() => insertWaypoint(route, -2, { x: 0, y: 0 })).toThrow(RangeError);
    });

    it('does not mutate the original route', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10)]);
      insertWaypoint(route, 0, { x: 5, y: 5 });
      expect(route.points).toHaveLength(2);
    });
  });

  // ---- deleteWaypoint ----
  describe('deleteWaypoint', () => {
    it('deletes a waypoint at the given index', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10), pt(20, 20)]);
      const result = deleteWaypoint(route, 1);

      expect(result.points).toHaveLength(2);
      expect(result.points[0]).toEqual(pt(0, 0));
      expect(result.points[1]).toEqual(pt(20, 20));
    });

    it('throws error when trying to delete below 2 points', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10)]);
      expect(() => deleteWaypoint(route, 0)).toThrow(
        'Cannot delete waypoint: route must have at least 2 points',
      );
    });

    it('throws RangeError for out-of-bounds index', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10), pt(20, 20)]);
      expect(() => deleteWaypoint(route, 5)).toThrow(RangeError);
      expect(() => deleteWaypoint(route, -1)).toThrow(RangeError);
    });

    it('does not mutate the original route', () => {
      const route = makeRoute([pt(0, 0), pt(10, 10), pt(20, 20)]);
      deleteWaypoint(route, 1);
      expect(route.points).toHaveLength(3);
    });
  });

  // ---- smoothRoute ----
  describe('smoothRoute', () => {
    it('returns the same points for 2-point route', () => {
      const route = makeRoute([pt(0, 0), pt(100, 100)]);
      const result = smoothRoute(route);

      expect(result.points).toHaveLength(2);
      expect(result.points[0]).toEqual(pt(0, 0));
      expect(result.points[1]).toEqual(pt(100, 100));
    });

    it('converts intermediate points to curve type', () => {
      const route = makeRoute([pt(0, 0), pt(50, 50), pt(100, 0)]);
      const result = smoothRoute(route);

      expect(result.points[0].type).toBe('line');
      expect(result.points[1].type).toBe('curve');
      expect(result.points[2].type).toBe('line');
    });

    it('preserves first and last points', () => {
      const route = makeRoute([pt(0, 0), pt(50, 50), pt(100, 0)]);
      const result = smoothRoute(route);

      expect(result.points[0].x).toBe(0);
      expect(result.points[0].y).toBe(0);
      expect(result.points[2].x).toBe(100);
      expect(result.points[2].y).toBe(0);
    });

    it('applies stronger smoothing with higher tension', () => {
      const route = makeRoute([pt(0, 0), pt(50, 100), pt(100, 0)]);
      const lowTension = smoothRoute(route, 0.1);
      const highTension = smoothRoute(route, 0.9);

      // Higher tension should pull the middle point more toward the midpoint of neighbors
      const midY = (0 + 0) / 2; // midpoint of prev/next y values
      const lowDist = Math.abs(lowTension.points[1].y - midY);
      const highDist = Math.abs(highTension.points[1].y - midY);
      expect(highDist).toBeLessThan(lowDist);
    });

    it('clamps tension to [0, 1]', () => {
      const route = makeRoute([pt(0, 0), pt(50, 50), pt(100, 0)]);
      const negResult = smoothRoute(route, -5);
      const overResult = smoothRoute(route, 10);

      // Tension 0 means no smoothing, point stays at original
      expect(negResult.points[1].x).toBe(50);
      expect(negResult.points[1].y).toBe(50);

      // Tension 1 (clamped from 10) should apply max smoothing
      expect(overResult.points[1].type).toBe('curve');
    });

    it('does not mutate the original route', () => {
      const route = makeRoute([pt(0, 0), pt(50, 50), pt(100, 0)]);
      smoothRoute(route, 0.5);
      expect(route.points[1].type).toBe('line');
      expect(route.points[1].x).toBe(50);
    });
  });
});
