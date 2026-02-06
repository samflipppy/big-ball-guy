import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_BLOCKING_SCHEMES,
  getBlockingSchemeById,
  applyBlockingScheme,
  getAllBlockingSchemeTags,
} from '@/lib/blocking-schemes';
import type { Formation, BlockType, OffensivePosition } from '@/types';

// Valid block types from the type definition
const VALID_BLOCK_TYPES: BlockType[] = [
  'drive', 'reach', 'down', 'pull', 'trap', 'pass-pro',
  'cut', 'double', 'zone', 'man', 'custom',
];

// Helper formation for testing applyBlockingScheme
function makeFormation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: 'test-formation',
    name: 'Test Singleback',
    side: 'offense',
    personnel: '11',
    tags: ['test'],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: 248 }, side: 'offense' },
      { id: 'lg', position: 'LG', label: 'LG', location: { x: 350, y: 248 }, side: 'offense' },
      { id: 'c', position: 'C', label: 'C', location: { x: 400, y: 248 }, side: 'offense' },
      { id: 'rg', position: 'RG', label: 'RG', location: { x: 450, y: 248 }, side: 'offense' },
      { id: 'rt', position: 'RT', label: 'RT', location: { x: 490, y: 248 }, side: 'offense' },
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 248 }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: 248 }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 580, y: 248 }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: 248 }, side: 'offense' },
    ],
    ...overrides,
  };
}

function makeIFormFormation(): Formation {
  return {
    id: 'test-iform',
    name: 'Test I-Form',
    side: 'offense',
    personnel: '21',
    tags: ['test'],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: 248 }, side: 'offense' },
      { id: 'lg', position: 'LG', label: 'LG', location: { x: 350, y: 248 }, side: 'offense' },
      { id: 'c', position: 'C', label: 'C', location: { x: 400, y: 248 }, side: 'offense' },
      { id: 'rg', position: 'RG', label: 'RG', location: { x: 450, y: 248 }, side: 'offense' },
      { id: 'rt', position: 'RT', label: 'RT', location: { x: 490, y: 248 }, side: 'offense' },
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
      { id: 'fb', position: 'FB', label: 'FB', location: { x: 400, y: 315 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 350 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 248 }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: 248 }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: 248 }, side: 'offense' },
    ],
  };
}

// ============================================================
// BUILT_IN_BLOCKING_SCHEMES
// ============================================================
describe('BUILT_IN_BLOCKING_SCHEMES', () => {
  it('contains at least 8 blocking schemes', () => {
    expect(BUILT_IN_BLOCKING_SCHEMES.length).toBeGreaterThanOrEqual(8);
  });

  it('contains 11 blocking schemes', () => {
    expect(BUILT_IN_BLOCKING_SCHEMES).toHaveLength(11);
  });

  it('has unique ids', () => {
    const ids = BUILT_IN_BLOCKING_SCHEMES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = BUILT_IN_BLOCKING_SCHEMES.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('includes the expected scheme names', () => {
    const names = BUILT_IN_BLOCKING_SCHEMES.map((s) => s.name);
    expect(names).toContain('Inside Zone');
    expect(names).toContain('Outside Zone');
    expect(names).toContain('Power');
    expect(names).toContain('Counter');
    expect(names).toContain('Trap');
    expect(names).toContain('Iso');
    expect(names).toContain('Duo');
    expect(names).toContain('Draw');
    expect(names).toContain('Pass Pro (Half-Slide)');
    expect(names).toContain('Pass Pro (Full-Slide)');
    expect(names).toContain('Sprint Out');
  });

  it('has both run and pass types', () => {
    const types = new Set(BUILT_IN_BLOCKING_SCHEMES.map((s) => s.type));
    expect(types).toContain('run');
    expect(types).toContain('pass');
  });

  it.each(BUILT_IN_BLOCKING_SCHEMES.map((s) => [s.name, s]))(
    '%s has required fields',
    (_name, scheme) => {
      const s = scheme as (typeof BUILT_IN_BLOCKING_SCHEMES)[number];
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.description.length).toBeGreaterThan(20);
      expect(['run', 'pass']).toContain(s.type);
      expect(s.rules.length).toBeGreaterThanOrEqual(4); // at least 4 OL rules
      expect(s.tags.length).toBeGreaterThan(0);
    },
  );

  it.each(BUILT_IN_BLOCKING_SCHEMES.map((s) => [s.name, s]))(
    '%s has valid block types in all rules',
    (_name, scheme) => {
      const s = scheme as (typeof BUILT_IN_BLOCKING_SCHEMES)[number];
      for (const rule of s.rules) {
        expect(VALID_BLOCK_TYPES).toContain(rule.blockType);
      }
    },
  );

  it.each(BUILT_IN_BLOCKING_SCHEMES.map((s) => [s.name, s]))(
    '%s rules include all 5 OL positions',
    (_name, scheme) => {
      const s = scheme as (typeof BUILT_IN_BLOCKING_SCHEMES)[number];
      const positions = s.rules.map((r) => r.position);
      expect(positions).toContain('LT');
      expect(positions).toContain('LG');
      expect(positions).toContain('C');
      expect(positions).toContain('RG');
      expect(positions).toContain('RT');
    },
  );

  it('every rule has a non-empty rule text and a positive priority', () => {
    for (const scheme of BUILT_IN_BLOCKING_SCHEMES) {
      for (const rule of scheme.rules) {
        expect(rule.rule.length).toBeGreaterThan(5);
        expect(rule.priority).toBeGreaterThan(0);
      }
    }
  });

  it('run schemes use run-relevant block types', () => {
    const runSchemes = BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'run');
    expect(runSchemes.length).toBeGreaterThanOrEqual(7);
    for (const scheme of runSchemes) {
      // At least one rule should use a run-relevant block type
      const runBlockTypes: BlockType[] = ['zone', 'reach', 'pull', 'trap', 'down', 'drive', 'double', 'man', 'pass-pro'];
      const hasRunType = scheme.rules.some((r) => runBlockTypes.includes(r.blockType));
      expect(hasRunType).toBe(true);
    }
  });

  it('pass schemes use pass-pro block type', () => {
    const passSchemes = BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'pass');
    expect(passSchemes.length).toBeGreaterThanOrEqual(2);
    for (const scheme of passSchemes) {
      const hasPassPro = scheme.rules.some((r) => r.blockType === 'pass-pro' || r.blockType === 'reach');
      expect(hasPassPro).toBe(true);
    }
  });
});

// ============================================================
// getBlockingSchemeById
// ============================================================
describe('getBlockingSchemeById()', () => {
  it('returns the correct scheme for a known id', () => {
    const scheme = getBlockingSchemeById('scheme-inside-zone');
    expect(scheme).toBeDefined();
    expect(scheme!.name).toBe('Inside Zone');
    expect(scheme!.type).toBe('run');
  });

  it('returns undefined for an unknown id', () => {
    expect(getBlockingSchemeById('scheme-nonexistent')).toBeUndefined();
  });

  it('returns correct scheme for every built-in id', () => {
    for (const s of BUILT_IN_BLOCKING_SCHEMES) {
      const result = getBlockingSchemeById(s.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(s.id);
      expect(result!.name).toBe(s.name);
    }
  });
});

// ============================================================
// applyBlockingScheme
// ============================================================
describe('applyBlockingScheme()', () => {
  it('returns assignments for all 5 OL positions in a standard formation', () => {
    const scheme = getBlockingSchemeById('scheme-inside-zone')!;
    const formation = makeFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    // Inside Zone has 5 rules (all OL), so 5 assignments
    expect(assignments).toHaveLength(5);
  });

  it('each assignment has a blocking object with correct fields', () => {
    const scheme = getBlockingSchemeById('scheme-inside-zone')!;
    const formation = makeFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    for (const a of assignments) {
      expect(a.playerId).toBeTruthy();
      expect(a.blocking).toBeDefined();
      expect(a.blocking!.id).toBeTruthy();
      expect(a.blocking!.blockerId).toBe(a.playerId);
      expect(VALID_BLOCK_TYPES).toContain(a.blocking!.blockType);
      expect(typeof a.blocking!.direction).toBe('number');
    }
  });

  it('assigns the correct block type per position for Inside Zone', () => {
    const scheme = getBlockingSchemeById('scheme-inside-zone')!;
    const formation = makeFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    // All Inside Zone rules use 'zone' block type
    for (const a of assignments) {
      expect(a.blocking!.blockType).toBe('zone');
    }
  });

  it('assigns pull block type for the pulling guard in Power scheme', () => {
    const scheme = getBlockingSchemeById('scheme-power')!;
    const formation = makeIFormFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    const rgAssignment = assignments.find((a) => a.playerId === 'rg');
    expect(rgAssignment).toBeDefined();
    expect(rgAssignment!.blocking!.blockType).toBe('pull');
  });

  it('assigns FB in Power scheme when FB is present in formation', () => {
    const scheme = getBlockingSchemeById('scheme-power')!;
    const formation = makeIFormFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    const fbAssignment = assignments.find((a) => a.playerId === 'fb');
    expect(fbAssignment).toBeDefined();
    expect(fbAssignment!.blocking!.blockType).toBe('drive');
  });

  it('skips FB rule when formation has no FB', () => {
    const scheme = getBlockingSchemeById('scheme-power')!;
    // Singleback formation (no FB)
    const formation = makeFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    const fbAssignment = assignments.find((a) => a.playerId === 'fb');
    expect(fbAssignment).toBeUndefined();

    // Should still have 5 OL assignments
    expect(assignments).toHaveLength(5);
  });

  it('includes a label with the rule description for each assignment', () => {
    const scheme = getBlockingSchemeById('scheme-inside-zone')!;
    const formation = makeFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    for (const a of assignments) {
      expect(a.label).toBeTruthy();
      expect(a.label!.length).toBeGreaterThan(3);
    }
  });

  it('assigns unique player ids (no player assigned twice)', () => {
    for (const scheme of BUILT_IN_BLOCKING_SCHEMES) {
      const formation = makeIFormFormation();
      const assignments = applyBlockingScheme(scheme, formation);

      const playerIds = assignments.map((a) => a.playerId);
      expect(new Set(playerIds).size).toBe(playerIds.length);
    }
  });

  it('handles a formation with only OL players', () => {
    const olOnly: Formation = makeFormation({
      players: [
        { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: 248 }, side: 'offense' },
        { id: 'lg', position: 'LG', label: 'LG', location: { x: 350, y: 248 }, side: 'offense' },
        { id: 'c', position: 'C', label: 'C', location: { x: 400, y: 248 }, side: 'offense' },
        { id: 'rg', position: 'RG', label: 'RG', location: { x: 450, y: 248 }, side: 'offense' },
        { id: 'rt', position: 'RT', label: 'RT', location: { x: 490, y: 248 }, side: 'offense' },
      ],
    });

    const scheme = getBlockingSchemeById('scheme-inside-zone')!;
    const assignments = applyBlockingScheme(scheme, olOnly);
    expect(assignments).toHaveLength(5);
  });

  it('handles empty formation gracefully', () => {
    const empty: Formation = makeFormation({ players: [] });
    const scheme = getBlockingSchemeById('scheme-inside-zone')!;
    const assignments = applyBlockingScheme(scheme, empty);
    expect(assignments).toHaveLength(0);
  });

  it('pass protection scheme assigns RB when present', () => {
    const scheme = getBlockingSchemeById('scheme-half-slide')!;
    const formation = makeFormation();
    const assignments = applyBlockingScheme(scheme, formation);

    const rbAssignment = assignments.find((a) => a.playerId === 'rb');
    expect(rbAssignment).toBeDefined();
    expect(rbAssignment!.blocking!.blockType).toBe('pass-pro');
  });

  it('applies all built-in schemes to singleback without errors', () => {
    const formation = makeFormation();
    for (const scheme of BUILT_IN_BLOCKING_SCHEMES) {
      const assignments = applyBlockingScheme(scheme, formation);
      expect(assignments.length).toBeGreaterThanOrEqual(4);
    }
  });
});

// ============================================================
// getAllBlockingSchemeTags
// ============================================================
describe('getAllBlockingSchemeTags()', () => {
  it('returns a non-empty array of tags', () => {
    const tags = getAllBlockingSchemeTags();
    expect(tags.length).toBeGreaterThan(0);
  });

  it('returns sorted tags', () => {
    const tags = getAllBlockingSchemeTags();
    const sorted = [...tags].sort();
    expect(tags).toEqual(sorted);
  });

  it('returns unique tags', () => {
    const tags = getAllBlockingSchemeTags();
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('includes expected tags', () => {
    const tags = getAllBlockingSchemeTags();
    expect(tags).toContain('zone');
    expect(tags).toContain('gap');
    expect(tags).toContain('pass-protection');
  });
});
