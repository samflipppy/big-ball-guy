import { describe, it, expect } from 'vitest';
import {
  SCALE_FACTORS,
  applyFontScale,
  getMinTouchTarget,
  generateCSSVariables,
  type FontScale,
} from '@/lib/accessibility/font-scaling';

describe('font-scaling', () => {
  describe('SCALE_FACTORS', () => {
    it('has all four scale levels', () => {
      expect(Object.keys(SCALE_FACTORS)).toEqual(['small', 'normal', 'large', 'x-large']);
    });

    it('has correct values', () => {
      expect(SCALE_FACTORS.small).toBe(0.875);
      expect(SCALE_FACTORS.normal).toBe(1);
      expect(SCALE_FACTORS.large).toBe(1.125);
      expect(SCALE_FACTORS['x-large']).toBe(1.25);
    });

    it('values increase monotonically', () => {
      const scales: FontScale[] = ['small', 'normal', 'large', 'x-large'];
      for (let i = 1; i < scales.length; i++) {
        expect(SCALE_FACTORS[scales[i]]).toBeGreaterThan(SCALE_FACTORS[scales[i - 1]]);
      }
    });
  });

  describe('applyFontScale', () => {
    it('returns the base size at normal scale', () => {
      expect(applyFontScale(16, 'normal')).toBe(16);
    });

    it('scales down for small', () => {
      expect(applyFontScale(16, 'small')).toBe(14);
    });

    it('scales up for large', () => {
      expect(applyFontScale(16, 'large')).toBe(18);
    });

    it('scales up for x-large', () => {
      expect(applyFontScale(16, 'x-large')).toBe(20);
    });

    it('handles zero base size', () => {
      expect(applyFontScale(0, 'large')).toBe(0);
    });

    it('rounds to one decimal place', () => {
      // 14 * 0.875 = 12.25
      expect(applyFontScale(14, 'small')).toBe(12.3);
    });

    it('handles odd base sizes', () => {
      // 13 * 1.125 = 14.625 -> rounded to 14.6
      expect(applyFontScale(13, 'large')).toBe(14.6);
    });

    it('handles large base sizes', () => {
      expect(applyFontScale(100, 'x-large')).toBe(125);
    });
  });

  describe('getMinTouchTarget', () => {
    it('returns 44px at normal scale', () => {
      expect(getMinTouchTarget('normal')).toBe(44);
    });

    it('returns smaller target at small scale', () => {
      const target = getMinTouchTarget('small');
      expect(target).toBeLessThan(44);
      expect(target).toBe(Math.round(44 * 0.875));
    });

    it('returns larger target at large scale', () => {
      const target = getMinTouchTarget('large');
      expect(target).toBeGreaterThan(44);
      expect(target).toBe(Math.round(44 * 1.125));
    });

    it('returns largest target at x-large scale', () => {
      const target = getMinTouchTarget('x-large');
      expect(target).toBe(55);
    });

    it('always returns a positive integer', () => {
      const scales: FontScale[] = ['small', 'normal', 'large', 'x-large'];
      for (const scale of scales) {
        const target = getMinTouchTarget(scale);
        expect(target).toBeGreaterThan(0);
        expect(Number.isInteger(target)).toBe(true);
      }
    });
  });

  describe('generateCSSVariables', () => {
    it('returns an object with expected CSS variable keys', () => {
      const vars = generateCSSVariables('normal');
      expect(vars).toHaveProperty('--font-scale');
      expect(vars).toHaveProperty('--font-size-xs');
      expect(vars).toHaveProperty('--font-size-sm');
      expect(vars).toHaveProperty('--font-size-base');
      expect(vars).toHaveProperty('--font-size-lg');
      expect(vars).toHaveProperty('--font-size-xl');
      expect(vars).toHaveProperty('--font-size-2xl');
      expect(vars).toHaveProperty('--font-size-3xl');
      expect(vars).toHaveProperty('--line-height-tight');
      expect(vars).toHaveProperty('--line-height-normal');
      expect(vars).toHaveProperty('--line-height-relaxed');
      expect(vars).toHaveProperty('--min-touch-target');
      expect(vars).toHaveProperty('--spacing-unit');
    });

    it('font-scale is "1" at normal', () => {
      const vars = generateCSSVariables('normal');
      expect(vars['--font-scale']).toBe('1');
    });

    it('base font size is 16px at normal', () => {
      const vars = generateCSSVariables('normal');
      expect(vars['--font-size-base']).toBe('16px');
    });

    it('base font size scales up at x-large', () => {
      const vars = generateCSSVariables('x-large');
      expect(vars['--font-size-base']).toBe('20px');
    });

    it('min-touch-target scales correctly', () => {
      const vars = generateCSSVariables('large');
      expect(vars['--min-touch-target']).toBe(`${getMinTouchTarget('large')}px`);
    });

    it('all values are strings', () => {
      const vars = generateCSSVariables('normal');
      for (const value of Object.values(vars)) {
        expect(typeof value).toBe('string');
      }
    });

    it('values differ between scales', () => {
      const normalVars = generateCSSVariables('normal');
      const largeVars = generateCSSVariables('large');
      expect(normalVars['--font-size-base']).not.toBe(largeVars['--font-size-base']);
    });
  });
});
