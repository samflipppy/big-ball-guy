import type { Play } from '@/types';

// ============================================================
// Call Sheet Template Types
// ============================================================

export interface CallSheetTemplate {
  id: string;
  name: string;
  columns: number;
  rows: number;
  cellSize: { width: number; height: number };
  headerFields: string[];
  showSituation: boolean;
}

export interface CallSheetCell {
  playId: string;
  playName: string;
  situation?: string;
  category?: string;
  row: number;
  column: number;
}

export interface CallSheetGrid {
  templateId: string;
  templateName: string;
  columns: number;
  rows: number;
  cells: CallSheetCell[];
  headerFields: string[];
}

// ============================================================
// Built-in Templates
// ============================================================

export const STANDARD_TEMPLATE: CallSheetTemplate = {
  id: 'standard',
  name: 'Standard',
  columns: 4,
  rows: 8,
  cellSize: { width: 160, height: 60 },
  headerFields: ['Play Name', 'Formation', 'Personnel', 'Tags'],
  showSituation: false,
};

export const COMPRESSED_TEMPLATE: CallSheetTemplate = {
  id: 'compressed',
  name: 'Compressed',
  columns: 6,
  rows: 12,
  cellSize: { width: 110, height: 40 },
  headerFields: ['Play Name', 'Formation'],
  showSituation: false,
};

export const CATEGORIZED_TEMPLATE: CallSheetTemplate = {
  id: 'categorized',
  name: 'Categorized',
  columns: 4,
  rows: 10,
  cellSize: { width: 160, height: 55 },
  headerFields: ['Situation', 'Play Name', 'Formation', 'Notes'],
  showSituation: true,
};

export const BUILT_IN_TEMPLATES: CallSheetTemplate[] = [
  STANDARD_TEMPLATE,
  COMPRESSED_TEMPLATE,
  CATEGORIZED_TEMPLATE,
];

/**
 * Get a built-in template by its ID.
 */
export function getTemplate(id: string): CallSheetTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

// ============================================================
// Apply Template
// ============================================================

/**
 * Arrange plays into a grid based on the given template.
 * For the 'categorized' template, plays are grouped by category/situation.
 * For other templates, plays fill the grid in reading order (left-to-right, top-to-bottom).
 */
export function applyTemplate(
  plays: Play[],
  template: CallSheetTemplate,
): CallSheetGrid {
  const maxCells = template.columns * template.rows;
  const cells: CallSheetCell[] = [];

  if (template.showSituation) {
    // Group by category, then lay out each group as a consecutive run
    const groups = new Map<string, Play[]>();
    for (const play of plays) {
      const key = play.category ?? 'General';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(play);
    }

    let cellIndex = 0;
    for (const [situation, groupPlays] of groups) {
      for (const play of groupPlays) {
        if (cellIndex >= maxCells) break;
        const row = Math.floor(cellIndex / template.columns);
        const col = cellIndex % template.columns;
        cells.push({
          playId: play.id,
          playName: play.name,
          situation,
          category: play.category,
          row,
          column: col,
        });
        cellIndex++;
      }
    }
  } else {
    // Fill in reading order
    const count = Math.min(plays.length, maxCells);
    for (let i = 0; i < count; i++) {
      const play = plays[i];
      const row = Math.floor(i / template.columns);
      const col = i % template.columns;
      cells.push({
        playId: play.id,
        playName: play.name,
        category: play.category,
        row,
        column: col,
      });
    }
  }

  return {
    templateId: template.id,
    templateName: template.name,
    columns: template.columns,
    rows: template.rows,
    cells,
    headerFields: template.headerFields,
  };
}

// ============================================================
// Create Custom Template
// ============================================================

let customCounter = 0;

/**
 * Create a custom call sheet template by merging config with standard defaults.
 */
export function createCustomTemplate(
  name: string,
  config: Partial<CallSheetTemplate> = {},
): CallSheetTemplate {
  customCounter++;
  return {
    id: config.id ?? `custom-${customCounter}`,
    name,
    columns: config.columns ?? STANDARD_TEMPLATE.columns,
    rows: config.rows ?? STANDARD_TEMPLATE.rows,
    cellSize: config.cellSize ?? { ...STANDARD_TEMPLATE.cellSize },
    headerFields: config.headerFields ?? [...STANDARD_TEMPLATE.headerFields],
    showSituation: config.showSituation ?? false,
  };
}
