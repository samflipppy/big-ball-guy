'use client';

import React, { useMemo } from 'react';
import { Group, Line, Arrow, Text } from 'react-konva';
import type { BlockingAssignment, Position, PlayRenderMode } from '@/types';
import { BLOCK_STROKE_WIDTH, BLOCK_COLORS } from '@/lib/constants';

export interface BlockingLineProps {
  assignment: BlockingAssignment;
  blockerPosition: Position;
  targetPosition?: Position;
  mode?: PlayRenderMode;
  onClick?: (assignmentId: string) => void;
}

function getStrokeScale(mode: PlayRenderMode): number {
  switch (mode) {
    case 'thumbnail':
      return 0.5;
    case 'wristband':
      return 0.35;
    case 'card':
      return 0.7;
    case 'print':
      return 1.2;
    case 'full':
    default:
      return 1;
  }
}

/**
 * Compute the target position when no explicit target is given.
 * Uses the direction angle (degrees) to project a short distance.
 */
function computeDirectionalTarget(start: Position, directionDeg: number, length: number): Position {
  const rad = (directionDeg * Math.PI) / 180;
  return {
    x: start.x + Math.cos(rad) * length,
    y: start.y - Math.sin(rad) * length, // canvas y is inverted
  };
}

export function BlockingLine({
  assignment,
  blockerPosition,
  targetPosition,
  mode = 'full',
  onClick,
}: BlockingLineProps) {
  const strokeScale = getStrokeScale(mode);
  const strokeWidth = BLOCK_STROKE_WIDTH * strokeScale;
  const color =
    BLOCK_COLORS[assignment.blockType as keyof typeof BLOCK_COLORS] ?? BLOCK_COLORS.default;

  // If no target position, project from direction or default to straight ahead
  const target = useMemo(() => {
    if (targetPosition) return targetPosition;
    const dir = assignment.direction ?? 90; // default: straight up
    return computeDirectionalTarget(blockerPosition, dir, 30 * strokeScale);
  }, [targetPosition, assignment.direction, blockerPosition, strokeScale]);

  const points = [blockerPosition.x, blockerPosition.y, target.x, target.y];

  const handleClick = () => {
    onClick?.(assignment.id);
  };

  // Midpoint for cut-block X symbol
  const midX = (blockerPosition.x + target.x) / 2;
  const midY = (blockerPosition.y + target.y) / 2;

  // Drive block: flat line at end (perpendicular bar)
  const driveBlockEndSymbol = useMemo(() => {
    if (assignment.blockType !== 'drive' && assignment.blockType !== 'reach' && assignment.blockType !== 'down') {
      return null;
    }
    // Draw a short perpendicular line at the target
    const dx = target.x - blockerPosition.x;
    const dy = target.y - blockerPosition.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = (-dy / len) * 8 * strokeScale;
    const perpY = (dx / len) * 8 * strokeScale;

    return (
      <Line
        points={[
          target.x - perpX,
          target.y - perpY,
          target.x + perpX,
          target.y + perpY,
        ]}
        stroke={color}
        strokeWidth={strokeWidth * 1.2}
        lineCap="round"
      />
    );
  }, [assignment.blockType, blockerPosition, target, color, strokeWidth, strokeScale]);

  // Pull block: arrow at end
  const pullArrow = useMemo(() => {
    if (assignment.blockType !== 'pull' && assignment.blockType !== 'trap') {
      return null;
    }
    return (
      <Arrow
        points={points}
        stroke={color}
        fill={color}
        strokeWidth={strokeWidth}
        pointerLength={8 * strokeScale}
        pointerWidth={6 * strokeScale}
        lineCap="round"
        dash={[6 * strokeScale, 3 * strokeScale]}
      />
    );
  }, [assignment.blockType, points, color, strokeWidth, strokeScale]);

  // Cut block: X symbol at midpoint
  const cutSymbol = useMemo(() => {
    if (assignment.blockType !== 'cut') return null;
    const sz = 6 * strokeScale;
    return (
      <Group>
        <Line
          points={[midX - sz, midY - sz, midX + sz, midY + sz]}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
        />
        <Line
          points={[midX + sz, midY - sz, midX - sz, midY + sz]}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
        />
      </Group>
    );
  }, [assignment.blockType, midX, midY, color, strokeWidth, strokeScale]);

  // Pass protection: curved/short line
  const isPassPro = assignment.blockType === 'pass-pro';

  return (
    <Group onClick={handleClick} onTap={handleClick}>
      {/* For pull/trap, draw the Arrow directly */}
      {pullArrow}

      {/* For drive/reach/down/pass-pro/zone/double/man/custom: draw a plain line */}
      {!pullArrow && (
        <Line
          points={points}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
          dash={isPassPro ? [4 * strokeScale, 4 * strokeScale] : undefined}
          hitStrokeWidth={10 * strokeScale}
        />
      )}

      {/* End symbols */}
      {driveBlockEndSymbol}
      {cutSymbol}
    </Group>
  );
}

export default BlockingLine;
