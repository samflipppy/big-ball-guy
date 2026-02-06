import { describe, it, expect } from 'vitest';
import {
  importRoster,
  matchToFormation,
  getDepthChart,
  validatePersonnel,
} from '@/lib/roster';
import type { RosterPlayer } from '@/lib/roster';
import type { Formation } from '@/types';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';

// ---- Test Helpers ----

function makeRosterPlayer(overrides: Partial<RosterPlayer> = {}): RosterPlayer {
  return {
    id: overrides.id ?? 'rp-1',
    name: overrides.name ?? 'John Smith',
    number: overrides.number ?? 1,
    position: overrides.position ?? 'QB',
    height: overrides.height ?? '6-2',
    weight: overrides.weight ?? 210,
    year: overrides.year ?? 'SR',
    isStarter: overrides.isStarter ?? false,
    ...overrides,
  };
}

const SAMPLE_CSV = `name,number,position,height,weight,year,isStarter
John Doe,12,QB,6-2,215,SR,true
Jane Smith,24,RB,5-10,195,JR,true
Bob Jones,81,WR,6-0,185,SO,true
Tim Brown,85,WR,6-1,190,SR,false
Al Davis,72,LT,6-5,310,SR,true
Ed Reed,74,LG,6-3,295,JR,true
Mike C,55,C,6-2,290,SR,true
Joe G,66,RG,6-4,305,SO,true
Tom T,77,RT,6-6,320,SR,true
Dan K,88,TE,6-4,250,JR,true
Sam W,3,WR,5-11,180,FR,false`;

// ---- Tests ----

describe('importRoster()', () => {
  it('parses a standard CSV into roster players', () => {
    const roster = importRoster(SAMPLE_CSV);
    expect(roster).toHaveLength(11);
    expect(roster[0].name).toBe('John Doe');
    expect(roster[0].number).toBe(12);
    expect(roster[0].position).toBe('QB');
    expect(roster[0].isStarter).toBe(true);
  });

  it('handles quoted CSV fields', () => {
    const csv = `name,number,position,height,weight,year,isStarter
"Smith, Jr.",7,QB,6-1,200,SR,true`;
    const roster = importRoster(csv);
    expect(roster).toHaveLength(1);
    expect(roster[0].name).toBe('Smith, Jr.');
  });

  it('returns empty array for header-only CSV', () => {
    const csv = 'name,number,position,height,weight,year,isStarter';
    expect(importRoster(csv)).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(importRoster('')).toHaveLength(0);
  });

  it('skips rows with missing name or invalid number', () => {
    const csv = `name,number,position,height,weight,year,isStarter
,12,QB,6-2,215,SR,true
Valid Player,abc,QB,6-2,215,SR,true
Good Player,1,QB,6-2,215,SR,true`;
    const roster = importRoster(csv);
    expect(roster).toHaveLength(1);
    expect(roster[0].name).toBe('Good Player');
  });

  it('correctly parses isStarter with various formats', () => {
    const csv = `name,number,position,height,weight,year,isStarter
A,1,QB,6-2,215,SR,true
B,2,RB,5-10,200,JR,1
C,3,WR,6-0,185,SO,yes
D,4,WR,6-1,190,SR,false
E,5,TE,6-4,245,JR,0`;
    const roster = importRoster(csv);
    expect(roster[0].isStarter).toBe(true);
    expect(roster[1].isStarter).toBe(true);
    expect(roster[2].isStarter).toBe(true);
    expect(roster[3].isStarter).toBe(false);
    expect(roster[4].isStarter).toBe(false);
  });

  it('generates unique IDs based on number and name', () => {
    const roster = importRoster(SAMPLE_CSV);
    const ids = new Set(roster.map((p) => p.id));
    expect(ids.size).toBe(roster.length);
  });
});

describe('matchToFormation()', () => {
  it('matches roster players to formation positions', () => {
    const roster = importRoster(SAMPLE_CSV);
    const formation = BUILT_IN_FORMATIONS.find((f) => f.name === 'Shotgun')!;
    const matches = matchToFormation(roster, formation);

    expect(matches.size).toBeGreaterThan(0);
    // QB should be matched
    const qbMatch = matches.get('qb');
    expect(qbMatch).toBeDefined();
    expect(qbMatch!.position).toBe('QB');
  });

  it('prefers starters over non-starters', () => {
    const roster: RosterPlayer[] = [
      makeRosterPlayer({ id: 'backup', name: 'Backup', number: 2, position: 'QB', isStarter: false }),
      makeRosterPlayer({ id: 'starter', name: 'Starter', number: 1, position: 'QB', isStarter: true }),
    ];
    const formation = BUILT_IN_FORMATIONS.find((f) => f.name === 'Shotgun')!;
    const matches = matchToFormation(roster, formation);
    const qbMatch = matches.get('qb');
    expect(qbMatch!.id).toBe('starter');
  });

  it('returns empty map for empty roster', () => {
    const formation = BUILT_IN_FORMATIONS[0];
    const matches = matchToFormation([], formation);
    expect(matches.size).toBe(0);
  });
});

describe('getDepthChart()', () => {
  it('returns players at the specified position', () => {
    const roster: RosterPlayer[] = [
      makeRosterPlayer({ id: 'qb1', name: 'QB1', number: 1, position: 'QB', isStarter: true }),
      makeRosterPlayer({ id: 'qb2', name: 'QB2', number: 2, position: 'QB', isStarter: false }),
      makeRosterPlayer({ id: 'rb1', name: 'RB1', number: 22, position: 'RB', isStarter: true }),
    ];
    const depth = getDepthChart(roster, 'QB');
    expect(depth).toHaveLength(2);
    expect(depth[0].id).toBe('qb1'); // starter first
    expect(depth[1].id).toBe('qb2');
  });

  it('puts starters first in depth chart', () => {
    const roster: RosterPlayer[] = [
      makeRosterPlayer({ id: 'wr3', name: 'WR3', number: 83, position: 'WR', isStarter: false }),
      makeRosterPlayer({ id: 'wr1', name: 'WR1', number: 1, position: 'WR', isStarter: true }),
      makeRosterPlayer({ id: 'wr2', name: 'WR2', number: 12, position: 'WR', isStarter: false }),
    ];
    const depth = getDepthChart(roster, 'WR');
    expect(depth[0].id).toBe('wr1');
  });

  it('returns empty array for position with no players', () => {
    const roster: RosterPlayer[] = [
      makeRosterPlayer({ id: 'qb1', position: 'QB' }),
    ];
    expect(getDepthChart(roster, 'WR')).toHaveLength(0);
  });

  it('includes FB in RB depth chart', () => {
    const roster: RosterPlayer[] = [
      makeRosterPlayer({ id: 'rb1', position: 'RB', isStarter: true }),
      makeRosterPlayer({ id: 'fb1', position: 'FB', isStarter: false }),
    ];
    const depth = getDepthChart(roster, 'RB');
    expect(depth).toHaveLength(2);
  });
});

describe('validatePersonnel()', () => {
  it('validates a complete 11-personnel roster', () => {
    const roster = importRoster(SAMPLE_CSV);
    const result = validatePersonnel(roster, '11');
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('reports missing positions', () => {
    const roster: RosterPlayer[] = [
      makeRosterPlayer({ id: 'qb', position: 'QB' }),
      // No OL, no WR, no TE, no RB
    ];
    const result = validatePersonnel(roster, '11');
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    // Should report OL shortage
    expect(result.missing.some((m) => m.position === 'OL')).toBe(true);
  });

  it('returns invalid for unknown personnel groups', () => {
    const result = validatePersonnel([], '99');
    expect(result.valid).toBe(false);
  });

  it('validates 21 personnel requires 2 RBs', () => {
    const roster: RosterPlayer[] = [
      makeRosterPlayer({ id: 'qb', position: 'QB' }),
      makeRosterPlayer({ id: 'lt', position: 'LT' }),
      makeRosterPlayer({ id: 'lg', position: 'LG' }),
      makeRosterPlayer({ id: 'c', position: 'C' }),
      makeRosterPlayer({ id: 'rg', position: 'RG' }),
      makeRosterPlayer({ id: 'rt', position: 'RT' }),
      makeRosterPlayer({ id: 'rb1', position: 'RB' }),
      // Only 1 RB, need 2 for '21'
      makeRosterPlayer({ id: 'te1', position: 'TE' }),
      makeRosterPlayer({ id: 'wr1', position: 'WR' }),
      makeRosterPlayer({ id: 'wr2', position: 'WR' }),
    ];
    const result = validatePersonnel(roster, '21');
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.position === 'RB' && m.needed === 2 && m.available === 1)).toBe(true);
  });
});
