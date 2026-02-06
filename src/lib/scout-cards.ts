import type { TendencyEntry, Play, Formation } from '@/types';
import { generateId } from '@/lib/utils';

// ============================================================
// Scout Card types
// ============================================================

export interface ScoutCard {
  id: string;
  situation: string;
  playId: string;
  playName: string;
  formationId: string;
  tendency: TendencyEntry;
  frequency: number;
  notes: string;
}

// ============================================================
// Core generation function
// ============================================================

/**
 * Generate scout cards from opponent tendencies, matched against
 * available plays and formations.
 *
 * Each tendency entry becomes one scout card. The card captures the
 * situation, the play diagram reference (via playId/formationId), the
 * frequency percentage, and any notes.
 */
export function generateScoutCards(
  tendencies: TendencyEntry[],
  plays: Play[],
  formations: Formation[],
): ScoutCard[] {
  const playMap = new Map(plays.map((p) => [p.id, p]));
  const formationMap = new Map(formations.map((f) => [f.id, f]));

  const cards: ScoutCard[] = [];

  for (const tendency of tendencies) {
    // Find a matching play for this tendency.
    // Match by playType tag, or fallback to any play with matching personnel/formation.
    const matchedPlay = findMatchingPlay(tendency, plays, formationMap);
    if (!matchedPlay) continue;

    cards.push({
      id: generateId(),
      situation: tendency.situation,
      playId: matchedPlay.id,
      playName: matchedPlay.name,
      formationId: matchedPlay.formationId,
      tendency,
      frequency: tendency.percentage,
      notes: tendency.notes ?? '',
    });
  }

  return sortByFrequency(cards);
}

/**
 * Find a play that best matches a tendency entry.
 *
 * Matching priority:
 *   1. Play tag matches the tendency playType AND formation matches
 *   2. Play tag matches the tendency playType
 *   3. Play personnel matches the tendency personnel
 */
function findMatchingPlay(
  tendency: TendencyEntry,
  plays: Play[],
  formationMap: Map<string, Formation>,
): Play | undefined {
  const playType = tendency.playType.toLowerCase();

  // Priority 1: tag + formation match
  if (tendency.formation) {
    const formationName = tendency.formation.toLowerCase();
    const match = plays.find(
      (p) =>
        p.tags.some((t) => t.toLowerCase() === playType) &&
        formationMap.get(p.formationId)?.name.toLowerCase() === formationName,
    );
    if (match) return match;
  }

  // Priority 2: tag match
  const tagMatch = plays.find((p) =>
    p.tags.some((t) => t.toLowerCase() === playType),
  );
  if (tagMatch) return tagMatch;

  // Priority 3: personnel match
  const personnelMatch = plays.find(
    (p) => p.personnel === tendency.personnel,
  );
  if (personnelMatch) return personnelMatch;

  // Fallback: first play
  return plays[0];
}

// ============================================================
// Grouping and sorting utilities
// ============================================================

/**
 * Group scout cards by their situation label.
 */
export function groupBySituation(cards: ScoutCard[]): Map<string, ScoutCard[]> {
  const groups = new Map<string, ScoutCard[]>();

  for (const card of cards) {
    const existing = groups.get(card.situation);
    if (existing) {
      existing.push(card);
    } else {
      groups.set(card.situation, [card]);
    }
  }

  // Sort each group by frequency descending
  for (const [, group] of groups) {
    group.sort((a, b) => b.frequency - a.frequency);
  }

  return groups;
}

/**
 * Sort scout cards by frequency descending (most frequent first).
 */
export function sortByFrequency(cards: ScoutCard[]): ScoutCard[] {
  return [...cards].sort((a, b) => b.frequency - a.frequency);
}
