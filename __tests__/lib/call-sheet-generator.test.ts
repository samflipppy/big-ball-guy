import { describe, it, expect } from 'vitest';
import {
  generateCallSheet,
  prioritizePlays,
  normalizeSituation,
  SITUATIONS,
} from '@/lib/call-sheet-generator';
import type { GamePlan, Play } from '@/types';

// ---- Test helpers ----

function makPlay(overrides: Partial<Play> = {}): Play {
  return {
    id: overrides.id ?? 'play-1',
    name: overrides.name ?? 'Test Play',
    formationId: 'builtin-shotgun',
    assignments: [],
    tags: overrides.tags ?? [],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeGamePlan(sections: GamePlan['sections'] = []): GamePlan {
  return {
    id: 'gp-1',
    name: 'Week 1 vs Rival',
    opponent: 'Rival',
    week: 1,
    season: '2024',
    sections,
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

// ---- Tests ----

describe('normalizeSituation()', () => {
  it('normalizes standard situation strings', () => {
    expect(normalizeSituation('1st & 10')).toBe('1st down');
    expect(normalizeSituation('3rd & Short')).toBe('3rd short');
    expect(normalizeSituation('Red Zone')).toBe('red zone');
  });

  it('normalizes alternative aliases', () => {
    expect(normalizeSituation('goalline')).toBe('goal line');
    expect(normalizeSituation('2-min')).toBe('2-minute');
    expect(normalizeSituation('hurry up')).toBe('2-minute');
    expect(normalizeSituation('redzone')).toBe('red zone');
  });

  it('returns undefined for unknown situations', () => {
    expect(normalizeSituation('garbage time')).toBeUndefined();
    expect(normalizeSituation('')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(normalizeSituation('RED ZONE')).toBe('red zone');
    expect(normalizeSituation('3RD & LONG')).toBe('3rd long');
  });
});

describe('prioritizePlays()', () => {
  it('returns all plays in some order', () => {
    const plays = [
      makPlay({ id: 'a', name: 'Alpha' }),
      makPlay({ id: 'b', name: 'Beta' }),
    ];
    const result = prioritizePlays(plays, '1st down');
    expect(result).toHaveLength(2);
  });

  it('boosts plays with situation-matching tags', () => {
    const plays = [
      makPlay({ id: 'no-match', name: 'NoMatch', tags: ['screen'] }),
      makPlay({ id: 'match', name: 'Match', tags: ['1st', 'down'] }),
    ];
    const result = prioritizePlays(plays, '1st down');
    // The play with matching tags should come first
    expect(result[0].id).toBe('match');
  });

  it('boosts run plays for short situations', () => {
    const plays = [
      makPlay({ id: 'pass', name: 'Pass Play', tags: ['pass'] }),
      makPlay({ id: 'run', name: 'Run Play', tags: ['run', 'short'] }),
    ];
    const result = prioritizePlays(plays, '3rd short');
    expect(result[0].id).toBe('run');
  });

  it('does not mutate the original array', () => {
    const plays = [
      makPlay({ id: 'b', name: 'Beta' }),
      makPlay({ id: 'a', name: 'Alpha' }),
    ];
    const original = [...plays];
    prioritizePlays(plays, '1st down');
    expect(plays[0].id).toBe(original[0].id);
  });
});

describe('generateCallSheet()', () => {
  const defaultOptions = {
    maxPlaysPerSituation: 5,
    includeCheckWithMe: true,
    includeAudibles: true,
  };

  it('generates a call sheet with correct structure', () => {
    const plays = [makPlay({ id: 'p1', name: 'Shotgun Mesh' })];
    const gp = makeGamePlan([
      {
        id: 's1',
        situation: '1st & 10',
        plays: [{ playId: 'p1', order: 1 }],
        order: 1,
      },
    ]);

    const cs = generateCallSheet(gp, plays, defaultOptions);
    expect(cs.gamePlanId).toBe('gp-1');
    expect(cs.teamId).toBe('team-1');
    expect(cs.sections.length).toBeGreaterThan(0);
    expect(cs.sections[0].name).toBe('1st down');
    expect(cs.sections[0].plays).toHaveLength(1);
  });

  it('groups plays into correct situation buckets', () => {
    const plays = [
      makPlay({ id: 'p1', name: 'Play 1' }),
      makPlay({ id: 'p2', name: 'Play 2' }),
      makPlay({ id: 'p3', name: 'Play 3' }),
    ];
    const gp = makeGamePlan([
      { id: 's1', situation: '1st & 10', plays: [{ playId: 'p1', order: 1 }], order: 1 },
      { id: 's2', situation: 'Red Zone', plays: [{ playId: 'p2', order: 1 }], order: 2 },
      { id: 's3', situation: '3rd & Long', plays: [{ playId: 'p3', order: 1 }], order: 3 },
    ]);

    const cs = generateCallSheet(gp, plays, defaultOptions);
    const names = cs.sections.map((s) => s.name);
    expect(names).toContain('1st down');
    expect(names).toContain('red zone');
    expect(names).toContain('3rd long');
  });

  it('caps plays per situation to maxPlaysPerSituation', () => {
    const plays = Array.from({ length: 10 }, (_, i) =>
      makPlay({ id: `p${i}`, name: `Play ${i}` }),
    );
    const gp = makeGamePlan([
      {
        id: 's1',
        situation: '1st & 10',
        plays: plays.map((p, i) => ({ playId: p.id, order: i + 1 })),
        order: 1,
      },
    ]);

    const cs = generateCallSheet(gp, plays, { ...defaultOptions, maxPlaysPerSituation: 3 });
    const firstSection = cs.sections.find((s) => s.name === '1st down');
    expect(firstSection!.plays).toHaveLength(3);
  });

  it('excludes check-with-me plays when option is false', () => {
    const plays = [
      makPlay({ id: 'p1', name: 'Normal', tags: [] }),
      makPlay({ id: 'p2', name: 'CWM', tags: ['check-with-me'] }),
    ];
    const gp = makeGamePlan([
      {
        id: 's1',
        situation: '1st & 10',
        plays: [
          { playId: 'p1', order: 1 },
          { playId: 'p2', order: 2 },
        ],
        order: 1,
      },
    ]);

    const cs = generateCallSheet(gp, plays, {
      ...defaultOptions,
      includeCheckWithMe: false,
    });
    const section = cs.sections.find((s) => s.name === '1st down')!;
    expect(section.plays).toHaveLength(1);
    expect(section.plays[0].playId).toBe('p1');
  });

  it('excludes audible plays when option is false', () => {
    const plays = [
      makPlay({ id: 'p1', name: 'Normal', tags: [] }),
      makPlay({ id: 'p2', name: 'Audible', tags: ['audible'] }),
    ];
    const gp = makeGamePlan([
      {
        id: 's1',
        situation: '2nd & Short',
        plays: [
          { playId: 'p1', order: 1 },
          { playId: 'p2', order: 2 },
        ],
        order: 1,
      },
    ]);

    const cs = generateCallSheet(gp, plays, {
      ...defaultOptions,
      includeAudibles: false,
    });
    const section = cs.sections.find((s) => s.name === '2nd short')!;
    expect(section.plays).toHaveLength(1);
    expect(section.plays[0].playId).toBe('p1');
  });

  it('skips sections with unmapped situations', () => {
    const plays = [makPlay({ id: 'p1', name: 'Play 1' })];
    const gp = makeGamePlan([
      { id: 's1', situation: 'garbage time', plays: [{ playId: 'p1', order: 1 }], order: 1 },
    ]);

    const cs = generateCallSheet(gp, plays, defaultOptions);
    expect(cs.sections).toHaveLength(0);
  });

  it('assigns colors to sections', () => {
    const plays = [makPlay({ id: 'p1', name: 'Play' })];
    const gp = makeGamePlan([
      { id: 's1', situation: 'Red Zone', plays: [{ playId: 'p1', order: 1 }], order: 1 },
    ]);

    const cs = generateCallSheet(gp, plays, defaultOptions);
    expect(cs.sections[0].color).toBeDefined();
    expect(cs.sections[0].color).toMatch(/^#/);
  });

  it('avoids duplicate plays in same bucket', () => {
    const plays = [makPlay({ id: 'p1', name: 'Play 1' })];
    const gp = makeGamePlan([
      {
        id: 's1',
        situation: '1st & 10',
        plays: [
          { playId: 'p1', order: 1 },
          { playId: 'p1', order: 2 }, // duplicate
        ],
        order: 1,
      },
      {
        id: 's2',
        situation: '1st down',
        plays: [{ playId: 'p1', order: 1 }], // same bucket
        order: 2,
      },
    ]);

    const cs = generateCallSheet(gp, plays, defaultOptions);
    const section = cs.sections.find((s) => s.name === '1st down')!;
    expect(section.plays).toHaveLength(1);
  });
});
