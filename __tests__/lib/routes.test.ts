import { describe, it, expect } from 'vitest';
import {
  ROUTE_TREE,
  ROUTES_BY_POSITION,
  getRouteByType,
  getRoutesForPosition,
  type RouteDefinition,
  type ReceiverPositionType,
} from '@/lib/routes';
import type { RouteType } from '@/types';

// All route types defined in the spec
const EXPECTED_ROUTE_TYPES: RouteType[] = [
  'streak', 'slant', 'out', 'in', 'corner', 'post',
  'curl', 'hitch', 'flat', 'wheel', 'drag', 'seam',
  'screen', 'swing', 'angle', 'option',
];

describe('ROUTE_TREE', () => {
  it('contains all 16 standard route types', () => {
    const types = ROUTE_TREE.map((r) => r.type);
    for (const t of EXPECTED_ROUTE_TYPES) {
      expect(types).toContain(t);
    }
  });

  it('has exactly 16 routes', () => {
    expect(ROUTE_TREE).toHaveLength(16);
  });

  it('has unique ids', () => {
    const ids = ROUTE_TREE.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique types', () => {
    const types = ROUTE_TREE.map((r) => r.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it.each(ROUTE_TREE.map((r) => [r.name, r]))('%s has required fields', (_name, route) => {
    const r = route as RouteDefinition;
    expect(r.id).toBeTruthy();
    expect(r.name).toBeTruthy();
    expect(r.type).toBeTruthy();
    expect(r.description).toBeTruthy();
    expect(r.points.length).toBeGreaterThanOrEqual(2);
  });

  it('each route starts at (0, 0)', () => {
    for (const r of ROUTE_TREE) {
      expect(r.points[0].x).toBe(0);
      expect(r.points[0].y).toBe(0);
    }
  });

  it('each point has a valid type', () => {
    const validTypes = ['line', 'curve', 'break'];
    for (const r of ROUTE_TREE) {
      for (const p of r.points) {
        expect(validTypes).toContain(p.type);
      }
    }
  });

  it('every route has a non-empty description', () => {
    for (const r of ROUTE_TREE) {
      expect(r.description.length).toBeGreaterThan(10);
    }
  });
});

describe('ROUTES_BY_POSITION', () => {
  const positionTypes: ReceiverPositionType[] = ['outside', 'slot', 'te', 'rb'];

  it('has entries for all position types', () => {
    for (const pos of positionTypes) {
      expect(ROUTES_BY_POSITION[pos]).toBeDefined();
      expect(ROUTES_BY_POSITION[pos].length).toBeGreaterThan(0);
    }
  });

  it('outside WR includes streak, slant, out, in, post, corner', () => {
    const outside = ROUTES_BY_POSITION.outside;
    expect(outside).toContain('streak');
    expect(outside).toContain('slant');
    expect(outside).toContain('out');
    expect(outside).toContain('in');
    expect(outside).toContain('post');
    expect(outside).toContain('corner');
  });

  it('RB includes flat, swing, screen, wheel', () => {
    const rb = ROUTES_BY_POSITION.rb;
    expect(rb).toContain('flat');
    expect(rb).toContain('swing');
    expect(rb).toContain('screen');
    expect(rb).toContain('wheel');
  });

  it('TE includes seam, drag, angle', () => {
    const te = ROUTES_BY_POSITION.te;
    expect(te).toContain('seam');
    expect(te).toContain('drag');
    expect(te).toContain('angle');
  });

  it('slot includes slant, in, drag, seam, option', () => {
    const slot = ROUTES_BY_POSITION.slot;
    expect(slot).toContain('slant');
    expect(slot).toContain('in');
    expect(slot).toContain('drag');
    expect(slot).toContain('seam');
    expect(slot).toContain('option');
  });
});

describe('getRouteByType()', () => {
  it('returns the correct route for a known type', () => {
    const streak = getRouteByType('streak');
    expect(streak).toBeDefined();
    expect(streak!.type).toBe('streak');
    expect(streak!.name).toContain('Streak');
  });

  it('returns undefined for an unknown / custom type', () => {
    expect(getRouteByType('custom')).toBeUndefined();
  });

  it('returns correct route for every known type', () => {
    for (const t of EXPECTED_ROUTE_TYPES) {
      const route = getRouteByType(t);
      expect(route).toBeDefined();
      expect(route!.type).toBe(t);
    }
  });
});

describe('getRoutesForPosition()', () => {
  it('returns routes for outside WR', () => {
    const routes = getRoutesForPosition('outside');
    expect(routes.length).toBeGreaterThan(0);
    // Should include streak
    expect(routes.some((r) => r.type === 'streak')).toBe(true);
  });

  it('returns routes for RB', () => {
    const routes = getRoutesForPosition('rb');
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.some((r) => r.type === 'flat')).toBe(true);
    expect(routes.some((r) => r.type === 'swing')).toBe(true);
    expect(routes.some((r) => r.type === 'screen')).toBe(true);
  });

  it('returns routes for TE', () => {
    const routes = getRoutesForPosition('te');
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.some((r) => r.type === 'seam')).toBe(true);
  });

  it('returns routes for slot', () => {
    const routes = getRoutesForPosition('slot');
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.some((r) => r.type === 'slant')).toBe(true);
  });

  it('returns full RouteDefinition objects', () => {
    const routes = getRoutesForPosition('outside');
    for (const r of routes) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.points.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('respects the ordering from ROUTES_BY_POSITION', () => {
    const posTypes = ROUTES_BY_POSITION.outside;
    const routes = getRoutesForPosition('outside');
    // Only those types that exist in ROUTE_TREE should appear, in order
    const resultTypes = routes.map((r) => r.type);
    const expected = posTypes.filter((t) => getRouteByType(t) !== undefined);
    expect(resultTypes).toEqual(expected);
  });
});
