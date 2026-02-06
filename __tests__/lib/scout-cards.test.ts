import { describe, it, expect, vi } from 'vitest';
import {
  generateScoutCards,
  groupBySituation,
  sortByFrequency,
} from '@/lib/scout-cards';
import type { ScoutCard } from '@/lib/scout-cards';
import type { TendencyEntry, Play, Formation } from '@/types';

// Mock crypto.randomUUID for deterministic tests
vi.stubGlobal('crypto', {
  randomUUID: (() => {
    let counter = 0;
    return () => `uuid-${++counter}`;
  })(),
});

const makeFormation = (id: string, name: string): Formation => ({
  id,
  name,
  side: 'offense',
  players: [
    { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
  ],
  personnel: '11',
  tags: [],
  isCustom: false,
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
});

const makePlay = (id: string, name: string, formationId: string, tags: string[], personnel = '11'): Play => ({
  id,
  name,
  formationId,
  assignments: [],
  tags,
  personnel,
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
});

const makeTendency = (
  overrides: Partial<TendencyEntry> = {},
): TendencyEntry => ({
  id: 't-1',
  opponentId: 'opp-1',
  situation: '1st & 10',
  personnel: '11',
  playType: 'run',
  percentage: 55,
  sampleSize: 20,
  teamId: 'team-1',
  createdAt: '2025-01-01',
  ...overrides,
});

const formations = [
  makeFormation('f1', 'Singleback'),
  makeFormation('f2', 'Shotgun'),
];

const plays = [
  makePlay('p1', 'HB Dive', 'f1', ['run'], '11'),
  makePlay('p2', 'PA Boot', 'f1', ['pass'], '11'),
  makePlay('p3', 'Mesh Concept', 'f2', ['pass'], '11'),
  makePlay('p4', 'Zone Left', 'f1', ['run'], '12'),
];

describe('generateScoutCards', () => {
  it('generates one card per tendency entry', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 55 }),
      makeTendency({ id: 't2', playType: 'pass', percentage: 30 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards).toHaveLength(2);
  });

  it('matches tendency playType to play tags', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 60 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].playName).toBe('HB Dive'); // First play with 'run' tag
  });

  it('matches tendency playType to play tags (pass)', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'pass', percentage: 40 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].playName).toBe('PA Boot'); // First play with 'pass' tag
  });

  it('uses formation match as higher priority', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'pass', formation: 'Shotgun', percentage: 35 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].playName).toBe('Mesh Concept'); // 'pass' tag + Shotgun formation
  });

  it('falls back to personnel match when no tag matches', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'screen', personnel: '12', percentage: 10 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].playName).toBe('Zone Left'); // personnel '12' match
  });

  it('falls back to first play when nothing matches', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'trick', personnel: '23', percentage: 5 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].playName).toBe('HB Dive'); // First play fallback
  });

  it('carries over frequency from tendency', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 72 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].frequency).toBe(72);
  });

  it('carries over notes from tendency', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 50, notes: 'Strong right' }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].notes).toBe('Strong right');
  });

  it('returns empty array for empty tendencies', () => {
    const cards = generateScoutCards([], plays, formations);
    expect(cards).toHaveLength(0);
  });

  it('returns empty array for empty plays', () => {
    const tendencies = [makeTendency({ id: 't1' })];
    const cards = generateScoutCards(tendencies, [], formations);
    expect(cards).toHaveLength(0);
  });

  it('returns results sorted by frequency descending', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 20 }),
      makeTendency({ id: 't2', playType: 'pass', percentage: 60 }),
      makeTendency({ id: 't3', playType: 'run', percentage: 40 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].frequency).toBe(60);
    expect(cards[1].frequency).toBe(40);
    expect(cards[2].frequency).toBe(20);
  });

  it('sets the situation from the tendency', () => {
    const tendencies = [
      makeTendency({ id: 't1', situation: '3rd & Long', playType: 'pass', percentage: 45 }),
    ];
    const cards = generateScoutCards(tendencies, plays, formations);
    expect(cards[0].situation).toBe('3rd & Long');
  });
});

describe('groupBySituation', () => {
  const makeCard = (situation: string, frequency: number): ScoutCard => ({
    id: `card-${Math.random()}`,
    situation,
    playId: 'p1',
    playName: 'Test',
    formationId: 'f1',
    tendency: makeTendency({ percentage: frequency }),
    frequency,
    notes: '',
  });

  it('groups cards by situation', () => {
    const cards = [
      makeCard('1st & 10', 50),
      makeCard('Red Zone', 30),
      makeCard('1st & 10', 25),
    ];
    const groups = groupBySituation(cards);
    expect(groups.size).toBe(2);
    expect(groups.get('1st & 10')).toHaveLength(2);
    expect(groups.get('Red Zone')).toHaveLength(1);
  });

  it('sorts each group by frequency descending', () => {
    const cards = [
      makeCard('1st & 10', 20),
      makeCard('1st & 10', 60),
      makeCard('1st & 10', 40),
    ];
    const groups = groupBySituation(cards);
    const group = groups.get('1st & 10')!;
    expect(group[0].frequency).toBe(60);
    expect(group[1].frequency).toBe(40);
    expect(group[2].frequency).toBe(20);
  });

  it('returns empty map for empty input', () => {
    const groups = groupBySituation([]);
    expect(groups.size).toBe(0);
  });
});

describe('sortByFrequency', () => {
  const makeCard = (frequency: number): ScoutCard => ({
    id: `card-${Math.random()}`,
    situation: 'test',
    playId: 'p1',
    playName: 'Test',
    formationId: 'f1',
    tendency: makeTendency({ percentage: frequency }),
    frequency,
    notes: '',
  });

  it('sorts cards by frequency descending', () => {
    const cards = [makeCard(10), makeCard(50), makeCard(30)];
    const sorted = sortByFrequency(cards);
    expect(sorted[0].frequency).toBe(50);
    expect(sorted[1].frequency).toBe(30);
    expect(sorted[2].frequency).toBe(10);
  });

  it('does not mutate the original array', () => {
    const cards = [makeCard(10), makeCard(50)];
    const sorted = sortByFrequency(cards);
    expect(sorted).not.toBe(cards);
    expect(cards[0].frequency).toBe(10); // Unchanged
  });

  it('handles empty array', () => {
    expect(sortByFrequency([])).toEqual([]);
  });

  it('handles single element', () => {
    const cards = [makeCard(42)];
    const sorted = sortByFrequency(cards);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].frequency).toBe(42);
  });
});
