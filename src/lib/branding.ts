// ============================================================
// Team Branding Utilities
// ============================================================

export interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
}

/**
 * 20+ common school / team color combinations.
 */
export const SCHOOL_COLOR_PRESETS: ColorPreset[] = [
  { name: 'Crimson & White', primary: '#A32638', secondary: '#FFFFFF' },
  { name: 'Navy & Orange', primary: '#001E62', secondary: '#F26522' },
  { name: 'Royal Blue & White', primary: '#0033A0', secondary: '#FFFFFF' },
  { name: 'Scarlet & Gray', primary: '#BB0000', secondary: '#666666' },
  { name: 'Purple & Gold', primary: '#461D7C', secondary: '#FDD023' },
  { name: 'Orange & Blue', primary: '#F56600', secondary: '#263077' },
  { name: 'Maroon & White', primary: '#500000', secondary: '#FFFFFF' },
  { name: 'Green & White', primary: '#18453B', secondary: '#FFFFFF' },
  { name: 'Red & Black', primary: '#CC0000', secondary: '#000000' },
  { name: 'Blue & Gold', primary: '#003DA5', secondary: '#FFB81C' },
  { name: 'Cardinal & Gold', primary: '#8C1515', secondary: '#B6985A' },
  { name: 'Black & Gold', primary: '#000000', secondary: '#CFB53B' },
  { name: 'Orange & White', primary: '#FF8200', secondary: '#FFFFFF' },
  { name: 'Burnt Orange & White', primary: '#BF5700', secondary: '#FFFFFF' },
  { name: 'Garnet & Gold', primary: '#782F40', secondary: '#CEB888' },
  { name: 'Kelly Green & White', primary: '#006633', secondary: '#FFFFFF' },
  { name: 'Maize & Blue', primary: '#00274C', secondary: '#FFCB05' },
  { name: 'Silver & Black', primary: '#A5ACAF', secondary: '#000000' },
  { name: 'Teal & Orange', primary: '#008E97', secondary: '#FC4C02' },
  { name: 'Steel Blue & Gold', primary: '#003087', secondary: '#FFB612' },
  { name: 'Forest Green & Gold', primary: '#154733', secondary: '#FFC72C' },
  { name: 'Wine & Gold', primary: '#6F263D', secondary: '#FFB81C' },
];

/**
 * Convert a hex color string to an { r, g, b } object.
 * Accepts "#RGB", "#RRGGBB", "RGB", "RRGGBB" formats.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Strip leading #
  let cleaned = hex.replace(/^#/, '');

  // Expand shorthand (#ABC -> AABBCC)
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (cleaned.length !== 6) return null;

  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert RGB values to a hex color string (with leading #).
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate the relative luminance of a colour per WCAG 2.0.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Return "#000000" or "#ffffff" depending on which provides better contrast
 * against the supplied hex colour.
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luminance = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

/**
 * Generate CSS custom properties for the given team colours and inject them
 * onto the document root.  Returns the property map so callers can inspect it
 * in tests or use it inline.
 */
export function applyTeamColors(
  primaryColor: string,
  secondaryColor: string,
): Record<string, string> {
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  const vars: Record<string, string> = {
    '--team-primary': primaryColor,
    '--team-secondary': secondaryColor,
    '--team-primary-contrast': getContrastColor(primaryColor),
    '--team-secondary-contrast': getContrastColor(secondaryColor),
  };

  if (primaryRgb) {
    vars['--team-primary-rgb'] = `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`;
  }
  if (secondaryRgb) {
    vars['--team-secondary-rgb'] = `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`;
  }

  // Apply to document if available (SSR-safe)
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }

  return vars;
}
