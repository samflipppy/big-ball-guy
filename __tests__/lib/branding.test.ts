import { describe, it, expect, beforeEach } from 'vitest';
import {
  SCHOOL_COLOR_PRESETS,
  hexToRgb,
  rgbToHex,
  getContrastColor,
  applyTeamColors,
} from '@/lib/branding';

describe('branding', () => {
  // -- SCHOOL_COLOR_PRESETS --

  describe('SCHOOL_COLOR_PRESETS', () => {
    it('contains at least 20 presets', () => {
      expect(SCHOOL_COLOR_PRESETS.length).toBeGreaterThanOrEqual(20);
    });

    it('each preset has name, primary, secondary', () => {
      for (const preset of SCHOOL_COLOR_PRESETS) {
        expect(typeof preset.name).toBe('string');
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('has unique names', () => {
      const names = SCHOOL_COLOR_PRESETS.map((p) => p.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  // -- hexToRgb --

  describe('hexToRgb()', () => {
    it('converts 6-digit hex with hash', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('converts 6-digit hex without hash', () => {
      expect(hexToRgb('1d4ed8')).toEqual({ r: 29, g: 78, b: 216 });
    });

    it('converts 3-digit shorthand hex', () => {
      expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#F80')).toEqual({ r: 255, g: 136, b: 0 });
    });

    it('returns null for invalid hex', () => {
      expect(hexToRgb('not-a-color')).toBeNull();
      expect(hexToRgb('#GGGGGG')).toBeNull();
      expect(hexToRgb('#12')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });

    it('handles black and white', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });
  });

  // -- rgbToHex --

  describe('rgbToHex()', () => {
    it('converts RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('converts black and white', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('pads single-digit hex values', () => {
      expect(rgbToHex(1, 2, 3)).toBe('#010203');
    });

    it('clamps out-of-range values', () => {
      expect(rgbToHex(300, -10, 128)).toBe('#ff0080');
    });

    it('rounds fractional values', () => {
      expect(rgbToHex(127.6, 0, 0)).toBe('#800000');
    });

    it('is the inverse of hexToRgb', () => {
      const hex = '#1d4ed8';
      const rgb = hexToRgb(hex);
      expect(rgb).not.toBeNull();
      expect(rgbToHex(rgb!.r, rgb!.g, rgb!.b)).toBe(hex);
    });
  });

  // -- getContrastColor --

  describe('getContrastColor()', () => {
    it('returns white for dark colors', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff');
      expect(getContrastColor('#1d4ed8')).toBe('#ffffff');
      expect(getContrastColor('#461D7C')).toBe('#ffffff');
    });

    it('returns black for light colors', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#000000');
      expect(getContrastColor('#FFB81C')).toBe('#000000');
      expect(getContrastColor('#FDD023')).toBe('#000000');
    });

    it('returns black for invalid hex', () => {
      expect(getContrastColor('invalid')).toBe('#000000');
    });

    it('handles mid-range grays', () => {
      // #808080 has luminance ~0.216 > 0.179 → black
      expect(getContrastColor('#808080')).toBe('#000000');
      // #333333 is dark → white
      expect(getContrastColor('#333333')).toBe('#ffffff');
    });
  });

  // -- applyTeamColors --

  describe('applyTeamColors()', () => {
    beforeEach(() => {
      // Reset any inline styles
      document.documentElement.style.cssText = '';
    });

    it('returns an object with CSS variable values', () => {
      const vars = applyTeamColors('#1d4ed8', '#ffffff');
      expect(vars['--team-primary']).toBe('#1d4ed8');
      expect(vars['--team-secondary']).toBe('#ffffff');
      expect(vars['--team-primary-contrast']).toBe('#ffffff');
      expect(vars['--team-secondary-contrast']).toBe('#000000');
      expect(vars['--team-primary-rgb']).toBe('29, 78, 216');
      expect(vars['--team-secondary-rgb']).toBe('255, 255, 255');
    });

    it('sets CSS variables on document.documentElement', () => {
      applyTeamColors('#CC0000', '#000000');
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--team-primary')).toBe('#CC0000');
      expect(root.style.getPropertyValue('--team-secondary')).toBe('#000000');
    });

    it('generates correct contrast colors', () => {
      const vars = applyTeamColors('#000000', '#FFFFFF');
      expect(vars['--team-primary-contrast']).toBe('#ffffff');
      expect(vars['--team-secondary-contrast']).toBe('#000000');
    });

    it('overwrites previous team colors', () => {
      applyTeamColors('#FF0000', '#0000FF');
      applyTeamColors('#00FF00', '#FFFF00');
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--team-primary')).toBe('#00FF00');
      expect(root.style.getPropertyValue('--team-secondary')).toBe('#FFFF00');
    });
  });
});
