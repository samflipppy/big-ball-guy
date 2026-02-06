import type { Play } from '@/types';

// ============================================================
// Tendency Record type (for tendency CSV export)
// ============================================================

export interface TendencyRecord {
  situation: string;
  personnel: string;
  formation?: string;
  playType: string;
  direction?: 'left' | 'right' | 'middle';
  percentage: number;
  sampleSize: number;
  notes?: string;
}

// ============================================================
// CSV helpers
// ============================================================

/**
 * Escape a single CSV field value. Wraps in double-quotes if the value
 * contains commas, double-quotes, or newlines.
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build a CSV string from headers and rows.
 */
function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = rows.map((row) => row.map(escapeCSVField).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// ============================================================
// Public API
// ============================================================

/**
 * Export plays to CSV with columns:
 * name, formation, personnel, tags, routeCount, blockCount, notes, createdAt
 */
export function exportPlaysToCSV(plays: Play[]): string {
  const headers = [
    'name',
    'formation',
    'personnel',
    'tags',
    'routeCount',
    'blockCount',
    'notes',
    'createdAt',
  ];

  const rows = plays.map((play) => {
    const routeCount = play.assignments.filter((a) => a.route != null).length;
    const blockCount = play.assignments.filter((a) => a.blocking != null).length;

    return [
      play.name,
      play.formationId,
      play.personnel,
      play.tags.join('; '),
      String(routeCount),
      String(blockCount),
      play.notes ?? '',
      play.createdAt,
    ];
  });

  return buildCSV(headers, rows);
}

/**
 * Export tendency data to CSV with columns:
 * situation, personnel, formation, playType, direction, percentage, sampleSize, notes
 */
export function exportTendenciesToCSV(tendencies: TendencyRecord[]): string {
  const headers = [
    'situation',
    'personnel',
    'formation',
    'playType',
    'direction',
    'percentage',
    'sampleSize',
    'notes',
  ];

  const rows = tendencies.map((t) => [
    t.situation,
    t.personnel,
    t.formation ?? '',
    t.playType,
    t.direction ?? '',
    String(t.percentage),
    String(t.sampleSize),
    t.notes ?? '',
  ]);

  return buildCSV(headers, rows);
}
