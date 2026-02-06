import type {
  BlockingScheme,
  BlockingRule,
  BlockType,
  Formation,
  PlayerAssignment,
  BlockingAssignment,
  OffensivePosition,
} from '@/types';

// ============================================================
// Built-in Blocking Schemes
// ============================================================

function rule(
  position: OffensivePosition,
  ruleText: string,
  blockType: BlockType,
  priority: number,
): BlockingRule {
  return { position, rule: ruleText, blockType, priority };
}

const TS = '2024-01-01T00:00:00.000Z';

const INSIDE_ZONE: BlockingScheme = {
  id: 'scheme-inside-zone',
  name: 'Inside Zone',
  type: 'run',
  description:
    'Offensive line steps playside in unison, blocking zone gaps and climbing to linebackers. The runner reads the first uncovered lineman and cuts off his block.',
  rules: [
    rule('LT', 'Block playside gap, climb to backside LB', 'zone', 1),
    rule('LG', 'Combo block with C to playside LB', 'zone', 2),
    rule('C', 'Block playside A-gap defender, combo to LB', 'zone', 3),
    rule('RG', 'Combo block with RT to playside LB', 'zone', 2),
    rule('RT', 'Block playside gap, seal edge', 'zone', 1),
  ],
  tags: ['zone', 'base', 'gap-scheme'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const OUTSIDE_ZONE: BlockingScheme = {
  id: 'scheme-outside-zone',
  name: 'Outside Zone',
  type: 'run',
  description:
    'Entire offensive line reach-blocks to the playside, aiming to get the ball to the edge. Back reads the blocks and can cut back if the defense over-pursues.',
  rules: [
    rule('LT', 'Reach block playside, seal defender outside', 'reach', 1),
    rule('LG', 'Reach block playside, overtake defender', 'reach', 2),
    rule('C', 'Reach block playside, cut off backside pursuit', 'reach', 3),
    rule('RG', 'Reach block playside, overtake defender', 'reach', 2),
    rule('RT', 'Reach block playside, get to second level', 'reach', 1),
  ],
  tags: ['zone', 'stretch', 'outside'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const POWER: BlockingScheme = {
  id: 'scheme-power',
  name: 'Power',
  type: 'run',
  description:
    'Gap scheme with a pulling guard (BSG) and a kick-out block by a FB or H-back. Playside line down-blocks, creating a wall for the runner.',
  rules: [
    rule('LT', 'Down block on playside defender', 'down', 1),
    rule('LG', 'Down block inside gap', 'down', 2),
    rule('C', 'Block back (backside A-gap)', 'drive', 3),
    rule('RG', 'Pull and lead through the hole, block LB', 'pull', 1),
    rule('RT', 'Hinge block, protect backside', 'drive', 4),
    rule('FB', 'Kick out the EMOL (end man on line of scrimmage)', 'drive', 1),
  ],
  tags: ['gap', 'power', 'downhill'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const COUNTER: BlockingScheme = {
  id: 'scheme-counter',
  name: 'Counter',
  type: 'run',
  description:
    'Misdirection gap scheme. Backside guard and tackle (or H-back) pull to the playside. The back takes a counter step before hitting the hole.',
  rules: [
    rule('LT', 'Down block on playside defender', 'down', 1),
    rule('LG', 'Down block inside gap', 'down', 2),
    rule('C', 'Block back (backside A-gap)', 'drive', 3),
    rule('RG', 'Pull and kick out EMOL', 'pull', 1),
    rule('RT', 'Pull and lead through hole, block LB', 'pull', 2),
  ],
  tags: ['gap', 'misdirection', 'counter'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const TRAP: BlockingScheme = {
  id: 'scheme-trap',
  name: 'Trap',
  type: 'run',
  description:
    'Let the defensive tackle penetrate unblocked, then trap-block him with a pulling guard. Quick-hitting play that exploits aggressive DL.',
  rules: [
    rule('LT', 'Block man on, seal outside', 'drive', 2),
    rule('LG', 'Skip-pull, trap the first DL past center', 'trap', 1),
    rule('C', 'Block backside A-gap, allow playside DT through', 'drive', 3),
    rule('RG', 'Block man on or inside gap', 'drive', 2),
    rule('RT', 'Block man on, seal edge', 'drive', 4),
  ],
  tags: ['gap', 'trap', 'quick-hit'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const ISO: BlockingScheme = {
  id: 'scheme-iso',
  name: 'Iso',
  type: 'run',
  description:
    'Man blocking up front with a fullback or lead blocker isolating on the middle linebacker. Simple, downhill run between the tackles.',
  rules: [
    rule('LT', 'Man block defender head-up or outside shade', 'man', 1),
    rule('LG', 'Man block defender head-up or inside shade', 'man', 2),
    rule('C', 'Man block nose tackle or head-up defender', 'man', 3),
    rule('RG', 'Man block defender head-up or inside shade', 'man', 2),
    rule('RT', 'Man block defender head-up or outside shade', 'man', 1),
    rule('FB', 'Lead block on MLB through the A-gap', 'drive', 1),
  ],
  tags: ['man', 'isolation', 'downhill'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const DUO: BlockingScheme = {
  id: 'scheme-duo',
  name: 'Duo',
  type: 'run',
  description:
    'Double-team both defensive tackles at the point of attack, then climb to linebackers. A power concept without pulling linemen.',
  rules: [
    rule('LT', 'Seal edge, block EMOL', 'drive', 1),
    rule('LG', 'Double-team DT with C, climb to LB', 'double', 2),
    rule('C', 'Double-team playside DT with guard', 'double', 3),
    rule('RG', 'Double-team DT with RT, climb to LB', 'double', 2),
    rule('RT', 'Double-team with RG, seal backside', 'double', 1),
  ],
  tags: ['man', 'double-team', 'downhill'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const DRAW: BlockingScheme = {
  id: 'scheme-draw',
  name: 'Draw',
  type: 'run',
  description:
    'Show pass protection to lure the defense into pass rush lanes, then hand off to the running back. OL sets as if pass-blocking, then drives forward.',
  rules: [
    rule('LT', 'Pass set, then drive block after handoff', 'pass-pro', 1),
    rule('LG', 'Pass set, then drive block inside', 'pass-pro', 2),
    rule('C', 'Pass set, then block middle LB', 'pass-pro', 3),
    rule('RG', 'Pass set, then drive block inside', 'pass-pro', 2),
    rule('RT', 'Pass set, then drive block after handoff', 'pass-pro', 1),
  ],
  tags: ['deception', 'draw', 'play-action'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const PASS_PRO_HALF_SLIDE: BlockingScheme = {
  id: 'scheme-half-slide',
  name: 'Pass Pro (Half-Slide)',
  type: 'pass',
  description:
    'Half the offensive line slides in one direction (zone side) while the other half blocks man-to-man (man side). Typically slide is to the passing strength.',
  rules: [
    rule('LT', 'Slide protect playside gap, pass off stunts', 'pass-pro', 1),
    rule('LG', 'Slide protect playside gap, help C', 'pass-pro', 2),
    rule('C', 'Slide protect playside gap, anchor midpoint', 'pass-pro', 3),
    rule('RG', 'Man block assigned defender (man side)', 'pass-pro', 2),
    rule('RT', 'Man block assigned defender (man side)', 'pass-pro', 1),
    rule('RB', 'Check-release: scan backside, block free rusher', 'pass-pro', 5),
  ],
  tags: ['pass-protection', 'half-slide', 'dropback'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const PASS_PRO_FULL_SLIDE: BlockingScheme = {
  id: 'scheme-full-slide',
  name: 'Pass Pro (Full-Slide)',
  type: 'pass',
  description:
    'All five offensive linemen slide in one direction. Each blocker is responsible for a gap rather than a man. Simple rules, good against heavy blitz.',
  rules: [
    rule('LT', 'Slide protect outside gap, anchor edge', 'pass-pro', 1),
    rule('LG', 'Slide protect outside gap, help LT if free', 'pass-pro', 2),
    rule('C', 'Slide protect playside gap', 'pass-pro', 3),
    rule('RG', 'Slide protect playside gap', 'pass-pro', 2),
    rule('RT', 'Slide protect playside gap', 'pass-pro', 1),
    rule('RB', 'Block backside edge rusher or check-release', 'pass-pro', 5),
  ],
  tags: ['pass-protection', 'full-slide', 'dropback'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

const SPRINT_OUT: BlockingScheme = {
  id: 'scheme-sprint-out',
  name: 'Sprint Out',
  type: 'pass',
  description:
    'QB sprints toward the sideline behind aggressive edge blocking. Playside OL aggressively reach-blocks; backside OL walls off pursuit.',
  rules: [
    rule('LT', 'Aggressive reach block, seal edge for sprint-out', 'reach', 1),
    rule('LG', 'Reach block playside, get movement', 'reach', 2),
    rule('C', 'Reach block playside, cut off backside', 'reach', 3),
    rule('RG', 'Hinge block, wall off backside pursuit', 'pass-pro', 4),
    rule('RT', 'Hinge block, protect backside', 'pass-pro', 4),
  ],
  tags: ['pass-protection', 'sprint-out', 'rollout'],
  teamId: '',
  createdAt: TS,
  updatedAt: TS,
};

// ============================================================
// Exports
// ============================================================

export const BUILT_IN_BLOCKING_SCHEMES: BlockingScheme[] = [
  INSIDE_ZONE,
  OUTSIDE_ZONE,
  POWER,
  COUNTER,
  TRAP,
  ISO,
  DUO,
  DRAW,
  PASS_PRO_HALF_SLIDE,
  PASS_PRO_FULL_SLIDE,
  SPRINT_OUT,
];

/**
 * Look up a built-in blocking scheme by its id.
 */
export function getBlockingSchemeById(id: string): BlockingScheme | undefined {
  return BUILT_IN_BLOCKING_SCHEMES.find((s) => s.id === id);
}

/**
 * Apply a blocking scheme to a formation.
 *
 * Matches scheme rule positions to formation players. For each rule,
 * finds the first unassigned player in the formation that matches the
 * rule's position (checking both the `position` field and label aliases).
 *
 * Returns PlayerAssignment[] with blocking assignments generated from the
 * scheme rules. Positions that don't exist in the formation are skipped.
 */
export function applyBlockingScheme(
  scheme: BlockingScheme,
  formation: Formation,
): PlayerAssignment[] {
  const assignments: PlayerAssignment[] = [];
  const usedPlayerIds = new Set<string>();

  // Sort rules by priority (lower = higher priority = assigned first)
  const sortedRules = [...scheme.rules].sort((a, b) => a.priority - b.priority);

  for (const schemeRule of sortedRules) {
    const matchingPlayer = findMatchingPlayer(
      schemeRule.position,
      formation,
      usedPlayerIds,
    );

    if (matchingPlayer) {
      usedPlayerIds.add(matchingPlayer.id);

      const blocking: BlockingAssignment = {
        id: `block-${scheme.id}-${matchingPlayer.id}`,
        blockerId: matchingPlayer.id,
        blockType: schemeRule.blockType,
        direction: getBlockDirection(schemeRule.blockType, schemeRule.position),
      };

      assignments.push({
        playerId: matchingPlayer.id,
        blocking,
        label: `${matchingPlayer.label}: ${schemeRule.rule}`,
      });
    }
  }

  return assignments;
}

/**
 * Find a player in the formation matching the given offensive position
 * that hasn't already been assigned.
 */
function findMatchingPlayer(
  targetPosition: OffensivePosition,
  formation: Formation,
  usedPlayerIds: Set<string>,
) {
  // Direct position match
  const directMatch = formation.players.find(
    (p) => p.position === targetPosition && !usedPlayerIds.has(p.id),
  );
  if (directMatch) return directMatch;

  // Label alias mapping for positions that may use different labels
  const positionAliases: Record<string, string[]> = {
    RB: ['RB', 'TB'],
    FB: ['FB'],
    TE: ['Y', 'T'],
  };

  const aliases = positionAliases[targetPosition];
  if (aliases) {
    for (const alias of aliases) {
      const aliasMatch = formation.players.find(
        (p) => p.label === alias && !usedPlayerIds.has(p.id),
      );
      if (aliasMatch) return aliasMatch;
    }
  }

  return undefined;
}

/**
 * Generate a default blocking direction angle based on block type and position.
 * Angles: 0 = straight up (north toward defense), 90 = right, -90 = left.
 */
function getBlockDirection(blockType: BlockType, position: OffensivePosition): number {
  // Pull blocks go to the playside (left/right based on position)
  if (blockType === 'pull') {
    return position === 'RG' || position === 'RT' ? -45 : 45;
  }
  // Reach blocks angle toward the playside
  if (blockType === 'reach') {
    return position === 'LT' || position === 'LG' ? -30 : 30;
  }
  // Zone blocks angle slightly playside
  if (blockType === 'zone') {
    return position === 'LT' || position === 'LG' ? -15 : 15;
  }
  // Down blocks angle inside
  if (blockType === 'down') {
    return position === 'LT' || position === 'LG' ? 20 : -20;
  }
  // Default: straight ahead
  return 0;
}

/**
 * Get all unique tags across all built-in blocking schemes.
 */
export function getAllBlockingSchemeTags(): string[] {
  const tagSet = new Set<string>();
  for (const scheme of BUILT_IN_BLOCKING_SCHEMES) {
    for (const tag of scheme.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}
