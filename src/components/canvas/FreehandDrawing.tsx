'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Line, Group } from 'react-konva';
import type { RoutePoint, Position } from '@/types';
import { simplifyPath } from '@/lib/utils';
import { SMOOTHING_EPSILON, MIN_DRAW_DISTANCE } from '@/lib/constants';

export interface FreehandDrawingProps {
  isDrawing: boolean;
  color?: string;
  strokeWidth?: number;
  onDrawComplete?: (points: RoutePoint[]) => void;
  onDrawStart?: () => void;
  onDrawCancel?: () => void;
}

/**
 * Detect sharp direction changes in a path to auto-segment into route break points.
 * Returns indices where the direction change exceeds the threshold.
 */
export function detectRouteBreaks(
  points: { x: number; y: number }[],
  angleThresholdDeg: number = 45,
): number[] {
  const breaks: number[] = [];
  if (points.length < 3) return breaks;

  const threshold = (angleThresholdDeg * Math.PI) / 180;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);

    let angleDiff = Math.abs(angle2 - angle1);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    if (angleDiff > threshold) {
      breaks.push(i);
    }
  }

  return breaks;
}

/**
 * Convert simplified freehand points into RoutePoint[] with break detection.
 */
export function convertToRoutePoints(
  rawPoints: { x: number; y: number }[],
  epsilon: number = SMOOTHING_EPSILON,
  breakAngle: number = 45,
): RoutePoint[] {
  if (rawPoints.length < 2) return [];

  // Simplify path using RDP
  const simplified = simplifyPath(rawPoints, epsilon);

  // Detect break points
  const breakIndices = new Set(detectRouteBreaks(simplified, breakAngle));

  // Convert to RoutePoint[]
  return simplified.map((pt, i) => ({
    x: pt.x,
    y: pt.y,
    type: breakIndices.has(i) ? 'break' : 'line',
  }));
}

/**
 * Distance between two points.
 */
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function FreehandDrawing({
  isDrawing,
  color = '#2563eb',
  strokeWidth = 2.5,
  onDrawComplete,
  onDrawStart,
  onDrawCancel,
}: FreehandDrawingProps) {
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const isActiveRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: any) => {
      if (!isDrawing) return;

      isActiveRef.current = true;
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      setCurrentPoints([{ x: pos.x, y: pos.y }]);
      onDrawStart?.();
    },
    [isDrawing, onDrawStart],
  );

  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || !isActiveRef.current) return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      setCurrentPoints((prev) => {
        if (prev.length === 0) return [{ x: pos.x, y: pos.y }];

        const lastPt = prev[prev.length - 1];
        // Only add point if it's far enough from the last one
        if (distance(lastPt, pos) < MIN_DRAW_DISTANCE) return prev;

        return [...prev, { x: pos.x, y: pos.y }];
      });
    },
    [isDrawing],
  );

  const handleMouseUp = useCallback(() => {
    if (!isActiveRef.current) return;
    isActiveRef.current = false;

    if (currentPoints.length < 2) {
      setCurrentPoints([]);
      onDrawCancel?.();
      return;
    }

    // Process the freehand points
    const routePoints = convertToRoutePoints(currentPoints);

    setCurrentPoints([]);
    onDrawComplete?.(routePoints);
  }, [currentPoints, onDrawComplete, onDrawCancel]);

  // Flatten current points for Konva Line
  const flatPoints = currentPoints.flatMap((p) => [p.x, p.y]);

  return (
    <Group
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Transparent hit area to capture events */}
      {isDrawing && (
        <Line
          points={[0, 0, 10000, 0, 10000, 10000, 0, 10000]}
          closed
          fill="transparent"
          stroke="transparent"
          listening={true}
        />
      )}

      {/* Current drawing stroke */}
      {flatPoints.length >= 4 && (
        <Line
          points={flatPoints}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={0.3}
          listening={false}
        />
      )}
    </Group>
  );
}

export default FreehandDrawing;
