import { describe, it, expect, vi } from 'vitest';
import {
  distance,
  isInsideAnyZone,
  findZoneSoftSpots,
  findManMismatches,
  analyzeCoverageWindows,
  ZONE_SOFT_SPOT_THRESHOLD,
  GRID_STEP,
} from '@/lib/coverage-windows';
import type { CoverageDefinition, ZoneDefinition } from '@/lib/defenses';
import type { Player, PlayerAssignment } from '@/types';

// ============================================================
// Helpers
// ============================================================

vi.mock('@/lib/utils', () => {
  let counter = 0;
  return {
    generateId: () => `test-id-${counter++}`,
    cn: (...args: string[]) => args.filter(Boolean).join(' '),
  };
});

function makePlayer(id: string, position: string, x: number, y: number, side: 'offense' | 'defense' = 'defense'): Player {
  return {
    id,
    position: position as Player['position'],
    label: id.toUpperCase(),
    location: { x, y },
    side,
  };
}

function makeCoverage(zones: ZoneDefinition[], overrides: Partial<CoverageDefinition> = {}): CoverageDefinition {
  return {
    id: 'test-cov',
    name: 'Test Coverage',
    description: 'Test coverage for unit tests',
    zones,
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe('distance', () => {
  it('returns 0 for identical points', () => {
    expect(distance(100, 200, 100, 200)).toBe(0);
  });

  it('computes correct euclidean distance', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  it('handles negative coordinates', () => {
    expect(distance(-3, -4, 0, 0)).toBe(5);
  });
});

describe('isInsideAnyZone', () => {
  const zones: ZoneDefinition[] = [
    { playerId: 'cb1', type: 'zone', area: { x: 0, y: 0, width: 200, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 300, y: 0, width: 200, height: 140 } },
    { playerId: 'ss', type: 'man', targetId: 'wr1' }, // man zone — has no area
  ];

  it('returns true when point is inside a zone area', () => {
    expect(isInsideAnyZone(100, 70, zones)).toBe(true);
  });

  it('returns true when point is inside a different zone area', () => {
    expect(isInsideAnyZone(400, 100, zones)).toBe(true);
  });

  it('returns false when point is outside all zone areas', () => {
    expect(isInsideAnyZone(250, 70, zones)).toBe(false);
  });

  it('returns false for an empty zone list', () => {
    expect(isInsideAnyZone(100, 100, [])).toBe(false);
  });

  it('returns true at the boundary of a zone (inclusive)', () => {
    expect(isInsideAnyZone(0, 0, zones)).toBe(true);
    expect(isInsideAnyZone(200, 140, zones)).toBe(true);
  });
});

describe('findZoneSoftSpots', () => {
  it('returns empty array for all-man coverage', () => {
    const coverage = makeCoverage([
      { playerId: 'cb1', type: 'man', targetId: 'wr1' },
      { playerId: 'cb2', type: 'man', targetId: 'wr2' },
    ]);
    const result = findZoneSoftSpots(coverage, []);
    expect(result).toHaveLength(0);
  });

  it('finds soft spots in large zone areas with distant defenders', () => {
    // A single large zone with the defender placed at one corner
    const coverage = makeCoverage([
      {
        playerId: 'fs',
        type: 'zone',
        area: { x: 0, y: 0, width: 400, height: 200 },
      },
    ]);
    const defenders = [makePlayer('fs', 'FS', 0, 0)];

    // The zone center at (200, 100) should be far from defender at zone center (200, 100)
    // Defender is at (0,0) while zone covers 0..400, 0..200
    const spots = findZoneSoftSpots(coverage, defenders, 80);
    expect(spots.length).toBeGreaterThan(0);
    // All returned windows should have a description mentioning "Soft spot"
    for (const spot of spots) {
      expect(spot.description).toContain('Soft spot');
    }
  });

  it('returns no soft spots when defenders cover zones tightly', () => {
    // Small zone, defender right in the center
    const coverage = makeCoverage([
      {
        playerId: 'fs',
        type: 'zone',
        area: { x: 200, y: 50, width: 80, height: 80 },
      },
    ]);
    const defenders = [makePlayer('fs', 'FS', 240, 90)];

    const spots = findZoneSoftSpots(coverage, defenders, 80);
    expect(spots).toHaveLength(0);
  });

  it('returns windows with valid id, x, y, radius, description', () => {
    const coverage = makeCoverage([
      {
        playerId: 'fs',
        type: 'zone',
        area: { x: 0, y: 0, width: 800, height: 250 },
      },
    ]);
    const defenders = [makePlayer('fs', 'FS', 400, 125)];

    const spots = findZoneSoftSpots(coverage, defenders, 60);
    for (const spot of spots) {
      expect(spot.id).toBeTruthy();
      expect(typeof spot.x).toBe('number');
      expect(typeof spot.y).toBe('number');
      expect(spot.radius).toBeGreaterThan(0);
      expect(spot.description.length).toBeGreaterThan(0);
    }
  });
});

describe('findManMismatches', () => {
  it('detects mismatch when WR is covered by LB', () => {
    const coverage = makeCoverage([
      { playerId: 'mlb', type: 'man', targetId: 'wr1' },
    ]);
    const offensePlayers = [makePlayer('wr1', 'WR', 100, 245, 'offense')];
    const defensePlayers = [makePlayer('mlb', 'MLB', 100, 190)];
    const assignments: PlayerAssignment[] = [
      {
        playerId: 'wr1',
        route: {
          id: 'r1',
          name: 'streak',
          type: 'streak',
          points: [
            { x: 100, y: 245, type: 'line' },
            { x: 100, y: 50, type: 'line' },
          ],
        },
      },
    ];

    const windows = findManMismatches(coverage, offensePlayers, defensePlayers, assignments);
    expect(windows).toHaveLength(1);
    expect(windows[0].description).toContain('WR');
    expect(windows[0].description).toContain('MLB');
  });

  it('detects mismatch when RB is covered by SS', () => {
    const coverage = makeCoverage([
      { playerId: 'ss', type: 'man', targetId: 'rb' },
    ]);
    const offensePlayers = [makePlayer('rb', 'RB', 400, 330, 'offense')];
    const defensePlayers = [makePlayer('ss', 'SS', 450, 140)];
    const assignments: PlayerAssignment[] = [
      {
        playerId: 'rb',
        route: {
          id: 'r2',
          name: 'flat',
          type: 'flat',
          points: [
            { x: 400, y: 330, type: 'line' },
            { x: 550, y: 240, type: 'line' },
          ],
        },
      },
    ];

    const windows = findManMismatches(coverage, offensePlayers, defensePlayers, assignments);
    expect(windows).toHaveLength(1);
    expect(windows[0].description).toContain('RB');
    expect(windows[0].description).toContain('SS');
  });

  it('does not flag CB covering WR (no mismatch)', () => {
    const coverage = makeCoverage([
      { playerId: 'cb1', type: 'man', targetId: 'wr1' },
    ]);
    const offensePlayers = [makePlayer('wr1', 'WR', 100, 245, 'offense')];
    const defensePlayers = [makePlayer('cb1', 'CB', 100, 200)];
    const assignments: PlayerAssignment[] = [
      {
        playerId: 'wr1',
        route: {
          id: 'r1',
          name: 'streak',
          type: 'streak',
          points: [{ x: 100, y: 50, type: 'line' }],
        },
      },
    ];

    const windows = findManMismatches(coverage, offensePlayers, defensePlayers, assignments);
    expect(windows).toHaveLength(0);
  });

  it('does not flag a receiver with no route assigned', () => {
    const coverage = makeCoverage([
      { playerId: 'mlb', type: 'man', targetId: 'wr1' },
    ]);
    const offensePlayers = [makePlayer('wr1', 'WR', 100, 245, 'offense')];
    const defensePlayers = [makePlayer('mlb', 'MLB', 100, 190)];
    const assignments: PlayerAssignment[] = []; // No route for wr1

    const windows = findManMismatches(coverage, offensePlayers, defensePlayers, assignments);
    expect(windows).toHaveLength(0);
  });

  it('places window at route endpoint', () => {
    const coverage = makeCoverage([
      { playerId: 'mlb', type: 'man', targetId: 'wr1' },
    ]);
    const offensePlayers = [makePlayer('wr1', 'WR', 100, 245, 'offense')];
    const defensePlayers = [makePlayer('mlb', 'MLB', 100, 190)];
    const assignments: PlayerAssignment[] = [
      {
        playerId: 'wr1',
        route: {
          id: 'r1',
          name: 'post',
          type: 'post',
          points: [
            { x: 100, y: 200, type: 'line' },
            { x: 300, y: 50, type: 'line' },
          ],
        },
      },
    ];

    const windows = findManMismatches(coverage, offensePlayers, defensePlayers, assignments);
    expect(windows).toHaveLength(1);
    expect(windows[0].x).toBe(300);
    expect(windows[0].y).toBe(50);
  });
});

describe('analyzeCoverageWindows', () => {
  it('combines zone soft spots and man mismatches', () => {
    const coverage = makeCoverage([
      {
        playerId: 'fs',
        type: 'zone',
        area: { x: 0, y: 0, width: 800, height: 250 },
      },
      { playerId: 'mlb', type: 'man', targetId: 'wr1' },
    ]);
    const offensePlayers = [makePlayer('wr1', 'WR', 100, 245, 'offense')];
    const defensePlayers = [
      makePlayer('fs', 'FS', 400, 125),
      makePlayer('mlb', 'MLB', 100, 190),
    ];
    const assignments: PlayerAssignment[] = [
      {
        playerId: 'wr1',
        route: {
          id: 'r1',
          name: 'streak',
          type: 'streak',
          points: [{ x: 100, y: 50, type: 'line' }],
        },
      },
    ];

    const windows = analyzeCoverageWindows(coverage, offensePlayers, defensePlayers, assignments, 60);
    // Should have at least the man mismatch (WR vs MLB)
    const manWindows = windows.filter((w) => w.description.includes('mismatch'));
    expect(manWindows.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array for tight man coverage with no mismatches', () => {
    const coverage = makeCoverage([
      { playerId: 'cb1', type: 'man', targetId: 'wr1' },
    ]);
    const offensePlayers = [makePlayer('wr1', 'WR', 100, 245, 'offense')];
    const defensePlayers = [makePlayer('cb1', 'CB', 100, 200)];
    const assignments: PlayerAssignment[] = [
      {
        playerId: 'wr1',
        route: {
          id: 'r1',
          name: 'slant',
          type: 'slant',
          points: [{ x: 200, y: 200, type: 'line' }],
        },
      },
    ];

    const windows = analyzeCoverageWindows(coverage, offensePlayers, defensePlayers, assignments);
    // No zone soft spots (no zone coverage), no man mismatches (CB vs WR)
    expect(windows).toHaveLength(0);
  });
});
