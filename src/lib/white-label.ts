/**
 * White-Label Option (#316)
 *
 * Allows organizations to customize branding, colors, logos,
 * and domain settings for a white-labeled experience.
 */

// ---- Types ----

export interface WhiteLabelConfig {
  organizationName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain?: string;
  favicon?: string;
  headerText?: string;
  footerText?: string;
}

export interface BrandedTheme {
  name: string;
  cssVariables: Record<string, string>;
  logo: string | null;
  favicon: string | null;
  headerText: string;
  footerText: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---- Constants ----

export const DEFAULT_BRAND: WhiteLabelConfig = {
  organizationName: 'Big Ball Guy',
  logo: '/images/logo.svg',
  primaryColor: '#2563EB',   // blue-600
  secondaryColor: '#1E293B', // slate-800
  accentColor: '#F59E0B',    // amber-500
  favicon: '/favicon.ico',
  headerText: 'Big Ball Guy',
  footerText: 'Built with Big Ball Guy',
};

// ---- Helpers ----

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Parse a hex color to RGB values.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (!match) return null;

  let hexStr = match[1];
  if (hexStr.length === 3) {
    hexStr = hexStr[0] + hexStr[0] + hexStr[1] + hexStr[1] + hexStr[2] + hexStr[2];
  }

  const num = parseInt(hexStr, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculate relative luminance of a color (0-1).
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// ---- Public API ----

/**
 * Get the best contrast text color (white or black) for a given background.
 */
export function getContrastColor(backgroundColor: string): '#FFFFFF' | '#000000' {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

/**
 * Apply white-label config by generating CSS custom property declarations.
 * Returns a CSS string that can be injected into a <style> tag.
 */
export function applyWhiteLabel(config: WhiteLabelConfig): string {
  const vars: Record<string, string> = {
    '--brand-primary': config.primaryColor,
    '--brand-secondary': config.secondaryColor,
    '--brand-accent': config.accentColor,
    '--brand-primary-text': getContrastColor(config.primaryColor),
    '--brand-secondary-text': getContrastColor(config.secondaryColor),
    '--brand-accent-text': getContrastColor(config.accentColor),
    '--brand-name': `"${config.organizationName}"`,
  };

  if (config.logo) {
    vars['--brand-logo'] = `url(${config.logo})`;
  }

  const declarations = Object.entries(vars)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n');

  return `:root {\n${declarations}\n}`;
}

/**
 * Generate a complete branded theme object from a config.
 */
export function generateBrandedTheme(config: WhiteLabelConfig): BrandedTheme {
  const primaryRgb = hexToRgb(config.primaryColor);
  const secondaryRgb = hexToRgb(config.secondaryColor);
  const accentRgb = hexToRgb(config.accentColor);

  const cssVariables: Record<string, string> = {
    '--brand-primary': config.primaryColor,
    '--brand-secondary': config.secondaryColor,
    '--brand-accent': config.accentColor,
    '--brand-primary-text': getContrastColor(config.primaryColor),
    '--brand-secondary-text': getContrastColor(config.secondaryColor),
    '--brand-accent-text': getContrastColor(config.accentColor),
  };

  if (primaryRgb) {
    cssVariables['--brand-primary-rgb'] = `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`;
  }
  if (secondaryRgb) {
    cssVariables['--brand-secondary-rgb'] = `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`;
  }
  if (accentRgb) {
    cssVariables['--brand-accent-rgb'] = `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`;
  }

  return {
    name: config.organizationName,
    cssVariables,
    logo: config.logo ?? null,
    favicon: config.favicon ?? null,
    headerText: config.headerText ?? config.organizationName,
    footerText: config.footerText ?? `Powered by ${config.organizationName}`,
  };
}

/**
 * Validate a partial white-label configuration.
 */
export function validateWhiteLabelConfig(
  config: Partial<WhiteLabelConfig>,
): ValidationResult {
  const errors: string[] = [];

  if (config.organizationName !== undefined && config.organizationName.trim().length === 0) {
    errors.push('Organization name cannot be empty');
  }

  if (config.primaryColor !== undefined && !HEX_COLOR_REGEX.test(config.primaryColor)) {
    errors.push('Primary color must be a valid hex color (e.g., #FF0000)');
  }

  if (config.secondaryColor !== undefined && !HEX_COLOR_REGEX.test(config.secondaryColor)) {
    errors.push('Secondary color must be a valid hex color (e.g., #FF0000)');
  }

  if (config.accentColor !== undefined && !HEX_COLOR_REGEX.test(config.accentColor)) {
    errors.push('Accent color must be a valid hex color (e.g., #FF0000)');
  }

  if (config.customDomain !== undefined && config.customDomain.length > 0) {
    if (!DOMAIN_REGEX.test(config.customDomain)) {
      errors.push('Custom domain is not a valid domain name');
    }
  }

  if (config.logo !== undefined && config.logo.length > 0) {
    if (!config.logo.startsWith('/') && !config.logo.startsWith('http')) {
      errors.push('Logo must be an absolute path or URL');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
