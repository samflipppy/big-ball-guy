/**
 * Apple Pencil Pressure-Sensitive Drawing
 *
 * Utilities for handling Apple Pencil (and other stylus) input,
 * including pressure normalization, line width mapping, and smoothing.
 */

export interface PencilEvent {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  timestamp: number;
}

/**
 * Extract and normalize pressure from a PointerEvent.
 * Returns a value between 0 and 1. Falls back to 0.5 for non-pressure devices.
 */
export function normalizePressure(event: PointerEvent): number {
  // Pointer events report pressure as 0-1 for pen; 0.5 for mouse with no pressure
  // If the pointer type is not pen, return 0.5 as default
  if (event.pointerType !== 'pen') {
    return 0.5;
  }

  const pressure = event.pressure;

  // Clamp between 0 and 1
  if (pressure <= 0) return 0;
  if (pressure >= 1) return 1;

  return pressure;
}

/**
 * Map a pressure value (0-1) to a line width between minWidth and maxWidth.
 * Uses a slight ease-in curve for more natural feel.
 */
export function pressureToLineWidth(
  pressure: number,
  minWidth: number,
  maxWidth: number,
): number {
  // Clamp pressure
  const clampedPressure = Math.max(0, Math.min(1, pressure));

  // Apply a slight ease-in curve (power of 1.5) for more natural pen feel
  const curved = Math.pow(clampedPressure, 1.5);

  // Linearly interpolate between minWidth and maxWidth
  return minWidth + curved * (maxWidth - minWidth);
}

/**
 * Smooth pressure values over a sliding window to reduce jitter.
 * Uses a simple moving average over the last `windowSize` events.
 */
export function smoothPressure(
  events: PencilEvent[],
  windowSize: number = 5,
): PencilEvent[] {
  if (events.length === 0) return [];
  if (windowSize <= 1) return [...events];

  return events.map((event, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = events.slice(start, index + 1);
    const avgPressure =
      window.reduce((sum, e) => sum + e.pressure, 0) / window.length;

    return {
      ...event,
      pressure: avgPressure,
    };
  });
}

/**
 * Detect whether a PointerEvent originated from a stylus (pen) input
 * rather than a finger (touch) or mouse.
 */
export function isStylusInput(event: PointerEvent): boolean {
  return event.pointerType === 'pen';
}

/**
 * Convert a PointerEvent to a PencilEvent with normalized values.
 */
export function pointerToPencilEvent(event: PointerEvent): PencilEvent {
  return {
    x: event.clientX,
    y: event.clientY,
    pressure: normalizePressure(event),
    tiltX: event.tiltX ?? 0,
    tiltY: event.tiltY ?? 0,
    timestamp: event.timeStamp,
  };
}
