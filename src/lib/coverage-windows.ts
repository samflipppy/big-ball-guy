import type { Player, PlayerAssignment, Route } from '@/types';
import type { CoverageDefinition, ZoneDefinition } from '@/lib/defenses';
import { generateId } from '@/lib/utils';
import { DEFAULT_FIELD } from '@/lib/constants';

// ============================================================
// Coverage Window Detection
// ============================================================

export interface CoverageWindow {
  id: string;
  x: number;
  y: number;
  radius: number;
  description: string;
}

/** Default threshold distance (pixels) for "no defender nearby" in zone coverage */
export const ZONE_SOFT_SPOT_THRESHOLD = 80;

/** Grid sampling resolution for zone soft-spot scanning */
export const GRID_STEP = 40;

/**
 * Euclidean distance between two points.
 */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Check whether a point (px, py) falls within any zone area.
 * Returns true if the point is inside at least one zone rectangle.
 */
export function isInsideAnyZone(
  px: number,
  py: number,
  zones: ZoneDefinition[],
): boolean {
  for (const z of zones) {
    if (z.type === 'zone' && z.area) {
      const { x, y, width, height } = z.area;
      if (px >= x && px <= x + width && py >= y && py <= y + height) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get the center position of a zone defender.
 * For zone defenders, the center of their zone area is used.
 */
function getDefenderPosition(
  zone: ZoneDefinition,
  defensePlayers: Player[],
): { x: number; y: number } | null {
  if (zone.type === 'zone' && zone.area) {
    return {
      x: zone.area.x + zone.area.width / 2,
      y: zone.area.y + zone.area.height / 2,
    };
  }
  // For man coverage, use the defender's actual location
  const player = defensePlayers.find((p) => p.id === zone.playerId);
  return player ? { x: player.location.x, y: player.location.y } : null;
}

/**
 * Find soft spots in zone coverage — areas on the field that are inside
 * a zone rectangle but have no zone defender's center within threshold distance.
 * Scans the field on a grid and clusters nearby soft spots.
 */
export function findZoneSoftSpots(
  coverage: CoverageDefinition,
  defensePlayers: Player[],
  threshold: number = ZONE_SOFT_SPOT_THRESHOLD,
): CoverageWindow[] {
  const zoneDefenders = coverage.zones.filter((z) => z.type === 'zone');

  if (zoneDefenders.length === 0) return [];

  // Get all zone defender center positions
  const defenderPositions: { x: number; y: number }[] = [];
  for (const zd of zoneDefenders) {
    const pos = getDefenderPosition(zd, defensePlayers);
    if (pos) defenderPositions.push(pos);
  }

  // Sample the field on a grid and find points far from all defenders
  const softPoints: { x: number; y: number; minDist: number }[] = [];
  const fieldWidth = DEFAULT_FIELD.width;
  const fieldHeight = DEFAULT_FIELD.lineOfScrimmageY; // only scan above LOS (defensive side)

  for (let gx = 0; gx <= fieldWidth; gx += GRID_STEP) {
    for (let gy = 0; gy <= fieldHeight; gy += GRID_STEP) {
      // Only consider points inside at least one zone area
      if (!isInsideAnyZone(gx, gy, coverage.zones)) continue;

      let minDist = Infinity;
      for (const dp of defenderPositions) {
        const d = distance(gx, gy, dp.x, dp.y);
        if (d < minDist) minDist = d;
      }

      if (minDist > threshold) {
        softPoints.push({ x: gx, y: gy, minDist });
      }
    }
  }

  // Cluster nearby soft points into windows
  return clusterSoftSpots(softPoints);
}

/**
 * Simple greedy clustering: merge soft points that are within 2*GRID_STEP of each other.
 */
function clusterSoftSpots(
  points: { x: number; y: number; minDist: number }[],
): CoverageWindow[] {
  if (points.length === 0) return [];

  const used = new Set<number>();
  const windows: CoverageWindow[] = [];

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    used.add(i);

    const cluster = [points[i]];

    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      // Check if close to any point already in the cluster
      const isNear = cluster.some(
        (cp) => distance(cp.x, cp.y, points[j].x, points[j].y) <= GRID_STEP * 2,
      );
      if (isNear) {
        used.add(j);
        cluster.push(points[j]);
      }
    }

    // Compute centroid
    const cx = cluster.reduce((s, p) => s + p.x, 0) / cluster.length;
    const cy = cluster.reduce((s, p) => s + p.y, 0) / cluster.length;
    const maxDist = Math.max(...cluster.map((p) => p.minDist));
    const radius = Math.max(GRID_STEP, cluster.length * (GRID_STEP / 2));

    windows.push({
      id: generateId(),
      x: Math.round(cx),
      y: Math.round(cy),
      radius: Math.round(Math.min(radius, 120)),
      description: `Soft spot in zone coverage — nearest defender is ${Math.round(maxDist)}px away`,
    });
  }

  return windows;
}

/**
 * Detect man-coverage mismatches by comparing the route runner's position
 * to the covering defender. Returns windows at the route endpoint when
 * a skill-position receiver is covered by a slower position type (LB, S).
 */
export function findManMismatches(
  coverage: CoverageDefinition,
  offensePlayers: Player[],
  defensePlayers: Player[],
  assignments: PlayerAssignment[],
): CoverageWindow[] {
  const windows: CoverageWindow[] = [];

  // Positions considered "fast" on offense
  const speedPositions = new Set(['WR', 'RB', 'H']);
  // Positions considered "slow" on defense for man coverage
  const slowDefensePositions = new Set(['MLB', 'ILB', 'OLB', 'LB', 'SS']);

  const manZones = coverage.zones.filter((z) => z.type === 'man');

  for (const mz of manZones) {
    const offensePlayer = offensePlayers.find((p) => p.id === mz.targetId);
    const defensePlayer = defensePlayers.find((p) => p.id === mz.playerId);

    if (!offensePlayer || !defensePlayer) continue;

    // Check if the offensive player has a route assigned
    const assignment = assignments.find((a) => a.playerId === offensePlayer.id);
    if (!assignment?.route) continue;

    // Mismatch: speed receiver covered by a slower defender
    if (
      speedPositions.has(offensePlayer.position) &&
      slowDefensePositions.has(defensePlayer.position)
    ) {
      // Use the route endpoint (last point) or the player location as the window position
      const routePoints = assignment.route.points;
      const endpoint = routePoints.length > 0
        ? routePoints[routePoints.length - 1]
        : offensePlayer.location;

      windows.push({
        id: generateId(),
        x: endpoint.x,
        y: endpoint.y,
        radius: 40,
        description: `Man mismatch: ${offensePlayer.label} (${offensePlayer.position}) vs ${defensePlayer.label} (${defensePlayer.position})`,
      });
    }
  }

  return windows;
}

/**
 * Full coverage window analysis: zone soft spots + man mismatches.
 */
export function analyzeCoverageWindows(
  coverage: CoverageDefinition,
  offensePlayers: Player[],
  defensePlayers: Player[],
  assignments: PlayerAssignment[],
  threshold?: number,
): CoverageWindow[] {
  const windows: CoverageWindow[] = [];

  windows.push(...findZoneSoftSpots(coverage, defensePlayers, threshold));
  windows.push(...findManMismatches(coverage, offensePlayers, defensePlayers, assignments));

  return windows;
}
