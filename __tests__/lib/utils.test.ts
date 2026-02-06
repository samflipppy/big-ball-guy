import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  generateId,
  formatDate,
  debounce,
  throttle,
  simplifyPath,
  snapToGrid,
  yardsToPixels,
  pixelsToYards,
} from '@/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles empty call', () => {
    expect(cn()).toBe('');
  });

  it('handles array of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});

describe('generateId()', () => {
  it('returns a valid UUID v4 format string', () => {
    const id = generateId();
    // UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate()', () => {
  it('formats a date string', () => {
    const result = formatDate('2025-03-15T12:00:00Z');
    expect(result).toBe('Mar 15, 2025');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2024-12-25T00:00:00Z'));
    expect(result).toBe('Dec 25, 2024');
  });

  it('formats January correctly', () => {
    const result = formatDate('2025-01-01T00:00:00Z');
    expect(result).toBe('Jan 1, 2025');
  });
});

describe('debounce()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced(); // reset
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls function with correct arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('hello', 42);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  it('only calls function once for rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('blocks subsequent calls within the limit', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows calls after the limit expires', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 300);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments to the function', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('arg1', 'arg2');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('simplifyPath()', () => {
  it('returns same points for 2 or fewer points', () => {
    const single = [{ x: 0, y: 0 }];
    expect(simplifyPath(single, 5)).toEqual(single);

    const pair = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(simplifyPath(pair, 5)).toEqual(pair);
  });

  it('returns empty array for empty input', () => {
    expect(simplifyPath([], 5)).toEqual([]);
  });

  it('simplifies a straight line to two endpoints', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 10 },
      { x: 15, y: 15 },
      { x: 20, y: 20 },
    ];
    const result = simplifyPath(points, 1);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 20 },
    ]);
  });

  it('preserves significant deviations', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 50 }, // big deviation
      { x: 20, y: 0 },
      { x: 30, y: 0 },
    ];
    const result = simplifyPath(points, 5);
    expect(result.length).toBeGreaterThan(2);
    // The major deviation point should be kept
    expect(result).toContainEqual({ x: 10, y: 50 });
  });

  it('with very high epsilon, reduces to start and end', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 3 },
      { x: 10, y: 1 },
      { x: 15, y: 4 },
      { x: 20, y: 0 },
    ];
    const result = simplifyPath(points, 1000);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
    ]);
  });

  it('with epsilon=0, preserves all points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 10, y: 0 },
    ];
    const result = simplifyPath(points, 0);
    expect(result).toEqual(points);
  });
});

describe('snapToGrid()', () => {
  it('snaps to nearest grid point', () => {
    expect(snapToGrid(13, 10)).toBe(10);
    expect(snapToGrid(17, 10)).toBe(20);
    expect(snapToGrid(15, 10)).toBe(20);
  });

  it('returns exact value when already on grid', () => {
    expect(snapToGrid(20, 10)).toBe(20);
    expect(snapToGrid(0, 10)).toBe(0);
  });

  it('works with different grid sizes', () => {
    expect(snapToGrid(7, 5)).toBe(5);
    expect(snapToGrid(8, 5)).toBe(10);
    expect(snapToGrid(14, 25)).toBe(25);
  });

  it('handles negative values', () => {
    expect(snapToGrid(-13, 10)).toBe(-10);
    expect(snapToGrid(-17, 10)).toBe(-20);
  });
});

describe('yardsToPixels()', () => {
  it('converts yards to pixels', () => {
    expect(yardsToPixels(10, 15)).toBe(150);
    expect(yardsToPixels(0, 15)).toBe(0);
    expect(yardsToPixels(1, 15)).toBe(15);
  });

  it('handles fractional yards', () => {
    expect(yardsToPixels(5.5, 10)).toBe(55);
  });
});

describe('pixelsToYards()', () => {
  it('converts pixels to yards', () => {
    expect(pixelsToYards(150, 15)).toBe(10);
    expect(pixelsToYards(0, 15)).toBe(0);
    expect(pixelsToYards(15, 15)).toBe(1);
  });

  it('handles fractional pixels', () => {
    expect(pixelsToYards(55, 10)).toBe(5.5);
  });

  it('is the inverse of yardsToPixels', () => {
    const ppy = 15;
    const yards = 7.5;
    expect(pixelsToYards(yardsToPixels(yards, ppy), ppy)).toBeCloseTo(yards);
  });
});
