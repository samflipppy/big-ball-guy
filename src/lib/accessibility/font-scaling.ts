// ============================================================
// Font Scaling and Text Size (#107)
// Provides font scaling utilities for accessibility
// ============================================================

export type FontScale = 'small' | 'normal' | 'large' | 'x-large';

/**
 * Scale factors for each font size preset.
 */
export const SCALE_FACTORS: Record<FontScale, number> = {
  small: 0.875,
  normal: 1,
  large: 1.125,
  'x-large': 1.25,
};

/**
 * Applies the font scale factor to a base pixel size.
 * Returns the computed size in pixels, rounded to 1 decimal.
 */
export function applyFontScale(basePx: number, scale: FontScale): number {
  const factor = SCALE_FACTORS[scale];
  return Math.round(basePx * factor * 10) / 10;
}

/**
 * Returns the minimum touch target size for the given scale.
 * At 'normal' scale, the minimum is 44px (WCAG 2.5.5 recommendation).
 * Scales proportionally for other sizes.
 */
export function getMinTouchTarget(scale: FontScale): number {
  const BASE_TOUCH_TARGET = 44;
  const factor = SCALE_FACTORS[scale];
  return Math.round(BASE_TOUCH_TARGET * factor);
}

/**
 * Generates a CSS custom properties object for the given font scale.
 * These can be applied to a root element to scale the entire UI.
 */
export function generateCSSVariables(scale: FontScale): Record<string, string> {
  const factor = SCALE_FACTORS[scale];

  return {
    '--font-scale': String(factor),
    '--font-size-xs': `${applyFontScale(12, scale)}px`,
    '--font-size-sm': `${applyFontScale(14, scale)}px`,
    '--font-size-base': `${applyFontScale(16, scale)}px`,
    '--font-size-lg': `${applyFontScale(18, scale)}px`,
    '--font-size-xl': `${applyFontScale(20, scale)}px`,
    '--font-size-2xl': `${applyFontScale(24, scale)}px`,
    '--font-size-3xl': `${applyFontScale(30, scale)}px`,
    '--line-height-tight': `${applyFontScale(20, scale)}px`,
    '--line-height-normal': `${applyFontScale(24, scale)}px`,
    '--line-height-relaxed': `${applyFontScale(28, scale)}px`,
    '--min-touch-target': `${getMinTouchTarget(scale)}px`,
    '--spacing-unit': `${applyFontScale(4, scale)}px`,
  };
}
