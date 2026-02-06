'use client';

import React, { useMemo } from 'react';
import { Group, Line, Circle, Text } from 'react-konva';
import { measureDistance, getMidpoint } from '@/lib/measurement';
import type { Position, FieldDimensions } from '@/types';

// ============================================================
// RulerTool — Draggable ruler line showing yard distance
// ============================================================

const RULER_COLOR = '#f59e0b'; // amber
const RULER_STROKE_WIDTH = 2;
const ENDPOINT_RADIUS = 6;
const ENDPOINT_FILL = '#ffffff';
const ENDPOINT_STROKE = '#f59e0b';
const LABEL_FONT_SIZE = 13;
const LABEL_BG_COLOR = 'rgba(0, 0, 0, 0.7)';
const LABEL_TEXT_COLOR = '#ffffff';
const LABEL_PADDING = 4;

export interface RulerToolProps {
  startPoint: Position;
  endPoint: Position;
  fieldWidth: number;
  fieldHeight: number;
  onUpdate?: (start: Position, end: Position) => void;
}

export function RulerTool({
  startPoint,
  endPoint,
  fieldWidth,
  fieldHeight,
  onUpdate,
}: RulerToolProps) {
  const fieldDims: FieldDimensions = useMemo(
    () => ({
      width: fieldWidth,
      height: fieldHeight,
      yardsVisible: 30,
      lineOfScrimmageY: fieldHeight / 2,
    }),
    [fieldWidth, fieldHeight],
  );

  const distance = useMemo(
    () => measureDistance(startPoint, endPoint, fieldDims),
    [startPoint, endPoint, fieldDims],
  );

  const midpoint = useMemo(
    () => getMidpoint(startPoint, endPoint),
    [startPoint, endPoint],
  );

  const label = `${distance} yds`;

  const handleStartDrag = (e: any) => {
    const pos = e.target.position();
    onUpdate?.({ x: pos.x, y: pos.y }, endPoint);
  };

  const handleEndDrag = (e: any) => {
    const pos = e.target.position();
    onUpdate?.(startPoint, { x: pos.x, y: pos.y });
  };

  return (
    <Group>
      {/* Ruler line */}
      <Line
        points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
        stroke={RULER_COLOR}
        strokeWidth={RULER_STROKE_WIDTH}
        dash={[6, 4]}
        listening={false}
      />

      {/* Distance label background */}
      <Text
        x={midpoint.x - 25}
        y={midpoint.y - LABEL_FONT_SIZE - LABEL_PADDING}
        text={label}
        fontSize={LABEL_FONT_SIZE}
        fill={LABEL_TEXT_COLOR}
        padding={LABEL_PADDING}
        listening={false}
      />

      {/* Start endpoint (draggable) */}
      <Circle
        x={startPoint.x}
        y={startPoint.y}
        radius={ENDPOINT_RADIUS}
        fill={ENDPOINT_FILL}
        stroke={ENDPOINT_STROKE}
        strokeWidth={2}
        draggable
        onDragEnd={handleStartDrag}
      />

      {/* End endpoint (draggable) */}
      <Circle
        x={endPoint.x}
        y={endPoint.y}
        radius={ENDPOINT_RADIUS}
        fill={ENDPOINT_FILL}
        stroke={ENDPOINT_STROKE}
        strokeWidth={2}
        draggable
        onDragEnd={handleEndDrag}
      />
    </Group>
  );
}

export default RulerTool;
