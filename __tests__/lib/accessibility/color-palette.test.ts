import { describe, it, expect } from 'vitest';
import {
  ROUTE_COLORS,
  getAccessibleColor,
  CONTRAST_RATIOS,
  checkContrast,
  hexToRgb,
  luminance,
  type ColorBlindMode,
} from '@/lib/accessibility/color-palette';

describe('color-palette', () => {
  describe('ROUTE_COLORS', () => {
    it('has colors for all four modes', () => {
      expect(Object.keys(ROUTE_COLORS)).toEqual(['normal', 'protanopia', 'deuteranopia', 'tritanopia']);
    });

    it('each mode has the same route keys', () => {
      const normalKeys = Object.keys(ROUTE_COLORS.normal).sort();
      for (const mode of ['protanopia', 'deuteranopia', 'tritanopia'] as ColorBlindMode[]) {
        expect(Object.keys(ROUTE_COLORS[mode]).sort()).toEqual(normalKeys);
      }
    });

    it('all color values are valid hex strings', () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/;
      for (const mode of Object.values(ROUTE_COLORS)) {
        for (const color of Object.values(mode)) {
          expect(color).toMatch(hexPattern);
        }
      }
    });

    it('color-blind modes have different colors than normal', () => {
      // At least some colors should differ in each alternative mode
      for (const mode of ['protanopia', 'deuteranopia', 'tritanopia'] as ColorBlindMode[]) {
        const differentCount = Object.keys(ROUTE_COLORS.normal).filter(
          (key) => ROUTE_COLORS.normal[key] !== ROUTE_COLORS[mode][key],
        ).length;
        expect(differentCount).toBeGreaterThan(0);
      }
    });
  });

  describe('getAccessibleColor', () => {
    it('returns original color in normal mode', () => {
      expect(getAccessibleColor('#2563eb', 'normal')).toBe('#2563eb');
    });

    it('maps a known normal color to protanopia equivalent', () => {
      const normalStreak = ROUTE_COLORS.normal.streak;
      const result = getAccessibleColor(normalStreak, 'protanopia');
      expect(result).toBe(ROUTE_COLORS.protanopia.streak);
    });

    it('maps a known normal color to deuteranopia equivalent', () => {
      const normalSlant = ROUTE_COLORS.normal.slant;
      const result = getAccessibleColor(normalSlant, 'deuteranopia');
      expect(result).toBe(ROUTE_COLORS.deuteranopia.slant);
    });

    it('maps a known normal color to tritanopia equivalent', () => {
      const normalOut = ROUTE_COLORS.normal.out;
      const result = getAccessibleColor(normalOut, 'tritanopia');
      expect(result).toBe(ROUTE_COLORS.tritanopia.out);
    });

    it('returns the original color if it is not found in the normal palette', () => {
      expect(getAccessibleColor('#999999', 'protanopia')).toBe('#999999');
    });

    it('handles case-insensitive color matching', () => {
      const normalStreak = ROUTE_COLORS.normal.streak.toUpperCase();
      const result = getAccessibleColor(normalStreak, 'protanopia');
      expect(result).toBe(ROUTE_COLORS.protanopia.streak);
    });
  });

  describe('CONTRAST_RATIOS', () => {
    it('has expected WCAG thresholds', () => {
      expect(CONTRAST_RATIOS.normalText).toBe(4.5);
      expect(CONTRAST_RATIOS.largeText).toBe(3);
      expect(CONTRAST_RATIOS.uiComponent).toBe(3);
      expect(CONTRAST_RATIOS.enhanced).toBe(7);
    });
  });

  describe('hexToRgb', () => {
    it('parses a 6-digit hex color', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('parses a 3-digit hex color', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles hex without the # prefix', () => {
      expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('returns null for invalid hex strings', () => {
      expect(hexToRgb('notacolor')).toBeNull();
      expect(hexToRgb('#gg0000')).toBeNull();
      expect(hexToRgb('#12')).toBeNull();
    });

    it('correctly parses white', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('correctly parses black', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('luminance', () => {
    it('returns 0 for black', () => {
      expect(luminance(0, 0, 0)).toBeCloseTo(0);
    });

    it('returns 1 for white', () => {
      expect(luminance(255, 255, 255)).toBeCloseTo(1);
    });

    it('returns an intermediate value for mid-gray', () => {
      const l = luminance(128, 128, 128);
      expect(l).toBeGreaterThan(0);
      expect(l).toBeLessThan(1);
    });

    it('returns higher luminance for lighter colors', () => {
      const dark = luminance(50, 50, 50);
      const light = luminance(200, 200, 200);
      expect(light).toBeGreaterThan(dark);
    });
  });

  describe('checkContrast', () => {
    it('returns 21 for black on white', () => {
      const ratio = checkContrast('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colors', () => {
      const ratio = checkContrast('#336699', '#336699');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('returns a ratio regardless of fg/bg order', () => {
      const ratio1 = checkContrast('#000000', '#ffffff');
      const ratio2 = checkContrast('#ffffff', '#000000');
      expect(ratio1).toBeCloseTo(ratio2);
    });

    it('returns 0 for invalid colors', () => {
      expect(checkContrast('invalid', '#ffffff')).toBe(0);
      expect(checkContrast('#000000', 'invalid')).toBe(0);
    });

    it('blue on white meets WCAG AA for large text', () => {
      const ratio = checkContrast('#2563eb', '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(CONTRAST_RATIOS.largeText);
    });
  });
});
