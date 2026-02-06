import { describe, it, expect } from 'vitest';
import {
  mirrorPlay,
  mirrorFormation,
  mirrorRoute,
  rotatePlay,
  duplicatePlay,
} from '@/lib/play-transforms';
import type { Play, Formation, Route, Player, PlayerAssignment } from '@/types';

// ---- Helpers ----

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'qb1',
    position: 'QB',
    label: 'QB',
    location: { x: 400, y: 280 },
    side: 'offense',
    ...overrides,
  };
}

function makeFormation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: 'form-1',
    name: 'Singleback',
    side: 'offense',
    players: [
      makePlayer({ id: 'qb1', location: { x: 400, y: 280 } }),
      makePlayer({ id: 'wr1', position: 'WR', label: 'X', location: { x: 100, y: 248 } }),
      makePlayer({ id: 'wr2', position: 'WR', label: 'Z', location: { x: 700, y: 248 } }),
    ],
    personnel: '11',
    tags: ['base'],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-1',
    name: 'Streak',
    type: 'streak',
    points: [
      { x: 100, y: 248, type: 'line' },
      { x: 100, y: 150, type: 'line' },
      { x: 100, y: 50, type: 'line' },
    ],
    ...overrides,
  };
}

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Four Verticals',
    formationId: 'form-1',
    assignments: [],
    tags: ['pass', 'vertical'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const FIELD_WIDTH = 800;

// ---- mirrorRoute ----

describe('mirrorRoute()', () => {
  it('flips all route points horizontally around the field center', () => {
    const route = makeRoute({
      points: [
        { x: 100, y: 248, type: 'line' },
        { x: 200, y: 150, type: 'curve' },
        { x: 150, y: 50, type: 'break' },
      ],
    });
    const mirrored = mirrorRoute(route, FIELD_WIDTH);

    expect(mirrored.points[0].x).toBe(700); // 800 - 100
    expect(mirrored.points[1].x).toBe(600); // 800 - 200
    expect(mirrored.points[2].x).toBe(650); // 800 - 150
  });

  it('preserves y coordinates', () => {
    const route = makeRoute();
    const mirrored = mirrorRoute(route, FIELD_WIDTH);

    for (let i = 0; i < route.points.length; i++) {
      expect(mirrored.points[i].y).toBe(route.points[i].y);
    }
  });

  it('preserves point types', () => {
    const route = makeRoute({
      points: [
        { x: 100, y: 248, type: 'line' },
        { x: 200, y: 150, type: 'curve' },
        { x: 300, y: 50, type: 'break' },
      ],
    });
    const mirrored = mirrorRoute(route, FIELD_WIDTH);

    expect(mirrored.points[0].type).toBe('line');
    expect(mirrored.points[1].type).toBe('curve');
    expect(mirrored.points[2].type).toBe('break');
  });

  it('generates a new route id', () => {
    const route = makeRoute();
    const mirrored = mirrorRoute(route, FIELD_WIDTH);
    expect(mirrored.id).not.toBe(route.id);
  });

  it('preserves route name and type', () => {
    const route = makeRoute({ name: 'Post Route', type: 'post' });
    const mirrored = mirrorRoute(route, FIELD_WIDTH);
    expect(mirrored.name).toBe('Post Route');
    expect(mirrored.type).toBe('post');
  });

  it('handles route at the center (x = fieldWidth / 2)', () => {
    const route = makeRoute({
      points: [{ x: 400, y: 200, type: 'line' }],
    });
    const mirrored = mirrorRoute(route, FIELD_WIDTH);
    expect(mirrored.points[0].x).toBe(400); // center stays at center
  });

  it('handles empty points array', () => {
    const route = makeRoute({ points: [] });
    const mirrored = mirrorRoute(route, FIELD_WIDTH);
    expect(mirrored.points).toEqual([]);
  });
});

// ---- mirrorFormation ----

describe('mirrorFormation()', () => {
  it('flips all player x-positions', () => {
    const formation = makeFormation();
    const mirrored = mirrorFormation(formation, FIELD_WIDTH);

    // QB at x=400 stays at 400 (center)
    const qb = mirrored.players.find((p) => p.id === 'qb1');
    expect(qb?.location.x).toBe(400);

    // WR X at x=100 moves to 700
    const wrX = mirrored.players.find((p) => p.id === 'wr1');
    expect(wrX?.location.x).toBe(700);

    // WR Z at x=700 moves to 100
    const wrZ = mirrored.players.find((p) => p.id === 'wr2');
    expect(wrZ?.location.x).toBe(100);
  });

  it('preserves y-positions', () => {
    const formation = makeFormation();
    const mirrored = mirrorFormation(formation, FIELD_WIDTH);

    for (const player of formation.players) {
      const mirroredPlayer = mirrored.players.find((p) => p.id === player.id);
      expect(mirroredPlayer?.location.y).toBe(player.location.y);
    }
  });

  it('generates a new formation id', () => {
    const formation = makeFormation();
    const mirrored = mirrorFormation(formation, FIELD_WIDTH);
    expect(mirrored.id).not.toBe(formation.id);
  });

  it('appends (Mirrored) to the name', () => {
    const formation = makeFormation({ name: 'Shotgun' });
    const mirrored = mirrorFormation(formation, FIELD_WIDTH);
    expect(mirrored.name).toBe('Shotgun (Mirrored)');
  });

  it('preserves player count', () => {
    const formation = makeFormation();
    const mirrored = mirrorFormation(formation, FIELD_WIDTH);
    expect(mirrored.players.length).toBe(formation.players.length);
  });

  it('preserves other formation properties', () => {
    const formation = makeFormation({ personnel: '12', tags: ['spread'] });
    const mirrored = mirrorFormation(formation, FIELD_WIDTH);
    expect(mirrored.personnel).toBe('12');
    expect(mirrored.tags).toEqual(['spread']);
    expect(mirrored.side).toBe('offense');
  });
});

// ---- mirrorPlay ----

describe('mirrorPlay()', () => {
  it('flips player positions in the formation', () => {
    const formation = makeFormation();
    const play = makePlay();
    const result = mirrorPlay(play, formation, FIELD_WIDTH);

    const wrX = result.formation.players.find((p) => p.id === 'wr1');
    expect(wrX?.location.x).toBe(700);
  });

  it('flips route points in assignments', () => {
    const formation = makeFormation();
    const route = makeRoute({
      points: [
        { x: 100, y: 248, type: 'line' },
        { x: 80, y: 150, type: 'break' },
        { x: 50, y: 50, type: 'line' },
      ],
    });
    const play = makePlay({
      assignments: [
        { playerId: 'wr1', route },
      ],
    });

    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    const mirroredAssignment = result.play.assignments[0];

    expect(mirroredAssignment.route?.points[0].x).toBe(700);
    expect(mirroredAssignment.route?.points[1].x).toBe(720);
    expect(mirroredAssignment.route?.points[2].x).toBe(750);
  });

  it('flips blocking direction angles', () => {
    const formation = makeFormation();
    const play = makePlay({
      assignments: [
        {
          playerId: 'qb1',
          blocking: {
            id: 'block-1',
            blockerId: 'qb1',
            blockType: 'drive',
            direction: 90, // pointing right
          },
        },
      ],
    });

    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    // 180 - 90 = 90 => 90 degrees (reflecting: 90 right becomes 90 left)
    expect(result.play.assignments[0].blocking?.direction).toBe(90);
  });

  it('flips blocking direction 0 degrees to 180 degrees', () => {
    const formation = makeFormation();
    const play = makePlay({
      assignments: [
        {
          playerId: 'qb1',
          blocking: {
            id: 'block-1',
            blockerId: 'qb1',
            blockType: 'drive',
            direction: 0,
          },
        },
      ],
    });

    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    expect(result.play.assignments[0].blocking?.direction).toBe(180);
  });

  it('flips motion paths', () => {
    const formation = makeFormation();
    const play = makePlay({
      assignments: [
        {
          playerId: 'wr1',
          motion: {
            startPosition: { x: 100, y: 248 },
            endPosition: { x: 300, y: 248 },
            timing: 'pre-snap',
          },
        },
      ],
    });

    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    const motion = result.play.assignments[0].motion;
    expect(motion?.startPosition.x).toBe(700);
    expect(motion?.endPosition.x).toBe(500);
  });

  it('flips defensive overlay players', () => {
    const formation = makeFormation();
    const play = makePlay({
      defensiveOverlay: {
        front: '4-3',
        coverage: 'Cover 2',
        players: [
          makePlayer({ id: 'cb1', position: 'CB', side: 'defense', location: { x: 100, y: 200 } }),
          makePlayer({ id: 'cb2', position: 'CB', side: 'defense', location: { x: 700, y: 200 } }),
        ],
      },
    });

    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    const cb1 = result.play.defensiveOverlay?.players.find((p) => p.id === 'cb1');
    const cb2 = result.play.defensiveOverlay?.players.find((p) => p.id === 'cb2');
    expect(cb1?.location.x).toBe(700);
    expect(cb2?.location.x).toBe(100);
  });

  it('flips hash from left to right', () => {
    const formation = makeFormation();
    const play = makePlay({ hash: 'left' });
    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    expect(result.play.hash).toBe('right');
  });

  it('flips hash from right to left', () => {
    const formation = makeFormation();
    const play = makePlay({ hash: 'right' });
    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    expect(result.play.hash).toBe('left');
  });

  it('keeps hash as middle when middle', () => {
    const formation = makeFormation();
    const play = makePlay({ hash: 'middle' });
    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    expect(result.play.hash).toBe('middle');
  });

  it('generates new IDs for play and formation', () => {
    const formation = makeFormation();
    const play = makePlay();
    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    expect(result.play.id).not.toBe(play.id);
    expect(result.formation.id).not.toBe(formation.id);
  });

  it('appends (Mirrored) to names', () => {
    const formation = makeFormation({ name: 'Pistol' });
    const play = makePlay({ name: 'HB Dive' });
    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    expect(result.play.name).toBe('HB Dive (Mirrored)');
    expect(result.formation.name).toBe('Pistol (Mirrored)');
  });

  it('links mirrored play to mirrored formation', () => {
    const formation = makeFormation();
    const play = makePlay();
    const result = mirrorPlay(play, formation, FIELD_WIDTH);
    expect(result.play.formationId).toBe(result.formation.id);
  });
});

// ---- rotatePlay ----

describe('rotatePlay()', () => {
  it('rotates positions by 180 degrees', () => {
    const formation = makeFormation({
      players: [
        makePlayer({ id: 'p1', location: { x: 400, y: 200 } }),
        makePlayer({ id: 'p2', location: { x: 400, y: 400 } }),
      ],
    });
    const play = makePlay();
    const result = rotatePlay(play, formation, 180);

    // Center = (400, 300). After 180deg rotation, positions swap across center.
    const p1 = result.formation.players.find((p) => p.id === 'p1');
    const p2 = result.formation.players.find((p) => p.id === 'p2');
    expect(p1?.location.x).toBeCloseTo(400, 0);
    expect(p1?.location.y).toBeCloseTo(400, 0);
    expect(p2?.location.x).toBeCloseTo(400, 0);
    expect(p2?.location.y).toBeCloseTo(200, 0);
  });

  it('rotates by 90 degrees', () => {
    const formation = makeFormation({
      players: [
        makePlayer({ id: 'p1', location: { x: 500, y: 300 } }),
        makePlayer({ id: 'p2', location: { x: 300, y: 300 } }),
      ],
    });
    const play = makePlay();
    const result = rotatePlay(play, formation, 90);

    // Center = (400, 300). p1 at offset (100, 0), rotated 90deg CW = (0, 100)
    const p1 = result.formation.players.find((p) => p.id === 'p1');
    expect(p1?.location.x).toBeCloseTo(400, 0);
    expect(p1?.location.y).toBeCloseTo(400, 0);
  });

  it('rotating by 360 degrees returns approximately original positions', () => {
    const formation = makeFormation();
    const play = makePlay();
    const result = rotatePlay(play, formation, 360);

    for (let i = 0; i < formation.players.length; i++) {
      expect(result.formation.players[i].location.x).toBeCloseTo(
        formation.players[i].location.x,
        5,
      );
      expect(result.formation.players[i].location.y).toBeCloseTo(
        formation.players[i].location.y,
        5,
      );
    }
  });

  it('rotating by 0 degrees preserves positions', () => {
    const formation = makeFormation();
    const play = makePlay();
    const result = rotatePlay(play, formation, 0);

    for (let i = 0; i < formation.players.length; i++) {
      expect(result.formation.players[i].location.x).toBeCloseTo(
        formation.players[i].location.x,
        5,
      );
      expect(result.formation.players[i].location.y).toBeCloseTo(
        formation.players[i].location.y,
        5,
      );
    }
  });

  it('rotates route points', () => {
    const formation = makeFormation({
      players: [
        makePlayer({ id: 'p1', location: { x: 400, y: 300 } }),
      ],
    });
    const play = makePlay({
      assignments: [
        {
          playerId: 'p1',
          route: makeRoute({
            points: [{ x: 500, y: 300, type: 'line' }],
          }),
        },
      ],
    });

    const result = rotatePlay(play, formation, 180);
    // Center is (400, 300). Point at (500, 300) offset is (100, 0).
    // Rotated 180 -> offset (-100, 0) -> absolute (300, 300)
    expect(result.play.assignments[0].route?.points[0].x).toBeCloseTo(300, 0);
    expect(result.play.assignments[0].route?.points[0].y).toBeCloseTo(300, 0);
  });

  it('rotates motion paths', () => {
    const formation = makeFormation({
      players: [
        makePlayer({ id: 'p1', location: { x: 400, y: 300 } }),
      ],
    });
    const play = makePlay({
      assignments: [
        {
          playerId: 'p1',
          motion: {
            startPosition: { x: 400, y: 200 },
            endPosition: { x: 400, y: 400 },
            timing: 'pre-snap',
          },
        },
      ],
    });

    const result = rotatePlay(play, formation, 180);
    expect(result.play.assignments[0].motion?.startPosition.y).toBeCloseTo(400, 0);
    expect(result.play.assignments[0].motion?.endPosition.y).toBeCloseTo(200, 0);
  });

  it('adjusts blocking direction angles', () => {
    const formation = makeFormation({
      players: [makePlayer({ id: 'p1', location: { x: 400, y: 300 } })],
    });
    const play = makePlay({
      assignments: [
        {
          playerId: 'p1',
          blocking: {
            id: 'block-1',
            blockerId: 'p1',
            blockType: 'drive',
            direction: 90,
          },
        },
      ],
    });

    const result = rotatePlay(play, formation, 45);
    expect(result.play.assignments[0].blocking?.direction).toBe(135); // 90 + 45
  });

  it('handles empty formation gracefully', () => {
    const formation = makeFormation({ players: [] });
    const play = makePlay();
    const result = rotatePlay(play, formation, 90);
    expect(result.formation.players).toEqual([]);
  });

  it('rotates defensive overlay players', () => {
    const formation = makeFormation({
      players: [
        makePlayer({ id: 'p1', location: { x: 400, y: 200 } }),
      ],
    });
    const play = makePlay({
      defensiveOverlay: {
        front: '4-3',
        coverage: 'Cover 2',
        players: [
          makePlayer({ id: 'd1', position: 'CB', side: 'defense', location: { x: 400, y: 400 } }),
        ],
      },
    });

    const result = rotatePlay(play, formation, 180);
    // Center is (400, 300). d1 at (400, 400) offset (0, 100), rotated 180 -> (0, -100) -> (400, 200)
    const d1 = result.play.defensiveOverlay?.players.find((p) => p.id === 'd1');
    expect(d1?.location.x).toBeCloseTo(400, 0);
    expect(d1?.location.y).toBeCloseTo(200, 0);
  });
});

// ---- duplicatePlay ----

describe('duplicatePlay()', () => {
  it('generates a new play id', () => {
    const play = makePlay();
    const copy = duplicatePlay(play);
    expect(copy.id).not.toBe(play.id);
  });

  it('appends (Copy) to the name', () => {
    const play = makePlay({ name: 'HB Counter' });
    const copy = duplicatePlay(play);
    expect(copy.name).toBe('HB Counter (Copy)');
  });

  it('deep clones route points', () => {
    const route = makeRoute();
    const play = makePlay({
      assignments: [{ playerId: 'wr1', route }],
    });

    const copy = duplicatePlay(play);
    // Modify original route point
    route.points[0].x = 9999;

    // Copy should be unchanged
    expect(copy.assignments[0].route?.points[0].x).not.toBe(9999);
  });

  it('generates new ids for routes', () => {
    const route = makeRoute();
    const play = makePlay({
      assignments: [{ playerId: 'wr1', route }],
    });

    const copy = duplicatePlay(play);
    expect(copy.assignments[0].route?.id).not.toBe(route.id);
  });

  it('generates new ids for blocking assignments', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'lt1',
          blocking: {
            id: 'block-1',
            blockerId: 'lt1',
            blockType: 'drive',
          },
        },
      ],
    });

    const copy = duplicatePlay(play);
    expect(copy.assignments[0].blocking?.id).not.toBe('block-1');
  });

  it('deep clones tags array', () => {
    const play = makePlay({ tags: ['run', 'power'] });
    const copy = duplicatePlay(play);

    play.tags.push('modified');
    expect(copy.tags).toEqual(['run', 'power']);
  });

  it('deep clones motion paths', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'wr1',
          motion: {
            startPosition: { x: 100, y: 200 },
            endPosition: { x: 300, y: 200 },
            timing: 'pre-snap',
          },
        },
      ],
    });

    const copy = duplicatePlay(play);

    // Modify original
    play.assignments[0].motion!.startPosition.x = 9999;
    expect(copy.assignments[0].motion?.startPosition.x).toBe(100);
  });

  it('deep clones defensive overlay players', () => {
    const play = makePlay({
      defensiveOverlay: {
        front: '4-3',
        coverage: 'Cover 2',
        players: [
          makePlayer({ id: 'cb1', position: 'CB', side: 'defense', location: { x: 100, y: 200 } }),
        ],
      },
    });

    const copy = duplicatePlay(play);

    // Modify original
    play.defensiveOverlay!.players[0].location.x = 9999;
    expect(copy.defensiveOverlay?.players[0].location.x).toBe(100);
  });

  it('preserves all other play properties', () => {
    const play = makePlay({
      formationId: 'form-42',
      conceptId: 'concept-1',
      personnel: '12',
      hash: 'left',
      category: 'run',
      notes: 'test notes',
      teamId: 'team-7',
    });

    const copy = duplicatePlay(play);
    expect(copy.formationId).toBe('form-42');
    expect(copy.conceptId).toBe('concept-1');
    expect(copy.personnel).toBe('12');
    expect(copy.hash).toBe('left');
    expect(copy.category).toBe('run');
    expect(copy.notes).toBe('test notes');
    expect(copy.teamId).toBe('team-7');
  });

  it('sets new timestamps', () => {
    const play = makePlay({
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    });

    const copy = duplicatePlay(play);
    expect(copy.createdAt).not.toBe('2020-01-01T00:00:00Z');
    expect(copy.updatedAt).not.toBe('2020-01-01T00:00:00Z');
  });

  it('handles play with no assignments', () => {
    const play = makePlay({ assignments: [] });
    const copy = duplicatePlay(play);
    expect(copy.assignments).toEqual([]);
  });

  it('handles play with no defensive overlay', () => {
    const play = makePlay({ defensiveOverlay: undefined });
    const copy = duplicatePlay(play);
    expect(copy.defensiveOverlay).toBeUndefined();
  });
});
