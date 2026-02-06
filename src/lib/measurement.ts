import type { FieldDimensions, Position } from '@/types';
import { PIXELS_PER_YARD } from '@/lib/constants';

// ============================================================
// Measurement — Distance and angle calculation utilities
// ============================================================

/**
 * Measure the distance between two points in yards.
 *
 * Uses the field dimensions to determine the pixels-per-yard ratio,
 * then converts the Euclidean pixel distance to yards.
 *
 * @param p1 First point in canvas pixel coordinates
 * @param p2 Second point in canvas pixel coordinates
 * @param fieldDims The field dimensions for scale reference
 * @returns Distance in yards (rounded to 1 decimal place)
 */
export function measureDistance(
  p1: Position,
  p2: Position,
  fieldDims: FieldDimensions,
): number {
  const pxPerYard = fieldDims.width / 53.3; // standard field width
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  const yards = pixelDistance / pxPerYard;
  return Math.round(yards * 10) / 10;
}

/**
 * Measure the angle formed by three points (p1 -> p2 -> p3).
 * The angle is measured at p2 (the vertex).
 *
 * @param p1 First point (one arm of the angle)
 * @param p2 Vertex point (where the angle is measured)
 * @param p3 Third point (other arm of the angle)
 * @returns Angle in degrees (0-180)
 */
export function measureAngle(
  p1: Position,
  p2: Position,
  p3: Position,
): number {
  const v1x = p1.x - p2.x;
  const v1y = p1.y - p2.y;
  const v2x = p3.x - p2.x;
  const v2y = p3.y - p2.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  const angleRad = Math.acos(cosAngle);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculate the midpoint between two positions.
 */
export function getMidpoint(p1: Position, p2: Position): Position {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculate the bearing/heading angle from p1 to p2 in degrees.
 * 0 = up (north), 90 = right (east), etc.
 */
export function getBearing(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p1.y - p2.y; // inverted because canvas y increases downward
  const radians = Math.atan2(dx, dy);
  const degrees = (radians * 180) / Math.PI;
  return ((degrees % 360) + 360) % 360;
}
