import { describe, it, expect } from 'vitest';
import {
  getFieldZone,
  findUnblockedDefenders,
  analyzeNumbersByZone,
  analyzePlayDefense,
  type ScoutingAlert,
} from '@/lib/scouting-alerts';
import type { Play, Player, DefensiveOverlay } from '@/types';

// ============================================================
// Helpers
// ============================================================

function makePlayer(id: string, position: string, x: number, y: number, side: 'offense' | 'defense' = 'defense'): Player {
  return {
    id,
    position: position as Player['position'],
    label: id.toUpperCase(),
    location: { x, y },
    side,
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

function makeDefense(players: Player[], overrides: Partial<DefensiveOverlay> = {}): DefensiveOverlay {
  return {
    front: '4-3 Over',
    coverage: 'Cover 2',
    players,
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe('getFieldZone', () => {
  it('returns "left" for x in the left third (0-266)', () => {
    expect(getFieldZone(0)).toBe('left');
    expect(getFieldZone(100)).toBe('left');
    expect(getFieldZone(265)).toBe('left');
  });

  it('returns "middle" for x in the middle third (267-533)', () => {
    expect(getFieldZone(300)).toBe('middle');
    expect(getFieldZone(400)).toBe('middle');
    expect(getFieldZone(530)).toBe('middle');
  });

  it('returns "right" for x in the right third (534-800)', () => {
    expect(getFieldZone(600)).toBe('right');
    expect(getFieldZone(700)).toBe('right');
    expect(getFieldZone(800)).toBe('right');
  });
});

describe('findUnblockedDefenders', () => {
  it('returns unblocked alerts for defensive linemen and LBs with no blocking assignment', () => {
    const defenders = [
      makePlayer('de1', 'DE', 300, 225),
      makePlayer('dt1', 'DT', 400, 225),
      makePlayer('mlb', 'MLB', 400, 190),
    ];
    const play = makePlay({ assignments: [] });
    const defense = makeDefense(defenders);

    const alerts = findUnblockedDefenders(play, defense);
    expect(alerts).toHaveLength(3);
    expect(alerts.every((a) => a.type === 'unblocked')).toBe(true);
  });

  it('does not flag a defender who has a blocker assigned to them', () => {
    const defenders = [
      makePlayer('de1', 'DE', 300, 225),
      makePlayer('dt1', 'DT', 400, 225),
    ];
    const play = makePlay({
      assignments: [
        {
          playerId: 'lt',
          blocking: { id: 'b1', blockerId: 'lt', targetId: 'de1', blockType: 'drive' },
        },
        {
          playerId: 'lg',
          blocking: { id: 'b2', blockerId: 'lg', targetId: 'dt1', blockType: 'drive' },
        },
      ],
    });
    const defense = makeDefense(defenders);

    const alerts = findUnblockedDefenders(play, defense);
    expect(alerts).toHaveLength(0);
  });

  it('does not flag DBs (CB, SS, FS) as unblocked', () => {
    const defenders = [
      makePlayer('cb1', 'CB', 100, 200),
      makePlayer('ss', 'SS', 450, 140),
      makePlayer('fs', 'FS', 350, 120),
    ];
    const play = makePlay({ assignments: [] });
    const defense = makeDefense(defenders);

    const alerts = findUnblockedDefenders(play, defense);
    expect(alerts).toHaveLength(0);
  });

  it('correctly identifies partially blocked fronts', () => {
    const defenders = [
      makePlayer('de1', 'DE', 300, 225),
      makePlayer('dt1', 'DT', 400, 225),
      makePlayer('mlb', 'MLB', 400, 190),
    ];
    const play = makePlay({
      assignments: [
        {
          playerId: 'lt',
          blocking: { id: 'b1', blockerId: 'lt', targetId: 'de1', blockType: 'drive' },
        },
      ],
    });
    const defense = makeDefense(defenders);

    const alerts = findUnblockedDefenders(play, defense);
    expect(alerts).toHaveLength(2);
    const ids = alerts.map((a) => a.playerId);
    expect(ids).toContain('dt1');
    expect(ids).toContain('mlb');
  });

  it('includes the zone in the alert for each unblocked defender', () => {
    const defenders = [
      makePlayer('de1', 'DE', 100, 225), // left zone
      makePlayer('de2', 'DE', 600, 225), // right zone
    ];
    const play = makePlay({ assignments: [] });
    const defense = makeDefense(defenders);

    const alerts = findUnblockedDefenders(play, defense);
    expect(alerts).toHaveLength(2);
    const zones = alerts.map((a) => a.zone);
    expect(zones).toContain('left');
    expect(zones).toContain('right');
  });

  it('includes OLB and ILB as box players that can be unblocked', () => {
    const defenders = [
      makePlayer('wlb', 'OLB', 290, 190),
      makePlayer('ilb1', 'ILB', 370, 190),
    ];
    const play = makePlay({ assignments: [] });
    const defense = makeDefense(defenders);

    const alerts = findUnblockedDefenders(play, defense);
    expect(alerts).toHaveLength(2);
  });
});

describe('analyzeNumbersByZone', () => {
  it('detects numbers advantage when offense outnumbers defense in a zone', () => {
    const offense = [
      makePlayer('wr1', 'WR', 100, 250, 'offense'),
      makePlayer('wr2', 'WR', 150, 250, 'offense'),
      makePlayer('wr3', 'WR', 200, 250, 'offense'),
    ];
    const defense = [
      makePlayer('cb1', 'CB', 100, 200),
    ];

    const alerts = analyzeNumbersByZone(offense, defense);
    const leftAdvantage = alerts.find((a) => a.zone === 'left' && a.type === 'numbers-advantage');
    expect(leftAdvantage).toBeDefined();
    expect(leftAdvantage!.message).toContain('3 vs 1');
  });

  it('detects numbers disadvantage when defense outnumbers offense in a zone', () => {
    const offense = [
      makePlayer('wr1', 'WR', 400, 250, 'offense'),
    ];
    const defense = [
      makePlayer('mlb', 'MLB', 400, 190),
      makePlayer('dt1', 'DT', 350, 225),
      makePlayer('dt2', 'DT', 450, 225),
    ];

    const alerts = analyzeNumbersByZone(offense, defense);
    const middleDisadvantage = alerts.find(
      (a) => a.zone === 'middle' && a.type === 'numbers-disadvantage',
    );
    expect(middleDisadvantage).toBeDefined();
  });

  it('returns no alert for a zone where counts are equal', () => {
    const offense = [
      makePlayer('wr1', 'WR', 400, 250, 'offense'),
    ];
    const defense = [
      makePlayer('mlb', 'MLB', 400, 190),
    ];

    const alerts = analyzeNumbersByZone(offense, defense);
    const middleAlerts = alerts.filter((a) => a.zone === 'middle');
    expect(middleAlerts).toHaveLength(0);
  });

  it('analyzes all three zones independently', () => {
    const offense = [
      makePlayer('wr1', 'WR', 100, 250, 'offense'),
      makePlayer('wr2', 'WR', 150, 250, 'offense'),
      makePlayer('qb', 'QB', 400, 280, 'offense'),
      makePlayer('rb', 'RB', 420, 330, 'offense'),
    ];
    const defense = [
      makePlayer('cb1', 'CB', 100, 200),
      makePlayer('mlb', 'MLB', 400, 190),
      makePlayer('dt1', 'DT', 380, 225),
      makePlayer('de2', 'DE', 600, 225),
    ];

    const alerts = analyzeNumbersByZone(offense, defense);
    // left: 2 off, 1 def => advantage
    expect(alerts.some((a) => a.zone === 'left' && a.type === 'numbers-advantage')).toBe(true);
    // right: 0 off, 1 def => disadvantage
    expect(alerts.some((a) => a.zone === 'right' && a.type === 'numbers-disadvantage')).toBe(true);
  });
});

describe('analyzePlayDefense', () => {
  it('combines unblocked defender alerts and numbers analysis', () => {
    const offensePlayers = [
      makePlayer('qb', 'QB', 400, 280, 'offense'),
      makePlayer('rb', 'RB', 400, 330, 'offense'),
    ];
    const defenders = [
      makePlayer('de1', 'DE', 300, 225),
      makePlayer('dt1', 'DT', 400, 225),
      makePlayer('mlb', 'MLB', 400, 190),
    ];
    const play = makePlay({ assignments: [] });
    const defense = makeDefense(defenders);

    const alerts = analyzePlayDefense(play, defense, offensePlayers);
    const unblockedAlerts = alerts.filter((a) => a.type === 'unblocked');
    const numbersAlerts = alerts.filter(
      (a) => a.type === 'numbers-advantage' || a.type === 'numbers-disadvantage',
    );

    expect(unblockedAlerts.length).toBeGreaterThan(0);
    expect(numbersAlerts.length).toBeGreaterThan(0);
  });

  it('returns empty array when all defenders are blocked and numbers are even', () => {
    const offensePlayers = [
      makePlayer('qb', 'QB', 400, 280, 'offense'),
    ];
    const defenders = [
      makePlayer('dt1', 'DT', 400, 225),
    ];
    const play = makePlay({
      assignments: [
        {
          playerId: 'c',
          blocking: { id: 'b1', blockerId: 'c', targetId: 'dt1', blockType: 'drive' },
        },
      ],
    });
    const defense = makeDefense(defenders);

    const alerts = analyzePlayDefense(play, defense, offensePlayers);
    // dt1 is blocked, middle zone is 1 vs 1 (even), left and right both 0 vs 0
    expect(alerts).toHaveLength(0);
  });
});
