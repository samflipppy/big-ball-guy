/**
 * Player Label Customization (#254)
 *
 * Provides label formatting, positioning, and style presets for
 * player labels on the canvas diagram.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LabelFormat = 'number' | 'position' | 'name' | 'custom';

export interface LabelStyle {
  format: LabelFormat;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  showOnHover: boolean;
}

export type LabelPreset = 'minimal' | 'detailed' | 'numbered' | 'position-only';

// ---------------------------------------------------------------------------
// Default Label Styles (presets)
// ---------------------------------------------------------------------------

export const DEFAULT_LABEL_STYLES: Record<LabelPreset, LabelStyle> = {
  minimal: {
    format: 'position',
    fontSize: 10,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    backgroundColor: 'transparent',
    showOnHover: false,
  },
  detailed: {
    format: 'name',
    fontSize: 12,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    showOnHover: false,
  },
  numbered: {
    format: 'number',
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#ffffff',
    backgroundColor: 'transparent',
    showOnHover: false,
  },
  'position-only': {
    format: 'position',
    fontSize: 10,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    backgroundColor: 'transparent',
    showOnHover: true,
  },
};

// ---------------------------------------------------------------------------
// Player info type used for label formatting
// ---------------------------------------------------------------------------

export interface PlayerLabelInfo {
  name?: string;
  number?: number;
  position: string;
}

// ---------------------------------------------------------------------------
// Format player label
// ---------------------------------------------------------------------------

/**
 * Returns the display text for a player label based on the style format.
 *
 * - `number`   : player jersey number (falls back to position)
 * - `position` : abbreviated position string
 * - `name`     : player name (falls back to position)
 * - `custom`   : combines number + name when available, otherwise position
 */
export function formatPlayerLabel(
  player: PlayerLabelInfo,
  style: LabelStyle,
): string {
  switch (style.format) {
    case 'number':
      return player.number != null ? String(player.number) : player.position;

    case 'position':
      return player.position;

    case 'name':
      return player.name && player.name.trim().length > 0
        ? player.name
        : player.position;

    case 'custom': {
      const parts: string[] = [];
      if (player.number != null) parts.push(String(player.number));
      if (player.name && player.name.trim().length > 0) parts.push(player.name);
      return parts.length > 0 ? parts.join(' ') : player.position;
    }

    default:
      return player.position;
  }
}

// ---------------------------------------------------------------------------
// Label position calculation
// ---------------------------------------------------------------------------

/** Default vertical offset to place the label below the player circle */
const LABEL_VERTICAL_OFFSET = 20;

/**
 * Calculates the top-left position for a label centered below a player,
 * ensuring it doesn't go below zero on either axis.
 */
export function getLabelPosition(
  playerX: number,
  playerY: number,
  labelWidth: number,
  labelHeight: number,
): { x: number; y: number } {
  const x = Math.max(0, playerX - labelWidth / 2);
  const y = Math.max(0, playerY + LABEL_VERTICAL_OFFSET);

  // Suppress unused-parameter lint — labelHeight is part of the public API
  // for future collision avoidance, but currently kept simple.
  void labelHeight;

  return { x, y };
}

// ---------------------------------------------------------------------------
// Validate label config
// ---------------------------------------------------------------------------

const VALID_FORMATS: LabelFormat[] = ['number', 'position', 'name', 'custom'];
const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 48;

export interface LabelValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a partial `LabelStyle` configuration object.
 * Returns a list of validation errors (empty when valid).
 */
export function validateLabelConfig(
  config: Partial<LabelStyle>,
): LabelValidationResult {
  const errors: string[] = [];

  if (config.format !== undefined && !VALID_FORMATS.includes(config.format)) {
    errors.push(
      `Invalid format "${config.format}". Must be one of: ${VALID_FORMATS.join(', ')}`,
    );
  }

  if (config.fontSize !== undefined) {
    if (typeof config.fontSize !== 'number' || Number.isNaN(config.fontSize)) {
      errors.push('fontSize must be a valid number');
    } else if (config.fontSize < MIN_FONT_SIZE || config.fontSize > MAX_FONT_SIZE) {
      errors.push(
        `fontSize must be between ${MIN_FONT_SIZE} and ${MAX_FONT_SIZE}`,
      );
    }
  }

  if (config.fontFamily !== undefined) {
    if (typeof config.fontFamily !== 'string' || config.fontFamily.trim().length === 0) {
      errors.push('fontFamily must be a non-empty string');
    }
  }

  if (config.color !== undefined) {
    if (typeof config.color !== 'string' || config.color.trim().length === 0) {
      errors.push('color must be a non-empty string');
    }
  }

  if (config.backgroundColor !== undefined) {
    if (typeof config.backgroundColor !== 'string') {
      errors.push('backgroundColor must be a string');
    }
  }

  if (config.showOnHover !== undefined) {
    if (typeof config.showOnHover !== 'boolean') {
      errors.push('showOnHover must be a boolean');
    }
  }

  return { valid: errors.length === 0, errors };
}
