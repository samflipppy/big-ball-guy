import { describe, it, expect } from 'vitest';
import {
  calculateVisibleRange,
  getItemStyle,
  calculateContainerHeight,
} from '@/lib/performance/virtual-scroll';

describe('virtual-scroll', () => {
  // -----------------------------------------------------------------------
  // calculateVisibleRange
  // -----------------------------------------------------------------------
  describe('calculateVisibleRange', () => {
    it('returns the correct range at scroll position 0', () => {
      const range = calculateVisibleRange(0, 50, 500, 100);
      // visible 0-10, buffer 3 => start=0, end=13
      expect(range.start).toBe(0);
      expect(range.end).toBe(13);
    });

    it('buffers items above the fold', () => {
      // scrollTop=500 => rawStart=10, visible=10, buffer=3
      const range = calculateVisibleRange(500, 50, 500, 100);
      expect(range.start).toBe(7); // 10-3
      expect(range.end).toBe(23); // 10+10+3
    });

    it('clamps start to 0', () => {
      const range = calculateVisibleRange(50, 50, 500, 100);
      // rawStart=1, start = max(0, 1-3) = 0
      expect(range.start).toBe(0);
    });

    it('clamps end to totalItems', () => {
      // scroll near the bottom
      const range = calculateVisibleRange(4700, 50, 500, 100);
      expect(range.end).toBeLessThanOrEqual(100);
    });

    it('returns { start: 0, end: 0 } when totalItems is 0', () => {
      const range = calculateVisibleRange(0, 50, 500, 0);
      expect(range.start).toBe(0);
      expect(range.end).toBe(0);
    });

    it('returns { start: 0, end: 0 } when itemHeight is 0', () => {
      const range = calculateVisibleRange(0, 0, 500, 100);
      expect(range.start).toBe(0);
      expect(range.end).toBe(0);
    });

    it('returns { start: 0, end: 0 } when containerHeight is 0', () => {
      const range = calculateVisibleRange(0, 50, 0, 100);
      expect(range.start).toBe(0);
      expect(range.end).toBe(0);
    });

    it('supports custom buffer size', () => {
      const range = calculateVisibleRange(500, 50, 500, 100, 5);
      expect(range.start).toBe(5); // 10-5
      expect(range.end).toBe(25); // 10+10+5
    });
  });

  // -----------------------------------------------------------------------
  // getItemStyle
  // -----------------------------------------------------------------------
  describe('getItemStyle', () => {
    it('returns absolute positioning at the correct offset', () => {
      const style = getItemStyle(3, 50);
      expect(style.position).toBe('absolute');
      expect(style.top).toBe(150); // 3 * 50
      expect(style.height).toBe(50);
      expect(style.width).toBe('100%');
    });

    it('returns top = 0 for index 0', () => {
      const style = getItemStyle(0, 100);
      expect(style.top).toBe(0);
    });

    it('uses the provided itemHeight', () => {
      const style = getItemStyle(5, 80);
      expect(style.top).toBe(400);
      expect(style.height).toBe(80);
    });
  });

  // -----------------------------------------------------------------------
  // calculateContainerHeight
  // -----------------------------------------------------------------------
  describe('calculateContainerHeight', () => {
    it('returns totalItems * itemHeight', () => {
      expect(calculateContainerHeight(100, 50)).toBe(5000);
    });

    it('returns 0 when there are no items', () => {
      expect(calculateContainerHeight(0, 50)).toBe(0);
    });

    it('returns 0 when itemHeight is 0', () => {
      expect(calculateContainerHeight(100, 0)).toBe(0);
    });
  });
});
