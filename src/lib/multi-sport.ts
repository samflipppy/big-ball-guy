import type { Play, Position } from '@/types';

// ---- Types ----

export type Sport = 'football' | 'basketball' | 'soccer' | 'lacrosse' | 'hockey';

export interface SportConfig {
  sport: Sport;
  fieldWidth: number;
  fieldHeight: number;
  playerCount: number;
  positions: string[];
  fieldColor: string;
  lineColor: string;
  fieldShape: 'rectangle' | 'oval';
}

// ---- Sport configurations ----

/**
 * Sport-specific configurations with correct field dimensions (in pixels)
 * and position lists.
 */
export const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  football: {
    sport: 'football',
    fieldWidth: 800,
    fieldHeight: 500,
    playerCount: 11,
    positions: [
      'QB', 'RB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT',
      'DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'CB', 'SS', 'FS',
    ],
    fieldColor: '#2d5a27',
    lineColor: '#ffffff',
    fieldShape: 'rectangle',
  },
  basketball: {
    sport: 'basketball',
    fieldWidth: 564,
    fieldHeight: 300,
    playerCount: 5,
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
    fieldColor: '#c68642',
    lineColor: '#ffffff',
    fieldShape: 'rectangle',
  },
  soccer: {
    sport: 'soccer',
    fieldWidth: 700,
    fieldHeight: 450,
    playerCount: 11,
    positions: [
      'GK', 'LB', 'CB', 'RB', 'LWB', 'RWB',
      'CDM', 'CM', 'CAM', 'LM', 'RM',
      'LW', 'RW', 'CF', 'ST',
    ],
    fieldColor: '#2d7a32',
    lineColor: '#ffffff',
    fieldShape: 'rectangle',
  },
  lacrosse: {
    sport: 'lacrosse',
    fieldWidth: 660,
    fieldHeight: 360,
    playerCount: 10,
    positions: [
      'A1', 'A2', 'A3', // attackmen
      'M1', 'M2', 'M3', // midfielders
      'D1', 'D2', 'D3', // defensemen
      'G', // goalie
    ],
    fieldColor: '#2d5a27',
    lineColor: '#ffffff',
    fieldShape: 'rectangle',
  },
  hockey: {
    sport: 'hockey',
    fieldWidth: 600,
    fieldHeight: 260,
    playerCount: 6,
    positions: ['C', 'LW', 'RW', 'LD', 'RD', 'G'],
    fieldColor: '#dce6f0',
    lineColor: '#cc0000',
    fieldShape: 'oval',
  },
};

// ---- Position lookup ----

/**
 * Get the list of positions for a given sport.
 */
export function getPositionsForSport(sport: Sport): string[] {
  const config = SPORT_CONFIGS[sport];
  if (!config) {
    throw new Error(`Unknown sport: ${sport}`);
  }
  return [...config.positions];
}

// ---- Field dimensions ----

/**
 * Get the field dimensions for a given sport.
 */
export function getFieldDimensions(sport: Sport): { width: number; height: number } {
  const config = SPORT_CONFIGS[sport];
  if (!config) {
    throw new Error(`Unknown sport: ${sport}`);
  }
  return { width: config.fieldWidth, height: config.fieldHeight };
}

// ---- Cross-sport conversion ----

/**
 * Convert a play's coordinates from one sport's field to another.
 *
 * Scales player positions and route points proportionally based on the
 * field dimension ratios between the two sports.
 */
export function convertPlayBetweenSports(
  play: Play,
  fromSport: Sport,
  toSport: Sport,
): Play {
  const fromConfig = SPORT_CONFIGS[fromSport];
  const toConfig = SPORT_CONFIGS[toSport];

  if (!fromConfig) {
    throw new Error(`Unknown source sport: ${fromSport}`);
  }
  if (!toConfig) {
    throw new Error(`Unknown target sport: ${toSport}`);
  }

  const scaleX = toConfig.fieldWidth / fromConfig.fieldWidth;
  const scaleY = toConfig.fieldHeight / fromConfig.fieldHeight;

  function scalePosition(pos: Position): Position {
    return {
      x: Math.round(pos.x * scaleX * 100) / 100,
      y: Math.round(pos.y * scaleY * 100) / 100,
    };
  }

  // Scale assignments (routes, motions, etc.)
  const scaledAssignments = play.assignments.map((assignment) => {
    const scaled = { ...assignment };

    if (assignment.route) {
      scaled.route = {
        ...assignment.route,
        points: assignment.route.points.map((pt) => ({
          ...pt,
          ...scalePosition(pt),
        })),
      };
    }

    if (assignment.motion) {
      scaled.motion = {
        ...assignment.motion,
        startPosition: scalePosition(assignment.motion.startPosition),
        endPosition: scalePosition(assignment.motion.endPosition),
      };
    }

    return scaled;
  });

  // Scale defensive overlay player positions
  let scaledDefensiveOverlay = play.defensiveOverlay;
  if (play.defensiveOverlay) {
    scaledDefensiveOverlay = {
      ...play.defensiveOverlay,
      players: play.defensiveOverlay.players.map((p) => ({
        ...p,
        location: scalePosition(p.location),
      })),
    };
  }

  return {
    ...play,
    assignments: scaledAssignments,
    defensiveOverlay: scaledDefensiveOverlay,
    tags: [...play.tags.filter((t) => t !== fromSport), toSport, 'converted'],
    notes: `${play.notes ?? ''}\nConverted from ${fromSport} to ${toSport}.`.trim(),
    updatedAt: new Date().toISOString(),
  };
}
