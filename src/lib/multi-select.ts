import type { PlayerAssignment, Position } from '@/types';

// ============================================================
// Multi-Select — Group selection and manipulation of players
// ============================================================

/**
 * Represents a group of selected players for batch operations.
 */
export interface SelectionGroup {
  playerIds: string[];
  createdAt: number;
}

/**
 * A bounding box rectangle.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Alignment options for aligning selected players.
 */
export type Alignment =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center-h'
  | 'center-v';

/**
 * A minimal player representation used in multi-select operations.
 * Contains only the fields needed for positioning.
 */
export interface PlayerWithLocation {
  playerId: string;
  location: Position;
}

/**
 * Create a new selection group from an array of player IDs.
 */
export function createSelection(playerIds: string[]): SelectionGroup {
  return {
    playerIds: [...new Set(playerIds)], // deduplicate
    createdAt: Date.now(),
  };
}

/**
 * Move all players in the selection by a given delta offset.
 * Returns a new array of players with updated locations.
 *
 * @param players Array of players with their current locations
 * @param selection The selection group identifying which players to move
 * @param delta The offset to apply { dx, dy }
 * @returns New array of players with updated positions for selected ones
 */
export function moveSelection(
  players: PlayerWithLocation[],
  selection: SelectionGroup,
  delta: { dx: number; dy: number },
): PlayerWithLocation[] {
  const selectedSet = new Set(selection.playerIds);

  return players.map((player) => {
    if (selectedSet.has(player.playerId)) {
      return {
        ...player,
        location: {
          x: player.location.x + delta.dx,
          y: player.location.y + delta.dy,
        },
      };
    }
    return { ...player };
  });
}

/**
 * Get the bounding box rectangle that encompasses all selected players.
 *
 * @param players Array of players with their locations
 * @param playerIds IDs of the players to include
 * @returns Bounding box, or null if no matching players found
 */
export function getBoundingBox(
  players: PlayerWithLocation[],
  playerIds: string[],
): BoundingBox | null {
  const idSet = new Set(playerIds);
  const selectedPlayers = players.filter((p) => idSet.has(p.playerId));

  if (selectedPlayers.length === 0) {
    return null;
  }

  const xs = selectedPlayers.map((p) => p.location.x);
  const ys = selectedPlayers.map((p) => p.location.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Align selected players according to the given alignment type.
 * Returns a new array of players with updated positions.
 *
 * - 'left': All selected players align to the leftmost x
 * - 'right': All selected players align to the rightmost x
 * - 'top': All selected players align to the topmost y (smallest y)
 * - 'bottom': All selected players align to the bottommost y (largest y)
 * - 'center-h': All selected players align to the horizontal center
 * - 'center-v': All selected players align to the vertical center
 */
export function alignSelection(
  players: PlayerWithLocation[],
  playerIds: string[],
  alignment: Alignment,
): PlayerWithLocation[] {
  const idSet = new Set(playerIds);
  const selectedPlayers = players.filter((p) => idSet.has(p.playerId));

  if (selectedPlayers.length <= 1) {
    return players.map((p) => ({ ...p, location: { ...p.location } }));
  }

  const bbox = getBoundingBox(players, playerIds);
  if (!bbox) {
    return players.map((p) => ({ ...p, location: { ...p.location } }));
  }

  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  return players.map((player) => {
    if (!idSet.has(player.playerId)) {
      return { ...player, location: { ...player.location } };
    }

    const loc = { ...player.location };

    switch (alignment) {
      case 'left':
        loc.x = bbox.x;
        break;
      case 'right':
        loc.x = bbox.x + bbox.width;
        break;
      case 'top':
        loc.y = bbox.y;
        break;
      case 'bottom':
        loc.y = bbox.y + bbox.height;
        break;
      case 'center-h':
        loc.x = centerX;
        break;
      case 'center-v':
        loc.y = centerY;
        break;
    }

    return { ...player, location: loc };
  });
}
