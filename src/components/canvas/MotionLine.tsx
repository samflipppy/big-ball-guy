'use client';

import React from 'react';
import { Line, Arrow } from 'react-konva';
import type { MotionPath, PlayRenderMode, Position } from '@/types';

export interface MotionLineProps {
  motion: MotionPath;
  startPosition: Position;
  mode?: PlayRenderMode;
}

function getModeScale(mode: PlayRenderMode): number {
  switch (mode) {
    case 'thumbnail':
      return 0.5;
    case 'wristband':
      return 0.4;
    case 'card':
      return 0.7;
    case 'print':
      return 1.1;
    case 'full':
    default:
      return 1;
  }
}

export function MotionLine({
  motion,
  startPosition,
  mode = 'full',
}: MotionLineProps) {
  const scale = getModeScale(mode);
  const strokeWidth = 2.5 * scale;
  const dashSize = 6 * scale;

  // Motion line goes from start to end position
  const points = [
    startPosition.x,
    startPosition.y,
    motion.endPosition.x,
    motion.endPosition.y,
  ];

  // Calculate arrow head at the end
  const dx = motion.endPosition.x - startPosition.x;
  const dy = motion.endPosition.y - startPosition.y;
  const length = Math.hypot(dx, dy);

  if (length < 5) return null;

  // Color based on timing
  const strokeColor = motion.timing === 'pre-snap' ? '#f59e0b' : '#8b5cf6';

  return (
    <>
      {/* Dashed motion line */}
      <Line
        points={points}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        dash={[dashSize, dashSize * 0.5]}
        lineCap="round"
        listening={false}
      />
      {/* Arrow head at end */}
      <Arrow
        points={[
          startPosition.x + dx * 0.7,
          startPosition.y + dy * 0.7,
          motion.endPosition.x,
          motion.endPosition.y,
        ]}
        stroke={strokeColor}
        fill={strokeColor}
        strokeWidth={strokeWidth}
        pointerLength={8 * scale}
        pointerWidth={6 * scale}
        listening={false}
      />
    </>
  );
}

export default MotionLine;
