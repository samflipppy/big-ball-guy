import { describe, it, expect } from 'vitest';
import {
  formatPlayerLabel,
  getLabelPosition,
  validateLabelConfig,
  DEFAULT_LABEL_STYLES,
  type LabelStyle,
  type PlayerLabelInfo,
} from '@/lib/player-labels';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const fullPlayer: PlayerLabelInfo = {
  name: 'John Smith',
  number: 12,
  position: 'QB',
};

const noNamePlayer: PlayerLabelInfo = {
  number: 55,
  position: 'MLB',
};

const noNumberPlayer: PlayerLabelInfo = {
  name: 'Jane Doe',
  position: 'WR',
};

const barePlayer: PlayerLabelInfo = {
  position: 'RB',
};

// ---------------------------------------------------------------------------
// DEFAULT_LABEL_STYLES
// ---------------------------------------------------------------------------

describe('DEFAULT_LABEL_STYLES', () => {
  it('contains the four expected presets', () => {
    expect(DEFAULT_LABEL_STYLES).toHaveProperty('minimal');
    expect(DEFAULT_LABEL_STYLES).toHaveProperty('detailed');
    expect(DEFAULT_LABEL_STYLES).toHaveProperty('numbered');
    expect(DEFAULT_LABEL_STYLES).toHaveProperty('position-only');
  });

  it('every preset has valid LabelStyle fields', () => {
    for (const style of Object.values(DEFAULT_LABEL_STYLES)) {
      expect(['number', 'position', 'name', 'custom']).toContain(style.format);
      expect(style.fontSize).toBeGreaterThan(0);
      expect(style.fontFamily.length).toBeGreaterThan(0);
      expect(typeof style.showOnHover).toBe('boolean');
    }
  });
});

// ---------------------------------------------------------------------------
// formatPlayerLabel
// ---------------------------------------------------------------------------

describe('formatPlayerLabel', () => {
  const positionStyle: LabelStyle = { ...DEFAULT_LABEL_STYLES.minimal, format: 'position' };
  const numberStyle: LabelStyle = { ...DEFAULT_LABEL_STYLES.numbered, format: 'number' };
  const nameStyle: LabelStyle = { ...DEFAULT_LABEL_STYLES.detailed, format: 'name' };
  const customStyle: LabelStyle = { ...DEFAULT_LABEL_STYLES.minimal, format: 'custom' };

  it('returns position string for position format', () => {
    expect(formatPlayerLabel(fullPlayer, positionStyle)).toBe('QB');
  });

  it('returns jersey number for number format', () => {
    expect(formatPlayerLabel(fullPlayer, numberStyle)).toBe('12');
  });

  it('falls back to position when number is missing', () => {
    expect(formatPlayerLabel(barePlayer, numberStyle)).toBe('RB');
  });

  it('returns player name for name format', () => {
    expect(formatPlayerLabel(fullPlayer, nameStyle)).toBe('John Smith');
  });

  it('falls back to position when name is missing', () => {
    expect(formatPlayerLabel(noNamePlayer, nameStyle)).toBe('MLB');
  });

  it('returns combined number + name for custom format', () => {
    expect(formatPlayerLabel(fullPlayer, customStyle)).toBe('12 John Smith');
  });

  it('returns just number for custom format when name is missing', () => {
    expect(formatPlayerLabel(noNamePlayer, customStyle)).toBe('55');
  });

  it('returns just name for custom format when number is missing', () => {
    expect(formatPlayerLabel(noNumberPlayer, customStyle)).toBe('Jane Doe');
  });

  it('falls back to position for custom format when both name and number are missing', () => {
    expect(formatPlayerLabel(barePlayer, customStyle)).toBe('RB');
  });

  it('falls back to position for name format when name is whitespace-only', () => {
    const player: PlayerLabelInfo = { name: '   ', position: 'TE' };
    expect(formatPlayerLabel(player, nameStyle)).toBe('TE');
  });
});

// ---------------------------------------------------------------------------
// getLabelPosition
// ---------------------------------------------------------------------------

describe('getLabelPosition', () => {
  it('centres the label horizontally below the player', () => {
    const result = getLabelPosition(100, 200, 40, 14);
    // x = max(0, 100 - 40/2) = 80
    expect(result.x).toBe(80);
    // y = max(0, 200 + 20) = 220
    expect(result.y).toBe(220);
  });

  it('clamps x to zero when label would go negative', () => {
    const result = getLabelPosition(5, 200, 40, 14);
    // x = max(0, 5 - 20) = 0
    expect(result.x).toBe(0);
  });

  it('clamps y to zero when player is near the top', () => {
    // y = max(0, -30 + 20) = 0
    const result = getLabelPosition(100, -30, 40, 14);
    expect(result.y).toBe(0);
  });

  it('returns non-negative coordinates for large label widths', () => {
    const result = getLabelPosition(50, 50, 200, 20);
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
  });

  it('handles zero-width labels', () => {
    const result = getLabelPosition(100, 200, 0, 0);
    expect(result.x).toBe(100);
    expect(result.y).toBe(220);
  });

  it('positions correctly at the origin', () => {
    const result = getLabelPosition(0, 0, 20, 10);
    expect(result.x).toBe(0);
    expect(result.y).toBe(20);
  });

  it('returns y with 20px vertical offset', () => {
    const result = getLabelPosition(400, 300, 60, 14);
    expect(result.y).toBe(320);
  });

  it('handles very large coordinates', () => {
    const result = getLabelPosition(10000, 10000, 100, 20);
    expect(result.x).toBe(9950);
    expect(result.y).toBe(10020);
  });
});

// ---------------------------------------------------------------------------
// validateLabelConfig
// ---------------------------------------------------------------------------

describe('validateLabelConfig', () => {
  it('returns valid for an empty config', () => {
    const result = validateLabelConfig({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for a correct full config', () => {
    const result = validateLabelConfig({
      format: 'position',
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#fff',
      backgroundColor: 'transparent',
      showOnHover: true,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects an invalid format', () => {
    const result = validateLabelConfig({ format: 'bogus' as never });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid format');
  });

  it('rejects fontSize below minimum', () => {
    const result = validateLabelConfig({ fontSize: 2 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('fontSize');
  });

  it('rejects fontSize above maximum', () => {
    const result = validateLabelConfig({ fontSize: 100 });
    expect(result.valid).toBe(false);
  });

  it('rejects NaN fontSize', () => {
    const result = validateLabelConfig({ fontSize: NaN });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('fontSize');
  });

  it('rejects empty fontFamily', () => {
    const result = validateLabelConfig({ fontFamily: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('fontFamily');
  });

  it('rejects empty color', () => {
    const result = validateLabelConfig({ color: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects non-boolean showOnHover', () => {
    const result = validateLabelConfig({ showOnHover: 'yes' as unknown as boolean });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('showOnHover');
  });

  it('accumulates multiple errors', () => {
    const result = validateLabelConfig({
      format: 'invalid' as never,
      fontSize: -1,
      fontFamily: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
