import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDevicePixelRatio,
  setupHiDPICanvas,
  hiDPICoordinates,
  getOptimalResolution,
  shouldUseHighDPI,
} from '@/lib/hidpi-canvas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockDPR(value: number) {
  Object.defineProperty(window, 'devicePixelRatio', {
    value,
    configurable: true,
    writable: true,
  });
}

let originalDPR: number;

beforeEach(() => {
  originalDPR = window.devicePixelRatio;
  mockDPR(2);
});

afterEach(() => {
  Object.defineProperty(window, 'devicePixelRatio', {
    value: originalDPR,
    configurable: true,
    writable: true,
  });
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getDevicePixelRatio
// ---------------------------------------------------------------------------

describe('getDevicePixelRatio', () => {
  it('returns the window devicePixelRatio', () => {
    mockDPR(2);
    expect(getDevicePixelRatio()).toBe(2);
  });

  it('clamps to max of 3', () => {
    mockDPR(4);
    expect(getDevicePixelRatio()).toBe(3);
  });

  it('returns 1 when devicePixelRatio is 1', () => {
    mockDPR(1);
    expect(getDevicePixelRatio()).toBe(1);
  });

  it('handles fractional DPR', () => {
    mockDPR(1.5);
    expect(getDevicePixelRatio()).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// setupHiDPICanvas
// ---------------------------------------------------------------------------

describe('setupHiDPICanvas', () => {
  it('sets canvas buffer dimensions to width*dpr x height*dpr', () => {
    mockDPR(2);
    const canvas = document.createElement('canvas');
    // Mock getContext to return a minimal context
    const scaleSpy = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: scaleSpy,
    } as unknown as CanvasRenderingContext2D);

    setupHiDPICanvas(canvas, 800, 600);

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it('sets CSS dimensions to logical size', () => {
    mockDPR(2);
    const canvas = document.createElement('canvas');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    setupHiDPICanvas(canvas, 800, 600);

    expect(canvas.style.width).toBe('800px');
    expect(canvas.style.height).toBe('600px');
  });

  it('calls context.scale with the DPR', () => {
    mockDPR(2);
    const canvas = document.createElement('canvas');
    const scaleSpy = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: scaleSpy,
    } as unknown as CanvasRenderingContext2D);

    setupHiDPICanvas(canvas, 800, 600);

    expect(scaleSpy).toHaveBeenCalledWith(2, 2);
  });

  it('returns the DPR that was applied', () => {
    mockDPR(2);
    const canvas = document.createElement('canvas');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const result = setupHiDPICanvas(canvas, 800, 600);
    expect(result).toBe(2);
  });

  it('handles null getContext gracefully', () => {
    mockDPR(2);
    const canvas = document.createElement('canvas');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    // Should not throw
    const result = setupHiDPICanvas(canvas, 400, 300);
    expect(result).toBe(2);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// hiDPICoordinates
// ---------------------------------------------------------------------------

describe('hiDPICoordinates', () => {
  it('multiplies coordinates by DPR', () => {
    const result = hiDPICoordinates(100, 200, 2);
    expect(result).toEqual({ x: 200, y: 400 });
  });

  it('returns same coords when DPR is 1', () => {
    const result = hiDPICoordinates(50, 75, 1);
    expect(result).toEqual({ x: 50, y: 75 });
  });

  it('handles fractional DPR', () => {
    const result = hiDPICoordinates(100, 100, 1.5);
    expect(result).toEqual({ x: 150, y: 150 });
  });

  it('handles zero coordinates', () => {
    const result = hiDPICoordinates(0, 0, 3);
    expect(result).toEqual({ x: 0, y: 0 });
  });
});

// ---------------------------------------------------------------------------
// getOptimalResolution
// ---------------------------------------------------------------------------

describe('getOptimalResolution', () => {
  it('returns full retina resolution when under pixel budget', () => {
    mockDPR(2);
    const result = getOptimalResolution(800, 600, 10_000_000);
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200);
    expect(result.dpr).toBe(2);
  });

  it('reduces DPR when full retina exceeds pixel budget', () => {
    mockDPR(3);
    // 1000*3 * 1000*3 = 9M pixels, budget 4M
    const result = getOptimalResolution(1000, 1000, 4_000_000);
    expect(result.dpr).toBeLessThan(3);
    expect(result.width * result.height).toBeLessThanOrEqual(4_100_000); // slight rounding tolerance
  });

  it('never returns DPR below 1', () => {
    mockDPR(1);
    const result = getOptimalResolution(5000, 5000, 1_000_000);
    expect(result.dpr).toBeGreaterThanOrEqual(1);
  });

  it('uses the default max pixel budget when not specified', () => {
    mockDPR(1);
    const result = getOptimalResolution(800, 600);
    // 800*600 = 480k, well under 4M default
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// shouldUseHighDPI
// ---------------------------------------------------------------------------

describe('shouldUseHighDPI', () => {
  it('returns true for few players at normal zoom', () => {
    expect(shouldUseHighDPI(11, 1)).toBe(true);
  });

  it('returns true for many players at high zoom', () => {
    expect(shouldUseHighDPI(100, 1.5)).toBe(true);
  });

  it('returns false for many players at low zoom', () => {
    expect(shouldUseHighDPI(60, 0.3)).toBe(false);
  });

  it('returns true at the exact threshold boundary (50 players, 0.5 zoom)', () => {
    expect(shouldUseHighDPI(50, 0.5)).toBe(true);
  });

  it('returns false just past threshold (51 players, 0.49 zoom)', () => {
    expect(shouldUseHighDPI(51, 0.49)).toBe(false);
  });

  it('returns true for zero players', () => {
    expect(shouldUseHighDPI(0, 0.1)).toBe(true);
  });
});
