import type { Route, RoutePoint } from '@/types';

// ============================================================
// Route Editing — Waypoint manipulation for route path editing
// ============================================================

/**
 * Extract the control points (waypoints) from a route.
 * Returns a copy of the route's points array.
 */
export function getWaypoints(route: Route): RoutePoint[] {
  return route.points.map((p) => ({ ...p }));
}

/**
 * Move a waypoint at the given index to a new position.
 * Returns a new Route with the updated point; original is not mutated.
 */
export function moveWaypoint(
  route: Route,
  index: number,
  newPos: { x: number; y: number },
): Route {
  if (index < 0 || index >= route.points.length) {
    throw new RangeError(
      `Waypoint index ${index} is out of range [0, ${route.points.length - 1}]`,
    );
  }

  const newPoints = route.points.map((p, i) =>
    i === index ? { ...p, x: newPos.x, y: newPos.y } : { ...p },
  );

  return { ...route, points: newPoints };
}

/**
 * Insert a new waypoint after the given index.
 * The new point defaults to type 'line'.
 */
export function insertWaypoint(
  route: Route,
  afterIndex: number,
  pos: { x: number; y: number },
): Route {
  if (afterIndex < -1 || afterIndex >= route.points.length) {
    throw new RangeError(
      `afterIndex ${afterIndex} is out of range [-1, ${route.points.length - 1}]`,
    );
  }

  const newPoint: RoutePoint = { x: pos.x, y: pos.y, type: 'line' };
  const newPoints = [...route.points];
  newPoints.splice(afterIndex + 1, 0, newPoint);

  return { ...route, points: newPoints };
}

/**
 * Delete a waypoint at the given index.
 * A route must maintain a minimum of 2 points; attempting to delete
 * below that threshold throws an error.
 */
export function deleteWaypoint(route: Route, index: number): Route {
  if (route.points.length <= 2) {
    throw new Error('Cannot delete waypoint: route must have at least 2 points');
  }

  if (index < 0 || index >= route.points.length) {
    throw new RangeError(
      `Waypoint index ${index} is out of range [0, ${route.points.length - 1}]`,
    );
  }

  const newPoints = route.points.filter((_, i) => i !== index);
  return { ...route, points: newPoints };
}

/**
 * Apply bezier smoothing to a route by converting intermediate points
 * to 'curve' type and optionally inserting interpolated control points.
 *
 * @param route   The route to smooth
 * @param tension A value between 0 and 1 controlling curve tightness.
 *                0 = straight lines, 1 = maximum curvature. Default is 0.5.
 * @returns A new Route with smoothed points
 */
export function smoothRoute(route: Route, tension: number = 0.5): Route {
  const clampedTension = Math.max(0, Math.min(1, tension));
  const pts = route.points;

  if (pts.length <= 2) {
    // Nothing to smooth with 2 or fewer points
    return {
      ...route,
      points: pts.map((p) => ({ ...p })),
    };
  }

  const smoothed: RoutePoint[] = [];

  // Keep the first point as-is
  smoothed.push({ ...pts[0] });

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    // Calculate a smoothed position by pulling towards neighboring midpoints
    const midX = (prev.x + next.x) / 2;
    const midY = (prev.y + next.y) / 2;

    const smoothedX = curr.x + (midX - curr.x) * clampedTension * 0.5;
    const smoothedY = curr.y + (midY - curr.y) * clampedTension * 0.5;

    smoothed.push({
      x: smoothedX,
      y: smoothedY,
      type: 'curve',
    });
  }

  // Keep the last point as-is
  smoothed.push({ ...pts[pts.length - 1] });

  return { ...route, points: smoothed };
}
