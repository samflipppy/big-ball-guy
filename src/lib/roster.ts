import type { Formation, PlayerPosition } from '@/types';

// ---- Types ----

export interface RosterPlayer {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  height: string;
  weight: number;
  year: string;
  isStarter: boolean;
}

// ---- Personnel group definitions ----

// Personnel groups define expected position counts: e.g. '11' = 1 RB, 1 TE
// Format: first digit = RBs, second digit = TEs (remaining are WRs up to 5 skill)
const PERSONNEL_REQUIREMENTS: Record<string, Record<string, number>> = {
  '10': { RB: 1, TE: 0, WR: 4 },
  '11': { RB: 1, TE: 1, WR: 3 },
  '12': { RB: 1, TE: 2, WR: 2 },
  '13': { RB: 1, TE: 3, WR: 1 },
  '20': { RB: 2, TE: 0, WR: 3 },
  '21': { RB: 2, TE: 1, WR: 2 },
  '22': { RB: 2, TE: 2, WR: 1 },
  '23': { RB: 2, TE: 3, WR: 0 },
};

// Positions that count as "RB" for personnel grouping
const RB_POSITIONS: PlayerPosition[] = ['RB', 'FB'];
// Positions that count as "TE"
const TE_POSITIONS: PlayerPosition[] = ['TE'];
// Positions that count as "WR"
const WR_POSITIONS: PlayerPosition[] = ['WR'];

// ---- CSV Import ----

/**
 * Parse CSV roster data into RosterPlayer objects.
 *
 * Expected CSV columns (header row required):
 *   name, number, position, height, weight, year, isStarter
 *
 * The parser is flexible about column ordering and handles quoted values.
 */
export function importRoster(csv: string): RosterPlayer[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return []; // Need at least header + 1 row

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const players: RosterPlayer[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const get = (col: string): string => {
      const idx = headers.indexOf(col);
      return idx >= 0 && idx < values.length ? values[idx].trim() : '';
    };

    const name = get('name');
    const number = parseInt(get('number'), 10);
    const position = get('position') as PlayerPosition;
    const height = get('height');
    const weight = parseInt(get('weight'), 10);
    const year = get('year');
    const starterRaw = get('isstarter') || get('starter');
    const isStarter = starterRaw.toLowerCase() === 'true' || starterRaw === '1' || starterRaw.toLowerCase() === 'yes';

    if (!name || isNaN(number)) continue;

    players.push({
      id: `roster-${number}-${name.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      number,
      position,
      height,
      weight: isNaN(weight) ? 0 : weight,
      year,
      isStarter,
    });
  }

  return players;
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }

  result.push(current);
  return result;
}

// ---- Formation matching ----

/**
 * Match real roster players to formation positions.
 *
 * Returns a map of formation player ID -> RosterPlayer.
 * Uses starters first, then depth chart ordering.
 */
export function matchToFormation(
  roster: RosterPlayer[],
  formation: Formation,
): Map<string, RosterPlayer> {
  const result = new Map<string, RosterPlayer>();
  const usedPlayerIds = new Set<string>();

  // Sort: starters first, then by number
  const sortedRoster = [...roster].sort((a, b) => {
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
    return a.number - b.number;
  });

  for (const formationPlayer of formation.players) {
    // Find a roster player matching the position
    const match = sortedRoster.find((rp) => {
      if (usedPlayerIds.has(rp.id)) return false;
      return isPositionMatch(rp.position, formationPlayer.position);
    });

    if (match) {
      result.set(formationPlayer.id, match);
      usedPlayerIds.add(match.id);
    }
  }

  return result;
}

/**
 * Check if a roster player's position can fill a formation position.
 */
function isPositionMatch(rosterPos: PlayerPosition, formationPos: PlayerPosition): boolean {
  if (rosterPos === formationPos) return true;

  // Flexible matching for skill positions
  const flexMap: Record<string, string[]> = {
    WR: ['WR', 'X', 'Z', 'H', 'F'],
    TE: ['TE', 'Y', 'T'],
    RB: ['RB', 'FB'],
    FB: ['FB', 'RB'],
  };

  const acceptable = flexMap[rosterPos];
  return acceptable ? acceptable.includes(formationPos) : false;
}

// ---- Depth Chart ----

/**
 * Get the depth chart for a specific position.
 *
 * Returns players ordered by: starters first, then by jersey number.
 */
export function getDepthChart(roster: RosterPlayer[], position: string): RosterPlayer[] {
  // Include flexible position matches
  const matching = roster.filter((p) => {
    if (p.position === position) return true;
    // Also include FB in RB depth chart and vice versa
    if (position === 'RB' && p.position === 'FB') return true;
    if (position === 'FB' && p.position === 'RB') return true;
    return false;
  });

  return matching.sort((a, b) => {
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
    return a.number - b.number;
  });
}

// ---- Personnel validation ----

/**
 * Validate whether the roster has enough players for a personnel group.
 *
 * Returns { valid, missing } where missing lists positions that are short.
 */
export function validatePersonnel(
  roster: RosterPlayer[],
  personnelGroup: string,
): { valid: boolean; missing: { position: string; needed: number; available: number }[] } {
  const requirements = PERSONNEL_REQUIREMENTS[personnelGroup];
  if (!requirements) {
    return { valid: false, missing: [{ position: 'unknown', needed: 0, available: 0 }] };
  }

  const missing: { position: string; needed: number; available: number }[] = [];

  // Always need 5 OL + 1 QB
  const olPositions: PlayerPosition[] = ['LT', 'LG', 'C', 'RG', 'RT'];
  const olCount = roster.filter((p) => olPositions.includes(p.position)).length;
  if (olCount < 5) {
    missing.push({ position: 'OL', needed: 5, available: olCount });
  }

  const qbCount = roster.filter((p) => p.position === 'QB').length;
  if (qbCount < 1) {
    missing.push({ position: 'QB', needed: 1, available: qbCount });
  }

  // Check skill positions
  for (const [posGroup, needed] of Object.entries(requirements)) {
    let positionList: PlayerPosition[];
    if (posGroup === 'RB') positionList = RB_POSITIONS;
    else if (posGroup === 'TE') positionList = TE_POSITIONS;
    else if (posGroup === 'WR') positionList = WR_POSITIONS;
    else continue;

    const available = roster.filter((p) => positionList.includes(p.position)).length;
    if (available < needed) {
      missing.push({ position: posGroup, needed, available });
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
