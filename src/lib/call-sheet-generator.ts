import type { GamePlan, Play, PlayRef, CallSheet, CallSheetSection } from '@/types';

// ---- Types ----

export interface CallSheetOptions {
  maxPlaysPerSituation: number;
  includeCheckWithMe: boolean;
  includeAudibles: boolean;
}

export const SITUATIONS = [
  '1st down',
  '2nd short',
  '2nd long',
  '3rd short',
  '3rd medium',
  '3rd long',
  'red zone',
  'goal line',
  '2-minute',
] as const;

export type Situation = (typeof SITUATIONS)[number];

// Mapping from free-form game plan section situation strings to our canonical situations
const SITUATION_ALIASES: Record<string, Situation> = {
  '1st & 10': '1st down',
  '1st down': '1st down',
  'first down': '1st down',
  '2nd & short': '2nd short',
  '2nd short': '2nd short',
  '2nd & 1-3': '2nd short',
  '2nd & long': '2nd long',
  '2nd long': '2nd long',
  '2nd & 7+': '2nd long',
  '3rd & short': '3rd short',
  '3rd short': '3rd short',
  '3rd & 1-2': '3rd short',
  '3rd & medium': '3rd medium',
  '3rd medium': '3rd medium',
  '3rd & 3-6': '3rd medium',
  '3rd & long': '3rd long',
  '3rd long': '3rd long',
  '3rd & 7+': '3rd long',
  'red zone': 'red zone',
  'redzone': 'red zone',
  'goal line': 'goal line',
  'goalline': 'goal line',
  '2-minute': '2-minute',
  '2 minute': '2-minute',
  'two-minute': '2-minute',
  '2-min': '2-minute',
  'hurry up': '2-minute',
};

const SITUATION_COLORS: Record<Situation, string> = {
  '1st down': '#4CAF50',
  '2nd short': '#8BC34A',
  '2nd long': '#FFC107',
  '3rd short': '#FF9800',
  '3rd medium': '#FF5722',
  '3rd long': '#F44336',
  'red zone': '#E91E63',
  'goal line': '#9C27B0',
  '2-minute': '#2196F3',
};

// ---- Helpers ----

/**
 * Normalize a free-form situation string to a canonical Situation value.
 * Returns undefined if the string cannot be mapped.
 */
export function normalizeSituation(raw: string): Situation | undefined {
  const key = raw.trim().toLowerCase();
  return SITUATION_ALIASES[key];
}

/**
 * Prioritize plays for a given situation.
 *
 * Sorting heuristics (higher priority first):
 * 1. Plays with tags matching the situation are boosted.
 * 2. Plays that appear earlier in the game plan section ordering are preferred.
 * 3. Check-with-me / audible-tagged plays are pushed to the end when
 *    the corresponding option is disabled.
 */
export function prioritizePlays(plays: Play[], situation: string): Play[] {
  const normalized = normalizeSituation(situation) ?? situation;

  const situationTokens = normalized.toLowerCase().split(/[\s-]+/);

  return [...plays].sort((a, b) => {
    const scoreA = relevanceScore(a, situationTokens);
    const scoreB = relevanceScore(b, situationTokens);
    // Higher score = more relevant = earlier in list
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Stable tie-break by name
    return a.name.localeCompare(b.name);
  });
}

function relevanceScore(play: Play, situationTokens: string[]): number {
  let score = 0;

  const playTokens = [
    ...play.tags.map((t) => t.toLowerCase()),
    play.category?.toLowerCase() ?? '',
    play.name.toLowerCase(),
  ];

  for (const token of situationTokens) {
    if (playTokens.some((pt) => pt.includes(token))) {
      score += 10;
    }
  }

  // Boost plays explicitly tagged for run/pass categories that fit the situation
  if (situationTokens.includes('short') && playTokens.some((t) => t.includes('run'))) {
    score += 5;
  }
  if (situationTokens.includes('long') && playTokens.some((t) => t.includes('pass'))) {
    score += 5;
  }

  return score;
}

// ---- Main generator ----

/**
 * Auto-generate a CallSheet from a GamePlan and full play list.
 *
 * 1. Maps each game plan section to a canonical situation bucket.
 * 2. Resolves PlayRef IDs to full Play objects.
 * 3. Prioritizes plays within each bucket.
 * 4. Caps each bucket at `maxPlaysPerSituation`.
 * 5. Optionally strips check-with-me / audible plays.
 */
export function generateCallSheet(
  gamePlan: GamePlan,
  plays: Play[],
  options: CallSheetOptions,
): CallSheet {
  const playMap = new Map(plays.map((p) => [p.id, p]));

  // Bucket plays by canonical situation
  const buckets = new Map<Situation, Play[]>();
  for (const sit of SITUATIONS) {
    buckets.set(sit, []);
  }

  for (const section of gamePlan.sections) {
    const situation = normalizeSituation(section.situation);
    if (!situation) continue;

    const bucket = buckets.get(situation)!;

    for (const ref of section.plays) {
      const play = playMap.get(ref.playId);
      if (!play) continue;

      // Optionally exclude check-with-me and audible plays
      if (!options.includeCheckWithMe && hasTag(play, 'check-with-me')) continue;
      if (!options.includeAudibles && hasTag(play, 'audible')) continue;

      // Avoid duplicates in the same bucket
      if (!bucket.some((p) => p.id === play.id)) {
        bucket.push(play);
      }
    }
  }

  // Build sections from buckets
  const sections: CallSheetSection[] = [];

  for (const sit of SITUATIONS) {
    const raw = buckets.get(sit)!;
    if (raw.length === 0) continue;

    const sorted = prioritizePlays(raw, sit);
    const capped = sorted.slice(0, options.maxPlaysPerSituation);

    const playRefs: PlayRef[] = capped.map((p, i) => ({
      playId: p.id,
      order: i + 1,
    }));

    sections.push({
      name: sit,
      plays: playRefs,
      color: SITUATION_COLORS[sit],
    });
  }

  return {
    id: `cs-${gamePlan.id}`,
    gamePlanId: gamePlan.id,
    sections,
    teamId: gamePlan.teamId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function hasTag(play: Play, tag: string): boolean {
  return play.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
}
