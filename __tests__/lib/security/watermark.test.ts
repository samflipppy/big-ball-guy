import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addWatermark,
  generateFreeTierWatermark,
  generateAttributionWatermark,
  shouldWatermark,
} from '@/lib/security/watermark';
import type { WatermarkOptions } from '@/lib/security/watermark';

// Mock canvas and context
function createMockCanvas(width = 800, height = 600) {
  const mockContext = {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 100 }),
    translate: vi.fn(),
    rotate: vi.fn(),
    globalAlpha: 1,
    fillStyle: '',
    font: '',
  };

  const canvas = {
    width,
    height,
    getContext: vi.fn().mockReturnValue(mockContext),
  } as unknown as HTMLCanvasElement;

  return { canvas, mockContext };
}

describe('watermark', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- addWatermark ---

  describe('addWatermark', () => {
    const defaultOptions: WatermarkOptions = {
      text: 'Test Watermark',
      opacity: 0.3,
      position: 'center',
      fontSize: 24,
      color: 'rgba(128,128,128,0.5)',
      rotation: -30,
    };

    it('applies a center watermark', () => {
      const { canvas, mockContext } = createMockCanvas();
      const result = addWatermark(canvas, defaultOptions);

      expect(result.applied).toBe(true);
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('applies a bottom-right watermark', () => {
      const { canvas, mockContext } = createMockCanvas();
      const result = addWatermark(canvas, {
        ...defaultOptions,
        position: 'bottom-right',
      });

      expect(result.applied).toBe(true);
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('applies a tiled watermark', () => {
      const { canvas, mockContext } = createMockCanvas();
      const result = addWatermark(canvas, {
        ...defaultOptions,
        position: 'tiled',
      });

      expect(result.applied).toBe(true);
      // Tiled should call fillText multiple times
      expect(mockContext.fillText.mock.calls.length).toBeGreaterThan(1);
    });

    it('sets opacity on context', () => {
      const { canvas, mockContext } = createMockCanvas();
      addWatermark(canvas, { ...defaultOptions, opacity: 0.5 });
      expect(mockContext.globalAlpha).toBe(0.5);
    });

    it('sets font size on context', () => {
      const { canvas, mockContext } = createMockCanvas();
      addWatermark(canvas, { ...defaultOptions, fontSize: 36 });
      expect(mockContext.font).toBe('36px sans-serif');
    });

    it('sets fill style color on context', () => {
      const { canvas, mockContext } = createMockCanvas();
      addWatermark(canvas, { ...defaultOptions, color: 'red' });
      expect(mockContext.fillStyle).toBe('red');
    });

    it('returns applied false for empty text', () => {
      const { canvas } = createMockCanvas();
      const result = addWatermark(canvas, { ...defaultOptions, text: '' });
      expect(result.applied).toBe(false);
    });

    it('returns applied false for whitespace-only text', () => {
      const { canvas } = createMockCanvas();
      const result = addWatermark(canvas, { ...defaultOptions, text: '   ' });
      expect(result.applied).toBe(false);
    });

    it('throws when canvas is null', () => {
      expect(() =>
        addWatermark(null as unknown as HTMLCanvasElement, defaultOptions),
      ).toThrow('Canvas element is required');
    });

    it('throws when getContext returns null', () => {
      const canvas = {
        width: 800,
        height: 600,
        getContext: vi.fn().mockReturnValue(null),
      } as unknown as HTMLCanvasElement;

      expect(() => addWatermark(canvas, defaultOptions)).toThrow(
        'Could not get canvas 2d context',
      );
    });

    it('applies rotation via ctx.rotate', () => {
      const { canvas, mockContext } = createMockCanvas();
      addWatermark(canvas, { ...defaultOptions, rotation: -45 });
      expect(mockContext.rotate).toHaveBeenCalled();
      // Rotation should be in radians
      const expectedRadians = (-45 * Math.PI) / 180;
      expect(mockContext.rotate).toHaveBeenCalledWith(expectedRadians);
    });
  });

  // --- generateFreeTierWatermark ---

  describe('generateFreeTierWatermark', () => {
    it('generates default free-tier watermark', () => {
      const options = generateFreeTierWatermark();
      expect(options.text).toBe('Created with Big Ball Guy - Free');
      expect(options.position).toBe('tiled');
      expect(options.opacity).toBe(0.3);
      expect(options.rotation).toBe(-30);
    });

    it('includes team name when provided', () => {
      const options = generateFreeTierWatermark('Eagles');
      expect(options.text).toContain('Eagles');
      expect(options.text).toContain('Created with Big Ball Guy - Free');
    });

    it('uses sensible defaults for fontSize', () => {
      const options = generateFreeTierWatermark();
      expect(options.fontSize).toBe(24);
    });

    it('uses tiled position for free tier', () => {
      const options = generateFreeTierWatermark();
      expect(options.position).toBe('tiled');
    });
  });

  // --- generateAttributionWatermark ---

  describe('generateAttributionWatermark', () => {
    it('creates attribution with author name', () => {
      const options = generateAttributionWatermark('Coach Johnson');
      expect(options.text).toBe('Created by Coach Johnson');
      expect(options.position).toBe('bottom-right');
    });

    it('trims author name', () => {
      const options = generateAttributionWatermark('  Coach  ');
      expect(options.text).toBe('Created by Coach');
    });

    it('throws for empty author', () => {
      expect(() => generateAttributionWatermark('')).toThrow(
        'Author name is required',
      );
    });

    it('throws for whitespace-only author', () => {
      expect(() => generateAttributionWatermark('   ')).toThrow(
        'Author name is required',
      );
    });

    it('uses lower opacity than free-tier', () => {
      const options = generateAttributionWatermark('Author');
      expect(options.opacity).toBe(0.2);
    });

    it('uses no rotation', () => {
      const options = generateAttributionWatermark('Author');
      expect(options.rotation).toBe(0);
    });
  });

  // --- shouldWatermark ---

  describe('shouldWatermark', () => {
    it('returns true for free tier PNG export', () => {
      expect(shouldWatermark('free', 'png')).toBe(true);
    });

    it('returns true for free tier JPG export', () => {
      expect(shouldWatermark('free', 'jpg')).toBe(true);
    });

    it('returns true for free tier PDF export', () => {
      expect(shouldWatermark('free', 'pdf')).toBe(true);
    });

    it('returns true for trial tier', () => {
      expect(shouldWatermark('trial', 'png')).toBe(true);
    });

    it('returns true for basic tier', () => {
      expect(shouldWatermark('basic', 'png')).toBe(true);
    });

    it('returns false for pro tier', () => {
      expect(shouldWatermark('pro', 'png')).toBe(false);
    });

    it('returns false for enterprise tier', () => {
      expect(shouldWatermark('enterprise', 'png')).toBe(false);
    });

    it('returns false for empty tier', () => {
      expect(shouldWatermark('', 'png')).toBe(false);
    });

    it('returns false for empty export type', () => {
      expect(shouldWatermark('free', '')).toBe(false);
    });

    it('is case-insensitive for tier', () => {
      expect(shouldWatermark('FREE', 'png')).toBe(true);
      expect(shouldWatermark('Free', 'png')).toBe(true);
    });

    it('is case-insensitive for export type', () => {
      expect(shouldWatermark('free', 'PNG')).toBe(true);
      expect(shouldWatermark('free', 'Jpg')).toBe(true);
    });

    it('returns false for non-image export on free tier (e.g., json)', () => {
      expect(shouldWatermark('free', 'json')).toBe(false);
    });
  });
});
