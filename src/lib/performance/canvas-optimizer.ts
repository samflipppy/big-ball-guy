/**
 * Canvas Rendering Optimization (#220)
 *
 * Provides frustum culling, level-of-detail selection, and batched
 * rendering utilities to keep the play-diagram canvas performant
 * even when hundreds of players are on the field.
 */

import type { Position } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LODLevel = 'high' | 'medium' | 'low';

export interface BatchGroup {
  lod: LODLevel;
  players: Position[];
}

// ---------------------------------------------------------------------------
// Frustum Culling
// ---------------------------------------------------------------------------

/**
 * Determine whether a single player position falls inside the visible
 * viewport (expanded slightly by a margin derived from the zoom level so
 * players at the edge aren't popped in/out abruptly).
 */
export function shouldRenderPlayer(
  player: Position,
  viewport: Viewport,
  zoom: number,
): boolean {
  // margin grows as we zoom out so off-screen players are pre-rendered
  const margin = 50 / Math.max(zoom, 0.1);

  const left = viewport.x - margin;
  const right = viewport.x + viewport.width + margin;
  const top = viewport.y - margin;
  const bottom = viewport.y + viewport.height + margin;

  return (
    player.x >= left &&
    player.x <= right &&
    player.y >= top &&
    player.y <= bottom
  );
}

/**
 * Filter a full list of players down to only those visible in the current
 * viewport at the given zoom level.
 */
export function getVisiblePlayers(
  players: Position[],
  viewport: Viewport,
  zoom: number,
): Position[] {
  return players.filter((p) => shouldRenderPlayer(p, viewport, zoom));
}

// ---------------------------------------------------------------------------
// Level of Detail
// ---------------------------------------------------------------------------

/**
 * Pick a level-of-detail tier based on the current zoom factor.
 *
 * - `high`   (zoom >= 1)   : full labels, shadows, detailed helmets
 * - `medium` (zoom >= 0.5) : labels, no shadows
 * - `low`    (zoom < 0.5)  : simple circles, no text
 */
export function getLOD(zoom: number): LODLevel {
  if (zoom >= 1) return 'high';
  if (zoom >= 0.5) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Batch Rendering
// ---------------------------------------------------------------------------

/**
 * Groups players into a single batch render call so that the canvas context
 * doesn't switch draw-state per player. Returns a `BatchGroup` containing
 * the LOD tier and the full player list (the caller decides how to draw
 * each tier).
 */
export function batchRenderPlayers(
  players: Position[],
  lod: string,
): BatchGroup {
  return {
    lod: lod as LODLevel,
    players: [...players],
  };
}
