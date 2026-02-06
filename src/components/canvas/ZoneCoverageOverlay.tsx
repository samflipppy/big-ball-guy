'use client';

import React, { useMemo } from 'react';
import { Group, Rect, Text } from 'react-konva';

// ============================================================
// ZoneCoverageOverlay — Renders semi-transparent zone coverage
// ============================================================

/** Colors for different zone types */
const ZONE_COLORS = {
  deep: 'rgba(59, 130, 246, 0.25)',       // blue for deep zones
  underneath: 'rgba(234, 179, 8, 0.25)',   // yellow for underneath zones
  flat: 'rgba(34, 197, 94, 0.25)',         // green for flat zones
};

const ZONE_LABEL_COLOR = 'rgba(255, 255, 255, 0.7)';
const ZONE_LABEL_FONT_SIZE = 11;

export interface ZoneCoverageOverlayProps {
  coverage: string;
  fieldWidth: number;
  fieldHeight: number;
  opacity?: number;
}

interface ZoneRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
}

/**
 * Build zone rectangles for Cover 2 scheme.
 * 2 deep halves + 5 underneath zones.
 */
function buildCover2Zones(
  fw: number,
  fh: number,
  opacity: number,
): ZoneRect[] {
  const deepTop = 0;
  const deepHeight = fh * 0.4;
  const underTop = deepHeight;
  const underHeight = fh - deepHeight;

  return [
    // Deep halves
    { x: 0, y: deepTop, width: fw / 2, height: deepHeight, color: ZONE_COLORS.deep, label: 'Deep Half' },
    { x: fw / 2, y: deepTop, width: fw / 2, height: deepHeight, color: ZONE_COLORS.deep, label: 'Deep Half' },
    // Underneath zones (5 zones)
    { x: 0, y: underTop, width: fw * 0.15, height: underHeight, color: ZONE_COLORS.flat, label: 'Flat' },
    { x: fw * 0.15, y: underTop, width: fw * 0.2, height: underHeight, color: ZONE_COLORS.underneath, label: 'Hook' },
    { x: fw * 0.35, y: underTop, width: fw * 0.3, height: underHeight, color: ZONE_COLORS.underneath, label: 'Middle' },
    { x: fw * 0.65, y: underTop, width: fw * 0.2, height: underHeight, color: ZONE_COLORS.underneath, label: 'Hook' },
    { x: fw * 0.85, y: underTop, width: fw * 0.15, height: underHeight, color: ZONE_COLORS.flat, label: 'Flat' },
  ];
}

/**
 * Build zone rectangles for Cover 3 scheme.
 * 3 deep thirds + 4 underneath zones.
 */
function buildCover3Zones(
  fw: number,
  fh: number,
  opacity: number,
): ZoneRect[] {
  const deepTop = 0;
  const deepHeight = fh * 0.4;
  const underTop = deepHeight;
  const underHeight = fh - deepHeight;
  const thirdWidth = fw / 3;

  return [
    // Deep thirds
    { x: 0, y: deepTop, width: thirdWidth, height: deepHeight, color: ZONE_COLORS.deep, label: 'Deep Third' },
    { x: thirdWidth, y: deepTop, width: thirdWidth, height: deepHeight, color: ZONE_COLORS.deep, label: 'Deep Third' },
    { x: thirdWidth * 2, y: deepTop, width: thirdWidth, height: deepHeight, color: ZONE_COLORS.deep, label: 'Deep Third' },
    // Underneath zones (4)
    { x: 0, y: underTop, width: fw * 0.25, height: underHeight, color: ZONE_COLORS.flat, label: 'Flat' },
    { x: fw * 0.25, y: underTop, width: fw * 0.25, height: underHeight, color: ZONE_COLORS.underneath, label: 'Curl' },
    { x: fw * 0.5, y: underTop, width: fw * 0.25, height: underHeight, color: ZONE_COLORS.underneath, label: 'Curl' },
    { x: fw * 0.75, y: underTop, width: fw * 0.25, height: underHeight, color: ZONE_COLORS.flat, label: 'Flat' },
  ];
}

/**
 * Build zone rectangles for Cover 4 scheme.
 * 4 deep quarters.
 */
function buildCover4Zones(
  fw: number,
  fh: number,
  opacity: number,
): ZoneRect[] {
  const deepTop = 0;
  const deepHeight = fh * 0.4;
  const underTop = deepHeight;
  const underHeight = fh - deepHeight;
  const quarterWidth = fw / 4;

  return [
    // Deep quarters
    { x: 0, y: deepTop, width: quarterWidth, height: deepHeight, color: ZONE_COLORS.deep, label: 'Quarter' },
    { x: quarterWidth, y: deepTop, width: quarterWidth, height: deepHeight, color: ZONE_COLORS.deep, label: 'Quarter' },
    { x: quarterWidth * 2, y: deepTop, width: quarterWidth, height: deepHeight, color: ZONE_COLORS.deep, label: 'Quarter' },
    { x: quarterWidth * 3, y: deepTop, width: quarterWidth, height: deepHeight, color: ZONE_COLORS.deep, label: 'Quarter' },
    // Underneath zones (3)
    { x: 0, y: underTop, width: fw * 0.2, height: underHeight, color: ZONE_COLORS.flat, label: 'Flat' },
    { x: fw * 0.2, y: underTop, width: fw * 0.6, height: underHeight, color: ZONE_COLORS.underneath, label: 'Middle' },
    { x: fw * 0.8, y: underTop, width: fw * 0.2, height: underHeight, color: ZONE_COLORS.flat, label: 'Flat' },
  ];
}

/**
 * Normalize a coverage string to a canonical key.
 */
function normalizeCoverage(coverage: string): string {
  return coverage
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('cover-', 'cover-');
}

export function ZoneCoverageOverlay({
  coverage,
  fieldWidth,
  fieldHeight,
  opacity = 1,
}: ZoneCoverageOverlayProps) {
  const zones = useMemo(() => {
    const key = normalizeCoverage(coverage);

    switch (key) {
      case 'cover-2':
        return buildCover2Zones(fieldWidth, fieldHeight, opacity);
      case 'cover-3':
        return buildCover3Zones(fieldWidth, fieldHeight, opacity);
      case 'cover-4':
      case 'quarters':
        return buildCover4Zones(fieldWidth, fieldHeight, opacity);
      default:
        return [];
    }
  }, [coverage, fieldWidth, fieldHeight, opacity]);

  if (zones.length === 0) return null;

  return (
    <Group listening={false}>
      {zones.map((zone, i) => (
        <React.Fragment key={`zone-${i}`}>
          <Rect
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill={zone.color}
            opacity={opacity}
            listening={false}
          />
          <Text
            x={zone.x + zone.width / 2 - 20}
            y={zone.y + zone.height / 2 - 6}
            text={zone.label}
            fontSize={ZONE_LABEL_FONT_SIZE}
            fill={ZONE_LABEL_COLOR}
            listening={false}
          />
        </React.Fragment>
      ))}
    </Group>
  );
}

export default ZoneCoverageOverlay;
