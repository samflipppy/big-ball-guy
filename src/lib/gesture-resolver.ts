/**
 * Touch Gesture Conflict Resolution
 *
 * Resolves conflicts between drawing, panning, and zooming gestures
 * based on touch count, canvas mode, and gesture state.
 */

export type GestureType = 'pan' | 'zoom' | 'draw' | 'tap' | 'long-press';

export interface GestureState {
  type: GestureType;
  startTime: number;
  startPoints: { x: number; y: number }[];
  currentPoints: { x: number; y: number }[];
}

// Threshold for long-press detection in milliseconds
const LONG_PRESS_THRESHOLD = 500;

// Threshold for distinguishing tap from drag (in pixels)
const TAP_DISTANCE_THRESHOLD = 10;

/**
 * Determine the intended gesture from the current touch state and canvas mode.
 *
 * Rules:
 * - 1 finger in draw mode = draw
 * - 1 finger in select mode = pan
 * - 2 fingers = zoom (regardless of mode)
 * - 3+ fingers = pan (system gesture passthrough)
 */
export function resolveGesture(
  touches: Touch[],
  canvasMode: string,
): GestureType {
  const touchCount = touches.length;

  if (touchCount === 0) {
    return 'tap';
  }

  if (touchCount >= 2) {
    return 'zoom';
  }

  // Single finger
  if (touchCount === 1) {
    const drawModes = [
      'draw-route',
      'draw-block',
      'draw-motion',
      'draw-zone',
      'draw',
      'eraser',
    ];

    if (drawModes.includes(canvasMode)) {
      return 'draw';
    }

    return 'pan';
  }

  return 'pan';
}

/**
 * Create an initial GestureState from the current touches.
 */
export function createGestureState(
  type: GestureType,
  touches: Touch[],
): GestureState {
  const points = Array.from(touches).map((t) => ({
    x: t.clientX,
    y: t.clientY,
  }));

  return {
    type,
    startTime: Date.now(),
    startPoints: points,
    currentPoints: [...points],
  };
}

/**
 * Update the current points of an existing gesture state.
 */
export function updateGestureState(
  state: GestureState,
  touches: Touch[],
): GestureState {
  const currentPoints = Array.from(touches).map((t) => ({
    x: t.clientX,
    y: t.clientY,
  }));

  return {
    ...state,
    currentPoints,
  };
}

/**
 * Check if the gesture is a drawing gesture.
 */
export function isDrawingGesture(gesture: GestureState): boolean {
  return gesture.type === 'draw';
}

/**
 * Check if the gesture is a pan gesture.
 */
export function isPanGesture(gesture: GestureState): boolean {
  return gesture.type === 'pan';
}

/**
 * Check if the gesture is a zoom gesture.
 */
export function isZoomGesture(gesture: GestureState): boolean {
  return gesture.type === 'zoom';
}

/**
 * Check if a gesture qualifies as a tap (short duration, minimal movement).
 */
export function isTapGesture(gesture: GestureState): boolean {
  if (gesture.startPoints.length === 0 || gesture.currentPoints.length === 0) {
    return false;
  }

  const elapsed = Date.now() - gesture.startTime;
  if (elapsed >= LONG_PRESS_THRESHOLD) return false;

  const start = gesture.startPoints[0];
  const current = gesture.currentPoints[0];
  const distance = Math.sqrt(
    Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2),
  );

  return distance < TAP_DISTANCE_THRESHOLD;
}

/**
 * Check if a gesture qualifies as a long press (held in place without moving).
 */
export function isLongPressGesture(gesture: GestureState): boolean {
  if (gesture.startPoints.length === 0 || gesture.currentPoints.length === 0) {
    return false;
  }

  const elapsed = Date.now() - gesture.startTime;
  if (elapsed < LONG_PRESS_THRESHOLD) return false;

  const start = gesture.startPoints[0];
  const current = gesture.currentPoints[0];
  const distance = Math.sqrt(
    Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2),
  );

  return distance < TAP_DISTANCE_THRESHOLD;
}

/**
 * Calculate the pinch zoom scale factor from a two-finger gesture.
 */
export function getPinchScale(gesture: GestureState): number {
  if (gesture.startPoints.length < 2 || gesture.currentPoints.length < 2) {
    return 1;
  }

  const startDist = Math.sqrt(
    Math.pow(gesture.startPoints[1].x - gesture.startPoints[0].x, 2) +
    Math.pow(gesture.startPoints[1].y - gesture.startPoints[0].y, 2),
  );

  const currentDist = Math.sqrt(
    Math.pow(gesture.currentPoints[1].x - gesture.currentPoints[0].x, 2) +
    Math.pow(gesture.currentPoints[1].y - gesture.currentPoints[0].y, 2),
  );

  if (startDist === 0) return 1;

  return currentDist / startDist;
}
