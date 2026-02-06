import { describe, it, expect } from 'vitest';
import {
  measureDistance,
  measureAngle,
  getMidpoint,
  getBearing,
} from '@/lib/measurement';
import type { FieldDimensions, Position } from '@/types';

const FIELD: FieldDimensions = {
  width: 800,
  height: 500,
  yardsVisible: 30,
  lineOfScrimmageY: 250,
};

const PX_PER_YARD = FIELD.width / 53.3;

describe('measurement', () => {
  // ---- measureDistance ----
  describe('measureDistance', () => {
    it('returns 0 for the same point', () => {
      const p: Position = { x: 100, y: 200 };
      expect(measureDistance(p, p, FIELD)).toBe(0);
    });

    it('calculates horizontal distance correctly', () => {
      const p1: Position = { x: 0, y: 250 };
      const p2: Position = { x: PX_PER_YARD * 10, y: 250 }; // exactly 10 yards
      const dist = measureDistance(p1, p2, FIELD);
      expect(dist).toBe(10);
    });

    it('calculates vertical distance correctly', () => {
      const p1: Position = { x: 400, y: 0 };
      const p2: Position = { x: 400, y: PX_PER_YARD * 5 }; // 5 yards
      const dist = measureDistance(p1, p2, FIELD);
      expect(dist).toBe(5);
    });

    it('calculates diagonal distance correctly', () => {
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: PX_PER_YARD * 3, y: PX_PER_YARD * 4 }; // 3-4-5 triangle
      const dist = measureDistance(p1, p2, FIELD);
      expect(dist).toBe(5);
    });

    it('is symmetric (distance A to B equals B to A)', () => {
      const p1: Position = { x: 100, y: 150 };
      const p2: Position = { x: 300, y: 400 };
      expect(measureDistance(p1, p2, FIELD)).toBe(measureDistance(p2, p1, FIELD));
    });

    it('scales correctly with different field widths', () => {
      const smallField: FieldDimensions = { ...FIELD, width: 400 };
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: 400, y: 0 };
      // 400 pixels at 400/53.3 px/yard = 53.3 yards
      const dist = measureDistance(p1, p2, smallField);
      expect(dist).toBe(53.3);
    });
  });

  // ---- measureAngle ----
  describe('measureAngle', () => {
    it('returns 90 for a right angle', () => {
      const p1: Position = { x: 100, y: 0 };
      const p2: Position = { x: 0, y: 0 }; // vertex
      const p3: Position = { x: 0, y: 100 };
      expect(measureAngle(p1, p2, p3)).toBe(90);
    });

    it('returns 180 for a straight line', () => {
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: 50, y: 0 }; // vertex
      const p3: Position = { x: 100, y: 0 };
      expect(measureAngle(p1, p2, p3)).toBe(180);
    });

    it('returns 0 when two arms overlap', () => {
      const p1: Position = { x: 100, y: 0 };
      const p2: Position = { x: 0, y: 0 };
      const p3: Position = { x: 100, y: 0 };
      expect(measureAngle(p1, p2, p3)).toBe(0);
    });

    it('returns 0 when a point coincides with the vertex', () => {
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: 0, y: 0 }; // vertex same as p1
      const p3: Position = { x: 100, y: 100 };
      expect(measureAngle(p1, p2, p3)).toBe(0);
    });

    it('calculates 45-degree angles', () => {
      const p1: Position = { x: 100, y: 0 };
      const p2: Position = { x: 0, y: 0 };
      const p3: Position = { x: 100, y: 100 };
      const angle = measureAngle(p1, p2, p3);
      expect(angle).toBe(45);
    });

    it('calculates 60-degree angles', () => {
      const p1: Position = { x: 100, y: 0 };
      const p2: Position = { x: 0, y: 0 };
      // 60 degrees: (cos60, sin60) = (0.5, sqrt(3)/2)
      const p3: Position = { x: 50, y: Math.sqrt(3) / 2 * 100 };
      const angle = measureAngle(p1, p2, p3);
      expect(angle).toBe(60);
    });
  });

  // ---- getMidpoint ----
  describe('getMidpoint', () => {
    it('returns the midpoint of two points', () => {
      const mid = getMidpoint({ x: 0, y: 0 }, { x: 100, y: 100 });
      expect(mid).toEqual({ x: 50, y: 50 });
    });

    it('returns the same point when both are identical', () => {
      const mid = getMidpoint({ x: 42, y: 42 }, { x: 42, y: 42 });
      expect(mid).toEqual({ x: 42, y: 42 });
    });
  });

  // ---- getBearing ----
  describe('getBearing', () => {
    it('returns 0 for due north (up)', () => {
      const bearing = getBearing({ x: 100, y: 100 }, { x: 100, y: 0 });
      expect(bearing).toBe(0);
    });

    it('returns 90 for due east (right)', () => {
      const bearing = getBearing({ x: 100, y: 100 }, { x: 200, y: 100 });
      expect(bearing).toBe(90);
    });

    it('returns 180 for due south (down)', () => {
      const bearing = getBearing({ x: 100, y: 100 }, { x: 100, y: 200 });
      expect(bearing).toBe(180);
    });

    it('returns 270 for due west (left)', () => {
      const bearing = getBearing({ x: 100, y: 100 }, { x: 0, y: 100 });
      expect(bearing).toBe(270);
    });
  });
});
