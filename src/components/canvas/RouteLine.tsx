'use client';

import React, { useMemo } from 'react';
import { Group, Line, Arrow } from 'react-konva';
import type { Route, RoutePoint, Position, PlayRenderMode } from '@/types';
import { ROUTE_COLORS, ROUTE_STROKE_WIDTH, ROUTE_ARROW_SIZE } from '@/lib/constants';

export interface RouteLineProps {
  route: Route;
  startPosition: Position;
  selected?: boolean;
  mode?: PlayRenderMode;
  isHotRoute?: boolean;
  onClick?: (routeId: string) => void;
}

/** Returns stroke width multiplier based on render mode */
function getStrokeScale(mode: PlayRenderMode): number {
  switch (mode) {
    case 'thumbnail':
      return 0.6;
    case 'wristband':
      return 0.4;
    case 'card':
      return 0.75;
    case 'print':
      return 1.2;
    case 'full':
    default:
      return 1;
  }
}

/**
 * Convert route points array to flat [x, y, x, y, ...] array for Konva Line/Arrow
 */
function buildPointsArray(start: Position, points: RoutePoint[]): number[] {
  const flat: number[] = [start.x, start.y];
  for (const pt of points) {
    flat.push(pt.x, pt.y);
  }
  return flat;
}

export function RouteLine({
  route,
  startPosition,
  selected = false,
  mode = 'full',
  isHotRoute = false,
  onClick,
}: RouteLineProps) {
  const strokeScale = getStrokeScale(mode);
  const strokeWidth = ROUTE_STROKE_WIDTH * strokeScale;
  const arrowSize = ROUTE_ARROW_SIZE * strokeScale;
  const color = route.color ?? ROUTE_COLORS[route.type] ?? ROUTE_COLORS.default;

  const dash = isHotRoute ? [6 * strokeScale, 4 * strokeScale] : undefined;

  const handleClick = () => {
    onClick?.(route.id);
  };

  // Build the flat points array from start through all route points
  const points = useMemo(
    () => buildPointsArray(startPosition, route.points),
    [startPosition, route.points],
  );

  // If there are at least 2 points we use Arrow for the last segment, Line for the rest
  const hasEnoughPoints = points.length >= 4; // At least start + 1 route point (2 coords each)

  if (!hasEnoughPoints) {
    return null;
  }

  // For the final segment, we use an Arrow to draw the arrowhead
  // All points except the last two are drawn as a plain Line
  const allButLastSegment = points.slice(0, -2);
  const lastSegmentStart = points.slice(-4, -2);
  const lastSegmentEnd = points.slice(-2);
  const arrowPoints = [...lastSegmentStart, ...lastSegmentEnd];

  return (
    <Group onClick={handleClick} onTap={handleClick}>
      {/* Main route path (all segments except the final one) */}
      {allButLastSegment.length >= 4 && (
        <Line
          points={allButLastSegment}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
          dash={dash}
          hitStrokeWidth={10 * strokeScale}
        />
      )}

      {/* Final segment with arrow */}
      <Arrow
        points={arrowPoints}
        stroke={color}
        fill={color}
        strokeWidth={strokeWidth}
        pointerLength={arrowSize}
        pointerWidth={arrowSize}
        lineCap="round"
        lineJoin="round"
        dash={dash}
        hitStrokeWidth={10 * strokeScale}
      />

      {/* Selection highlight */}
      {selected && (
        <Line
          points={points}
          stroke={ROUTE_COLORS.default}
          strokeWidth={strokeWidth + 4 * strokeScale}
          lineCap="round"
          lineJoin="round"
          opacity={0.3}
          listening={false}
        />
      )}
    </Group>
  );
}

export default RouteLine;
