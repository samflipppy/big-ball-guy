import type { Play, Player, PlayerAssignment, DefensiveOverlay } from '@/types';
import { DEFAULT_FIELD } from '@/lib/constants';

// ============================================================
// Scouting Alerts — Analyze play + defense to detect issues
// ============================================================

export type ScoutingAlertType = 'unblocked' | 'numbers-advantage' | 'numbers-disadvantage';

export interface ScoutingAlert {
  type: ScoutingAlertType;
  playerId: string;
  zone: string;
  message: string;
}

export type FieldZone = 'left' | 'middle' | 'right';

/**
 * Determine which third of the field a player is in based on x-coordinate.
 * The field is divided into three equal zones: left (0-266), middle (267-533), right (534-800).
 */
export function getFieldZone(x: number): FieldZone {
  const thirdWidth = DEFAULT_FIELD.width / 3;
  if (x < thirdWidth) return 'left';
  if (x < thirdWidth * 2) return 'middle';
  return 'right';
}

/**
 * Find defensive players that have no offensive blocker assigned to them.
 * Compares blocking assignments in the play against defensive player positions.
 */
export function findUnblockedDefenders(
  play: Play,
  defense: DefensiveOverlay,
): ScoutingAlert[] {
  const alerts: ScoutingAlert[] = [];

  // Collect all defensive player IDs that are targeted by a blocking assignment
  const blockedDefenderIds = new Set<string>();
  for (const assignment of play.assignments) {
    if (assignment.blocking?.targetId) {
      blockedDefenderIds.add(assignment.blocking.targetId);
    }
  }

  // Only flag box defenders (DL and LBs) as unblocked threats — not DBs.
  const boxPositions = new Set(['DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'LB']);

  for (const defender of defense.players) {
    if (!boxPositions.has(defender.position)) continue;
    if (!blockedDefenderIds.has(defender.id)) {
      const zone = getFieldZone(defender.location.x);
      alerts.push({
        type: 'unblocked',
        playerId: defender.id,
        zone,
        message: `${defender.label} (${defender.position}) is unblocked in the ${zone} zone`,
      });
    }
  }

  return alerts;
}

/**
 * Count offensive and defensive players in each zone and detect
 * numbers advantages / disadvantages for the offense.
 */
export function analyzeNumbersByZone(
  offensePlayers: Player[],
  defensePlayers: Player[],
): ScoutingAlert[] {
  const alerts: ScoutingAlert[] = [];

  const zones: FieldZone[] = ['left', 'middle', 'right'];

  for (const zone of zones) {
    const offenseCount = offensePlayers.filter(
      (p) => getFieldZone(p.location.x) === zone,
    ).length;
    const defenseCount = defensePlayers.filter(
      (p) => getFieldZone(p.location.x) === zone,
    ).length;

    if (offenseCount > defenseCount) {
      alerts.push({
        type: 'numbers-advantage',
        playerId: '',
        zone,
        message: `Offense has numbers advantage in ${zone} zone (${offenseCount} vs ${defenseCount})`,
      });
    } else if (defenseCount > offenseCount) {
      alerts.push({
        type: 'numbers-disadvantage',
        playerId: '',
        zone,
        message: `Defense has numbers advantage in ${zone} zone (${defenseCount} vs ${offenseCount})`,
      });
    }
  }

  return alerts;
}

/**
 * Full analysis of a play against a defensive overlay.
 * Returns all scouting alerts (unblocked defenders + numbers analysis).
 */
export function analyzePlayDefense(
  play: Play,
  defense: DefensiveOverlay,
  offensePlayers: Player[],
): ScoutingAlert[] {
  const alerts: ScoutingAlert[] = [];

  // 1. Unblocked defenders
  alerts.push(...findUnblockedDefenders(play, defense));

  // 2. Numbers by zone
  alerts.push(...analyzeNumbersByZone(offensePlayers, defense.players));

  return alerts;
}
