import { describe, it, expect } from 'vitest';
import {
  SPORT_CONFIGS,
  getPositionsForSport,
  getFieldDimensions,
  convertPlayBetweenSports,
} from '@/lib/multi-sport';
import type { Sport, SportConfig } from '@/lib/multi-sport';
import type { Play } from '@/types';

// ---- Helpers ----

function makeMinimalPlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Test Play',
    formationId: 'formation-1',
    assignments: [],
    tags: ['football'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---- SPORT_CONFIGS ----

describe('SPORT_CONFIGS', () => {
  it('contains all 5 sports', () => {
    const sports: Sport[] = ['football', 'basketball', 'soccer', 'lacrosse', 'hockey'];
    for (const sport of sports) {
      expect(SPORT_CONFIGS[sport]).toBeDefined();
    }
  });

  it('each config has positive field dimensions', () => {
    for (const config of Object.values(SPORT_CONFIGS)) {
      expect(config.fieldWidth).toBeGreaterThan(0);
      expect(config.fieldHeight).toBeGreaterThan(0);
    }
  });

  it('each config has a valid player count', () => {
    for (const config of Object.values(SPORT_CONFIGS)) {
      expect(config.playerCount).toBeGreaterThan(0);
    }
  });

  it('each config has at least one position', () => {
    for (const config of Object.values(SPORT_CONFIGS)) {
      expect(config.positions.length).toBeGreaterThan(0);
    }
  });

  it('football has 11 players', () => {
    expect(SPORT_CONFIGS.football.playerCount).toBe(11);
  });

  it('basketball has 5 players', () => {
    expect(SPORT_CONFIGS.basketball.playerCount).toBe(5);
  });

  it('hockey has 6 players', () => {
    expect(SPORT_CONFIGS.hockey.playerCount).toBe(6);
  });

  it('hockey has oval field shape', () => {
    expect(SPORT_CONFIGS.hockey.fieldShape).toBe('oval');
  });

  it('football has rectangle field shape', () => {
    expect(SPORT_CONFIGS.football.fieldShape).toBe('rectangle');
  });

  it('each config has fieldColor and lineColor', () => {
    for (const config of Object.values(SPORT_CONFIGS)) {
      expect(config.fieldColor).toBeDefined();
      expect(config.lineColor).toBeDefined();
      expect(config.fieldColor.length).toBeGreaterThan(0);
      expect(config.lineColor.length).toBeGreaterThan(0);
    }
  });
});

// ---- getPositionsForSport ----

describe('getPositionsForSport()', () => {
  it('returns football positions including QB', () => {
    const positions = getPositionsForSport('football');
    expect(positions).toContain('QB');
    expect(positions).toContain('WR');
    expect(positions).toContain('CB');
  });

  it('returns basketball positions', () => {
    const positions = getPositionsForSport('basketball');
    expect(positions).toContain('PG');
    expect(positions).toContain('SG');
    expect(positions).toContain('C');
  });

  it('returns soccer positions including GK', () => {
    const positions = getPositionsForSport('soccer');
    expect(positions).toContain('GK');
    expect(positions).toContain('ST');
  });

  it('returns lacrosse positions', () => {
    const positions = getPositionsForSport('lacrosse');
    expect(positions).toContain('G');
    expect(positions).toContain('A1');
  });

  it('returns hockey positions', () => {
    const positions = getPositionsForSport('hockey');
    expect(positions).toContain('C');
    expect(positions).toContain('G');
    expect(positions).toContain('LW');
  });

  it('returns a copy (not the original array)', () => {
    const positions1 = getPositionsForSport('football');
    const positions2 = getPositionsForSport('football');
    expect(positions1).not.toBe(positions2);
    expect(positions1).toEqual(positions2);
  });
});

// ---- getFieldDimensions ----

describe('getFieldDimensions()', () => {
  it('returns football field dimensions', () => {
    const dims = getFieldDimensions('football');
    expect(dims.width).toBe(800);
    expect(dims.height).toBe(500);
  });

  it('returns basketball court dimensions', () => {
    const dims = getFieldDimensions('basketball');
    expect(dims.width).toBe(564);
    expect(dims.height).toBe(300);
  });

  it('returns soccer field dimensions', () => {
    const dims = getFieldDimensions('soccer');
    expect(dims.width).toBe(700);
    expect(dims.height).toBe(450);
  });

  it('returns lacrosse field dimensions', () => {
    const dims = getFieldDimensions('lacrosse');
    expect(dims.width).toBeGreaterThan(0);
    expect(dims.height).toBeGreaterThan(0);
  });

  it('returns hockey rink dimensions', () => {
    const dims = getFieldDimensions('hockey');
    expect(dims.width).toBeGreaterThan(0);
    expect(dims.height).toBeGreaterThan(0);
  });
});

// ---- convertPlayBetweenSports ----

describe('convertPlayBetweenSports()', () => {
  it('converts football to basketball with scaled coordinates', () => {
    const play = makeMinimalPlay({
      assignments: [
        {
          playerId: 'p1',
          route: {
            id: 'r1',
            name: 'streak',
            type: 'streak',
            points: [
              { x: 400, y: 250, type: 'line' },
              { x: 400, y: 100, type: 'line' },
            ],
          },
        },
      ],
    });

    const converted = convertPlayBetweenSports(play, 'football', 'basketball');
    // Basketball is 564x300 vs Football 800x500
    const scaleX = 564 / 800;
    const scaleY = 300 / 500;
    const route = converted.assignments[0].route!;
    expect(route.points[0].x).toBeCloseTo(400 * scaleX, 1);
    expect(route.points[0].y).toBeCloseTo(250 * scaleY, 1);
  });

  it('adds toSport tag and "converted" tag', () => {
    const play = makeMinimalPlay({ tags: ['run', 'football'] });
    const converted = convertPlayBetweenSports(play, 'football', 'soccer');
    expect(converted.tags).toContain('soccer');
    expect(converted.tags).toContain('converted');
  });

  it('removes fromSport tag', () => {
    const play = makeMinimalPlay({ tags: ['football', 'pass'] });
    const converted = convertPlayBetweenSports(play, 'football', 'basketball');
    expect(converted.tags).not.toContain('football');
    expect(converted.tags).toContain('pass');
  });

  it('preserves play identity fields', () => {
    const play = makeMinimalPlay({ id: 'my-play', name: 'Sweep Right' });
    const converted = convertPlayBetweenSports(play, 'football', 'soccer');
    expect(converted.id).toBe('my-play');
    expect(converted.name).toBe('Sweep Right');
  });

  it('same-sport conversion preserves coordinates', () => {
    const play = makeMinimalPlay({
      assignments: [
        {
          playerId: 'p1',
          route: {
            id: 'r1',
            name: 'out',
            type: 'out',
            points: [{ x: 200, y: 150, type: 'line' }],
          },
        },
      ],
    });
    const converted = convertPlayBetweenSports(play, 'football', 'football');
    expect(converted.assignments[0].route!.points[0].x).toBeCloseTo(200, 1);
    expect(converted.assignments[0].route!.points[0].y).toBeCloseTo(150, 1);
  });

  it('scales defensive overlay player positions', () => {
    const play = makeMinimalPlay({
      defensiveOverlay: {
        front: '4-3',
        coverage: 'Cover 2',
        players: [
          { id: 'd1', position: 'MLB', label: 'M', location: { x: 400, y: 200 }, side: 'defense' },
        ],
      },
    });
    const converted = convertPlayBetweenSports(play, 'football', 'basketball');
    const scaleX = 564 / 800;
    const scaleY = 300 / 500;
    expect(converted.defensiveOverlay!.players[0].location.x).toBeCloseTo(400 * scaleX, 1);
    expect(converted.defensiveOverlay!.players[0].location.y).toBeCloseTo(200 * scaleY, 1);
  });

  it('scales motion paths', () => {
    const play = makeMinimalPlay({
      assignments: [
        {
          playerId: 'p1',
          motion: {
            startPosition: { x: 100, y: 200 },
            endPosition: { x: 300, y: 200 },
            timing: 'pre-snap',
          },
        },
      ],
    });
    const converted = convertPlayBetweenSports(play, 'football', 'soccer');
    const scaleX = 700 / 800;
    expect(converted.assignments[0].motion!.startPosition.x).toBeCloseTo(100 * scaleX, 1);
    expect(converted.assignments[0].motion!.endPosition.x).toBeCloseTo(300 * scaleX, 1);
  });

  it('updates the updatedAt timestamp', () => {
    const play = makeMinimalPlay({ updatedAt: '2020-01-01T00:00:00.000Z' });
    const converted = convertPlayBetweenSports(play, 'football', 'basketball');
    expect(new Date(converted.updatedAt).getTime()).toBeGreaterThan(
      new Date('2020-01-01T00:00:00.000Z').getTime(),
    );
  });

  it('appends conversion note', () => {
    const play = makeMinimalPlay({ notes: 'Original notes.' });
    const converted = convertPlayBetweenSports(play, 'football', 'soccer');
    expect(converted.notes).toContain('Original notes.');
    expect(converted.notes).toContain('Converted from football to soccer.');
  });
});
