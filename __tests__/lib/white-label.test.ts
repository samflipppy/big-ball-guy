import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BRAND,
  getContrastColor,
  applyWhiteLabel,
  generateBrandedTheme,
  validateWhiteLabelConfig,
} from '@/lib/white-label';
import type { WhiteLabelConfig } from '@/lib/white-label';

const TEST_CONFIG: WhiteLabelConfig = {
  organizationName: 'Wildcats Football',
  logo: '/images/wildcats.png',
  primaryColor: '#FF0000',
  secondaryColor: '#000000',
  accentColor: '#FFFF00',
  customDomain: 'wildcats.example.com',
  favicon: '/wildcats-favicon.ico',
  headerText: 'Wildcats Playbook',
  footerText: 'Go Wildcats!',
};

describe('white-label', () => {
  describe('DEFAULT_BRAND', () => {
    it('has Big Ball Guy as organization name', () => {
      expect(DEFAULT_BRAND.organizationName).toBe('Big Ball Guy');
    });

    it('has valid hex colors', () => {
      expect(DEFAULT_BRAND.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DEFAULT_BRAND.secondaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DEFAULT_BRAND.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('getContrastColor', () => {
    it('returns white for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#FFFFFF');
      expect(getContrastColor('#1E293B')).toBe('#FFFFFF');
    });

    it('returns black for light backgrounds', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#000000');
      expect(getContrastColor('#F5F5F5')).toBe('#000000');
    });

    it('returns black for invalid hex (fallback)', () => {
      expect(getContrastColor('not-a-color')).toBe('#000000');
    });

    it('handles shorthand hex colors', () => {
      expect(getContrastColor('#FFF')).toBe('#000000');
      expect(getContrastColor('#000')).toBe('#FFFFFF');
    });
  });

  describe('applyWhiteLabel', () => {
    it('returns a :root CSS block with custom properties', () => {
      const css = applyWhiteLabel(TEST_CONFIG);
      expect(css).toContain(':root {');
      expect(css).toContain('--brand-primary: #FF0000');
      expect(css).toContain('--brand-secondary: #000000');
      expect(css).toContain('--brand-accent: #FFFF00');
    });

    it('includes contrast text colors', () => {
      const css = applyWhiteLabel(TEST_CONFIG);
      expect(css).toContain('--brand-primary-text:');
      expect(css).toContain('--brand-secondary-text:');
    });

    it('includes logo URL when provided', () => {
      const css = applyWhiteLabel(TEST_CONFIG);
      expect(css).toContain('--brand-logo: url(/images/wildcats.png)');
    });

    it('includes organization name', () => {
      const css = applyWhiteLabel(TEST_CONFIG);
      expect(css).toContain('--brand-name: "Wildcats Football"');
    });
  });

  describe('generateBrandedTheme', () => {
    it('returns a theme object with all fields', () => {
      const theme = generateBrandedTheme(TEST_CONFIG);
      expect(theme.name).toBe('Wildcats Football');
      expect(theme.logo).toBe('/images/wildcats.png');
      expect(theme.favicon).toBe('/wildcats-favicon.ico');
      expect(theme.headerText).toBe('Wildcats Playbook');
      expect(theme.footerText).toBe('Go Wildcats!');
    });

    it('includes CSS variables with RGB values', () => {
      const theme = generateBrandedTheme(TEST_CONFIG);
      expect(theme.cssVariables['--brand-primary']).toBe('#FF0000');
      expect(theme.cssVariables['--brand-primary-rgb']).toBe('255, 0, 0');
    });

    it('uses org name as fallback headerText', () => {
      const config: WhiteLabelConfig = { ...TEST_CONFIG, headerText: undefined };
      const theme = generateBrandedTheme(config);
      expect(theme.headerText).toBe('Wildcats Football');
    });

    it('generates fallback footerText', () => {
      const config: WhiteLabelConfig = { ...TEST_CONFIG, footerText: undefined };
      const theme = generateBrandedTheme(config);
      expect(theme.footerText).toBe('Powered by Wildcats Football');
    });
  });

  describe('validateWhiteLabelConfig', () => {
    it('returns valid for a correct config', () => {
      const result = validateWhiteLabelConfig(TEST_CONFIG);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty organization name', () => {
      const result = validateWhiteLabelConfig({ organizationName: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Organization name cannot be empty');
    });

    it('rejects invalid hex colors', () => {
      const result = validateWhiteLabelConfig({ primaryColor: 'red' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Primary color');
    });

    it('rejects invalid custom domain', () => {
      const result = validateWhiteLabelConfig({ customDomain: 'not a domain' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Custom domain');
    });

    it('accepts valid custom domain', () => {
      const result = validateWhiteLabelConfig({ customDomain: 'my.example.com' });
      expect(result.valid).toBe(true);
    });

    it('rejects logo with relative path', () => {
      const result = validateWhiteLabelConfig({ logo: 'images/logo.png' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Logo');
    });

    it('accepts logo with absolute path', () => {
      const result = validateWhiteLabelConfig({ logo: '/images/logo.png' });
      expect(result.valid).toBe(true);
    });

    it('accepts logo with http URL', () => {
      const result = validateWhiteLabelConfig({ logo: 'https://example.com/logo.png' });
      expect(result.valid).toBe(true);
    });

    it('returns valid for an empty partial config', () => {
      const result = validateWhiteLabelConfig({});
      expect(result.valid).toBe(true);
    });
  });
});
