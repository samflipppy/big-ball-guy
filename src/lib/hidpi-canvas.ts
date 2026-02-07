/**
 * High-DPI Canvas Rendering (#261)
 *
 * Utilities for scaling canvas rendering on Retina / high-DPI displays
 * while keeping performance acceptable when many players are on screen.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sensible cap so we don't over-allocate GPU memory on 3x/4x screens */
const MAX_DPR = 3;

/** Default maximum total pixel count before we trade quality for speed */
const DEFAULT_MAX_PIXELS = 4_000_000; // ~2000x2000

/** Above this player count at low zoom we disable high DPI for perf */
const HIGH_PLAYER_THRESHOLD = 50;
const LOW_ZOOM_THRESHOLD = 0.5;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the current device pixel ratio, clamped to a reasonable max.
 * Falls back to 1 when running outside a browser (SSR / tests).
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio ?? 1, MAX_DPR);
}

/**
 * Scales a `<canvas>` element so it renders crisply on high-DPI screens.
 *
 * Sets the canvas buffer dimensions to `width * dpr` x `height * dpr` and
 * uses CSS sizing to keep the element at the logical `width` x `height`.
 * Also applies `context.scale(dpr, dpr)` so subsequent draw calls use
 * logical (CSS) coordinates.
 *
 * @returns The device pixel ratio that was applied, or 1 if setup failed.
 */
export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): number {
  const dpr = getDevicePixelRatio();

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  return dpr;
}

/**
 * Converts logical (CSS) coordinates to physical (canvas buffer) coordinates
 * by multiplying by the device pixel ratio.
 */
export function hiDPICoordinates(
  x: number,
  y: number,
  dpr: number,
): { x: number; y: number } {
  return {
    x: x * dpr,
    y: y * dpr,
  };
}

/**
 * Given a container size, returns the optimal canvas resolution that
 * balances visual quality and performance.
 *
 * If the full retina resolution exceeds `maxPixels`, the effective DPR
 * is reduced so that total pixel count stays under the budget.
 */
export function getOptimalResolution(
  containerWidth: number,
  containerHeight: number,
  maxPixels: number = DEFAULT_MAX_PIXELS,
): { width: number; height: number; dpr: number } {
  const baseDpr = getDevicePixelRatio();
  const fullPixels = containerWidth * baseDpr * (containerHeight * baseDpr);

  if (fullPixels <= maxPixels) {
    return {
      width: Math.round(containerWidth * baseDpr),
      height: Math.round(containerHeight * baseDpr),
      dpr: baseDpr,
    };
  }

  // Scale down the DPR so we stay within budget
  const scale = Math.sqrt(maxPixels / (containerWidth * containerHeight));
  const effectiveDpr = Math.max(1, Math.min(baseDpr, scale));

  return {
    width: Math.round(containerWidth * effectiveDpr),
    height: Math.round(containerHeight * effectiveDpr),
    dpr: effectiveDpr,
  };
}

/**
 * Heuristic: should the canvas use high-DPI rendering?
 *
 * Returns `false` when there are many players AND the zoom is low,
 * because at that combination the GPU cost of a 2x/3x buffer outweighs
 * the visual benefit.
 */
export function shouldUseHighDPI(
  playerCount: number,
  zoom: number,
): boolean {
  if (playerCount > HIGH_PLAYER_THRESHOLD && zoom < LOW_ZOOM_THRESHOLD) {
    return false;
  }
  return true;
}
