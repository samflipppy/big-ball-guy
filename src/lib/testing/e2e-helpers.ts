// ============================================================
// #340 — E2E Test Helpers
// Utility functions for creating realistic test data
// ============================================================

import type {
  Play,
  Formation,
  GamePlan,
  Team,
  PlayId,
  FormationId,
  GamePlanId,
  TeamId,
  Player,
  PlayerAssignment,
  GamePlanSection,
  FieldSide,
} from '@/types';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_test_${idCounter}_${Date.now()}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

// ---------------------------------------------------------------------------
// Default players
// ---------------------------------------------------------------------------

function defaultOffensivePlayers(): Player[] {
  const positions: { pos: Player['position']; x: number; y: number }[] = [
    { pos: 'QB', x: 50, y: 35 },
    { pos: 'RB', x: 50, y: 30 },
    { pos: 'WR', x: 10, y: 40 },
    { pos: 'WR', x: 90, y: 40 },
    { pos: 'TE', x: 70, y: 40 },
    { pos: 'LT', x: 35, y: 40 },
    { pos: 'LG', x: 40, y: 40 },
    { pos: 'C', x: 50, y: 40 },
    { pos: 'RG', x: 60, y: 40 },
    { pos: 'RT', x: 65, y: 40 },
    { pos: 'FB', x: 50, y: 32 },
  ];

  return positions.map((p, i) => ({
    id: `player_off_${i}`,
    position: p.pos,
    label: p.pos,
    location: { x: p.x, y: p.y },
    side: 'offense' as FieldSide,
  }));
}

// ---------------------------------------------------------------------------
// Play names for realistic data
// ---------------------------------------------------------------------------

const PLAY_NAMES = [
  'Power Right', 'Sweep Left', 'Counter Trey', 'Inside Zone',
  'Outside Zone', 'Iso Strong', 'HB Dive', 'PA Boot',
  'Mesh Concept', 'Four Verticals', 'Smash', 'Curl Flat',
  'Stick', 'Hank', 'Y Cross', 'Dagger',
  'Double Post', 'Levels', 'Sail', 'Flood Right',
  'Screen Left', 'HB Draw', 'QB Sneak', 'Jet Sweep',
];

const FORMATION_NAMES = [
  'Singleback Ace', 'Shotgun Spread', 'I-Formation Strong',
  'Pistol Trips', 'Empty 5-Wide', 'Singleback Twins',
  'Shotgun Doubles', 'Goal Line Heavy', 'Wildcat',
  'Jumbo Package',
];

const PERSONNEL_GROUPS = ['10', '11', '12', '20', '21', '22', '13'];

const CATEGORIES = ['run', 'pass', 'screen', 'play-action', 'trick'];

const OPPONENTS = [
  'Northside Titans', 'Central Hawks', 'Eastside Panthers',
  'Westfield Bears', 'Southridge Wolves', 'Valley Falcons',
];

// ---------------------------------------------------------------------------
// Factory: createTestPlay
// ---------------------------------------------------------------------------

export function createTestPlay(overrides?: Partial<Play>): Play {
  const id = overrides?.id ?? generateId('play');
  const now = new Date().toISOString();

  return {
    id,
    name: PLAY_NAMES[Math.floor(Math.random() * PLAY_NAMES.length)],
    formationId: generateId('formation'),
    assignments: [] as PlayerAssignment[],
    tags: ['test'],
    personnel: '11',
    category: 'run',
    teamId: 'team_default',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: createTestFormation
// ---------------------------------------------------------------------------

export function createTestFormation(overrides?: Partial<Formation>): Formation {
  const id = overrides?.id ?? generateId('formation');
  const now = new Date().toISOString();

  return {
    id,
    name: FORMATION_NAMES[Math.floor(Math.random() * FORMATION_NAMES.length)],
    side: 'offense',
    players: defaultOffensivePlayers(),
    personnel: '11',
    tags: ['test'],
    isCustom: false,
    teamId: 'team_default',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: createTestGamePlan
// ---------------------------------------------------------------------------

export function createTestGamePlan(overrides?: Partial<GamePlan>): GamePlan {
  const id = overrides?.id ?? generateId('gameplan');
  const now = new Date().toISOString();

  const defaultSection: GamePlanSection = {
    id: generateId('section'),
    situation: '1st & 10',
    plays: [],
    order: 0,
  };

  return {
    id,
    name: `Week 1 vs ${OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]}`,
    opponent: OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)],
    week: 1,
    season: '2025',
    sections: [defaultSection],
    teamId: 'team_default',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: createTestTeam
// ---------------------------------------------------------------------------

export function createTestTeam(overrides?: Partial<Team>): Team {
  const id = overrides?.id ?? generateId('team');
  const now = new Date().toISOString();

  return {
    id,
    name: 'Test Eagles',
    school: 'Test High School',
    level: 'high_school',
    primaryColor: '#003366',
    secondaryColor: '#FFD700',
    createdAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// seedTestData — generates N plays with realistic, varied data
// ---------------------------------------------------------------------------

const testDataStore: { plays: Play[]; formations: Formation[] } = {
  plays: [],
  formations: [],
};

export function seedTestData(count: number): {
  plays: Play[];
  formations: Formation[];
} {
  const formations: Formation[] = [];
  const plays: Play[] = [];

  // Create a few formations to share among plays
  const formationCount = Math.max(1, Math.ceil(count / 3));
  for (let i = 0; i < formationCount; i++) {
    formations.push(
      createTestFormation({
        name: FORMATION_NAMES[i % FORMATION_NAMES.length],
        personnel: PERSONNEL_GROUPS[i % PERSONNEL_GROUPS.length],
        tags: ['test', `seed-${i}`],
      }),
    );
  }

  for (let i = 0; i < count; i++) {
    const formation = formations[i % formations.length];
    plays.push(
      createTestPlay({
        name: PLAY_NAMES[i % PLAY_NAMES.length],
        formationId: formation.id,
        personnel: formation.personnel,
        category: CATEGORIES[i % CATEGORIES.length],
        tags: ['test', `seed-${i}`],
        hash: (['left', 'middle', 'right'] as const)[i % 3],
      }),
    );
  }

  testDataStore.plays.push(...plays);
  testDataStore.formations.push(...formations);

  return { plays, formations };
}

// ---------------------------------------------------------------------------
// cleanupTestData — clears the internal test data store
// ---------------------------------------------------------------------------

export function cleanupTestData(): void {
  testDataStore.plays.length = 0;
  testDataStore.formations.length = 0;
  resetIdCounter();
}

// ---------------------------------------------------------------------------
// Accessor for inspecting stored test data
// ---------------------------------------------------------------------------

export function getTestDataStore(): Readonly<typeof testDataStore> {
  return testDataStore;
}
