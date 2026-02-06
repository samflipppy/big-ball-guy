import type { Concept, Formation, PlayerAssignment, Route, OffensivePosition } from '@/types';

// Helper to create a route with standard points for a given route type
function makeRoute(
  id: string,
  name: string,
  type: Route['type'],
  points: Route['points'],
): Route {
  return { id, name, type, points };
}

// ---- Built-in pass concepts ----

export const BUILT_IN_CONCEPTS: Concept[] = [
  {
    id: 'concept-mesh',
    name: 'Mesh',
    description: 'Two receivers run shallow crossing routes in opposite directions, creating a natural rub/pick.',
    routes: [
      { position: 'WR', route: makeRoute('mesh-x', 'X Drag', 'drag', [{ x: 0, y: 0, type: 'line' }, { x: 5, y: -2, type: 'break' }, { x: 40, y: -5, type: 'line' }]) },
      { position: 'TE', route: makeRoute('mesh-y', 'Y Cross', 'cross', [{ x: 0, y: 0, type: 'line' }, { x: -5, y: -2, type: 'break' }, { x: -40, y: -5, type: 'line' }]) },
      { position: 'RB', route: makeRoute('mesh-rb', 'RB Flat', 'flat', [{ x: 0, y: 0, type: 'line' }, { x: 20, y: 2, type: 'line' }]) },
    ],
    tags: ['quick game', 'crossing', 'man-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-smash',
    name: 'Smash',
    description: 'Outside receiver runs a hitch while inside receiver runs a corner route — attacks Cover 2.',
    routes: [
      { position: 'WR', route: makeRoute('smash-x', 'X Hitch', 'hitch', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -10, type: 'break' }, { x: -2, y: -8, type: 'line' }]) },
      { position: 'TE', route: makeRoute('smash-y', 'Y Corner', 'corner', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -8, type: 'break' }, { x: 15, y: -20, type: 'line' }]) },
    ],
    tags: ['deep', 'cover-2-beater', 'two-man'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-flood',
    name: 'Flood',
    description: 'Three receivers flood one side at three different levels — flat, intermediate, deep.',
    routes: [
      { position: 'RB', route: makeRoute('flood-rb', 'RB Flat', 'flat', [{ x: 0, y: 0, type: 'line' }, { x: 25, y: 2, type: 'line' }]) },
      { position: 'TE', route: makeRoute('flood-te', 'TE Out', 'out', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -10, type: 'break' }, { x: 15, y: -10, type: 'line' }]) },
      { position: 'WR', route: makeRoute('flood-z', 'Z Streak', 'streak', [{ x: 0, y: 0, type: 'line' }, { x: 3, y: -25, type: 'line' }]) },
    ],
    tags: ['deep', 'cover-3-beater', 'three-level'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-y-cross',
    name: 'Y-Cross',
    description: 'TE runs a deep cross over the middle, typically with a post and a dig clearing space.',
    routes: [
      { position: 'TE', route: makeRoute('ycross-y', 'Y Deep Cross', 'cross', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -12, type: 'break' }, { x: -35, y: -14, type: 'line' }]) },
      { position: 'WR', route: makeRoute('ycross-x', 'X Post', 'post', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -12, type: 'break' }, { x: 10, y: -25, type: 'line' }]) },
      { position: 'RB', route: makeRoute('ycross-rb', 'RB Check', 'flat', [{ x: 0, y: 0, type: 'line' }, { x: -15, y: 2, type: 'line' }]) },
    ],
    tags: ['deep', 'play-action', 'crossing'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-drive',
    name: 'Drive',
    description: 'Two receivers run in-breaking routes at different depths, creating a high-low read over the middle.',
    routes: [
      { position: 'WR', route: makeRoute('drive-z', 'Z Deep In', 'in', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -14, type: 'break' }, { x: -20, y: -14, type: 'line' }]) },
      { position: 'TE', route: makeRoute('drive-y', 'Y Shallow Cross', 'drag', [{ x: 0, y: 0, type: 'line' }, { x: -3, y: -3, type: 'break' }, { x: -30, y: -5, type: 'line' }]) },
    ],
    tags: ['quick game', 'crossing', 'zone-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-sail',
    name: 'Sail',
    description: 'Vertical stretch with a corner route, a flat route, and a deep out — attacks Cover 3.',
    routes: [
      { position: 'WR', route: makeRoute('sail-z', 'Z Corner', 'corner', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -12, type: 'break' }, { x: 15, y: -22, type: 'line' }]) },
      { position: 'TE', route: makeRoute('sail-y', 'Y Out', 'out', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -8, type: 'break' }, { x: 15, y: -8, type: 'line' }]) },
      { position: 'RB', route: makeRoute('sail-rb', 'RB Flat', 'flat', [{ x: 0, y: 0, type: 'line' }, { x: 20, y: 2, type: 'line' }]) },
    ],
    tags: ['deep', 'cover-3-beater', 'three-level'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-levels',
    name: 'Levels',
    description: 'Two in-breaking routes at different depths (5 and 12 yards) to create a horizontal stretch.',
    routes: [
      { position: 'WR', route: makeRoute('levels-x', 'X Shallow In', 'in', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -5, type: 'break' }, { x: 20, y: -5, type: 'line' }]) },
      { position: 'TE', route: makeRoute('levels-y', 'Y Deep In', 'dig', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -12, type: 'break' }, { x: -20, y: -12, type: 'line' }]) },
    ],
    tags: ['quick game', 'crossing', 'zone-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-four-verts',
    name: 'Four Verticals',
    description: 'All four eligible receivers run vertical/seam routes to stress the deep coverage.',
    routes: [
      { position: 'WR', route: makeRoute('4verts-x', 'X Streak', 'streak', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -30, type: 'line' }]) },
      { position: 'TE', route: makeRoute('4verts-y', 'Y Seam', 'seam', [{ x: 0, y: 0, type: 'line' }, { x: -3, y: -30, type: 'line' }]) },
      { position: 'RB', route: makeRoute('4verts-rb', 'RB Swing', 'swing', [{ x: 0, y: 0, type: 'line' }, { x: 20, y: 0, type: 'curve' }, { x: 25, y: -10, type: 'line' }]) },
    ],
    tags: ['deep', 'aggressive', 'cover-3-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-slant-flat',
    name: 'Slant-Flat',
    description: 'Outside receiver runs a slant while the flat defender is pulled by an underneath flat route.',
    routes: [
      { position: 'WR', route: makeRoute('sf-x', 'X Slant', 'slant', [{ x: 0, y: 0, type: 'line' }, { x: 10, y: -8, type: 'line' }]) },
      { position: 'RB', route: makeRoute('sf-rb', 'RB Flat', 'flat', [{ x: 0, y: 0, type: 'line' }, { x: -20, y: 2, type: 'line' }]) },
    ],
    tags: ['quick game', 'high-low', 'zone-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-curl-flat',
    name: 'Curl-Flat',
    description: 'Outside receiver runs a curl while an underneath receiver runs to the flat — classic Cover 2 read.',
    routes: [
      { position: 'WR', route: makeRoute('cf-z', 'Z Curl', 'curl', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -12, type: 'break' }, { x: -3, y: -10, type: 'line' }]) },
      { position: 'TE', route: makeRoute('cf-y', 'Y Flat', 'flat', [{ x: 0, y: 0, type: 'line' }, { x: 15, y: 2, type: 'line' }]) },
    ],
    tags: ['quick game', 'high-low', 'cover-2-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-stick',
    name: 'Stick',
    description: 'TE runs a 6-yard stick route with a flat and a corner route providing a triangle read.',
    routes: [
      { position: 'TE', route: makeRoute('stick-y', 'Y Stick', 'hitch', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -6, type: 'break' }, { x: 2, y: -6, type: 'line' }]) },
      { position: 'RB', route: makeRoute('stick-rb', 'RB Flat', 'flat', [{ x: 0, y: 0, type: 'line' }, { x: 20, y: 2, type: 'line' }]) },
      { position: 'WR', route: makeRoute('stick-z', 'Z Corner', 'corner', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -10, type: 'break' }, { x: 12, y: -20, type: 'line' }]) },
    ],
    tags: ['quick game', 'triangle read', 'zone-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-dagger',
    name: 'Dagger',
    description: 'Deep post route combined with a dig route underneath, attacking the deep middle of the field.',
    routes: [
      { position: 'WR', route: makeRoute('dagger-x', 'X Post', 'post', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -12, type: 'break' }, { x: 15, y: -25, type: 'line' }]) },
      { position: 'TE', route: makeRoute('dagger-y', 'Y Dig', 'dig', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -12, type: 'break' }, { x: -20, y: -12, type: 'line' }]) },
    ],
    tags: ['deep', 'play-action', 'cover-3-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-post-wheel',
    name: 'Post-Wheel',
    description: 'Inside receiver runs a post to clear, outside receiver runs a wheel route up the sideline.',
    routes: [
      { position: 'TE', route: makeRoute('pw-y', 'Y Post', 'post', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -10, type: 'break' }, { x: -10, y: -22, type: 'line' }]) },
      { position: 'RB', route: makeRoute('pw-rb', 'RB Wheel', 'wheel', [{ x: 0, y: 0, type: 'line' }, { x: 20, y: 0, type: 'curve' }, { x: 22, y: -25, type: 'line' }]) },
    ],
    tags: ['deep', 'play-action', 'man-beater'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-scissors',
    name: 'Scissors',
    description: 'Two receivers cross deep — one runs a post, the other a corner, creating a scissors action.',
    routes: [
      { position: 'WR', route: makeRoute('scissors-x', 'X Post', 'post', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -10, type: 'break' }, { x: 12, y: -22, type: 'line' }]) },
      { position: 'TE', route: makeRoute('scissors-y', 'Y Corner', 'corner', [{ x: 0, y: 0, type: 'line' }, { x: 0, y: -10, type: 'break' }, { x: 15, y: -22, type: 'line' }]) },
    ],
    tags: ['deep', 'aggressive', 'two-man'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'concept-double-slants',
    name: 'Double Slants',
    description: 'Two receivers run slant routes at the same depth — quick, high-percentage pass against man coverage.',
    routes: [
      { position: 'WR', route: makeRoute('dslant-x', 'X Slant', 'slant', [{ x: 0, y: 0, type: 'line' }, { x: 12, y: -8, type: 'line' }]) },
      { position: 'TE', route: makeRoute('dslant-y', 'Y Slant', 'slant', [{ x: 0, y: 0, type: 'line' }, { x: -12, y: -8, type: 'line' }]) },
    ],
    tags: ['quick game', 'man-beater', 'high-percentage'],
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

/**
 * Look up a built-in concept by id.
 */
export function getConceptById(id: string): Concept | undefined {
  return BUILT_IN_CONCEPTS.find((c) => c.id === id);
}

/**
 * Apply a concept to a formation.
 *
 * Matches concept route positions to formation player positions.
 * For positions with multiple players (e.g. multiple WRs), routes are
 * assigned to the first unmatched player for that position.
 *
 * Returns a PlayerAssignment[] with routes applied to the right players.
 * Positions that don't exist in the formation are skipped.
 */
export function applyConceptToFormation(
  concept: Concept,
  formation: Formation,
): PlayerAssignment[] {
  const assignments: PlayerAssignment[] = [];
  const usedPlayerIds = new Set<string>();

  for (const conceptRoute of concept.routes) {
    const matchingPlayer = findMatchingPlayer(
      conceptRoute.position,
      formation,
      usedPlayerIds,
    );

    if (matchingPlayer) {
      usedPlayerIds.add(matchingPlayer.id);
      assignments.push({
        playerId: matchingPlayer.id,
        route: conceptRoute.route,
        label: matchingPlayer.label,
      });
    }
    // If no matching player, skip this route (formation doesn't have the position)
  }

  return assignments;
}

/**
 * Find a player in the formation matching the given offensive position that
 * hasn't already been assigned. Checks both the `position` field and common
 * label aliases (e.g. label 'X'/'Z'/'H' for WR).
 */
function findMatchingPlayer(
  targetPosition: OffensivePosition,
  formation: Formation,
  usedPlayerIds: Set<string>,
) {
  // Direct position match — pick the first unused player at that position
  const directMatch = formation.players.find(
    (p) => p.position === targetPosition && !usedPlayerIds.has(p.id),
  );
  if (directMatch) return directMatch;

  // Alias mapping: some formations label WRs as X/Z/H/F but the position is still 'WR'
  const positionAliases: Record<string, string[]> = {
    WR: ['X', 'Z', 'H', 'F'],
    TE: ['Y', 'T'],
    RB: ['RB', 'TB'],
    FB: ['FB'],
  };

  const aliases = positionAliases[targetPosition];
  if (aliases) {
    for (const alias of aliases) {
      const aliasMatch = formation.players.find(
        (p) => p.label === alias && !usedPlayerIds.has(p.id),
      );
      if (aliasMatch) return aliasMatch;
    }
  }

  return undefined;
}

/** Get all unique concept tags across all built-in concepts. */
export function getAllConceptTags(): string[] {
  const tagSet = new Set<string>();
  for (const concept of BUILT_IN_CONCEPTS) {
    for (const tag of concept.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}
