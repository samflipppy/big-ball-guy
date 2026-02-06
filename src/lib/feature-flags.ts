// ============================================================
// #350 — Feature Flag System
// Client-side feature flag management with localStorage
// persistence, rollout percentages, and per-user overrides.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  userOverrides?: Record<string, boolean>; // userId → enabled
}

export interface FlagStore {
  flags: Record<string, FeatureFlag>;
  version: number;
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bbg_feature_flags';

// ---------------------------------------------------------------------------
// Default flags
// ---------------------------------------------------------------------------

export const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark mode UI theme',
    enabled: true,
  },
  {
    id: 'ai_play_suggestions',
    name: 'AI Play Suggestions',
    description: 'AI-powered play recommendations based on game situation',
    enabled: false,
    rolloutPercentage: 25,
  },
  {
    id: 'real_time_collab',
    name: 'Real-Time Collaboration',
    description: 'Live multi-user editing of playbooks',
    enabled: false,
    rolloutPercentage: 10,
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed play success rate analytics and tendency charts',
    enabled: false,
    rolloutPercentage: 50,
  },
  {
    id: 'video_integration',
    name: 'Video Integration',
    description: 'Link game film clips to plays and formations',
    enabled: false,
  },
  {
    id: 'voice_commands',
    name: 'Voice Commands',
    description: 'Voice-controlled play drawing and navigation',
    enabled: false,
    rolloutPercentage: 5,
  },
  {
    id: 'export_pdf',
    name: 'PDF Export',
    description: 'Export playbooks and game plans as PDF',
    enabled: true,
  },
  {
    id: 'drill_cards',
    name: 'Drill Cards',
    description: 'Generate printable drill cards for practice',
    enabled: true,
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadStore(): FlagStore {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return buildDefaultStore();
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultStore();
    const parsed = JSON.parse(raw) as FlagStore;
    // Merge with defaults — new flags added in code should appear
    return mergeWithDefaults(parsed);
  } catch {
    return buildDefaultStore();
  }
}

function buildDefaultStore(): FlagStore {
  const flags: Record<string, FeatureFlag> = {};
  for (const flag of DEFAULT_FLAGS) {
    flags[flag.id] = { ...flag };
  }
  return { flags, version: 1 };
}

function mergeWithDefaults(store: FlagStore): FlagStore {
  const merged = { ...store, flags: { ...store.flags } };
  for (const flag of DEFAULT_FLAGS) {
    if (!merged.flags[flag.id]) {
      merged.flags[flag.id] = { ...flag };
    }
  }
  return merged;
}

function saveStore(store: FlagStore): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

/**
 * Simple deterministic hash to decide rollout bucket for a user.
 * Returns a number between 0 and 99.
 */
function hashUserToPercentage(flagId: string, userId: string): number {
  const str = `${flagId}:${userId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit int
  }
  return Math.abs(hash) % 100;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a feature flag is enabled. When a userId is provided,
 * per-user overrides and rollout percentage are evaluated.
 */
export function isEnabled(flagId: string, userId?: string): boolean {
  const store = loadStore();
  const flag = store.flags[flagId];
  if (!flag) return false;

  // Per-user override takes highest priority
  if (userId && flag.userOverrides && flagId in flag.userOverrides === false) {
    // No specific override — continue to other checks
  }
  if (userId && flag.userOverrides && userId in flag.userOverrides) {
    return flag.userOverrides[userId];
  }

  // If the flag is globally disabled, it's off
  if (!flag.enabled) {
    // But check rollout percentage if userId is provided
    if (userId && flag.rolloutPercentage !== undefined && flag.rolloutPercentage > 0) {
      return hashUserToPercentage(flagId, userId) < flag.rolloutPercentage;
    }
    return false;
  }

  return true;
}

/**
 * Return all feature flags with their current state.
 */
export function getFlags(): FeatureFlag[] {
  const store = loadStore();
  return Object.values(store.flags);
}

/**
 * Toggle a flag globally.
 */
export function setFlag(flagId: string, enabled: boolean): void {
  const store = loadStore();
  if (!store.flags[flagId]) {
    throw new Error(`Unknown feature flag: ${flagId}`);
  }
  store.flags[flagId] = { ...store.flags[flagId], enabled };
  saveStore(store);
}

/**
 * Set a per-user override for a flag.
 */
export function setUserOverride(
  flagId: string,
  userId: string,
  enabled: boolean,
): void {
  const store = loadStore();
  if (!store.flags[flagId]) {
    throw new Error(`Unknown feature flag: ${flagId}`);
  }
  const flag = store.flags[flagId];
  store.flags[flagId] = {
    ...flag,
    userOverrides: { ...flag.userOverrides, [userId]: enabled },
  };
  saveStore(store);
}

/**
 * Remove a per-user override.
 */
export function removeUserOverride(flagId: string, userId: string): void {
  const store = loadStore();
  if (!store.flags[flagId]) return;
  const flag = store.flags[flagId];
  if (flag.userOverrides) {
    const { [userId]: _, ...rest } = flag.userOverrides;
    store.flags[flagId] = { ...flag, userOverrides: rest };
    saveStore(store);
  }
}

/**
 * Reset all flags to defaults and clear localStorage.
 */
export function resetFlags(): void {
  const store = buildDefaultStore();
  saveStore(store);
}
