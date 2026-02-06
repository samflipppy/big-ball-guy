import type { Play } from '@/types';

// ---- Types ----

export interface WristbandOptions {
  columns: 3 | 4 | 5 | 6;
  colorCode: boolean;
  abbreviate: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface WristbandPlay {
  id: string;
  displayName: string;
  formationId: string;
  color?: string;
}

export interface WristbandRow {
  cells: WristbandPlay[];
}

export interface WristbandData {
  rows: WristbandRow[];
  columns: number;
  fontSize: 'small' | 'medium' | 'large';
}

export interface PrintCell {
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

export interface PrintRow {
  cells: PrintCell[];
}

export interface PrintReadyWristband {
  rows: PrintRow[];
  columns: number;
  totalPlays: number;
}

// ---- Abbreviation ----

// Common football word abbreviations
const ABBREVIATION_MAP: Record<string, string> = {
  'power': 'PWR',
  'counter': 'CTR',
  'inside': 'IN',
  'outside': 'OUT',
  'zone': 'ZN',
  'read': 'RD',
  'option': 'OPT',
  'sprint': 'SPRT',
  'screen': 'SCR',
  'quick': 'QK',
  'slant': 'SL',
  'streak': 'STK',
  'hitch': 'HCH',
  'corner': 'CNR',
  'post': 'PST',
  'flood': 'FLD',
  'mesh': 'MSH',
  'smash': 'SMSH',
  'drive': 'DRV',
  'right': 'RT',
  'left': 'LT',
  'strong': 'STR',
  'weak': 'WK',
  'trips': 'TRP',
  'shotgun': 'SHTGN',
  'pistol': 'PSTL',
  'singleback': 'SB',
  'bunch': 'BNCH',
  'empty': 'EMPT',
  'motion': 'MOT',
  'swing': 'SWG',
  'wheel': 'WHL',
  'seam': 'SM',
  'drag': 'DRG',
  'cross': 'CRS',
  'curl': 'CRL',
  'flat': 'FLT',
  'pass': 'PS',
  'run': 'RN',
  'play': 'PL',
  'action': 'ACT',
};

/**
 * Smart abbreviation of a play name.
 *
 * Strategy:
 * 1. Try known word abbreviations first.
 * 2. If still too long, truncate words to their first 3 characters.
 * 3. Final truncation to maxLen if needed.
 */
export function abbreviatePlayName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;

  // Split into words
  const words = name.split(/[\s\-_]+/);

  // Pass 1: replace known words with abbreviations
  let abbreviated = words
    .map((w) => {
      const lower = w.toLowerCase();
      return ABBREVIATION_MAP[lower] ?? w;
    })
    .join(' ');

  if (abbreviated.length <= maxLen) return abbreviated;

  // Pass 2: truncate each word to first 3 chars
  abbreviated = words
    .map((w) => {
      const lower = w.toLowerCase();
      const abbr = ABBREVIATION_MAP[lower];
      if (abbr) return abbr;
      return w.length > 3 ? w.slice(0, 3).toUpperCase() : w.toUpperCase();
    })
    .join(' ');

  if (abbreviated.length <= maxLen) return abbreviated;

  // Pass 3: remove spaces and truncate
  abbreviated = abbreviated.replace(/\s+/g, '');

  return abbreviated.slice(0, maxLen);
}

// ---- Color coding ----

// Predefined color palette for formations
const FORMATION_COLORS = [
  '#4CAF50', // green
  '#2196F3', // blue
  '#FF9800', // orange
  '#9C27B0', // purple
  '#F44336', // red
  '#00BCD4', // cyan
  '#FFEB3B', // yellow
  '#795548', // brown
  '#E91E63', // pink
  '#607D8B', // blue-grey
];

/**
 * Assign a color to each play based on its formation.
 * All plays sharing the same formationId get the same color.
 */
export function colorCodeByFormation(plays: Play[]): Map<string, string> {
  const formationColorMap = new Map<string, string>();
  const playColorMap = new Map<string, string>();
  let colorIndex = 0;

  for (const play of plays) {
    if (!formationColorMap.has(play.formationId)) {
      formationColorMap.set(
        play.formationId,
        FORMATION_COLORS[colorIndex % FORMATION_COLORS.length],
      );
      colorIndex++;
    }

    playColorMap.set(play.id, formationColorMap.get(play.formationId)!);
  }

  return playColorMap;
}

// ---- Generator ----

/**
 * Generate wristband data from a list of plays.
 */
export function generateWristband(plays: Play[], options: WristbandOptions): WristbandData {
  const colorMap = options.colorCode ? colorCodeByFormation(plays) : new Map<string, string>();

  const maxNameLen = options.fontSize === 'small' ? 10 : options.fontSize === 'medium' ? 15 : 20;

  const wristbandPlays: WristbandPlay[] = plays.map((play) => ({
    id: play.id,
    displayName: options.abbreviate
      ? abbreviatePlayName(play.name, maxNameLen)
      : play.name,
    formationId: play.formationId,
    color: colorMap.get(play.id),
  }));

  // Chunk into rows
  const rows: WristbandRow[] = [];
  for (let i = 0; i < wristbandPlays.length; i += options.columns) {
    const cells = wristbandPlays.slice(i, i + options.columns);
    // Pad the last row if needed
    while (cells.length < options.columns) {
      cells.push({ id: '', displayName: '', formationId: '', color: undefined });
    }
    rows.push({ cells });
  }

  return {
    rows,
    columns: options.columns,
    fontSize: options.fontSize,
  };
}

// ---- Print formatting ----

const FONT_SIZE_MAP: Record<'small' | 'medium' | 'large', number> = {
  small: 8,
  medium: 10,
  large: 12,
};

/**
 * Convert wristband data into a print-ready structure with explicit styling.
 */
export function formatForPrint(wristband: WristbandData): PrintReadyWristband {
  const fontSize = FONT_SIZE_MAP[wristband.fontSize];
  let totalPlays = 0;

  const rows: PrintRow[] = wristband.rows.map((row) => ({
    cells: row.cells.map((cell) => {
      if (cell.id) totalPlays++;

      const backgroundColor = cell.color ?? '#FFFFFF';
      // Use dark text for light backgrounds, light text for dark backgrounds
      const textColor = isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';

      return {
        text: cell.displayName,
        backgroundColor,
        textColor,
        fontSize,
      };
    }),
  }));

  return {
    rows,
    columns: wristband.columns,
    totalPlays,
  };
}

/**
 * Simple luminance check to determine if a hex color is "light".
 */
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance approximation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
