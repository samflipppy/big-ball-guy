import { describe, it, expect, vi } from 'vitest';
import {
  doesTriggerMatch,
  matchTrigger,
  matchAllTriggers,
  applyHotRoute,
  createHotRouteTrigger,
  type HotRouteTrigger,
} from '@/lib/hot-routes';
import type { Play, DefensiveOverlay, PlayerAssignment } from '@/types';

vi.mock('@/lib/utils', () => {
  let counter = 0;
  return {
    generateId: () => `hot-${counter++}`,
    cn: (...args: string[]) => args.filter(Boolean).join(' '),
  };
});

// ============================================================
// Helpers
// ============================================================

function makeDefense(overrides: Partial<DefensiveOverlay> = {}): DefensiveOverlay {
  return {
    front: '4-3 Over',
    coverage: 'Cover 2',
    players: [],
    ...overrides,
  };
}

function makeTrigger(overrides: Partial<HotRouteTrigger> = {}): HotRouteTrigger {
  return {
    id: 'trigger-1',
    name: 'Blitz Beater',
    defensiveKey: 'blitz',
    adjustment: [],
    ...overrides,
  };
}

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Test Play',
    formationId: 'f1',
    assignments: [],
    tags: [],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe('doesTriggerMatch', () => {
  it('matches blitz trigger when defense has a blitz', () => {
    const defense = makeDefense({ blitz: 'LB Blitz' });
    const trigger = makeTrigger({ defensiveKey: 'blitz' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });

  it('does not match blitz trigger when no blitz is defined', () => {
    const defense = makeDefense({ blitz: undefined });
    const trigger = makeTrigger({ defensiveKey: 'blitz' });
    expect(doesTriggerMatch(defense, trigger)).toBe(false);
  });

  it('does not match blitz trigger when blitz is empty string', () => {
    const defense = makeDefense({ blitz: '' });
    const trigger = makeTrigger({ defensiveKey: 'blitz' });
    expect(doesTriggerMatch(defense, trigger)).toBe(false);
  });

  it('matches man-coverage trigger for Cover 0', () => {
    const defense = makeDefense({ coverage: 'Cover 0' });
    const trigger = makeTrigger({ defensiveKey: 'man-coverage' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });

  it('matches man-coverage trigger for Cover 1', () => {
    const defense = makeDefense({ coverage: 'Cover 1' });
    const trigger = makeTrigger({ defensiveKey: 'man-coverage' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });

  it('does not match man-coverage trigger for Cover 1 Robber', () => {
    const defense = makeDefense({ coverage: 'Cover 1 Robber' });
    const trigger = makeTrigger({ defensiveKey: 'man-coverage' });
    expect(doesTriggerMatch(defense, trigger)).toBe(false);
  });

  it('matches man-coverage trigger for Cover 2 Man', () => {
    const defense = makeDefense({ coverage: 'Cover 2 Man' });
    const trigger = makeTrigger({ defensiveKey: 'man-coverage' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });

  it('matches zone-coverage trigger for Cover 3', () => {
    const defense = makeDefense({ coverage: 'Cover 3' });
    const trigger = makeTrigger({ defensiveKey: 'zone-coverage' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });

  it('matches zone-coverage trigger for Cover 4/Quarters', () => {
    const defense = makeDefense({ coverage: 'Cover 4/Quarters' });
    const trigger = makeTrigger({ defensiveKey: 'zone-coverage' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });

  it('does not match zone-coverage trigger for pure man coverage', () => {
    const defense = makeDefense({ coverage: 'Cover 0' });
    const trigger = makeTrigger({ defensiveKey: 'zone-coverage' });
    expect(doesTriggerMatch(defense, trigger)).toBe(false);
  });

  it('matches generic substring against coverage name', () => {
    const defense = makeDefense({ coverage: 'Cover 3 Cloud' });
    const trigger = makeTrigger({ defensiveKey: 'cloud' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });

  it('matches generic substring against front name', () => {
    const defense = makeDefense({ front: '3-4' });
    const trigger = makeTrigger({ defensiveKey: '3-4' });
    expect(doesTriggerMatch(defense, trigger)).toBe(true);
  });
});

describe('matchTrigger', () => {
  it('returns the first matching trigger', () => {
    const defense = makeDefense({ coverage: 'Cover 0', blitz: 'Safety Blitz' });
    const triggers = [
      makeTrigger({ id: 't1', defensiveKey: 'zone-coverage' }),
      makeTrigger({ id: 't2', defensiveKey: 'blitz', name: 'Blitz Beater' }),
      makeTrigger({ id: 't3', defensiveKey: 'blitz', name: 'Second Blitz' }),
    ];

    const result = matchTrigger(defense, triggers);
    expect(result).toBeDefined();
    // t1 (zone-coverage) does not match Cover 0, so t2 (blitz) is first match
    expect(result!.id).toBe('t2');
  });

  it('returns undefined when no trigger matches', () => {
    const defense = makeDefense({ coverage: 'Cover 2', blitz: undefined });
    const triggers = [
      makeTrigger({ defensiveKey: 'blitz' }),
    ];

    const result = matchTrigger(defense, triggers);
    expect(result).toBeUndefined();
  });
});

describe('matchAllTriggers', () => {
  it('returns all matching triggers', () => {
    const defense = makeDefense({ blitz: 'LB Blitz', coverage: 'Cover 0' });
    const triggers = [
      makeTrigger({ id: 't1', defensiveKey: 'blitz' }),
      makeTrigger({ id: 't2', defensiveKey: 'man-coverage' }),
      makeTrigger({ id: 't3', defensiveKey: 'zone-coverage' }),
    ];

    const results = matchAllTriggers(defense, triggers);
    expect(results).toHaveLength(2);
    expect(results.map((t) => t.id)).toContain('t1');
    expect(results.map((t) => t.id)).toContain('t2');
  });
});

describe('applyHotRoute', () => {
  it('replaces assignments for players in the trigger adjustment', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'wr1',
          route: { id: 'r1', name: 'streak', type: 'streak', points: [] },
        },
        {
          playerId: 'rb',
          route: { id: 'r2', name: 'flat', type: 'flat', points: [] },
        },
      ],
    });

    const trigger = makeTrigger({
      adjustment: [
        {
          playerId: 'wr1',
          route: { id: 'r-hot', name: 'slant', type: 'slant', points: [{ x: 200, y: 200, type: 'line' }] },
        },
      ],
    });

    const result = applyHotRoute(play, trigger);
    const wr1Assignment = result.assignments.find((a) => a.playerId === 'wr1');
    expect(wr1Assignment!.route!.type).toBe('slant');

    // rb should be unchanged
    const rbAssignment = result.assignments.find((a) => a.playerId === 'rb');
    expect(rbAssignment!.route!.type).toBe('flat');
  });

  it('does not mutate the original play', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'wr1',
          route: { id: 'r1', name: 'streak', type: 'streak', points: [] },
        },
      ],
    });

    const trigger = makeTrigger({
      adjustment: [
        {
          playerId: 'wr1',
          route: { id: 'r-hot', name: 'slant', type: 'slant', points: [] },
        },
      ],
    });

    const result = applyHotRoute(play, trigger);
    expect(result).not.toBe(play);
    expect(play.assignments[0].route!.type).toBe('streak');
    expect(result.assignments[0].route!.type).toBe('slant');
  });

  it('adds assignments for players not in the original play', () => {
    const play = makePlay({
      assignments: [
        { playerId: 'wr1', route: { id: 'r1', name: 'streak', type: 'streak', points: [] } },
      ],
    });

    const trigger = makeTrigger({
      adjustment: [
        { playerId: 'te', route: { id: 'r-te', name: 'drag', type: 'drag', points: [] } },
      ],
    });

    const result = applyHotRoute(play, trigger);
    expect(result.assignments).toHaveLength(2);
    const teAssignment = result.assignments.find((a) => a.playerId === 'te');
    expect(teAssignment).toBeDefined();
    expect(teAssignment!.route!.type).toBe('drag');
  });

  it('preserves non-adjusted assignments', () => {
    const play = makePlay({
      assignments: [
        { playerId: 'wr1', route: { id: 'r1', name: 'post', type: 'post', points: [] } },
        { playerId: 'wr2', route: { id: 'r2', name: 'corner', type: 'corner', points: [] } },
        { playerId: 'rb', route: { id: 'r3', name: 'flat', type: 'flat', points: [] } },
      ],
    });

    const trigger = makeTrigger({
      adjustment: [
        { playerId: 'wr1', route: { id: 'r-hot', name: 'slant', type: 'slant', points: [] } },
      ],
    });

    const result = applyHotRoute(play, trigger);
    expect(result.assignments).toHaveLength(3);
    expect(result.assignments.find((a) => a.playerId === 'wr2')!.route!.type).toBe('corner');
    expect(result.assignments.find((a) => a.playerId === 'rb')!.route!.type).toBe('flat');
  });
});

describe('createHotRouteTrigger', () => {
  it('creates a trigger with generated id', () => {
    const adjustment: PlayerAssignment[] = [
      { playerId: 'wr1', route: { id: 'r1', name: 'slant', type: 'slant', points: [] } },
    ];

    const trigger = createHotRouteTrigger('Quick Slant', 'blitz', adjustment);
    expect(trigger.id).toBeTruthy();
    expect(trigger.name).toBe('Quick Slant');
    expect(trigger.defensiveKey).toBe('blitz');
    expect(trigger.adjustment).toHaveLength(1);
  });

  it('creates unique ids for different triggers', () => {
    const t1 = createHotRouteTrigger('T1', 'blitz', []);
    const t2 = createHotRouteTrigger('T2', 'man-coverage', []);
    expect(t1.id).not.toBe(t2.id);
  });
});
