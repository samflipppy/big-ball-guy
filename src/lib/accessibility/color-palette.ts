// ============================================================
// Color-Blind Safe Palette (#105)
// Provides accessible color alternatives for different color vision deficiencies
// ============================================================

export type ColorBlindMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

/**
 * Route colors per color-blind mode.
 * Normal: original colors from constants.
 * Each mode provides perceptually distinct alternatives.
 */
export const ROUTE_COLORS: Record<ColorBlindMode, Record<string, string>> = {
  normal: {
    streak: '#2563eb',
    slant: '#16a34a',
    out: '#dc2626',
    in: '#9333ea',
    corner: '#ea580c',
    post: '#0891b2',
    curl: '#ca8a04',
    comeback: '#be185d',
    flat: '#65a30d',
    drag: '#6366f1',
    custom: '#6b7280',
    default: '#2563eb',
  },
  protanopia: {
    streak: '#0066cc',
    slant: '#ccaa00',
    out: '#0044aa',
    in: '#aa8800',
    corner: '#6644cc',
    post: '#00aacc',
    curl: '#cc6600',
    comeback: '#8844aa',
    flat: '#ddbb00',
    drag: '#4466dd',
    custom: '#888888',
    default: '#0066cc',
  },
  deuteranopia: {
    streak: '#0077bb',
    slant: '#ddaa33',
    out: '#0055aa',
    in: '#bb8800',
    corner: '#7744cc',
    post: '#0099cc',
    curl: '#cc7700',
    comeback: '#9944aa',
    flat: '#ccbb00',
    drag: '#5566dd',
    custom: '#888888',
    default: '#0077bb',
  },
  tritanopia: {
    streak: '#cc3333',
    slant: '#33aa66',
    out: '#dd4444',
    in: '#aa3366',
    corner: '#ff6644',
    post: '#338877',
    curl: '#cc5544',
    comeback: '#993355',
    flat: '#44bb55',
    drag: '#ee5555',
    custom: '#888888',
    default: '#cc3333',
  },
};

/**
 * Maps a color from the normal palette to its accessible equivalent
 * for the given color-blind mode.
 */
export function getAccessibleColor(color: string, mode: ColorBlindMode): string {
  if (mode === 'normal') return color;

  const normalPalette = ROUTE_COLORS.normal;
  const targetPalette = ROUTE_COLORS[mode];

  // Look up the color in the normal palette to find its key
  for (const [key, value] of Object.entries(normalPalette)) {
    if (value.toLowerCase() === color.toLowerCase()) {
      return targetPalette[key] ?? color;
    }
  }

  // If the color is not in the normal palette, return it unchanged
  return color;
}

/**
 * Minimum WCAG contrast ratios for different UI element types.
 */
export const CONTRAST_RATIOS = {
  normalText: 4.5, // WCAG AA for normal text
  largeText: 3, // WCAG AA for large text (18px+ or 14px+ bold)
  uiComponent: 3, // WCAG AA for UI components and graphical objects
  enhanced: 7, // WCAG AAA for normal text
} as const;

/**
 * Converts a hex color string to RGB components.
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) formats.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, '');

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  return { r, g, b };
}

/**
 * Calculates the relative luminance of an RGB color per WCAG 2.1 spec.
 * Values are in range 0-255 for each channel.
 * Returns a value between 0 (darkest) and 1 (lightest).
 */
export function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates the WCAG 2.1 contrast ratio between two hex colors.
 * Returns a value between 1 (no contrast) and 21 (maximum contrast).
 * Returns 0 if either color is invalid.
 */
export function checkContrast(fg: string, bg: string): number {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);

  if (!fgRgb || !bgRgb) return 0;

  const l1 = luminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const l2 = luminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}
