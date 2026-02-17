'use client';

import React, { useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Text } from 'react-konva';
import {
  CANVAS_BG_COLOR,
  CANVAS_BG_COLOR_DARK,
  LINE_COLOR,
  HASH_COLOR,
  GRID_COLOR,
} from '@/lib/constants';

export interface FieldCanvasProps {
  width: number;
  height: number;
  yardsVisible?: number;
  lineOfScrimmageY?: number;
  darkMode?: boolean;
  zoom?: number;
  panX?: number;
  panY?: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (x: number, y: number) => void;
  panMode?: boolean;
  children?: React.ReactNode;
  onStageMouseDown?: (e: any) => void;
  onStageMouseMove?: (e: any) => void;
  onStageMouseUp?: (e: any) => void;
  cursorStyle?: string;
}

// Field numbers displayed at each 10-yard interval
const FIELD_NUMBERS = [10, 20, 30, 40, 50, 40, 30, 20, 10];

export function FieldCanvas({
  width,
  height,
  yardsVisible = 30,
  lineOfScrimmageY,
  darkMode = false,
  zoom = 1,
  panX = 0,
  panY = 0,
  onZoomChange,
  onPanChange,
  panMode = false,
  children,
  onStageMouseDown,
  onStageMouseMove,
  onStageMouseUp,
  cursorStyle = 'default',
}: FieldCanvasProps) {
  const bgColor = darkMode ? CANVAS_BG_COLOR_DARK : CANVAS_BG_COLOR;
  const yardSpacing = height / yardsVisible;

  // Standard field width is 53.33 yards
  const fieldWidthYards = 53.33;
  const pixelsPerYard = width / fieldWidthYards;

  // Hash mark positions (NFL: 23.58 yards from sideline, college: 20 yards)
  const leftHash = 20 * pixelsPerYard;
  const rightHash = (fieldWidthYards - 20) * pixelsPerYard;

  // LOS defaults to middle of canvas
  const losY = lineOfScrimmageY ?? height * 0.5;

  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const oldZoom = zoom;
      const newZoom =
        e.evt.deltaY < 0
          ? Math.min(oldZoom * scaleBy, 5)
          : Math.max(oldZoom / scaleBy, 0.25);
      onZoomChange?.(newZoom);
    },
    [zoom, onZoomChange],
  );

  const handleDragEnd = useCallback(
    (e: any) => {
      if (panMode) {
        onPanChange?.(e.target.x(), e.target.y());
      }
    },
    [panMode, onPanChange],
  );

  // Build yard lines, hash marks, and numbers
  const yardLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const hashLength = 4;
    const hashSpacing = yardSpacing / 5; // minor hash every 1 yard

    // Draw yard lines every 5 yards across the visible range
    for (let i = 0; i <= yardsVisible; i++) {
      const y = i * yardSpacing;
      const isFiveYard = i % 5 === 0;

      if (isFiveYard) {
        // Major yard line
        lines.push(
          <Line
            key={`yard-${i}`}
            points={[0, y, width, y]}
            stroke={LINE_COLOR}
            strokeWidth={1}
            opacity={0.6}
          />,
        );
      } else {
        // Minor hash marks at each 1-yard interval
        // Left sideline hash
        lines.push(
          <Line
            key={`hash-l-${i}`}
            points={[0, y, hashLength * 2, y]}
            stroke={HASH_COLOR}
            strokeWidth={0.5}
          />,
        );
        // Right sideline hash
        lines.push(
          <Line
            key={`hash-r-${i}`}
            points={[width - hashLength * 2, y, width, y]}
            stroke={HASH_COLOR}
            strokeWidth={0.5}
          />,
        );
        // Left hash mark
        lines.push(
          <Line
            key={`hash-lh-${i}`}
            points={[leftHash - hashLength, y, leftHash + hashLength, y]}
            stroke={HASH_COLOR}
            strokeWidth={0.5}
          />,
        );
        // Right hash mark
        lines.push(
          <Line
            key={`hash-rh-${i}`}
            points={[rightHash - hashLength, y, rightHash + hashLength, y]}
            stroke={HASH_COLOR}
            strokeWidth={0.5}
          />,
        );
      }
    }

    return lines;
  }, [width, height, yardsVisible, yardSpacing, leftHash, rightHash]);

  // Field numbers at 10-yard increments
  const fieldNumbers = useMemo(() => {
    const nums: React.ReactNode[] = [];
    const fontSize = Math.max(12, width * 0.025);

    // Calculate how many 10-yard blocks we can show
    for (let i = 0; i < FIELD_NUMBERS.length; i++) {
      const yardFromEndzone = (i + 1) * 10;
      // Position relative to what's visible on canvas
      // We center the view so LOS is in the middle
      const y = losY - (yardFromEndzone - yardsVisible / 2) * yardSpacing;

      if (y < -fontSize || y > height + fontSize) continue;

      // Left side number
      nums.push(
        <Text
          key={`num-l-${i}`}
          x={leftHash - 40}
          y={y - fontSize / 2}
          text={String(FIELD_NUMBERS[i])}
          fontSize={fontSize}
          fill={LINE_COLOR}
          opacity={0.3}
          fontStyle="bold"
          align="center"
          width={30}
        />,
      );
      // Right side number
      nums.push(
        <Text
          key={`num-r-${i}`}
          x={rightHash + 10}
          y={y - fontSize / 2}
          text={String(FIELD_NUMBERS[i])}
          fontSize={fontSize}
          fill={LINE_COLOR}
          opacity={0.3}
          fontStyle="bold"
          align="center"
          width={30}
        />,
      );
    }
    return nums;
  }, [losY, yardsVisible, yardSpacing, height, width, leftHash, rightHash]);

  // Line of scrimmage
  const losLine = useMemo(() => {
    if (losY == null) return null;
    return (
      <Line
        key="los"
        points={[0, losY, width, losY]}
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[8, 4]}
        opacity={0.8}
      />
    );
  }, [losY, width]);

  // Sideline boundaries
  const sidelines = useMemo(() => {
    return [
      <Line
        key="sideline-left"
        points={[1, 0, 1, height]}
        stroke={LINE_COLOR}
        strokeWidth={2}
        opacity={0.5}
      />,
      <Line
        key="sideline-right"
        points={[width - 1, 0, width - 1, height]}
        stroke={LINE_COLOR}
        strokeWidth={2}
        opacity={0.5}
      />,
    ];
  }, [width, height]);

  // End zone indicators
  const endZones = useMemo(() => {
    const zones: React.ReactNode[] = [];
    const endZoneHeight = 10 * yardSpacing; // 10 yards deep

    // Top end zone (visible if scrolled)
    zones.push(
      <Rect
        key="endzone-top"
        x={0}
        y={-endZoneHeight}
        width={width}
        height={endZoneHeight}
        fill={darkMode ? '#1a2e1a' : '#1e4620'}
        opacity={0.5}
      />,
    );

    // Bottom end zone
    zones.push(
      <Rect
        key="endzone-bottom"
        x={0}
        y={height}
        width={width}
        height={endZoneHeight}
        fill={darkMode ? '#1a2e1a' : '#1e4620'}
        opacity={0.5}
      />,
    );

    return zones;
  }, [width, height, yardSpacing, darkMode]);

  return (
    <Stage
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={panX}
      y={panY}
      draggable={panMode}
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
      onMouseDown={onStageMouseDown}
      onMouseMove={onStageMouseMove}
      onMouseUp={onStageMouseUp}
      onTouchStart={onStageMouseDown}
      onTouchMove={onStageMouseMove}
      onTouchEnd={onStageMouseUp}
      style={{ cursor: cursorStyle }}
    >
      <Layer>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill={bgColor} />

        {/* End zones */}
        {endZones}

        {/* Sidelines */}
        {sidelines}

        {/* Yard lines and hash marks */}
        {yardLines}

        {/* Field numbers */}
        {fieldNumbers}

        {/* Line of scrimmage */}
        {losLine}
      </Layer>
      {/* Additional layers from children (players, routes, etc.) */}
      {children}
    </Stage>
  );
}

export default FieldCanvas;
