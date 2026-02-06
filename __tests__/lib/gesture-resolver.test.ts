import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveGesture,
  createGestureState,
  updateGestureState,
  isDrawingGesture,
  isPanGesture,
  isZoomGesture,
  isTapGesture,
  isLongPressGesture,
  getPinchScale,
  type GestureState,
} from '@/lib/gesture-resolver';

// Helper to create mock Touch objects
function createTouch(x: number, y: number): Touch {
  return {
    clientX: x,
    clientY: y,
    identifier: 0,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    target: document.createElement('div'),
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  } as Touch;
}

describe('gesture-resolver', () => {
  describe('resolveGesture', () => {
    it('returns draw for single finger in draw-route mode', () => {
      const touches = [createTouch(100, 200)];
      expect(resolveGesture(touches, 'draw-route')).toBe('draw');
    });

    it('returns draw for single finger in draw-block mode', () => {
      const touches = [createTouch(100, 200)];
      expect(resolveGesture(touches, 'draw-block')).toBe('draw');
    });

    it('returns draw for single finger in draw-motion mode', () => {
      const touches = [createTouch(100, 200)];
      expect(resolveGesture(touches, 'draw-motion')).toBe('draw');
    });

    it('returns draw for single finger in draw-zone mode', () => {
      const touches = [createTouch(100, 200)];
      expect(resolveGesture(touches, 'draw-zone')).toBe('draw');
    });

    it('returns draw for single finger in eraser mode', () => {
      const touches = [createTouch(100, 200)];
      expect(resolveGesture(touches, 'eraser')).toBe('draw');
    });

    it('returns pan for single finger in select mode', () => {
      const touches = [createTouch(100, 200)];
      expect(resolveGesture(touches, 'select')).toBe('pan');
    });

    it('returns pan for single finger in pan mode', () => {
      const touches = [createTouch(100, 200)];
      expect(resolveGesture(touches, 'pan')).toBe('pan');
    });

    it('returns zoom for two fingers regardless of mode', () => {
      const touches = [createTouch(100, 200), createTouch(200, 300)];
      expect(resolveGesture(touches, 'draw-route')).toBe('zoom');
      expect(resolveGesture(touches, 'select')).toBe('zoom');
      expect(resolveGesture(touches, 'pan')).toBe('zoom');
    });

    it('returns zoom for three or more fingers', () => {
      const touches = [createTouch(100, 200), createTouch(200, 300), createTouch(300, 400)];
      expect(resolveGesture(touches, 'select')).toBe('zoom');
    });

    it('returns tap for zero touches', () => {
      expect(resolveGesture([], 'select')).toBe('tap');
    });
  });

  describe('createGestureState', () => {
    it('creates a gesture state with correct type and points', () => {
      const touches = [createTouch(100, 200)];
      const state = createGestureState('draw', touches);

      expect(state.type).toBe('draw');
      expect(state.startPoints).toHaveLength(1);
      expect(state.startPoints[0]).toEqual({ x: 100, y: 200 });
      expect(state.currentPoints).toHaveLength(1);
      expect(state.currentPoints[0]).toEqual({ x: 100, y: 200 });
      expect(state.startTime).toBeGreaterThan(0);
    });

    it('creates state with multiple touch points', () => {
      const touches = [createTouch(100, 200), createTouch(300, 400)];
      const state = createGestureState('zoom', touches);

      expect(state.startPoints).toHaveLength(2);
      expect(state.startPoints[1]).toEqual({ x: 300, y: 400 });
    });
  });

  describe('updateGestureState', () => {
    it('updates current points while preserving start points', () => {
      const initialTouches = [createTouch(100, 200)];
      const state = createGestureState('draw', initialTouches);

      const updatedTouches = [createTouch(150, 250)];
      const updated = updateGestureState(state, updatedTouches);

      expect(updated.startPoints[0]).toEqual({ x: 100, y: 200 });
      expect(updated.currentPoints[0]).toEqual({ x: 150, y: 250 });
      expect(updated.type).toBe('draw');
      expect(updated.startTime).toBe(state.startTime);
    });
  });

  describe('gesture type predicates', () => {
    it('isDrawingGesture returns true for draw type', () => {
      const state: GestureState = {
        type: 'draw',
        startTime: Date.now(),
        startPoints: [{ x: 0, y: 0 }],
        currentPoints: [{ x: 10, y: 10 }],
      };
      expect(isDrawingGesture(state)).toBe(true);
      expect(isPanGesture(state)).toBe(false);
      expect(isZoomGesture(state)).toBe(false);
    });

    it('isPanGesture returns true for pan type', () => {
      const state: GestureState = {
        type: 'pan',
        startTime: Date.now(),
        startPoints: [{ x: 0, y: 0 }],
        currentPoints: [{ x: 10, y: 10 }],
      };
      expect(isPanGesture(state)).toBe(true);
      expect(isDrawingGesture(state)).toBe(false);
    });

    it('isZoomGesture returns true for zoom type', () => {
      const state: GestureState = {
        type: 'zoom',
        startTime: Date.now(),
        startPoints: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        currentPoints: [{ x: 0, y: 0 }, { x: 200, y: 200 }],
      };
      expect(isZoomGesture(state)).toBe(true);
      expect(isDrawingGesture(state)).toBe(false);
    });
  });

  describe('isTapGesture', () => {
    it('returns true for short duration with minimal movement', () => {
      const now = Date.now();
      const state: GestureState = {
        type: 'tap',
        startTime: now, // Just started
        startPoints: [{ x: 100, y: 200 }],
        currentPoints: [{ x: 102, y: 201 }], // barely moved
      };
      expect(isTapGesture(state)).toBe(true);
    });

    it('returns false for long duration (becomes long press)', () => {
      const state: GestureState = {
        type: 'tap',
        startTime: Date.now() - 600, // 600ms ago
        startPoints: [{ x: 100, y: 200 }],
        currentPoints: [{ x: 100, y: 200 }],
      };
      expect(isTapGesture(state)).toBe(false);
    });

    it('returns false for significant movement', () => {
      const state: GestureState = {
        type: 'tap',
        startTime: Date.now(),
        startPoints: [{ x: 100, y: 200 }],
        currentPoints: [{ x: 150, y: 250 }], // moved 50+ pixels
      };
      expect(isTapGesture(state)).toBe(false);
    });

    it('returns false for empty points', () => {
      const state: GestureState = {
        type: 'tap',
        startTime: Date.now(),
        startPoints: [],
        currentPoints: [],
      };
      expect(isTapGesture(state)).toBe(false);
    });
  });

  describe('isLongPressGesture', () => {
    it('returns true for long duration with minimal movement', () => {
      const state: GestureState = {
        type: 'long-press',
        startTime: Date.now() - 600,
        startPoints: [{ x: 100, y: 200 }],
        currentPoints: [{ x: 101, y: 201 }],
      };
      expect(isLongPressGesture(state)).toBe(true);
    });

    it('returns false for short duration', () => {
      const state: GestureState = {
        type: 'long-press',
        startTime: Date.now() - 100,
        startPoints: [{ x: 100, y: 200 }],
        currentPoints: [{ x: 100, y: 200 }],
      };
      expect(isLongPressGesture(state)).toBe(false);
    });

    it('returns false if finger moved too much', () => {
      const state: GestureState = {
        type: 'long-press',
        startTime: Date.now() - 600,
        startPoints: [{ x: 100, y: 200 }],
        currentPoints: [{ x: 200, y: 300 }],
      };
      expect(isLongPressGesture(state)).toBe(false);
    });
  });

  describe('getPinchScale', () => {
    it('returns 1 when fingers have not moved', () => {
      const state: GestureState = {
        type: 'zoom',
        startTime: Date.now(),
        startPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        currentPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      };
      expect(getPinchScale(state)).toBe(1);
    });

    it('returns 2 when distance doubles', () => {
      const state: GestureState = {
        type: 'zoom',
        startTime: Date.now(),
        startPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        currentPoints: [{ x: 0, y: 0 }, { x: 200, y: 0 }],
      };
      expect(getPinchScale(state)).toBe(2);
    });

    it('returns 0.5 when distance halves', () => {
      const state: GestureState = {
        type: 'zoom',
        startTime: Date.now(),
        startPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        currentPoints: [{ x: 0, y: 0 }, { x: 50, y: 0 }],
      };
      expect(getPinchScale(state)).toBe(0.5);
    });

    it('returns 1 when fewer than 2 points', () => {
      const state: GestureState = {
        type: 'zoom',
        startTime: Date.now(),
        startPoints: [{ x: 0, y: 0 }],
        currentPoints: [{ x: 0, y: 0 }],
      };
      expect(getPinchScale(state)).toBe(1);
    });

    it('returns 1 when start distance is zero', () => {
      const state: GestureState = {
        type: 'zoom',
        startTime: Date.now(),
        startPoints: [{ x: 50, y: 50 }, { x: 50, y: 50 }],
        currentPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      };
      expect(getPinchScale(state)).toBe(1);
    });
  });
});
