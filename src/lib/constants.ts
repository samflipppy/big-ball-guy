import type { FieldDimensions, Formation, Player } from '@/types';

// Field canvas defaults
export const DEFAULT_FIELD: FieldDimensions = {
  width: 800,
  height: 500,
  yardsVisible: 30,
  lineOfScrimmageY: 250,
};

export const PIXELS_PER_YARD = DEFAULT_FIELD.width / 53.3; // Standard field width = 53.33 yards
export const YARD_LINE_SPACING = DEFAULT_FIELD.height / DEFAULT_FIELD.yardsVisible;

// Player rendering
export const PLAYER_RADIUS = 14;
export const PLAYER_FONT_SIZE = 10;
export const PLAYER_COLORS = {
  offense: '#2563eb', // blue-600
  defense: '#dc2626', // red-600
  highlight: '#f59e0b', // amber-500
  selected: '#8b5cf6', // violet-500
};

// Route rendering
export const ROUTE_STROKE_WIDTH = 2.5;
export const ROUTE_ARROW_SIZE = 8;
export const ROUTE_COLORS: Record<string, string> = {
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
};

// Blocking symbols
export const BLOCK_STROKE_WIDTH = 3;
export const BLOCK_COLORS = {
  drive: '#2563eb',
  reach: '#16a34a',
  pull: '#f59e0b',
  trap: '#dc2626',
  'pass-pro': '#6b7280',
  default: '#2563eb',
};

// Canvas
export const CANVAS_BG_COLOR = '#2d5a27'; // Field green
export const CANVAS_BG_COLOR_DARK = '#1a3d18'; // Dark field green
export const LINE_COLOR = '#ffffff';
export const HASH_COLOR = 'rgba(255, 255, 255, 0.4)';
export const GRID_COLOR = 'rgba(255, 255, 255, 0.08)';

// Drawing smoothing
export const SMOOTHING_EPSILON = 3; // RDP simplification tolerance
export const MIN_DRAW_DISTANCE = 5; // Min pixel distance between freehand points

// Auto-save
export const AUTO_SAVE_DELAY = 1500; // ms debounce

// Thumbnail
export const THUMBNAIL_WIDTH = 200;
export const THUMBNAIL_HEIGHT = 125;

// Wristband
export const WRISTBAND_DEFAULTS = {
  columns: 4,
  rows: 8,
  fontSize: 7,
  cellWidth: 90,
  cellHeight: 55,
};

// Scouting
export const SCOUTING_COLORS = {
  weakness: '#ef4444', // red
  strength: '#3b82f6', // blue
  neutral: '#f59e0b', // amber
  unblocked: '#ef4444',
  advantage: '#22c55e', // green
  even: '#f59e0b',
  disadvantage: '#ef4444',
};

// Default 11-personnel offensive formation (Singleback)
export const DEFAULT_OFFENSE_PLAYERS: Player[] = [
  { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
  { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
  { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 245 }, side: 'offense' },
  { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: 245 }, side: 'offense' },
  { id: 'h', position: 'WR', label: 'H', location: { x: 580, y: 248 }, side: 'offense' },
  { id: 'te', position: 'TE', label: 'Y', location: { x: 490, y: 248 }, side: 'offense' },
  { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: 248 }, side: 'offense' },
  { id: 'lg', position: 'LG', label: 'LG', location: { x: 350, y: 248 }, side: 'offense' },
  { id: 'c', position: 'C', label: 'C', location: { x: 400, y: 248 }, side: 'offense' },
  { id: 'rg', position: 'RG', label: 'RG', location: { x: 450, y: 248 }, side: 'offense' },
  { id: 'rt', position: 'RT', label: 'RT', location: { x: 490, y: 248 }, side: 'offense' },
];

// Default 4-3 defense
export const DEFAULT_DEFENSE_PLAYERS: Player[] = [
  { id: 'de1', position: 'DE', label: 'DE', location: { x: 290, y: 220 }, side: 'defense' },
  { id: 'dt1', position: 'DT', label: 'DT', location: { x: 360, y: 220 }, side: 'defense' },
  { id: 'dt2', position: 'DT', label: 'DT', location: { x: 440, y: 220 }, side: 'defense' },
  { id: 'de2', position: 'DE', label: 'DE', location: { x: 510, y: 220 }, side: 'defense' },
  { id: 'mlb', position: 'MLB', label: 'M', location: { x: 400, y: 190 }, side: 'defense' },
  { id: 'wlb', position: 'OLB', label: 'W', location: { x: 300, y: 190 }, side: 'defense' },
  { id: 'slb', position: 'OLB', label: 'S', location: { x: 500, y: 190 }, side: 'defense' },
  { id: 'cb1', position: 'CB', label: 'CB', location: { x: 100, y: 200 }, side: 'defense' },
  { id: 'cb2', position: 'CB', label: 'CB', location: { x: 660, y: 200 }, side: 'defense' },
  { id: 'ss', position: 'SS', label: 'SS', location: { x: 450, y: 140 }, side: 'defense' },
  { id: 'fs', position: 'FS', label: 'FS', location: { x: 350, y: 120 }, side: 'defense' },
];

// Personnel groupings
export const PERSONNEL_GROUPS = [
  { code: '10', description: '1 RB, 0 TE, 4 WR' },
  { code: '11', description: '1 RB, 1 TE, 3 WR' },
  { code: '12', description: '1 RB, 2 TE, 2 WR' },
  { code: '13', description: '1 RB, 3 TE, 1 WR' },
  { code: '20', description: '2 RB, 0 TE, 3 WR' },
  { code: '21', description: '2 RB, 1 TE, 2 WR' },
  { code: '22', description: '2 RB, 2 TE, 1 WR' },
  { code: '23', description: '2 RB, 3 TE, 0 WR' },
];

// Common defensive fronts
export const DEFENSIVE_FRONTS = [
  '4-3 Over', '4-3 Under', '3-4', 'Nickel', 'Dime',
  '4-2-5', '3-3-5', '5-2', '6-1', '46',
];

// Common coverages
export const COVERAGES = [
  'Cover 0', 'Cover 1', 'Cover 2', 'Cover 2 Man',
  'Cover 3', 'Cover 3 Cloud', 'Cover 4', 'Cover 6',
  'Man Free', 'Quarters',
];
