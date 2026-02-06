import type { RouteType, RoutePoint } from '@/types';

// --- Route definition used in the route tree library ---
export interface RouteDefinition {
  id: string;
  name: string;
  type: RouteType;
  points: RoutePoint[];
  description: string;
}

// Position grouping type for filtering routes by receiver alignment
export type ReceiverPositionType = 'outside' | 'slot' | 'te' | 'rb';

// ============================================================
// Route Point Conventions
//   (0,0) = player start position
//   Negative Y = upfield (toward the end zone the offense is attacking)
//   Positive X = toward the right sideline
//   Negative X = toward the left sideline
// ============================================================

// --- Individual Route Definitions ---

const STREAK: RouteDefinition = {
  id: 'route-streak',
  name: 'Streak/Go',
  type: 'streak',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -40, type: 'line' },
    { x: 0, y: -80, type: 'line' },
  ],
  description: 'Vertical route straight upfield. The receiver runs full speed past the defender.',
};

const SLANT: RouteDefinition = {
  id: 'route-slant',
  name: 'Slant',
  type: 'slant',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -10, type: 'line' },
    { x: 20, y: -30, type: 'break' },
    { x: 40, y: -50, type: 'line' },
  ],
  description: 'Quick 3-step route breaking inside at 45 degrees. A staple of short passing games.',
};

const OUT: RouteDefinition = {
  id: 'route-out',
  name: 'Out',
  type: 'out',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -30, type: 'line' },
    { x: 0, y: -40, type: 'break' },
    { x: -30, y: -40, type: 'line' },
  ],
  description: 'Receiver runs upfield 10-12 yards then breaks sharply toward the sideline.',
};

const IN_DIG: RouteDefinition = {
  id: 'route-in',
  name: 'In/Dig',
  type: 'in',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -30, type: 'line' },
    { x: 0, y: -40, type: 'break' },
    { x: 30, y: -40, type: 'line' },
  ],
  description: 'Receiver runs upfield 10-15 yards then breaks sharply across the middle of the field.',
};

const CORNER: RouteDefinition = {
  id: 'route-corner',
  name: 'Corner',
  type: 'corner',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -30, type: 'line' },
    { x: 0, y: -40, type: 'break' },
    { x: -25, y: -65, type: 'line' },
  ],
  description: 'Receiver stems upfield 10-12 yards then breaks at 45 degrees toward the corner of the end zone.',
};

const POST: RouteDefinition = {
  id: 'route-post',
  name: 'Post',
  type: 'post',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -30, type: 'line' },
    { x: 0, y: -40, type: 'break' },
    { x: 25, y: -65, type: 'line' },
  ],
  description: 'Receiver stems upfield 10-12 yards then breaks at 45 degrees toward the goalpost/middle of field.',
};

const CURL: RouteDefinition = {
  id: 'route-curl',
  name: 'Curl/Comeback',
  type: 'curl',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -35, type: 'line' },
    { x: 0, y: -40, type: 'break' },
    { x: -5, y: -35, type: 'curve' },
  ],
  description: 'Receiver drives upfield 12-15 yards then turns back toward the quarterback.',
};

const HITCH: RouteDefinition = {
  id: 'route-hitch',
  name: 'Hitch',
  type: 'hitch',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -15, type: 'line' },
    { x: 0, y: -18, type: 'break' },
    { x: 0, y: -14, type: 'line' },
  ],
  description: 'Quick 5-yard route where the receiver stops and turns back to the quarterback.',
};

const FLAT: RouteDefinition = {
  id: 'route-flat',
  name: 'Flat',
  type: 'flat',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -5, type: 'curve' },
    { x: -25, y: -8, type: 'line' },
  ],
  description: 'Short route toward the sideline in the flat area, typically 2-3 yards deep.',
};

const WHEEL: RouteDefinition = {
  id: 'route-wheel',
  name: 'Wheel',
  type: 'wheel',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: -15, y: -5, type: 'curve' },
    { x: -20, y: -15, type: 'curve' },
    { x: -15, y: -40, type: 'line' },
    { x: -15, y: -70, type: 'line' },
  ],
  description: 'Route that starts toward the flat then curves upfield along the sideline. Often run by RBs.',
};

const DRAG: RouteDefinition = {
  id: 'route-drag',
  name: 'Drag/Cross',
  type: 'drag',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -5, type: 'line' },
    { x: 0, y: -8, type: 'break' },
    { x: 40, y: -8, type: 'line' },
    { x: 70, y: -8, type: 'line' },
  ],
  description: 'Shallow crossing route across the field at 3-5 yards depth. Great for creating picks and finding zones.',
};

const SEAM: RouteDefinition = {
  id: 'route-seam',
  name: 'Seam',
  type: 'seam',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 3, y: -25, type: 'line' },
    { x: 5, y: -50, type: 'line' },
    { x: 5, y: -75, type: 'line' },
  ],
  description: 'Vertical route that splits the seam between the safety and linebacker. Typically run by TEs or slot receivers.',
};

const SCREEN: RouteDefinition = {
  id: 'route-screen',
  name: 'Screen',
  type: 'screen',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: 3, type: 'curve' },
    { x: -10, y: 5, type: 'curve' },
    { x: -25, y: 3, type: 'line' },
  ],
  description: 'Receiver or back moves behind the line of scrimmage to catch a short pass behind blockers.',
};

const SWING: RouteDefinition = {
  id: 'route-swing',
  name: 'Swing',
  type: 'swing',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: -10, y: 2, type: 'curve' },
    { x: -25, y: -3, type: 'curve' },
    { x: -35, y: -10, type: 'line' },
  ],
  description: 'Running back swings out of the backfield toward the sideline. A check-down or designed pass.',
};

const ANGLE: RouteDefinition = {
  id: 'route-angle',
  name: 'Angle',
  type: 'angle',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: -10, y: -3, type: 'line' },
    { x: -15, y: -5, type: 'break' },
    { x: -5, y: -20, type: 'line' },
    { x: 5, y: -35, type: 'line' },
  ],
  description: 'Back or TE takes a flat step then breaks at an angle upfield across the middle.',
};

const OPTION: RouteDefinition = {
  id: 'route-option',
  name: 'Option',
  type: 'option',
  points: [
    { x: 0, y: 0, type: 'line' },
    { x: 0, y: -20, type: 'line' },
    { x: 0, y: -25, type: 'break' },
    { x: 15, y: -25, type: 'curve' },
  ],
  description: 'Receiver reads the coverage and chooses to sit in a zone hole or break away from man coverage.',
};

// ============================================================
// The full route tree — all standard routes
// ============================================================
export const ROUTE_TREE: RouteDefinition[] = [
  STREAK,
  SLANT,
  OUT,
  IN_DIG,
  CORNER,
  POST,
  CURL,
  HITCH,
  FLAT,
  WHEEL,
  DRAG,
  SEAM,
  SCREEN,
  SWING,
  ANGLE,
  OPTION,
];

// ============================================================
// Routes grouped by position type
// ============================================================
export const ROUTES_BY_POSITION: Record<ReceiverPositionType, RouteType[]> = {
  outside: ['streak', 'slant', 'out', 'in', 'corner', 'post', 'curl', 'hitch', 'comeback', 'drag'],
  slot: ['slant', 'in', 'out', 'drag', 'seam', 'post', 'corner', 'option', 'hitch', 'wheel'],
  te: ['seam', 'drag', 'out', 'in', 'corner', 'flat', 'curl', 'streak', 'angle', 'option'],
  rb: ['flat', 'swing', 'screen', 'wheel', 'angle', 'option', 'drag', 'seam'],
};

// ============================================================
// Getter functions
// ============================================================

/**
 * Look up a single route definition by its RouteType.
 * Returns undefined if no matching route is found.
 */
export function getRouteByType(type: RouteType): RouteDefinition | undefined {
  return ROUTE_TREE.find((r) => r.type === type);
}

/**
 * Return all route definitions suitable for a given receiver position type.
 * Routes are returned in the order specified in ROUTES_BY_POSITION.
 */
export function getRoutesForPosition(position: ReceiverPositionType): RouteDefinition[] {
  const types = ROUTES_BY_POSITION[position];
  if (!types) return [];

  const result: RouteDefinition[] = [];
  for (const t of types) {
    const route = getRouteByType(t);
    if (route) {
      result.push(route);
    }
  }
  return result;
}
