import type { Player } from '@/types';

// ============================================================
// Defensive library types
// ============================================================

export interface DefensiveFront {
  id: string;
  name: string;
  players: Player[];
  description: string;
}

export interface ZoneDefinition {
  playerId: string;
  type: 'man' | 'zone';
  area?: { x: number; y: number; width: number; height: number };
  targetId?: string;
}

export interface CoverageDefinition {
  id: string;
  name: string;
  zones: ZoneDefinition[];
  description: string;
}

// ============================================================
// Helper — canonical defensive player IDs used across fronts
//   We keep consistent IDs so coverages can reference them.
//   Location coordinates are on the same 800x500 canvas as
//   formations.ts (LOS at y=248, offense below, defense above).
// ============================================================

// --- Common player factories ---
function de(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'DE', label, location: { x, y }, side: 'defense' };
}
function dt(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'DT', label, location: { x, y }, side: 'defense' };
}
function nt(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'NT', label, location: { x, y }, side: 'defense' };
}
function olb(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'OLB', label, location: { x, y }, side: 'defense' };
}
function ilb(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'ILB', label, location: { x, y }, side: 'defense' };
}
function mlb(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'MLB', label, location: { x, y }, side: 'defense' };
}
function cb(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'CB', label, location: { x, y }, side: 'defense' };
}
function ss(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'SS', label, location: { x, y }, side: 'defense' };
}
function fs(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'FS', label, location: { x, y }, side: 'defense' };
}
function nb(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'NB', label, location: { x, y }, side: 'defense' };
}
function lb(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'LB', label, location: { x, y }, side: 'defense' };
}
function s(id: string, label: string, x: number, y: number): Player {
  return { id, position: 'S', label, location: { x, y }, side: 'defense' };
}

// ============================================================
// Defensive Fronts
// ============================================================

const FOUR_THREE_OVER: DefensiveFront = {
  id: 'front-43-over',
  name: '4-3 Over',
  description: 'Standard 4-3 with the defensive line shifted toward the strong side (over). 3 linebackers behind.',
  players: [
    de('de1', 'DE', 280, 225),
    dt('dt1', 'DT', 360, 225),
    dt('dt2', 'DT', 440, 225),
    de('de2', 'DE', 520, 225),
    olb('wlb', 'W', 290, 190),
    mlb('mlb', 'M', 400, 190),
    olb('slb', 'S', 510, 190),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const FOUR_THREE_UNDER: DefensiveFront = {
  id: 'front-43-under',
  name: '4-3 Under',
  description: '4-3 alignment with the defensive line shifted toward the weak side (under). OLB walks up to the LOS.',
  players: [
    de('de1', 'DE', 290, 225),
    dt('dt1', 'DT', 370, 225),
    dt('dt2', 'DT', 430, 225),
    de('de2', 'DE', 510, 225),
    olb('wlb', 'W', 260, 190),
    mlb('mlb', 'M', 400, 190),
    olb('slb', 'S', 530, 190),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const THREE_FOUR: DefensiveFront = {
  id: 'front-34',
  name: '3-4',
  description: 'Three down linemen with four linebackers. Versatile blitz packages and coverage flexibility.',
  players: [
    de('de1', 'DE', 310, 225),
    nt('nt', 'NT', 400, 225),
    de('de2', 'DE', 490, 225),
    olb('lolb', 'J', 260, 195),
    ilb('ilb1', 'M', 370, 190),
    ilb('ilb2', 'W', 430, 190),
    olb('rolb', 'S', 540, 195),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const NICKEL: DefensiveFront = {
  id: 'front-nickel',
  name: 'Nickel',
  description: 'Five defensive backs (extra CB/NB replaces a LB). Ideal against 3-WR sets.',
  players: [
    de('de1', 'DE', 290, 225),
    dt('dt1', 'DT', 370, 225),
    dt('dt2', 'DT', 430, 225),
    de('de2', 'DE', 510, 225),
    mlb('mlb', 'M', 400, 190),
    olb('slb', 'S', 510, 190),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    nb('nb', 'NB', 580, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const DIME: DefensiveFront = {
  id: 'front-dime',
  name: 'Dime',
  description: 'Six defensive backs. Used in obvious passing situations against 4-WR sets.',
  players: [
    de('de1', 'DE', 310, 225),
    dt('dt1', 'DT', 380, 225),
    dt('dt2', 'DT', 420, 225),
    de('de2', 'DE', 490, 225),
    mlb('mlb', 'M', 400, 190),
    cb('cb1', 'CB', 80, 200),
    cb('cb2', 'CB', 680, 200),
    nb('nb1', 'NB', 570, 200),
    nb('nb2', 'DB', 200, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const FOUR_TWO_FIVE: DefensiveFront = {
  id: 'front-425',
  name: '4-2-5',
  description: 'Four down linemen, two linebackers, five DBs. Common base defense in spread-heavy leagues.',
  players: [
    de('de1', 'DE', 290, 225),
    dt('dt1', 'DT', 370, 225),
    dt('dt2', 'DT', 430, 225),
    de('de2', 'DE', 510, 225),
    mlb('mlb', 'M', 380, 190),
    lb('wlb', 'W', 450, 190),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    nb('nb', 'NB', 580, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const THREE_THREE_FIVE: DefensiveFront = {
  id: 'front-335',
  name: '3-3-5',
  description: 'Three down linemen, three linebackers, five DBs. Designed to match spread offenses.',
  players: [
    de('de1', 'DE', 310, 225),
    nt('nt', 'NT', 400, 225),
    de('de2', 'DE', 490, 225),
    olb('lolb', 'J', 280, 195),
    mlb('mlb', 'M', 400, 190),
    olb('rolb', 'S', 520, 195),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    nb('nb', 'NB', 570, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const FIVE_TWO: DefensiveFront = {
  id: 'front-52',
  name: '5-2',
  description: 'Five down linemen with two linebackers behind. Strong against the run.',
  players: [
    de('de1', 'DE', 270, 225),
    dt('dt1', 'DT', 340, 225),
    nt('nt', 'NT', 400, 225),
    dt('dt2', 'DT', 460, 225),
    de('de2', 'DE', 530, 225),
    mlb('mlb1', 'M', 370, 190),
    mlb('mlb2', 'W', 430, 190),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

const FORTY_SIX: DefensiveFront = {
  id: 'front-46',
  name: '46',
  description: 'Aggressive 8-man front. SS walks into the box. Heavy run support and pressure.',
  players: [
    de('de1', 'DE', 280, 225),
    dt('dt1', 'DT', 360, 225),
    dt('dt2', 'DT', 440, 225),
    de('de2', 'DE', 520, 225),
    olb('wlb', 'W', 290, 190),
    mlb('mlb', 'M', 400, 190),
    olb('slb', 'S', 510, 190),
    ss('ss', 'SS', 440, 195),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    fs('fs', 'FS', 400, 120),
  ],
};

const BEAR: DefensiveFront = {
  id: 'front-bear',
  name: 'Bear',
  description: 'Variation of the 46 with a nose tackle head-up on center and DTs over both guards. Maximum interior pressure.',
  players: [
    de('de1', 'DE', 280, 225),
    dt('dt1', 'DT', 350, 225),
    nt('nt', 'NT', 400, 225),
    dt('dt2', 'DT', 450, 225),
    de('de2', 'DE', 520, 225),
    mlb('mlb', 'M', 400, 190),
    olb('slb', 'S', 540, 190),
    cb('cb1', 'CB', 100, 200),
    cb('cb2', 'CB', 660, 200),
    ss('ss', 'SS', 460, 140),
    fs('fs', 'FS', 340, 120),
  ],
};

// ============================================================
// Full library of defensive fronts
// ============================================================
export const DEFENSIVE_FRONTS_LIBRARY: DefensiveFront[] = [
  FOUR_THREE_OVER,
  FOUR_THREE_UNDER,
  THREE_FOUR,
  NICKEL,
  DIME,
  FOUR_TWO_FIVE,
  THREE_THREE_FIVE,
  FIVE_TWO,
  FORTY_SIX,
  BEAR,
];

// ============================================================
// Coverages
//
// Player IDs reference the canonical IDs used in the fronts
// above.  When pairing a front + coverage the consumer should
// match on player id.
// ============================================================

const COVER_0: CoverageDefinition = {
  id: 'cov-0',
  name: 'Cover 0',
  description: 'Pure man coverage with no deep safety help. All-out blitz or maximum pressure.',
  zones: [
    { playerId: 'cb1', type: 'man', targetId: 'x' },
    { playerId: 'cb2', type: 'man', targetId: 'z' },
    { playerId: 'ss', type: 'man', targetId: 'te' },
    { playerId: 'fs', type: 'man', targetId: 'rb' },
    { playerId: 'nb', type: 'man', targetId: 'h' },
  ],
};

const COVER_1: CoverageDefinition = {
  id: 'cov-1',
  name: 'Cover 1',
  description: 'Man coverage across the board with a single high safety providing deep help.',
  zones: [
    { playerId: 'cb1', type: 'man', targetId: 'x' },
    { playerId: 'cb2', type: 'man', targetId: 'z' },
    { playerId: 'ss', type: 'man', targetId: 'te' },
    { playerId: 'fs', type: 'zone', area: { x: 200, y: 0, width: 400, height: 140 } },
    { playerId: 'nb', type: 'man', targetId: 'h' },
  ],
};

const COVER_1_ROBBER: CoverageDefinition = {
  id: 'cov-1-robber',
  name: 'Cover 1 Robber',
  description: 'Cover 1 shell with a linebacker or safety playing a "robber" zone in the middle of the field.',
  zones: [
    { playerId: 'cb1', type: 'man', targetId: 'x' },
    { playerId: 'cb2', type: 'man', targetId: 'z' },
    { playerId: 'ss', type: 'zone', area: { x: 300, y: 140, width: 200, height: 100 } },
    { playerId: 'fs', type: 'zone', area: { x: 200, y: 0, width: 400, height: 140 } },
    { playerId: 'nb', type: 'man', targetId: 'h' },
  ],
};

const COVER_2: CoverageDefinition = {
  id: 'cov-2',
  name: 'Cover 2',
  description: 'Two deep safeties split the field in half. CBs play flat zones underneath.',
  zones: [
    { playerId: 'cb1', type: 'zone', area: { x: 0, y: 140, width: 200, height: 110 } },
    { playerId: 'cb2', type: 'zone', area: { x: 600, y: 140, width: 200, height: 110 } },
    { playerId: 'ss', type: 'zone', area: { x: 400, y: 0, width: 400, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 0, y: 0, width: 400, height: 140 } },
    { playerId: 'mlb', type: 'zone', area: { x: 300, y: 140, width: 200, height: 110 } },
  ],
};

const COVER_2_MAN: CoverageDefinition = {
  id: 'cov-2-man',
  name: 'Cover 2 Man',
  description: 'Two-deep safeties with man coverage underneath. Combines deep help with man principles.',
  zones: [
    { playerId: 'cb1', type: 'man', targetId: 'x' },
    { playerId: 'cb2', type: 'man', targetId: 'z' },
    { playerId: 'ss', type: 'zone', area: { x: 400, y: 0, width: 400, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 0, y: 0, width: 400, height: 140 } },
    { playerId: 'nb', type: 'man', targetId: 'h' },
  ],
};

const COVER_3: CoverageDefinition = {
  id: 'cov-3',
  name: 'Cover 3',
  description: 'Three deep defenders each cover a deep third. Four underneath zone defenders.',
  zones: [
    { playerId: 'cb1', type: 'zone', area: { x: 0, y: 0, width: 267, height: 140 } },
    { playerId: 'cb2', type: 'zone', area: { x: 533, y: 0, width: 267, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 267, y: 0, width: 266, height: 140 } },
    { playerId: 'ss', type: 'zone', area: { x: 500, y: 140, width: 200, height: 110 } },
    { playerId: 'mlb', type: 'zone', area: { x: 300, y: 140, width: 200, height: 110 } },
  ],
};

const COVER_3_CLOUD: CoverageDefinition = {
  id: 'cov-3-cloud',
  name: 'Cover 3 Cloud',
  description: 'Cover 3 variation where the corner plays a flat zone and the safety rotates to deep third.',
  zones: [
    { playerId: 'cb1', type: 'zone', area: { x: 0, y: 140, width: 200, height: 110 } },
    { playerId: 'cb2', type: 'zone', area: { x: 533, y: 0, width: 267, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 267, y: 0, width: 266, height: 140 } },
    { playerId: 'ss', type: 'zone', area: { x: 0, y: 0, width: 267, height: 140 } },
    { playerId: 'mlb', type: 'zone', area: { x: 300, y: 140, width: 200, height: 110 } },
  ],
};

const COVER_3_BUZZ: CoverageDefinition = {
  id: 'cov-3-buzz',
  name: 'Cover 3 Buzz',
  description: 'Cover 3 with the strong safety buzzing down to play a flat/curl zone underneath.',
  zones: [
    { playerId: 'cb1', type: 'zone', area: { x: 0, y: 0, width: 267, height: 140 } },
    { playerId: 'cb2', type: 'zone', area: { x: 533, y: 0, width: 267, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 267, y: 0, width: 266, height: 140 } },
    { playerId: 'ss', type: 'zone', area: { x: 500, y: 140, width: 200, height: 110 } },
    { playerId: 'mlb', type: 'zone', area: { x: 300, y: 140, width: 200, height: 110 } },
  ],
};

const COVER_4: CoverageDefinition = {
  id: 'cov-4',
  name: 'Cover 4/Quarters',
  description: 'Four deep defenders each responsible for a quarter of the deep field. Excellent vs deep passing.',
  zones: [
    { playerId: 'cb1', type: 'zone', area: { x: 0, y: 0, width: 200, height: 140 } },
    { playerId: 'cb2', type: 'zone', area: { x: 600, y: 0, width: 200, height: 140 } },
    { playerId: 'ss', type: 'zone', area: { x: 400, y: 0, width: 200, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 200, y: 0, width: 200, height: 140 } },
    { playerId: 'mlb', type: 'zone', area: { x: 300, y: 140, width: 200, height: 110 } },
  ],
};

const COVER_6: CoverageDefinition = {
  id: 'cov-6',
  name: 'Cover 6',
  description: 'Split-field coverage: Cover 4 to the field side and Cover 2 to the boundary. Adapts to the width of the field.',
  zones: [
    { playerId: 'cb1', type: 'zone', area: { x: 0, y: 0, width: 200, height: 140 } },
    { playerId: 'cb2', type: 'zone', area: { x: 600, y: 140, width: 200, height: 110 } },
    { playerId: 'ss', type: 'zone', area: { x: 400, y: 0, width: 400, height: 140 } },
    { playerId: 'fs', type: 'zone', area: { x: 200, y: 0, width: 200, height: 140 } },
    { playerId: 'mlb', type: 'zone', area: { x: 300, y: 140, width: 200, height: 110 } },
  ],
};

// ============================================================
// Full library of coverages
// ============================================================
export const COVERAGES_LIBRARY: CoverageDefinition[] = [
  COVER_0,
  COVER_1,
  COVER_1_ROBBER,
  COVER_2,
  COVER_2_MAN,
  COVER_3,
  COVER_3_CLOUD,
  COVER_3_BUZZ,
  COVER_4,
  COVER_6,
];

// ============================================================
// Getter functions
// ============================================================

/**
 * Look up a defensive front by its id.
 */
export function getDefensiveFront(id: string): DefensiveFront | undefined {
  return DEFENSIVE_FRONTS_LIBRARY.find((f) => f.id === id);
}

/**
 * Look up a coverage by its id.
 */
export function getCoverage(id: string): CoverageDefinition | undefined {
  return COVERAGES_LIBRARY.find((c) => c.id === id);
}
