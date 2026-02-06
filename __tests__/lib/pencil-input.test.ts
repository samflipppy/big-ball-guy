import { describe, it, expect } from 'vitest';
import {
  normalizePressure,
  pressureToLineWidth,
  smoothPressure,
  isStylusInput,
  pointerToPencilEvent,
  type PencilEvent,
} from '@/lib/pencil-input';

// Helper to create a mock PointerEvent
function createPointerEvent(overrides: Partial<PointerEvent> = {}): PointerEvent {
  return {
    pointerType: 'pen',
    pressure: 0.5,
    tiltX: 0,
    tiltY: 0,
    clientX: 100,
    clientY: 200,
    timeStamp: 1000,
    ...overrides,
  } as unknown as PointerEvent;
}

describe('pencil-input', () => {
  describe('normalizePressure', () => {
    it('returns pressure value for pen pointer type', () => {
      const event = createPointerEvent({ pointerType: 'pen', pressure: 0.7 });
      expect(normalizePressure(event)).toBe(0.7);
    });

    it('returns 0.5 for non-pen pointer types', () => {
      const mouseEvent = createPointerEvent({ pointerType: 'mouse', pressure: 0.3 });
      expect(normalizePressure(mouseEvent)).toBe(0.5);

      const touchEvent = createPointerEvent({ pointerType: 'touch', pressure: 0.8 });
      expect(normalizePressure(touchEvent)).toBe(0.5);
    });

    it('clamps pressure to 0 when negative', () => {
      const event = createPointerEvent({ pointerType: 'pen', pressure: -0.5 });
      expect(normalizePressure(event)).toBe(0);
    });

    it('clamps pressure to 1 when above 1', () => {
      const event = createPointerEvent({ pointerType: 'pen', pressure: 1.5 });
      expect(normalizePressure(event)).toBe(1);
    });

    it('returns 0 for zero pressure pen input', () => {
      const event = createPointerEvent({ pointerType: 'pen', pressure: 0 });
      expect(normalizePressure(event)).toBe(0);
    });

    it('returns 1 for full pressure pen input', () => {
      const event = createPointerEvent({ pointerType: 'pen', pressure: 1 });
      expect(normalizePressure(event)).toBe(1);
    });
  });

  describe('pressureToLineWidth', () => {
    it('returns minWidth at zero pressure', () => {
      expect(pressureToLineWidth(0, 1, 10)).toBe(1);
    });

    it('returns maxWidth at full pressure', () => {
      expect(pressureToLineWidth(1, 1, 10)).toBe(10);
    });

    it('returns a value between min and max for mid pressure', () => {
      const width = pressureToLineWidth(0.5, 1, 10);
      expect(width).toBeGreaterThan(1);
      expect(width).toBeLessThan(10);
    });

    it('applies ease-in curve (mid pressure maps below linear midpoint)', () => {
      const width = pressureToLineWidth(0.5, 0, 10);
      // Linear midpoint would be 5. With pow(0.5, 1.5) ≈ 0.354, result ≈ 3.54
      expect(width).toBeLessThan(5);
    });

    it('clamps negative pressure to 0', () => {
      expect(pressureToLineWidth(-0.5, 2, 8)).toBe(2);
    });

    it('clamps pressure above 1', () => {
      expect(pressureToLineWidth(1.5, 2, 8)).toBe(8);
    });

    it('handles equal min and max width', () => {
      expect(pressureToLineWidth(0.5, 5, 5)).toBe(5);
    });

    it('increases monotonically with pressure', () => {
      const w1 = pressureToLineWidth(0.2, 1, 10);
      const w2 = pressureToLineWidth(0.5, 1, 10);
      const w3 = pressureToLineWidth(0.8, 1, 10);
      expect(w1).toBeLessThan(w2);
      expect(w2).toBeLessThan(w3);
    });
  });

  describe('smoothPressure', () => {
    function makePencilEvents(pressures: number[]): PencilEvent[] {
      return pressures.map((p, i) => ({
        x: i * 10,
        y: i * 10,
        pressure: p,
        tiltX: 0,
        tiltY: 0,
        timestamp: i * 16,
      }));
    }

    it('returns empty array for empty input', () => {
      expect(smoothPressure([])).toEqual([]);
    });

    it('returns copy when windowSize is 1', () => {
      const events = makePencilEvents([0.5, 0.7]);
      const result = smoothPressure(events, 1);
      expect(result).toHaveLength(2);
      expect(result[0].pressure).toBe(0.5);
      expect(result[1].pressure).toBe(0.7);
    });

    it('smooths pressure values over window', () => {
      const events = makePencilEvents([0.2, 0.4, 0.6, 0.8, 1.0]);
      const result = smoothPressure(events, 3);

      // First element: average of [0.2] = 0.2
      expect(result[0].pressure).toBeCloseTo(0.2);
      // Second element: average of [0.2, 0.4] = 0.3
      expect(result[1].pressure).toBeCloseTo(0.3);
      // Third element: average of [0.2, 0.4, 0.6] = 0.4
      expect(result[2].pressure).toBeCloseTo(0.4);
      // Fourth element: average of [0.4, 0.6, 0.8] = 0.6
      expect(result[3].pressure).toBeCloseTo(0.6);
      // Fifth element: average of [0.6, 0.8, 1.0] = 0.8
      expect(result[4].pressure).toBeCloseTo(0.8);
    });

    it('preserves x, y, tilt, and timestamp', () => {
      const events = makePencilEvents([0.3, 0.7]);
      const result = smoothPressure(events, 2);
      expect(result[0].x).toBe(0);
      expect(result[0].y).toBe(0);
      expect(result[1].x).toBe(10);
      expect(result[1].y).toBe(10);
    });

    it('uses default windowSize of 5', () => {
      const events = makePencilEvents([1, 1, 1, 1, 1, 0]);
      const result = smoothPressure(events);
      // Last element: average of [1, 1, 1, 1, 0] = 0.8
      expect(result[5].pressure).toBeCloseTo(0.8);
    });

    it('handles single event', () => {
      const events = makePencilEvents([0.5]);
      const result = smoothPressure(events, 3);
      expect(result).toHaveLength(1);
      expect(result[0].pressure).toBe(0.5);
    });
  });

  describe('isStylusInput', () => {
    it('returns true for pen pointer type', () => {
      const event = createPointerEvent({ pointerType: 'pen' });
      expect(isStylusInput(event)).toBe(true);
    });

    it('returns false for touch pointer type', () => {
      const event = createPointerEvent({ pointerType: 'touch' });
      expect(isStylusInput(event)).toBe(false);
    });

    it('returns false for mouse pointer type', () => {
      const event = createPointerEvent({ pointerType: 'mouse' });
      expect(isStylusInput(event)).toBe(false);
    });

    it('returns false for empty string pointer type', () => {
      const event = createPointerEvent({ pointerType: '' });
      expect(isStylusInput(event)).toBe(false);
    });
  });

  describe('pointerToPencilEvent', () => {
    it('converts a pen PointerEvent to PencilEvent', () => {
      const event = createPointerEvent({
        pointerType: 'pen',
        pressure: 0.6,
        clientX: 150,
        clientY: 250,
        tiltX: 15,
        tiltY: -10,
        timeStamp: 5000,
      });

      const pencilEvent = pointerToPencilEvent(event);
      expect(pencilEvent.x).toBe(150);
      expect(pencilEvent.y).toBe(250);
      expect(pencilEvent.pressure).toBe(0.6);
      expect(pencilEvent.tiltX).toBe(15);
      expect(pencilEvent.tiltY).toBe(-10);
      expect(pencilEvent.timestamp).toBe(5000);
    });

    it('normalizes pressure for non-pen inputs', () => {
      const event = createPointerEvent({
        pointerType: 'touch',
        pressure: 0.3,
        clientX: 50,
        clientY: 50,
      });

      const pencilEvent = pointerToPencilEvent(event);
      expect(pencilEvent.pressure).toBe(0.5); // normalized for non-pen
    });
  });
});
