import type { Play } from '@/types';

// ---- Types ----

export interface DrillCard {
  id: string;
  name: string;
  playId: string;
  period: string;
  repCount: number;
  tempo: 'walk-through' | 'jog' | 'full-speed';
  coachingPoints: string[];
  equipment: string[];
}

export interface DrillCardOptions {
  period: string;
  repCount?: number;
  tempo?: DrillCard['tempo'];
  coachingPoints?: string[];
  equipment?: string[];
}

export interface PracticeScriptEntry {
  drillCard: DrillCard;
  startMinute: number;
  durationMinutes: number;
}

// ---- Constants ----

const TEMPO_MINUTES: Record<DrillCard['tempo'], number> = {
  'walk-through': 3,
  'jog': 5,
  'full-speed': 7,
};

const REP_MINUTES = 0.5; // additional minutes per rep beyond the first

// ---- Generation ----

/**
 * Generate a drill card from a play.
 */
export function generateDrillCard(play: Play, options: DrillCardOptions): DrillCard {
  const coachingPoints = options.coachingPoints ?? deriveCoachingPoints(play);
  const equipment = options.equipment ?? deriveEquipment(play);

  return {
    id: `drill-${play.id}-${Date.now()}`,
    name: play.name,
    playId: play.id,
    period: options.period,
    repCount: options.repCount ?? 3,
    tempo: options.tempo ?? 'full-speed',
    coachingPoints,
    equipment,
  };
}

/**
 * Derive coaching points from a play's properties.
 */
function deriveCoachingPoints(play: Play): string[] {
  const points: string[] = [];

  // Check for route assignments
  const routeAssignments = play.assignments.filter((a) => a.route);
  if (routeAssignments.length > 0) {
    points.push('Focus on route timing and depth');
    points.push('Eyes on the quarterback through the break');
  }

  // Check for blocking assignments
  const blockingAssignments = play.assignments.filter((a) => a.blocking);
  if (blockingAssignments.length > 0) {
    points.push('Sustain blocks through the whistle');
    points.push('Maintain proper pad level');
  }

  // Check for motion
  const motionAssignments = play.assignments.filter((a) => a.motion);
  if (motionAssignments.length > 0) {
    points.push('Motion timing must be precise');
  }

  if (points.length === 0) {
    points.push('Execute with proper technique');
    points.push('Communicate pre-snap reads');
  }

  return points;
}

/**
 * Derive equipment needs from a play's properties.
 */
function deriveEquipment(play: Play): string[] {
  const equipment: string[] = ['footballs'];

  const hasRoutes = play.assignments.some((a) => a.route);
  const hasBlocking = play.assignments.some((a) => a.blocking);

  if (hasRoutes) {
    equipment.push('cones');
  }

  if (hasBlocking) {
    equipment.push('blocking pads');
  }

  return equipment;
}

// ---- Practice Script ----

/**
 * Estimate the time needed for a single drill card.
 */
export function estimateDrillTime(card: DrillCard): number {
  const baseMins = TEMPO_MINUTES[card.tempo];
  const extraReps = Math.max(0, card.repCount - 1) * REP_MINUTES;
  return baseMins + extraReps;
}

/**
 * Build a practice script from drill cards, auto-allocating time.
 *
 * If the total estimated time exceeds `totalMinutes`, drills are proportionally
 * scaled down. If there's surplus time, it's distributed evenly.
 */
export function buildPracticeScript(
  drillCards: DrillCard[],
  totalMinutes: number,
): PracticeScriptEntry[] {
  if (drillCards.length === 0) return [];

  // Estimate raw time for each card
  const estimates = drillCards.map((card) => ({
    card,
    rawMinutes: estimateDrillTime(card),
  }));

  const totalEstimated = estimates.reduce((sum, e) => sum + e.rawMinutes, 0);

  // Scale factor to fit within totalMinutes
  const scale = totalEstimated > 0 ? totalMinutes / totalEstimated : 1;

  let currentMinute = 0;
  const entries: PracticeScriptEntry[] = [];

  for (const est of estimates) {
    const duration = Math.max(1, Math.round(est.rawMinutes * scale));

    entries.push({
      drillCard: est.card,
      startMinute: currentMinute,
      durationMinutes: duration,
    });

    currentMinute += duration;
  }

  return entries;
}

// ---- Grouping ----

/**
 * Group drill cards by their practice period.
 */
export function groupByPeriod(drillCards: DrillCard[]): Map<string, DrillCard[]> {
  const groups = new Map<string, DrillCard[]>();

  for (const card of drillCards) {
    const period = card.period;
    if (!groups.has(period)) {
      groups.set(period, []);
    }
    groups.get(period)!.push(card);
  }

  return groups;
}

// ---- Export ----

/**
 * Export drill cards to JSON or CSV format.
 */
export function exportDrillCards(cards: DrillCard[], format: 'json' | 'csv'): string {
  if (format === 'json') {
    return JSON.stringify(cards, null, 2);
  }

  // CSV export
  const headers = [
    'id',
    'name',
    'playId',
    'period',
    'repCount',
    'tempo',
    'coachingPoints',
    'equipment',
  ];

  const rows = cards.map((card) => [
    escapeCSV(card.id),
    escapeCSV(card.name),
    escapeCSV(card.playId),
    escapeCSV(card.period),
    String(card.repCount),
    escapeCSV(card.tempo),
    escapeCSV(card.coachingPoints.join('; ')),
    escapeCSV(card.equipment.join('; ')),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
