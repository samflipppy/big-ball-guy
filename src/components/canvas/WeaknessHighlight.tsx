import React from 'react';
import { Rect, Text, Group } from 'react-konva';
import { DEFAULT_FIELD, SCOUTING_COLORS } from '@/lib/constants';

// ============================================================
// WeaknessHighlight — Colored overlays on field zones
// ============================================================

export interface Weakness {
  zone: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface WeaknessHighlightProps {
  weaknesses: Weakness[];
}

const SEVERITY_OPACITY: Record<string, number> = {
  low: 0.15,
  medium: 0.3,
  high: 0.45,
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#f59e0b',     // amber
  medium: '#f97316',  // orange
  high: '#ef4444',    // red
};

/**
 * Convert a zone name to a canvas rectangle.
 * Supports: left, middle, right, deep-left, deep-middle, deep-right,
 * short-left, short-middle, short-right.
 */
export function getZoneRect(zone: string): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const fieldW = DEFAULT_FIELD.width;
  const losY = DEFAULT_FIELD.lineOfScrimmageY;
  const thirdW = fieldW / 3;
  const halfH = losY / 2;

  // Parse zone into depth + side
  const parts = zone.toLowerCase().split('-');

  let x = 0;
  let y = 0;
  let width = thirdW;
  let height = losY;

  if (parts.length === 1) {
    // Simple: left, middle, right (full depth above LOS)
    switch (parts[0]) {
      case 'left':
        x = 0;
        break;
      case 'middle':
        x = thirdW;
        break;
      case 'right':
        x = thirdW * 2;
        break;
      default:
        x = 0;
        width = fieldW;
    }
    y = 0;
    height = losY;
  } else if (parts.length === 2) {
    // Compound: deep-left, short-middle, etc.
    const [depth, side] = parts;

    switch (side) {
      case 'left':
        x = 0;
        break;
      case 'middle':
        x = thirdW;
        break;
      case 'right':
        x = thirdW * 2;
        break;
      default:
        x = 0;
        width = fieldW;
    }

    switch (depth) {
      case 'deep':
        y = 0;
        height = halfH;
        break;
      case 'short':
        y = halfH;
        height = halfH;
        break;
      default:
        y = 0;
        height = losY;
    }
  }

  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

export function WeaknessHighlight({ weaknesses }: WeaknessHighlightProps) {
  if (!weaknesses || weaknesses.length === 0) return null;

  return (
    <Group>
      {weaknesses.map((w, index) => {
        const rect = getZoneRect(w.zone);
        const color = SEVERITY_COLORS[w.severity] ?? SEVERITY_COLORS.medium;
        const opacity = SEVERITY_OPACITY[w.severity] ?? SEVERITY_OPACITY.medium;

        return (
          <Group key={`weakness-${index}`}>
            <Rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={color}
              opacity={opacity}
            />
            <Text
              x={rect.x + 4}
              y={rect.y + 4}
              text={w.description}
              fontSize={11}
              fill="#ffffff"
              opacity={0.9}
              width={rect.width - 8}
            />
          </Group>
        );
      })}
    </Group>
  );
}
