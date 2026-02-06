import type { Route, RoutePoint, PlayerAssignment } from '@/types';
import { generateId } from '@/lib/utils';

// ============================================================
// Route Clipboard — Copy/Paste routes between players
// ============================================================

/**
 * Serialized clipboard format for route transfer between players.
 */
export interface RouteClipboard {
  /** The serialized route data */
  route: Route;
  /** The original player's position type (e.g., 'WR', 'RB') */
  sourcePosition?: string;
  /** The original player's location for offset calculation */
  sourceLocation: { x: number; y: number };
  /** Timestamp of the copy operation */
  copiedAt: number;
}

/** Position groups that are considered compatible for route pasting */
const ROUTE_COMPATIBLE_GROUPS: Record<string, string[]> = {
  receiver: ['WR', 'TE', 'H', 'X', 'Y', 'Z', 'F', 'T', 'RB', 'FB'],
  lineman: ['LT', 'LG', 'C', 'RG', 'RT'],
  defensive_back: ['CB', 'SS', 'FS', 'NB', 'S'],
  linebacker: ['OLB', 'ILB', 'MLB', 'LB'],
  defensive_line: ['DE', 'DT', 'NT'],
};

/**
 * Copy a route from a player assignment into clipboard format.
 * The source player's location is stored so offsets can be calculated on paste.
 *
 * @param assignment The player assignment containing the route
 * @param sourceLocation The current position of the source player on the field
 * @param sourcePosition The position label of the source player (e.g., 'WR')
 * @returns A RouteClipboard object, or null if the assignment has no route
 */
export function copyRoute(
  assignment: PlayerAssignment,
  sourceLocation: { x: number; y: number } = { x: 0, y: 0 },
  sourcePosition?: string,
): RouteClipboard | null {
  if (!assignment.route) {
    return null;
  }

  return {
    route: {
      ...assignment.route,
      points: assignment.route.points.map((p) => ({ ...p })),
    },
    sourcePosition,
    sourceLocation: { ...sourceLocation },
    copiedAt: Date.now(),
  };
}

/**
 * Paste a copied route onto a different player, adjusting point
 * positions relative to the target player's location.
 *
 * @param clipboard The clipboard data from copyRoute
 * @param targetPlayerId The ID of the player receiving the route
 * @param targetLocation The position of the target player on the field
 * @returns A new PlayerAssignment with the pasted route
 */
export function pasteRoute(
  clipboard: RouteClipboard,
  targetPlayerId: string,
  targetLocation: { x: number; y: number } = { x: 0, y: 0 },
): PlayerAssignment {
  const dx = targetLocation.x - clipboard.sourceLocation.x;
  const dy = targetLocation.y - clipboard.sourceLocation.y;

  const adjustedPoints: RoutePoint[] = clipboard.route.points.map((p) => ({
    ...p,
    x: p.x + dx,
    y: p.y + dy,
  }));

  const newRoute: Route = {
    ...clipboard.route,
    id: generateId(),
    points: adjustedPoints,
  };

  return {
    playerId: targetPlayerId,
    route: newRoute,
  };
}

/**
 * Check whether a clipboard route can be pasted onto a player
 * at the given position. Routes are compatible within the same
 * position group (e.g., all receivers are compatible with each other).
 *
 * @param clipboard The clipboard data
 * @param targetPosition The position type of the target player
 * @returns true if the route can be pasted
 */
export function canPasteRoute(
  clipboard: RouteClipboard,
  targetPosition?: string,
): boolean {
  // If no clipboard route, can't paste
  if (!clipboard.route) {
    return false;
  }

  // If no position info on either side, allow it
  if (!clipboard.sourcePosition || !targetPosition) {
    return true;
  }

  // Same position is always compatible
  if (clipboard.sourcePosition === targetPosition) {
    return true;
  }

  // Check if both belong to the same compatibility group
  for (const group of Object.values(ROUTE_COMPATIBLE_GROUPS)) {
    const sourceInGroup = group.includes(clipboard.sourcePosition);
    const targetInGroup = group.includes(targetPosition);
    if (sourceInGroup && targetInGroup) {
      return true;
    }
  }

  // Quarterback is a special case - can paste to anyone
  if (clipboard.sourcePosition === 'QB' || targetPosition === 'QB') {
    return true;
  }

  return false;
}
