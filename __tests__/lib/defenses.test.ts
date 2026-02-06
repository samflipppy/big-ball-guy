import { describe, it, expect } from 'vitest';
import {
  DEFENSIVE_FRONTS_LIBRARY,
  COVERAGES_LIBRARY,
  getDefensiveFront,
  getCoverage,
  type DefensiveFront,
  type CoverageDefinition,
} from '@/lib/defenses';

// ============================================================
// Defensive Fronts
// ============================================================

const EXPECTED_FRONT_NAMES = [
  '4-3 Over', '4-3 Under', '3-4', 'Nickel', 'Dime',
  '4-2-5', '3-3-5', '5-2', '46', 'Bear',
];

describe('DEFENSIVE_FRONTS_LIBRARY', () => {
  it('contains all 10 expected fronts', () => {
    expect(DEFENSIVE_FRONTS_LIBRARY).toHaveLength(10);
    const names = DEFENSIVE_FRONTS_LIBRARY.map((f) => f.name);
    for (const n of EXPECTED_FRONT_NAMES) {
      expect(names).toContain(n);
    }
  });

  it('has unique ids', () => {
    const ids = DEFENSIVE_FRONTS_LIBRARY.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(DEFENSIVE_FRONTS_LIBRARY.map((f) => [f.name, f]))(
    '%s has 11 players',
    (_name, front) => {
      expect((front as DefensiveFront).players).toHaveLength(11);
    },
  );

  it('every front has all defensive players on the defense side', () => {
    for (const front of DEFENSIVE_FRONTS_LIBRARY) {
      for (const player of front.players) {
        expect(player.side).toBe('defense');
      }
    }
  });

  it('every front has a non-empty description', () => {
    for (const front of DEFENSIVE_FRONTS_LIBRARY) {
      expect(front.description.length).toBeGreaterThan(10);
    }
  });

  it('every player has valid location coordinates', () => {
    for (const front of DEFENSIVE_FRONTS_LIBRARY) {
      for (const player of front.players) {
        expect(player.location.x).toBeGreaterThanOrEqual(0);
        expect(player.location.x).toBeLessThanOrEqual(800);
        expect(player.location.y).toBeGreaterThanOrEqual(0);
        expect(player.location.y).toBeLessThanOrEqual(500);
      }
    }
  });

  it('every player has a valid defensive position', () => {
    const validPositions = ['DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'CB', 'SS', 'FS', 'NB', 'S', 'LB'];
    for (const front of DEFENSIVE_FRONTS_LIBRARY) {
      for (const player of front.players) {
        expect(validPositions).toContain(player.position);
      }
    }
  });

  it('every player has an id and label', () => {
    for (const front of DEFENSIVE_FRONTS_LIBRARY) {
      for (const player of front.players) {
        expect(player.id).toBeTruthy();
        expect(player.label).toBeTruthy();
      }
    }
  });
});

describe('getDefensiveFront()', () => {
  it('returns correct front by id', () => {
    const front = getDefensiveFront('front-43-over');
    expect(front).toBeDefined();
    expect(front!.name).toBe('4-3 Over');
  });

  it('returns undefined for unknown id', () => {
    expect(getDefensiveFront('nonexistent')).toBeUndefined();
  });

  it('returns correct front for each front in the library', () => {
    for (const f of DEFENSIVE_FRONTS_LIBRARY) {
      const result = getDefensiveFront(f.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(f.id);
      expect(result!.name).toBe(f.name);
    }
  });
});

// ============================================================
// Coverages
// ============================================================

const EXPECTED_COVERAGE_NAMES = [
  'Cover 0', 'Cover 1', 'Cover 1 Robber', 'Cover 2', 'Cover 2 Man',
  'Cover 3', 'Cover 3 Cloud', 'Cover 3 Buzz', 'Cover 4/Quarters', 'Cover 6',
];

describe('COVERAGES_LIBRARY', () => {
  it('contains all 10 expected coverages', () => {
    expect(COVERAGES_LIBRARY).toHaveLength(10);
    const names = COVERAGES_LIBRARY.map((c) => c.name);
    for (const n of EXPECTED_COVERAGE_NAMES) {
      expect(names).toContain(n);
    }
  });

  it('has unique ids', () => {
    const ids = COVERAGES_LIBRARY.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every coverage has at least one zone definition', () => {
    for (const cov of COVERAGES_LIBRARY) {
      expect(cov.zones.length).toBeGreaterThan(0);
    }
  });

  it('every coverage has a non-empty description', () => {
    for (const cov of COVERAGES_LIBRARY) {
      expect(cov.description.length).toBeGreaterThan(10);
    }
  });

  it('every zone has a valid type (man or zone)', () => {
    for (const cov of COVERAGES_LIBRARY) {
      for (const z of cov.zones) {
        expect(['man', 'zone']).toContain(z.type);
      }
    }
  });

  it('man zones have a targetId', () => {
    for (const cov of COVERAGES_LIBRARY) {
      for (const z of cov.zones) {
        if (z.type === 'man') {
          expect(z.targetId).toBeTruthy();
        }
      }
    }
  });

  it('zone zones have an area definition', () => {
    for (const cov of COVERAGES_LIBRARY) {
      for (const z of cov.zones) {
        if (z.type === 'zone') {
          expect(z.area).toBeDefined();
          expect(z.area!.width).toBeGreaterThan(0);
          expect(z.area!.height).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every zone has a playerId', () => {
    for (const cov of COVERAGES_LIBRARY) {
      for (const z of cov.zones) {
        expect(z.playerId).toBeTruthy();
      }
    }
  });

  it('Cover 0 is all man coverage', () => {
    const c0 = getCoverage('cov-0');
    expect(c0).toBeDefined();
    for (const z of c0!.zones) {
      expect(z.type).toBe('man');
    }
  });

  it('Cover 2 has two deep zone safeties', () => {
    const c2 = getCoverage('cov-2');
    expect(c2).toBeDefined();
    const deepZones = c2!.zones.filter(
      (z) => z.type === 'zone' && z.area && z.area.y === 0,
    );
    expect(deepZones.length).toBeGreaterThanOrEqual(2);
  });

  it('Cover 4/Quarters has four deep zone defenders', () => {
    const c4 = getCoverage('cov-4');
    expect(c4).toBeDefined();
    const deepZones = c4!.zones.filter(
      (z) => z.type === 'zone' && z.area && z.area.y === 0,
    );
    expect(deepZones.length).toBe(4);
  });
});

describe('getCoverage()', () => {
  it('returns correct coverage by id', () => {
    const cov = getCoverage('cov-3');
    expect(cov).toBeDefined();
    expect(cov!.name).toBe('Cover 3');
  });

  it('returns undefined for unknown id', () => {
    expect(getCoverage('nonexistent')).toBeUndefined();
  });

  it('returns correct coverage for each coverage in the library', () => {
    for (const c of COVERAGES_LIBRARY) {
      const result = getCoverage(c.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(c.id);
      expect(result!.name).toBe(c.name);
    }
  });
});
