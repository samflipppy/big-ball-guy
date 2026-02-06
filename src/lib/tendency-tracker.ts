import { generateId } from '@/lib/utils';

// ============================================================
// Opponent Tendency Tracking
// ============================================================

export interface TendencyRecord {
  id: string;
  down: number;
  distance: string;
  fieldPosition: string;
  playType: string;
  formation: string;
  createdAt: string;
}

export interface TendencyFilters {
  down?: number;
  distance?: string;
  fieldPosition?: string;
  playType?: string;
  formation?: string;
}

export interface TendencySummaryEntry {
  playType: string;
  count: number;
  percentage: number;
}

export interface TendencySummary {
  down: number;
  total: number;
  entries: TendencySummaryEntry[];
}

// ============================================================
// In-memory tendency store
// ============================================================

let tendencies: TendencyRecord[] = [];

/**
 * Record an opponent tendency for a given down-distance-field situation.
 */
export function recordTendency(
  down: number,
  distance: string,
  fieldPosition: string,
  playType: string,
  formation: string,
): TendencyRecord {
  const record: TendencyRecord = {
    id: generateId(),
    down,
    distance,
    fieldPosition,
    playType,
    formation,
    createdAt: new Date().toISOString(),
  };
  tendencies.push(record);
  return record;
}

/**
 * Retrieve tendencies matching the provided filters.
 * Omitted filter keys are ignored (match-all).
 */
export function getTendencies(filters: TendencyFilters = {}): TendencyRecord[] {
  return tendencies.filter((t) => {
    if (filters.down !== undefined && t.down !== filters.down) return false;
    if (filters.distance !== undefined && t.distance !== filters.distance) return false;
    if (filters.fieldPosition !== undefined && t.fieldPosition !== filters.fieldPosition) return false;
    if (filters.playType !== undefined && t.playType !== filters.playType) return false;
    if (filters.formation !== undefined && t.formation !== filters.formation) return false;
    return true;
  });
}

/**
 * Get percentage breakdowns of play types for a given down.
 */
export function getTendencySummary(down: number): TendencySummary {
  const filtered = tendencies.filter((t) => t.down === down);
  const total = filtered.length;

  if (total === 0) {
    return { down, total: 0, entries: [] };
  }

  // Count by playType
  const counts: Record<string, number> = {};
  for (const t of filtered) {
    counts[t.playType] = (counts[t.playType] || 0) + 1;
  }

  const entries: TendencySummaryEntry[] = Object.entries(counts)
    .map(([playType, count]) => ({
      playType,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10, // one decimal place
    }))
    .sort((a, b) => b.count - a.count);

  return { down, total, entries };
}

/**
 * Export all tendency records.
 */
export function exportTendencies(): TendencyRecord[] {
  return [...tendencies];
}

/**
 * Import tendency records (replaces current store).
 */
export function importTendencies(records: TendencyRecord[]): void {
  tendencies = [...records];
}

/**
 * Clear all tendency records. Useful for testing and resets.
 */
export function clearTendencies(): void {
  tendencies = [];
}

/**
 * Get the current count of stored tendencies.
 */
export function getTendencyCount(): number {
  return tendencies.length;
}
