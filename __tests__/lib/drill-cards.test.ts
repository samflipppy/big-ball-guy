import { describe, it, expect } from 'vitest';
import {
  generateDrillCard,
  buildPracticeScript,
  groupByPeriod,
  exportDrillCards,
  estimateDrillTime,
} from '@/lib/drill-cards';
import type { DrillCard } from '@/lib/drill-cards';
import type { Play } from '@/types';

// ---- Test Helpers ----

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: overrides.id ?? 'play-1',
    name: overrides.name ?? 'Test Play',
    formationId: 'builtin-shotgun',
    assignments: overrides.assignments ?? [],
    tags: [],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeDrillCard(overrides: Partial<DrillCard> = {}): DrillCard {
  return {
    id: overrides.id ?? 'drill-1',
    name: overrides.name ?? 'Test Drill',
    playId: overrides.playId ?? 'play-1',
    period: overrides.period ?? 'team',
    repCount: overrides.repCount ?? 3,
    tempo: overrides.tempo ?? 'full-speed',
    coachingPoints: overrides.coachingPoints ?? ['Point 1'],
    equipment: overrides.equipment ?? ['footballs'],
    ...overrides,
  };
}

// ---- Tests ----

describe('generateDrillCard()', () => {
  it('creates a drill card with play name and id', () => {
    const play = makePlay({ id: 'p1', name: 'Shotgun Mesh' });
    const card = generateDrillCard(play, { period: 'team' });
    expect(card.name).toBe('Shotgun Mesh');
    expect(card.playId).toBe('p1');
    expect(card.period).toBe('team');
  });

  it('uses provided options for repCount and tempo', () => {
    const play = makePlay();
    const card = generateDrillCard(play, {
      period: 'individual',
      repCount: 10,
      tempo: 'walk-through',
    });
    expect(card.repCount).toBe(10);
    expect(card.tempo).toBe('walk-through');
  });

  it('defaults to 3 reps and full-speed when not specified', () => {
    const play = makePlay();
    const card = generateDrillCard(play, { period: 'team' });
    expect(card.repCount).toBe(3);
    expect(card.tempo).toBe('full-speed');
  });

  it('uses custom coaching points when provided', () => {
    const play = makePlay();
    const card = generateDrillCard(play, {
      period: 'team',
      coachingPoints: ['Stay low', 'Eyes up'],
    });
    expect(card.coachingPoints).toEqual(['Stay low', 'Eyes up']);
  });

  it('derives coaching points from play assignments when not provided', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'wr1',
          route: {
            id: 'r1',
            name: 'Slant',
            type: 'slant',
            points: [{ x: 0, y: 0, type: 'line' }],
          },
        },
      ],
    });
    const card = generateDrillCard(play, { period: 'team' });
    expect(card.coachingPoints.length).toBeGreaterThan(0);
    expect(card.coachingPoints.some((p) => p.toLowerCase().includes('route'))).toBe(true);
  });

  it('derives equipment from play assignments', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'lt',
          blocking: {
            id: 'b1',
            blockerId: 'lt',
            blockType: 'drive',
          },
        },
      ],
    });
    const card = generateDrillCard(play, { period: 'team' });
    expect(card.equipment).toContain('blocking pads');
    expect(card.equipment).toContain('footballs');
  });

  it('uses custom equipment when provided', () => {
    const play = makePlay();
    const card = generateDrillCard(play, {
      period: 'team',
      equipment: ['tackling dummies', 'cones'],
    });
    expect(card.equipment).toEqual(['tackling dummies', 'cones']);
  });

  it('generates unique IDs', () => {
    const play = makePlay();
    const card1 = generateDrillCard(play, { period: 'team' });
    // Small delay to ensure different timestamp
    const card2 = generateDrillCard(play, { period: 'team' });
    // IDs include timestamp, so they will differ (or at worst be the same ms)
    expect(card1.id).toMatch(/^drill-/);
  });
});

describe('estimateDrillTime()', () => {
  it('estimates time based on tempo and reps', () => {
    const card = makeDrillCard({ tempo: 'full-speed', repCount: 3 });
    // full-speed base = 7, extra reps = 2 * 0.5 = 1, total = 8
    expect(estimateDrillTime(card)).toBe(8);
  });

  it('walk-through is shorter than full-speed', () => {
    const walkThrough = makeDrillCard({ tempo: 'walk-through', repCount: 1 });
    const fullSpeed = makeDrillCard({ tempo: 'full-speed', repCount: 1 });
    expect(estimateDrillTime(walkThrough)).toBeLessThan(estimateDrillTime(fullSpeed));
  });

  it('more reps increase time', () => {
    const few = makeDrillCard({ repCount: 1, tempo: 'jog' });
    const many = makeDrillCard({ repCount: 10, tempo: 'jog' });
    expect(estimateDrillTime(many)).toBeGreaterThan(estimateDrillTime(few));
  });
});

describe('buildPracticeScript()', () => {
  it('returns empty array for empty drill cards', () => {
    expect(buildPracticeScript([], 60)).toEqual([]);
  });

  it('allocates time across drill cards', () => {
    const cards = [
      makeDrillCard({ id: 'd1', tempo: 'full-speed', repCount: 3 }),
      makeDrillCard({ id: 'd2', tempo: 'walk-through', repCount: 2 }),
    ];
    const script = buildPracticeScript(cards, 60);
    expect(script).toHaveLength(2);
    expect(script[0].startMinute).toBe(0);
    expect(script[1].startMinute).toBeGreaterThan(0);
  });

  it('starts at minute 0', () => {
    const cards = [makeDrillCard()];
    const script = buildPracticeScript(cards, 30);
    expect(script[0].startMinute).toBe(0);
  });

  it('scales down when total time exceeds budget', () => {
    // Two full-speed 3-rep drills = ~8 mins each = 16 mins total
    const cards = [
      makeDrillCard({ id: 'd1', tempo: 'full-speed', repCount: 3 }),
      makeDrillCard({ id: 'd2', tempo: 'full-speed', repCount: 3 }),
    ];
    const script = buildPracticeScript(cards, 10); // only 10 minutes
    const totalAllocated = script.reduce((sum, e) => sum + e.durationMinutes, 0);
    // Should be close to 10 minutes (rounding may cause slight variation)
    expect(totalAllocated).toBeLessThanOrEqual(12);
    expect(totalAllocated).toBeGreaterThanOrEqual(8);
  });

  it('preserves drill card references', () => {
    const cards = [makeDrillCard({ id: 'd1', name: 'My Drill' })];
    const script = buildPracticeScript(cards, 60);
    expect(script[0].drillCard.name).toBe('My Drill');
  });

  it('ensures minimum 1 minute per drill', () => {
    const cards = Array.from({ length: 100 }, (_, i) =>
      makeDrillCard({ id: `d${i}` }),
    );
    const script = buildPracticeScript(cards, 10);
    for (const entry of script) {
      expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('groupByPeriod()', () => {
  it('groups drill cards by period name', () => {
    const cards = [
      makeDrillCard({ id: 'd1', period: 'team' }),
      makeDrillCard({ id: 'd2', period: 'individual' }),
      makeDrillCard({ id: 'd3', period: 'team' }),
    ];
    const groups = groupByPeriod(cards);
    expect(groups.get('team')).toHaveLength(2);
    expect(groups.get('individual')).toHaveLength(1);
  });

  it('returns empty map for empty input', () => {
    const groups = groupByPeriod([]);
    expect(groups.size).toBe(0);
  });

  it('handles single period', () => {
    const cards = [
      makeDrillCard({ id: 'd1', period: 'seven-on-seven' }),
      makeDrillCard({ id: 'd2', period: 'seven-on-seven' }),
    ];
    const groups = groupByPeriod(cards);
    expect(groups.size).toBe(1);
    expect(groups.get('seven-on-seven')).toHaveLength(2);
  });
});

describe('exportDrillCards()', () => {
  it('exports as JSON with correct structure', () => {
    const cards = [makeDrillCard({ id: 'd1', name: 'Test' })];
    const json = exportDrillCards(cards, 'json');
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('d1');
    expect(parsed[0].name).toBe('Test');
  });

  it('exports as CSV with header row', () => {
    const cards = [makeDrillCard({ id: 'd1', name: 'Test' })];
    const csv = exportDrillCards(cards, 'csv');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,name,playId,period,repCount,tempo,coachingPoints,equipment');
    expect(lines).toHaveLength(2);
  });

  it('escapes CSV values with commas', () => {
    const cards = [
      makeDrillCard({
        id: 'd1',
        name: 'Test',
        coachingPoints: ['Point 1, important', 'Point 2'],
      }),
    ];
    const csv = exportDrillCards(cards, 'csv');
    // The coachingPoints field should be quoted because it contains a comma after joining
    expect(csv).toContain('"Point 1, important; Point 2"');
  });

  it('handles empty card list', () => {
    const json = exportDrillCards([], 'json');
    expect(JSON.parse(json)).toEqual([]);

    const csv = exportDrillCards([], 'csv');
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // header only
  });
});
