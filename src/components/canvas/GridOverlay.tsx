'use client';

import React, { useMemo } from 'react';
import { Line } from 'react-konva';
import { generateGridLines, isMajorGridLine } from '@/lib/grid';

// ============================================================
// GridOverlay — Renders configurable grid lines on the canvas
// ============================================================

/** Subtle line color for minor grid lines */
const MINOR_GRID_COLOR = 'rgba(255, 255, 255, 0.06)';
/** Slightly more visible color for major grid lines (every 5th line) */
const MAJOR_GRID_COLOR = 'rgba(255, 255, 255, 0.12)';
/** Stroke width for minor lines */
const MINOR_STROKE_WIDTH = 0.5;
/** Stroke width for major lines */
const MAJOR_STROKE_WIDTH = 1;

export interface GridOverlayProps {
  width: number;
  height: number;
  gridSize: number;
  visible: boolean;
}

export function GridOverlay({ width, height, gridSize, visible }: GridOverlayProps) {
  const gridLines = useMemo(() => {
    if (!visible || gridSize <= 0) return { x: [], y: [] };
    return generateGridLines(width, height, gridSize);
  }, [width, height, gridSize, visible]);

  if (!visible) return null;

  return (
    <>
      {/* Vertical grid lines */}
      {gridLines.x.map((x) => {
        const isMajor = isMajorGridLine(x, gridSize);
        return (
          <Line
            key={`grid-v-${x}`}
            points={[x, 0, x, height]}
            stroke={isMajor ? MAJOR_GRID_COLOR : MINOR_GRID_COLOR}
            strokeWidth={isMajor ? MAJOR_STROKE_WIDTH : MINOR_STROKE_WIDTH}
            listening={false}
          />
        );
      })}

      {/* Horizontal grid lines */}
      {gridLines.y.map((y) => {
        const isMajor = isMajorGridLine(y, gridSize);
        return (
          <Line
            key={`grid-h-${y}`}
            points={[0, y, width, y]}
            stroke={isMajor ? MAJOR_GRID_COLOR : MINOR_GRID_COLOR}
            strokeWidth={isMajor ? MAJOR_STROKE_WIDTH : MINOR_STROKE_WIDTH}
            listening={false}
          />
        );
      })}
    </>
  );
}

export default GridOverlay;
