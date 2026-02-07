/**
 * Export watermarking utilities.
 *
 * Adds watermark overlays to canvas exports based on
 * subscription tier and export type.
 */

// --- Types ---

export interface WatermarkOptions {
  text: string;
  opacity: number;
  position: 'center' | 'bottom-right' | 'tiled';
  fontSize: number;
  color: string;
  rotation: number;
}

export interface WatermarkResult {
  applied: boolean;
  options: WatermarkOptions;
}

// --- Constants ---

const DEFAULT_OPACITY = 0.3;
const DEFAULT_FONT_SIZE = 24;
const DEFAULT_COLOR = 'rgba(128, 128, 128, 0.5)';
const DEFAULT_ROTATION = -30;
const TILE_SPACING = 200;

// --- Free Tier Plans ---

const FREE_TIERS = new Set(['free', 'trial', 'basic']);

// --- Export types that always get watermarked on free tier ---

const WATERMARKED_EXPORT_TYPES = new Set(['png', 'jpg', 'jpeg', 'pdf', 'svg']);

// --- Core Functions ---

/**
 * Add a watermark to an HTML canvas element.
 */
export function addWatermark(
  canvas: HTMLCanvasElement,
  options: WatermarkOptions,
): WatermarkResult {
  if (!canvas) {
    throw new Error('Canvas element is required');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas 2d context');
  }

  const { text, opacity, position, fontSize, color, rotation } = options;

  if (!text || text.trim().length === 0) {
    return { applied: false, options };
  }

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px sans-serif`;

  const radians = (rotation * Math.PI) / 180;

  switch (position) {
    case 'center': {
      const textMetrics = ctx.measureText(text);
      const x = (canvas.width - textMetrics.width) / 2;
      const y = canvas.height / 2;

      ctx.translate(x + textMetrics.width / 2, y);
      ctx.rotate(radians);
      ctx.fillText(text, -textMetrics.width / 2, 0);
      break;
    }

    case 'bottom-right': {
      const textMetrics = ctx.measureText(text);
      const padding = 20;
      const x = canvas.width - textMetrics.width - padding;
      const y = canvas.height - padding;

      ctx.translate(x + textMetrics.width / 2, y);
      ctx.rotate(radians);
      ctx.fillText(text, -textMetrics.width / 2, 0);
      break;
    }

    case 'tiled': {
      for (let x = 0; x < canvas.width + TILE_SPACING; x += TILE_SPACING) {
        for (let y = 0; y < canvas.height + TILE_SPACING; y += TILE_SPACING) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(radians);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
      break;
    }
  }

  ctx.restore();
  return { applied: true, options };
}

/**
 * Generate watermark configuration for free-tier exports.
 */
export function generateFreeTierWatermark(teamName?: string): WatermarkOptions {
  const text = teamName
    ? `Created with Big Ball Guy - Free | ${teamName}`
    : 'Created with Big Ball Guy - Free';

  return {
    text,
    opacity: DEFAULT_OPACITY,
    position: 'tiled',
    fontSize: DEFAULT_FONT_SIZE,
    color: DEFAULT_COLOR,
    rotation: DEFAULT_ROTATION,
  };
}

/**
 * Generate watermark configuration for author attribution.
 */
export function generateAttributionWatermark(author: string): WatermarkOptions {
  if (!author || author.trim().length === 0) {
    throw new Error('Author name is required');
  }

  return {
    text: `Created by ${author.trim()}`,
    opacity: 0.2,
    position: 'bottom-right',
    fontSize: 16,
    color: DEFAULT_COLOR,
    rotation: 0,
  };
}

/**
 * Determine if a watermark should be applied based on plan tier and export type.
 */
export function shouldWatermark(tier: string, exportType: string): boolean {
  if (!tier || !exportType) {
    return false;
  }

  const normalizedTier = tier.toLowerCase().trim();
  const normalizedExport = exportType.toLowerCase().trim();

  // Paid tiers never get watermarked
  if (!FREE_TIERS.has(normalizedTier)) {
    return false;
  }

  // Free tiers get watermarked on image/document exports
  return WATERMARKED_EXPORT_TYPES.has(normalizedExport);
}
