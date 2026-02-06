import type {
  Play,
  Formation,
  Route,
  RoutePoint,
  Player,
  PlayerAssignment,
  BlockingAssignment,
  MotionPath,
  Position,
} from '@/types';
import { generateId } from '@/lib/utils';

// ============================================================
// Play Transforms — mirror, rotate, and duplicate operations
// ============================================================

/**
 * Mirror a route's points horizontally around the field center.
 * Each point's x-coordinate is reflected: newX = fieldWidth - x
 */
export function mirrorRoute(route: Route, fieldWidth: number): Route {
  return {
    ...route,
    id: generateId(),
    points: route.points.map((point): RoutePoint => ({
      ...point,
      x: fieldWidth - point.x,
    })),
  };
}

/**
 * Mirror a single player's position horizontally.
 */
function mirrorPlayer(player: Player, fieldWidth: number): Player {
  return {
    ...player,
    location: {
      x: fieldWidth - player.location.x,
      y: player.location.y,
    },
  };
}

/**
 * Mirror a motion path horizontally.
 */
function mirrorMotionPath(motion: MotionPath, fieldWidth: number): MotionPath {
  return {
    ...motion,
    startPosition: {
      x: fieldWidth - motion.startPosition.x,
      y: motion.startPosition.y,
    },
    endPosition: {
      x: fieldWidth - motion.endPosition.x,
      y: motion.endPosition.y,
    },
  };
}

/**
 * Mirror a blocking assignment horizontally.
 * Reverses the direction angle if present (reflects across vertical axis).
 */
function mirrorBlockingAssignment(
  blocking: BlockingAssignment,
): BlockingAssignment {
  return {
    ...blocking,
    id: generateId(),
    direction:
      blocking.direction !== undefined
        ? (180 - blocking.direction + 360) % 360
        : undefined,
  };
}

/**
 * Mirror a player assignment horizontally.
 */
function mirrorAssignment(
  assignment: PlayerAssignment,
  fieldWidth: number,
): PlayerAssignment {
  return {
    ...assignment,
    route: assignment.route
      ? mirrorRoute(assignment.route, fieldWidth)
      : undefined,
    blocking: assignment.blocking
      ? mirrorBlockingAssignment(assignment.blocking)
      : undefined,
    motion: assignment.motion
      ? mirrorMotionPath(assignment.motion, fieldWidth)
      : undefined,
  };
}

/**
 * Mirror just a formation horizontally around the field center.
 * Flips all player x-positions: newX = fieldWidth - x
 */
export function mirrorFormation(
  formation: Formation,
  fieldWidth: number,
): Formation {
  return {
    ...formation,
    id: generateId(),
    name: `${formation.name} (Mirrored)`,
    players: formation.players.map((player) =>
      mirrorPlayer(player, fieldWidth),
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Mirror an entire play and its formation horizontally.
 * Flips all player positions, routes, blocking assignments, and motion paths.
 */
export function mirrorPlay(
  play: Play,
  formation: Formation,
  fieldWidth: number,
): { play: Play; formation: Formation } {
  const mirroredFormation = mirrorFormation(formation, fieldWidth);

  const mirroredPlay: Play = {
    ...play,
    id: generateId(),
    name: `${play.name} (Mirrored)`,
    formationId: mirroredFormation.id,
    assignments: play.assignments.map((assignment) =>
      mirrorAssignment(assignment, fieldWidth),
    ),
    defensiveOverlay: play.defensiveOverlay
      ? {
          ...play.defensiveOverlay,
          players: play.defensiveOverlay.players.map((player) =>
            mirrorPlayer(player, fieldWidth),
          ),
        }
      : undefined,
    hash: play.hash === 'left' ? 'right' : play.hash === 'right' ? 'left' : play.hash,
    updatedAt: new Date().toISOString(),
  };

  return { play: mirroredPlay, formation: mirroredFormation };
}

/**
 * Rotate a position around a center point by a given number of degrees.
 */
function rotatePosition(
  pos: Position,
  centerX: number,
  centerY: number,
  radians: number,
): Position {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = pos.x - centerX;
  const dy = pos.y - centerY;
  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

/**
 * Rotate all positions in a play and formation by the given degrees
 * around the center of the field. Useful for field orientation changes.
 */
export function rotatePlay(
  play: Play,
  formation: Formation,
  degrees: number,
): { play: Play; formation: Formation } {
  const radians = (degrees * Math.PI) / 180;

  // Calculate center from the formation's bounding box
  const allPlayers = [
    ...formation.players,
    ...(play.defensiveOverlay?.players ?? []),
  ];

  if (allPlayers.length === 0) {
    return { play, formation };
  }

  const xs = allPlayers.map((p) => p.location.x);
  const ys = allPlayers.map((p) => p.location.y);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

  const rotatedFormation: Formation = {
    ...formation,
    players: formation.players.map((player) => ({
      ...player,
      location: rotatePosition(player.location, centerX, centerY, radians),
    })),
    updatedAt: new Date().toISOString(),
  };

  const rotatedPlay: Play = {
    ...play,
    assignments: play.assignments.map((assignment) => ({
      ...assignment,
      route: assignment.route
        ? {
            ...assignment.route,
            points: assignment.route.points.map((pt) => {
              const rotated = rotatePosition(pt, centerX, centerY, radians);
              return { ...pt, x: rotated.x, y: rotated.y };
            }),
          }
        : undefined,
      blocking: assignment.blocking
        ? {
            ...assignment.blocking,
            direction:
              assignment.blocking.direction !== undefined
                ? (assignment.blocking.direction + degrees + 360) % 360
                : undefined,
          }
        : undefined,
      motion: assignment.motion
        ? {
            ...assignment.motion,
            startPosition: rotatePosition(
              assignment.motion.startPosition,
              centerX,
              centerY,
              radians,
            ),
            endPosition: rotatePosition(
              assignment.motion.endPosition,
              centerX,
              centerY,
              radians,
            ),
          }
        : undefined,
    })),
    defensiveOverlay: play.defensiveOverlay
      ? {
          ...play.defensiveOverlay,
          players: play.defensiveOverlay.players.map((player) => ({
            ...player,
            location: rotatePosition(
              player.location,
              centerX,
              centerY,
              radians,
            ),
          })),
        }
      : undefined,
    updatedAt: new Date().toISOString(),
  };

  return { play: rotatedPlay, formation: rotatedFormation };
}

/**
 * Deep clone a play with new IDs for the play and all sub-entities.
 * Preserves all data but generates fresh identifiers.
 */
export function duplicatePlay(play: Play): Play {
  return {
    ...play,
    id: generateId(),
    name: `${play.name} (Copy)`,
    assignments: play.assignments.map((assignment) => ({
      ...assignment,
      route: assignment.route
        ? {
            ...assignment.route,
            id: generateId(),
            points: assignment.route.points.map((pt) => ({ ...pt })),
          }
        : undefined,
      blocking: assignment.blocking
        ? {
            ...assignment.blocking,
            id: generateId(),
          }
        : undefined,
      motion: assignment.motion
        ? {
            ...assignment.motion,
            startPosition: { ...assignment.motion.startPosition },
            endPosition: { ...assignment.motion.endPosition },
          }
        : undefined,
    })),
    defensiveOverlay: play.defensiveOverlay
      ? {
          ...play.defensiveOverlay,
          players: play.defensiveOverlay.players.map((player) => ({
            ...player,
            location: { ...player.location },
          })),
        }
      : undefined,
    tags: [...play.tags],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
