import { describe, it, expect } from 'vitest';
import {
  snapToGrid,
  generateGridLines,
  isMajorGridLine,
  DEFAULT_GRID_SIZES,
  DEFAULT_GRID_SIZE,
} from '@/lib/grid';

// ---- snapToGrid ----

describe('snapToGrid()', () => {
  it('snaps position to nearest grid point', () => {
    const result = snapToGrid({ x: 13, y: 27 }, 10);
    expect(result).toEqual({ x: 10, y: 30 });
  });

  it('snaps exact grid positions to themselves', () => {
    const result = snapToGrid({ x: 20, y: 30 }, 10);
    expect(result).toEqual({ x: 20, y: 30 });
  });

  it('rounds to nearest (up at midpoint)', () => {
    const result = snapToGrid({ x: 15, y: 25 }, 10);
    expect(result).toEqual({ x: 20, y: 30 });
  });

  it('rounds down when closer to lower grid', () => {
    const result = snapToGrid({ x: 12, y: 23 }, 10);
    expect(result).toEqual({ x: 10, y: 20 });
  });

  it('works with grid size of 5', () => {
    const result = snapToGrid({ x: 7, y: 13 }, 5);
    expect(result).toEqual({ x: 5, y: 15 });
  });

  it('works with grid size of 15', () => {
    const result = snapToGrid({ x: 22, y: 38 }, 15);
    expect(result).toEqual({ x: 30, y: 45 });
  });

  it('works with grid size of 20', () => {
    const result = snapToGrid({ x: 33, y: 47 }, 20);
    expect(result).toEqual({ x: 40, y: 40 });
  });

  it('handles zero position', () => {
    const result = snapToGrid({ x: 0, y: 0 }, 10);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('handles large positions', () => {
    const result = snapToGrid({ x: 793, y: 497 }, 10);
    expect(result).toEqual({ x: 790, y: 500 });
  });

  it('handles negative values', () => {
    const result = snapToGrid({ x: -13, y: -27 }, 10);
    expect(result).toEqual({ x: -10, y: -30 });
  });

  it('snaps x and y independently', () => {
    const result = snapToGrid({ x: 4, y: 16 }, 10);
    expect(result.x).toBe(0);
    expect(result.y).toBe(20);
  });
});

// ---- generateGridLines ----

describe('generateGridLines()', () => {
  it('generates vertical lines at gridSize intervals', () => {
    const result = generateGridLines(50, 50, 10);
    expect(result.x).toEqual([10, 20, 30, 40]);
  });

  it('generates horizontal lines at gridSize intervals', () => {
    const result = generateGridLines(50, 50, 10);
    expect(result.y).toEqual([10, 20, 30, 40]);
  });

  it('does not include 0 or field boundary', () => {
    const result = generateGridLines(100, 100, 10);
    expect(result.x).not.toContain(0);
    expect(result.x).not.toContain(100);
    expect(result.y).not.toContain(0);
    expect(result.y).not.toContain(100);
  });

  it('handles grid size of 5', () => {
    const result = generateGridLines(30, 30, 5);
    expect(result.x).toEqual([5, 10, 15, 20, 25]);
    expect(result.y).toEqual([5, 10, 15, 20, 25]);
  });

  it('handles grid size of 20', () => {
    const result = generateGridLines(100, 100, 20);
    expect(result.x).toEqual([20, 40, 60, 80]);
    expect(result.y).toEqual([20, 40, 60, 80]);
  });

  it('generates correct number of lines for default field', () => {
    const result = generateGridLines(800, 500, 10);
    expect(result.x.length).toBe(79); // 10, 20, ..., 790
    expect(result.y.length).toBe(49); // 10, 20, ..., 490
  });

  it('returns empty arrays for grid size larger than field', () => {
    const result = generateGridLines(50, 50, 100);
    expect(result.x).toEqual([]);
    expect(result.y).toEqual([]);
  });

  it('handles grid size equal to field dimensions', () => {
    const result = generateGridLines(100, 100, 100);
    expect(result.x).toEqual([]);
    expect(result.y).toEqual([]);
  });

  it('generates different counts for different field dimensions', () => {
    const result = generateGridLines(200, 100, 10);
    expect(result.x.length).toBe(19); // wider
    expect(result.y.length).toBe(9);  // shorter
  });
});

// ---- isMajorGridLine ----

describe('isMajorGridLine()', () => {
  it('returns true for every 5th grid line', () => {
    expect(isMajorGridLine(50, 10)).toBe(true);  // 50/10 = 5
    expect(isMajorGridLine(100, 10)).toBe(true); // 100/10 = 10
    expect(isMajorGridLine(150, 10)).toBe(true); // 150/10 = 15
  });

  it('returns false for non-major grid lines', () => {
    expect(isMajorGridLine(10, 10)).toBe(false); // 10/10 = 1
    expect(isMajorGridLine(20, 10)).toBe(false); // 20/10 = 2
    expect(isMajorGridLine(30, 10)).toBe(false); // 30/10 = 3
    expect(isMajorGridLine(40, 10)).toBe(false); // 40/10 = 4
  });

  it('treats position 0 as major (grid index 0)', () => {
    expect(isMajorGridLine(0, 10)).toBe(true); // 0/10 = 0, 0 % 5 = 0
  });

  it('works with grid size of 5', () => {
    expect(isMajorGridLine(25, 5)).toBe(true);  // 25/5 = 5
    expect(isMajorGridLine(50, 5)).toBe(true);  // 50/5 = 10
    expect(isMajorGridLine(15, 5)).toBe(false); // 15/5 = 3
  });

  it('works with grid size of 20', () => {
    expect(isMajorGridLine(100, 20)).toBe(true);  // 100/20 = 5
    expect(isMajorGridLine(200, 20)).toBe(true);  // 200/20 = 10
    expect(isMajorGridLine(60, 20)).toBe(false);  // 60/20 = 3
  });
});

// ---- Constants ----

describe('constants', () => {
  it('DEFAULT_GRID_SIZES contains expected values', () => {
    expect(DEFAULT_GRID_SIZES).toEqual([5, 10, 15, 20]);
  });

  it('DEFAULT_GRID_SIZE is 10', () => {
    expect(DEFAULT_GRID_SIZE).toBe(10);
  });

  it('DEFAULT_GRID_SIZES is readonly', () => {
    // This is a compile-time check, but we can verify it's an array
    expect(Array.isArray(DEFAULT_GRID_SIZES)).toBe(true);
    expect(DEFAULT_GRID_SIZES.length).toBe(4);
  });
});
