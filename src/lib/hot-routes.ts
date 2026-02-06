import type { Play, PlayerAssignment, DefensiveOverlay } from '@/types';
import { generateId } from '@/lib/utils';

// ============================================================
// Hot Route Triggers
// ============================================================

export interface HotRouteTrigger {
  id: string;
  name: string;
  defensiveKey: string; // e.g., 'blitz', 'man-coverage', 'cover-0', 'cover-2'
  adjustment: PlayerAssignment[];
}

/**
 * Check whether a defensive alignment matches a trigger's defensive key.
 * Matching rules:
 *  - 'blitz': defense has a blitz defined
 *  - 'man-coverage': coverage name contains 'Man' or 'Cover 0' or 'Cover 1' (excluding Robber)
 *  - 'zone-coverage': coverage contains 'Cover 2', 'Cover 3', 'Cover 4', 'Cover 6', 'Quarters'
 *  - Other: exact substring match against front name, coverage name, or blitz string
 */
export function doesTriggerMatch(
  defense: DefensiveOverlay,
  trigger: HotRouteTrigger,
): boolean {
  const key = trigger.defensiveKey.toLowerCase();
  const coverage = defense.coverage.toLowerCase();
  const front = defense.front.toLowerCase();
  const blitz = (defense.blitz ?? '').toLowerCase();

  switch (key) {
    case 'blitz':
      return !!defense.blitz && defense.blitz.trim().length > 0;

    case 'man-coverage':
      return (
        coverage.includes('man') ||
        coverage === 'cover 0' ||
        (coverage.startsWith('cover 1') && !coverage.includes('robber'))
      );

    case 'zone-coverage':
      return (
        coverage.includes('cover 2') ||
        coverage.includes('cover 3') ||
        coverage.includes('cover 4') ||
        coverage.includes('cover 6') ||
        coverage.includes('quarters')
      );

    default:
      // Generic substring match
      return (
        coverage.includes(key) ||
        front.includes(key) ||
        blitz.includes(key)
      );
  }
}

/**
 * Find the first matching trigger for a given defense.
 * Returns the trigger if found, or undefined.
 */
export function matchTrigger(
  defense: DefensiveOverlay,
  triggers: HotRouteTrigger[],
): HotRouteTrigger | undefined {
  return triggers.find((trigger) => doesTriggerMatch(defense, trigger));
}

/**
 * Find all matching triggers for a given defense.
 */
export function matchAllTriggers(
  defense: DefensiveOverlay,
  triggers: HotRouteTrigger[],
): HotRouteTrigger[] {
  return triggers.filter((trigger) => doesTriggerMatch(defense, trigger));
}

/**
 * Apply a hot route trigger to a play: replace assignments for any player
 * that appears in the trigger's adjustment list.
 * Returns a new Play object (does not mutate the original).
 */
export function applyHotRoute(
  play: Play,
  trigger: HotRouteTrigger,
): Play {
  const adjustedPlayerIds = new Set(trigger.adjustment.map((a) => a.playerId));

  const newAssignments = play.assignments.map((assignment) => {
    if (adjustedPlayerIds.has(assignment.playerId)) {
      const replacement = trigger.adjustment.find(
        (a) => a.playerId === assignment.playerId,
      );
      return replacement ? { ...replacement } : assignment;
    }
    return { ...assignment };
  });

  // Also add any adjustments for players not in the original assignments
  for (const adj of trigger.adjustment) {
    if (!play.assignments.some((a) => a.playerId === adj.playerId)) {
      newAssignments.push({ ...adj });
    }
  }

  return {
    ...play,
    assignments: newAssignments,
  };
}

/**
 * Create a hot route trigger with a generated ID.
 */
export function createHotRouteTrigger(
  name: string,
  defensiveKey: string,
  adjustment: PlayerAssignment[],
): HotRouteTrigger {
  return {
    id: generateId(),
    name,
    defensiveKey,
    adjustment,
  };
}
