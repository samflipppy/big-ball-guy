import { describe, it, expect } from 'vitest';
import {
  generateWristband,
  abbreviatePlayName,
  colorCodeByFormation,
  formatForPrint,
} from '@/lib/wristband-generator';
import type { Play } from '@/types';

// ---- Helpers ----

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: overrides.id ?? 'play-1',
    name: overrides.name ?? 'Test Play',
    formationId: overrides.formationId ?? 'builtin-shotgun',
    assignments: [],
    tags: [],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---- Tests ----

describe('abbreviatePlayName()', () => {
  it('returns name unchanged if under maxLen', () => {
    expect(abbreviatePlayName('HB Dive', 20)).toBe('HB Dive');
  });

  it('abbreviates known football words', () => {
    const result = abbreviatePlayName('Shotgun Power Right', 15);
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result).toContain('PWR');
  });

  it('truncates words to 3 chars when abbreviation is still too long', () => {
    const result = abbreviatePlayName('Singleback Counter Strong Left Motion', 12);
    expect(result.length).toBeLessThanOrEqual(12);
  });

  it('handles single-word names', () => {
    expect(abbreviatePlayName('Z', 5)).toBe('Z');
  });

  it('hard-truncates as last resort', () => {
    const result = abbreviatePlayName('ABCDEFGHIJKLMNOP QRSTUVWXYZ', 8);
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it('handles empty string', () => {
    expect(abbreviatePlayName('', 10)).toBe('');
  });
});

describe('colorCodeByFormation()', () => {
  it('assigns same color to plays with same formation', () => {
    const plays = [
      makePlay({ id: 'a', formationId: 'f1' }),
      makePlay({ id: 'b', formationId: 'f1' }),
    ];
    const colors = colorCodeByFormation(plays);
    expect(colors.get('a')).toBe(colors.get('b'));
  });

  it('assigns different colors to plays with different formations', () => {
    const plays = [
      makePlay({ id: 'a', formationId: 'f1' }),
      makePlay({ id: 'b', formationId: 'f2' }),
    ];
    const colors = colorCodeByFormation(plays);
    expect(colors.get('a')).not.toBe(colors.get('b'));
  });

  it('returns empty map for empty input', () => {
    const colors = colorCodeByFormation([]);
    expect(colors.size).toBe(0);
  });

  it('cycles colors for many formations', () => {
    const plays = Array.from({ length: 15 }, (_, i) =>
      makePlay({ id: `p${i}`, formationId: `f${i}` }),
    );
    const colors = colorCodeByFormation(plays);
    expect(colors.size).toBe(15);
    // All should have valid hex colors
    for (const color of colors.values()) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('generateWristband()', () => {
  const defaultOptions = {
    columns: 4 as const,
    colorCode: false,
    abbreviate: false,
    fontSize: 'medium' as const,
  };

  it('generates rows with correct column count', () => {
    const plays = Array.from({ length: 7 }, (_, i) =>
      makePlay({ id: `p${i}`, name: `Play ${i}` }),
    );
    const wb = generateWristband(plays, defaultOptions);
    expect(wb.columns).toBe(4);
    expect(wb.rows).toHaveLength(2); // 7 plays / 4 cols = 2 rows
    expect(wb.rows[0].cells).toHaveLength(4);
  });

  it('pads last row when plays do not fill columns evenly', () => {
    const plays = [makePlay({ id: 'p1', name: 'Play 1' })];
    const wb = generateWristband(plays, { ...defaultOptions, columns: 3 });
    expect(wb.rows[0].cells).toHaveLength(3);
    // Last 2 cells should be empty placeholders
    expect(wb.rows[0].cells[1].id).toBe('');
    expect(wb.rows[0].cells[2].id).toBe('');
  });

  it('abbreviates names when option is true', () => {
    const plays = [makePlay({ id: 'p1', name: 'Shotgun Power Right' })];
    const wb = generateWristband(plays, { ...defaultOptions, abbreviate: true });
    expect(wb.rows[0].cells[0].displayName).not.toBe('Shotgun Power Right');
    expect(wb.rows[0].cells[0].displayName.length).toBeLessThanOrEqual(15);
  });

  it('preserves full names when abbreviate is false', () => {
    const plays = [makePlay({ id: 'p1', name: 'Shotgun Power Right' })];
    const wb = generateWristband(plays, { ...defaultOptions, abbreviate: false });
    expect(wb.rows[0].cells[0].displayName).toBe('Shotgun Power Right');
  });

  it('includes color when colorCode is true', () => {
    const plays = [makePlay({ id: 'p1', formationId: 'f1' })];
    const wb = generateWristband(plays, { ...defaultOptions, colorCode: true });
    expect(wb.rows[0].cells[0].color).toBeDefined();
    expect(wb.rows[0].cells[0].color).toMatch(/^#/);
  });

  it('returns empty rows for empty play list', () => {
    const wb = generateWristband([], defaultOptions);
    expect(wb.rows).toHaveLength(0);
  });

  it('respects different column counts', () => {
    const plays = Array.from({ length: 12 }, (_, i) =>
      makePlay({ id: `p${i}`, name: `P${i}` }),
    );

    const wb3 = generateWristband(plays, { ...defaultOptions, columns: 3 });
    expect(wb3.rows).toHaveLength(4); // 12 / 3

    const wb6 = generateWristband(plays, { ...defaultOptions, columns: 6 });
    expect(wb6.rows).toHaveLength(2); // 12 / 6
  });
});

describe('formatForPrint()', () => {
  it('converts wristband data to print-ready format', () => {
    const plays = [
      makePlay({ id: 'p1', name: 'Play 1', formationId: 'f1' }),
      makePlay({ id: 'p2', name: 'Play 2', formationId: 'f1' }),
    ];
    const wb = generateWristband(plays, {
      columns: 3,
      colorCode: true,
      abbreviate: false,
      fontSize: 'medium',
    });
    const printed = formatForPrint(wb);

    expect(printed.columns).toBe(3);
    expect(printed.totalPlays).toBe(2);
    expect(printed.rows).toHaveLength(1);
    expect(printed.rows[0].cells).toHaveLength(3);
  });

  it('sets correct font size from wristband data', () => {
    const plays = [makePlay({ id: 'p1', name: 'Play' })];
    const wbSmall = generateWristband(plays, {
      columns: 3,
      colorCode: false,
      abbreviate: false,
      fontSize: 'small',
    });
    const printedSmall = formatForPrint(wbSmall);
    expect(printedSmall.rows[0].cells[0].fontSize).toBe(8);

    const wbLarge = generateWristband(plays, {
      columns: 3,
      colorCode: false,
      abbreviate: false,
      fontSize: 'large',
    });
    const printedLarge = formatForPrint(wbLarge);
    expect(printedLarge.rows[0].cells[0].fontSize).toBe(12);
  });

  it('uses dark text on light backgrounds', () => {
    const plays = [makePlay({ id: 'p1', name: 'Play' })];
    const wb = generateWristband(plays, {
      columns: 3,
      colorCode: false,
      abbreviate: false,
      fontSize: 'medium',
    });
    // No color = white background
    const printed = formatForPrint(wb);
    expect(printed.rows[0].cells[0].backgroundColor).toBe('#FFFFFF');
    expect(printed.rows[0].cells[0].textColor).toBe('#000000');
  });

  it('counts only non-empty plays in totalPlays', () => {
    const plays = [makePlay({ id: 'p1', name: 'Play 1' })];
    const wb = generateWristband(plays, {
      columns: 4,
      colorCode: false,
      abbreviate: false,
      fontSize: 'medium',
    });
    const printed = formatForPrint(wb);
    // 1 real play + 3 empty padding cells
    expect(printed.totalPlays).toBe(1);
    expect(printed.rows[0].cells).toHaveLength(4);
  });
});
