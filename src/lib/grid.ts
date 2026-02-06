import type { Position } from '@/types';

// ============================================================
// Grid — Snap-to-grid utilities and grid line generation
// ============================================================

/** Available preset grid sizes in pixels */
export const DEFAULT_GRID_SIZES: readonly number[] = [5, 10, 15, 20];

/** Default grid size in pixels */
export const DEFAULT_GRID_SIZE = 10;

/**
 * Snap a position to the nearest grid point.
 * Both x and y are independently rounded to the nearest multiple of gridSize.
 */
export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Generate arrays of x and y coordinates for drawing grid lines.
 *
 * @param fieldWidth  - Total width of the field canvas in pixels
 * @param fieldHeight - Total height of the field canvas in pixels
 * @param gridSize    - Distance between grid lines in pixels
 * @returns Object with arrays of x coordinates (vertical lines) and y coordinates (horizontal lines)
 */
export function generateGridLines(
  fieldWidth: number,
  fieldHeight: number,
  gridSize: number,
): { x: number[]; y: number[] } {
  const xLines: number[] = [];
  const yLines: number[] = [];

  // Generate vertical grid lines (x positions)
  for (let x = gridSize; x < fieldWidth; x += gridSize) {
    xLines.push(x);
  }

  // Generate horizontal grid lines (y positions)
  for (let y = gridSize; y < fieldHeight; y += gridSize) {
    yLines.push(y);
  }

  return { x: xLines, y: yLines };
}

/**
 * Check if a given grid line position is at a major interval.
 * Major intervals are every 5th grid line for visual emphasis.
 */
export function isMajorGridLine(position: number, gridSize: number): boolean {
  const gridIndex = Math.round(position / gridSize);
  return gridIndex % 5 === 0;
}
