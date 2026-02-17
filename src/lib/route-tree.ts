/**
 * Route Tree Library
 *
 * Defines built-in routes and allows coaches to create custom route trees.
 * Routes are visual patterns that can be assigned to receivers.
 */

import type { RoutePoint, RouteType } from '@/types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface RouteDefinition {
  id: string;
  name: string;
  type: RouteType;
  /** Route depth in yards (negative = upfield toward defense) */
  depth: number;
  /** Direction: left (-1), straight (0), right (1) */
  direction: -1 | 0 | 1;
  /** Points relative to player start position (0,0). Y negative = upfield */
  points: RoutePoint[];
  /** Short description for coaches */
  description: string;
  /** Tags for filtering */
  tags: string[];
  /** Whether this is a built-in or custom route */
  isBuiltIn: boolean;
  /** Team ID (empty for built-in) */
  teamId: string;
}

export interface RouteCategory {
  name: string;
  routes: RouteDefinition[];
}

// ----------------------------------------------------------------------------
// Helper to create route points
// ----------------------------------------------------------------------------

function pt(x: number, y: number, type: 'line' | 'curve' | 'break' = 'line'): RoutePoint {
  return { x, y, type };
}

// ----------------------------------------------------------------------------
// Built-in Routes - Standard Route Tree
// Coordinates are relative to player position.
// Y is inverted: negative = upfield (toward defense)
// X: negative = left, positive = right
// Scale: roughly 1 unit = 1 yard
// ----------------------------------------------------------------------------

// Quick/Short Routes (0-5 yards)
const HITCH: RouteDefinition = {
  id: 'route-hitch',
  name: 'Hitch',
  type: 'hitch',
  depth: 5,
  direction: 0,
  points: [
    pt(0, 0),
    pt(0, -5, 'break'),
    pt(2, -4),
  ],
  description: 'Run 5 yards upfield, turn back to QB',
  tags: ['quick', 'short', 'timing'],
  isBuiltIn: true,
  teamId: '',
};

const SLANT: RouteDefinition = {
  id: 'route-slant',
  name: 'Slant',
  type: 'slant',
  depth: 5,
  direction: 1,
  points: [
    pt(0, 0),
    pt(0, -3, 'break'),
    pt(15, -12),
  ],
  description: 'Quick break inside at 45 degrees',
  tags: ['quick', 'short', 'inside'],
  isBuiltIn: true,
  teamId: '',
};

const QUICK_OUT: RouteDefinition = {
  id: 'route-quick-out',
  name: 'Quick Out',
  type: 'out',
  depth: 5,
  direction: -1,
  points: [
    pt(0, 0),
    pt(0, -5, 'break'),
    pt(-12, -5),
  ],
  description: '5-yard out to the sideline',
  tags: ['quick', 'short', 'outside'],
  isBuiltIn: true,
  teamId: '',
};

const FLAT: RouteDefinition = {
  id: 'route-flat',
  name: 'Flat',
  type: 'flat',
  depth: 2,
  direction: -1,
  points: [
    pt(0, 0),
    pt(-15, -2, 'curve'),
  ],
  description: 'Release to the flat, typically for RBs',
  tags: ['quick', 'checkdown', 'rb'],
  isBuiltIn: true,
  teamId: '',
};

const SWING: RouteDefinition = {
  id: 'route-swing',
  name: 'Swing',
  type: 'swing',
  depth: 0,
  direction: -1,
  points: [
    pt(0, 0),
    pt(-5, 2, 'curve'),
    pt(-15, -2, 'curve'),
  ],
  description: 'Swing out to the flat (RB route)',
  tags: ['quick', 'rb', 'screen'],
  isBuiltIn: true,
  teamId: '',
};

// Intermediate Routes (6-15 yards)
const CURL: RouteDefinition = {
  id: 'route-curl',
  name: 'Curl',
  type: 'curl',
  depth: 12,
  direction: 0,
  points: [
    pt(0, 0),
    pt(0, -12, 'break'),
    pt(-3, -10, 'curve'),
  ],
  description: 'Run 12 yards, curl back toward QB',
  tags: ['intermediate', 'timing', 'possession'],
  isBuiltIn: true,
  teamId: '',
};

const COMEBACK: RouteDefinition = {
  id: 'route-comeback',
  name: 'Comeback',
  type: 'comeback',
  depth: 15,
  direction: -1,
  points: [
    pt(0, 0),
    pt(0, -15, 'break'),
    pt(-5, -12),
  ],
  description: 'Stem 15 yards, break back toward sideline',
  tags: ['intermediate', 'outside', 'timing'],
  isBuiltIn: true,
  teamId: '',
};

const OUT_ROUTE: RouteDefinition = {
  id: 'route-out',
  name: 'Out',
  type: 'out',
  depth: 12,
  direction: -1,
  points: [
    pt(0, 0),
    pt(0, -12, 'break'),
    pt(-15, -12),
  ],
  description: '12-yard out route to the sideline',
  tags: ['intermediate', 'outside', 'timing'],
  isBuiltIn: true,
  teamId: '',
};

const IN_ROUTE: RouteDefinition = {
  id: 'route-in',
  name: 'In / Dig',
  type: 'dig',
  depth: 12,
  direction: 1,
  points: [
    pt(0, 0),
    pt(0, -12, 'break'),
    pt(20, -12),
  ],
  description: '12-yard in-breaking route (dig)',
  tags: ['intermediate', 'inside', 'crossing'],
  isBuiltIn: true,
  teamId: '',
};

const DRAG: RouteDefinition = {
  id: 'route-drag',
  name: 'Drag',
  type: 'drag',
  depth: 3,
  direction: 1,
  points: [
    pt(0, 0),
    pt(0, -3, 'curve'),
    pt(30, -5),
  ],
  description: 'Shallow cross underneath coverage',
  tags: ['short', 'crossing', 'rub'],
  isBuiltIn: true,
  teamId: '',
};

const CROSS: RouteDefinition = {
  id: 'route-cross',
  name: 'Cross',
  type: 'cross',
  depth: 10,
  direction: 1,
  points: [
    pt(0, 0),
    pt(0, -10, 'break'),
    pt(25, -10),
  ],
  description: 'Intermediate crossing route',
  tags: ['intermediate', 'crossing'],
  isBuiltIn: true,
  teamId: '',
};

// Deep Routes (15+ yards)
const STREAK: RouteDefinition = {
  id: 'route-streak',
  name: 'Streak / Go',
  type: 'streak',
  depth: 30,
  direction: 0,
  points: [
    pt(0, 0),
    pt(0, -30),
  ],
  description: 'Vertical route straight upfield',
  tags: ['deep', 'vertical', 'speed'],
  isBuiltIn: true,
  teamId: '',
};

const POST: RouteDefinition = {
  id: 'route-post',
  name: 'Post',
  type: 'post',
  depth: 20,
  direction: 1,
  points: [
    pt(0, 0),
    pt(0, -12, 'break'),
    pt(15, -25),
  ],
  description: 'Break inside toward the post (goalpost)',
  tags: ['deep', 'inside', 'big-play'],
  isBuiltIn: true,
  teamId: '',
};

const CORNER: RouteDefinition = {
  id: 'route-corner',
  name: 'Corner',
  type: 'corner',
  depth: 20,
  direction: -1,
  points: [
    pt(0, 0),
    pt(0, -12, 'break'),
    pt(-15, -25),
  ],
  description: 'Break toward the corner of the end zone',
  tags: ['deep', 'outside', 'red-zone'],
  isBuiltIn: true,
  teamId: '',
};

const SEAM: RouteDefinition = {
  id: 'route-seam',
  name: 'Seam',
  type: 'seam',
  depth: 20,
  direction: 0,
  points: [
    pt(0, 0),
    pt(2, -8, 'curve'),
    pt(3, -20),
  ],
  description: 'Vertical up the seam between zones',
  tags: ['deep', 'vertical', 'te'],
  isBuiltIn: true,
  teamId: '',
};

// Specialty Routes
const WHEEL: RouteDefinition = {
  id: 'route-wheel',
  name: 'Wheel',
  type: 'wheel',
  depth: 20,
  direction: -1,
  points: [
    pt(0, 0),
    pt(-8, 0, 'curve'),
    pt(-12, -5, 'curve'),
    pt(-10, -20),
  ],
  description: 'Swing to flat then turn upfield',
  tags: ['deep', 'rb', 'big-play'],
  isBuiltIn: true,
  teamId: '',
};

const ANGLE: RouteDefinition = {
  id: 'route-angle',
  name: 'Angle',
  type: 'angle',
  depth: 5,
  direction: 1,
  points: [
    pt(0, 0),
    pt(-3, -2, 'curve'),
    pt(10, -6),
  ],
  description: 'Fake out then angle inside (RB route)',
  tags: ['short', 'rb', 'misdirection'],
  isBuiltIn: true,
  teamId: '',
};

const SCREEN: RouteDefinition = {
  id: 'route-screen',
  name: 'Screen',
  type: 'screen',
  depth: -2,
  direction: -1,
  points: [
    pt(0, 0),
    pt(-5, 3, 'curve'),
    pt(-12, 2),
  ],
  description: 'Slip behind the line for a screen pass',
  tags: ['quick', 'screen', 'deception'],
  isBuiltIn: true,
  teamId: '',
};

const OPTION_ROUTE: RouteDefinition = {
  id: 'route-option',
  name: 'Option',
  type: 'option',
  depth: 8,
  direction: 0,
  points: [
    pt(0, 0),
    pt(0, -8, 'break'),
    pt(5, -8), // Can break either way
  ],
  description: 'Read coverage and break to open space',
  tags: ['intermediate', 'read', 'option'],
  isBuiltIn: true,
  teamId: '',
};

// ----------------------------------------------------------------------------
// Built-in Route Library
// ----------------------------------------------------------------------------

export const BUILT_IN_ROUTES: RouteDefinition[] = [
  // Quick/Short
  HITCH,
  SLANT,
  QUICK_OUT,
  FLAT,
  SWING,
  DRAG,
  // Intermediate
  CURL,
  COMEBACK,
  OUT_ROUTE,
  IN_ROUTE,
  CROSS,
  // Deep
  STREAK,
  POST,
  CORNER,
  SEAM,
  WHEEL,
  // Specialty
  ANGLE,
  SCREEN,
  OPTION_ROUTE,
];

// ----------------------------------------------------------------------------
// Route Categories for UI
// ----------------------------------------------------------------------------

export const ROUTE_CATEGORIES: RouteCategory[] = [
  {
    name: 'Quick (0-5 yds)',
    routes: [HITCH, SLANT, QUICK_OUT, FLAT, SWING, DRAG],
  },
  {
    name: 'Intermediate (6-15 yds)',
    routes: [CURL, COMEBACK, OUT_ROUTE, IN_ROUTE, CROSS],
  },
  {
    name: 'Deep (15+ yds)',
    routes: [STREAK, POST, CORNER, SEAM, WHEEL],
  },
  {
    name: 'Specialty',
    routes: [ANGLE, SCREEN, OPTION_ROUTE],
  },
];

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

/**
 * Get a route by ID
 */
export function getRouteById(id: string): RouteDefinition | undefined {
  return BUILT_IN_ROUTES.find((r) => r.id === id);
}

/**
 * Mirror a route horizontally (flip left/right)
 */
export function mirrorRoute(route: RouteDefinition): RouteDefinition {
  return {
    ...route,
    id: `${route.id}-mirror`,
    direction: (route.direction * -1) as -1 | 0 | 1,
    points: route.points.map((p) => ({
      ...p,
      x: -p.x,
    })),
  };
}

/**
 * Scale route points to canvas coordinates
 * @param route - The route definition
 * @param startX - Player's X position on canvas
 * @param startY - Player's Y position on canvas
 * @param scale - Yards to pixels scale factor
 */
export function scaleRouteToCanvas(
  route: RouteDefinition,
  startX: number,
  startY: number,
  scale: number = 5, // 5 pixels per yard is a good default
): RoutePoint[] {
  return route.points.map((p) => ({
    ...p,
    x: startX + p.x * scale,
    y: startY + p.y * scale,
  }));
}

/**
 * Get routes filtered by tags
 */
export function getRoutesByTag(tag: string): RouteDefinition[] {
  return BUILT_IN_ROUTES.filter((r) => r.tags.includes(tag));
}

/**
 * Get all unique route tags
 */
export function getAllRouteTags(): string[] {
  const tagSet = new Set<string>();
  BUILT_IN_ROUTES.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
