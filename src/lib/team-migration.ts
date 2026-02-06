// ============================================================
// #192 — Install Migration Between Teams
// Export / import an entire team's playbook install as a
// portable package for migration between teams.
// ============================================================

import type {
  Formation,
  Concept,
  Play,
  GamePlan,
  BlockingScheme,
  TeamId,
} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstallPackage {
  version: string;
  exportedAt: string;
  sourceTeamId: string;
  formations: Formation[];
  concepts: Concept[];
  plays: Play[];
  gamePlans: GamePlan[];
  blockingSchemes: BlockingScheme[];
}

export interface MigrationPreview {
  formationCount: number;
  conceptCount: number;
  playCount: number;
  gamePlanCount: number;
  blockingSchemeCount: number;
  totalItems: number;
  formationNames: string[];
  conceptNames: string[];
  playNames: string[];
  gamePlanNames: string[];
  blockingSchemeNames: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  imported: MigrationPreview;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Current package version
// ---------------------------------------------------------------------------

const PACKAGE_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// In-memory data store (simulates a database for this module)
// ---------------------------------------------------------------------------

interface DataStore {
  formations: Map<string, Formation>;
  concepts: Map<string, Concept>;
  plays: Map<string, Play>;
  gamePlans: Map<string, GamePlan>;
  blockingSchemes: Map<string, BlockingScheme>;
}

const store: DataStore = {
  formations: new Map(),
  concepts: new Map(),
  plays: new Map(),
  gamePlans: new Map(),
  blockingSchemes: new Map(),
};

// ---------------------------------------------------------------------------
// Store management helpers (for testing and seeding)
// ---------------------------------------------------------------------------

export function addToStore<T extends { id: string }>(
  collection: 'formations' | 'concepts' | 'plays' | 'gamePlans' | 'blockingSchemes',
  item: T,
): void {
  (store[collection] as Map<string, T>).set(item.id, item);
}

export function clearStore(): void {
  store.formations.clear();
  store.concepts.clear();
  store.plays.clear();
  store.gamePlans.clear();
  store.blockingSchemes.clear();
}

// ---------------------------------------------------------------------------
// exportInstall
// ---------------------------------------------------------------------------

/**
 * Export the entire playbook install for a team as a portable package.
 */
export function exportInstall(teamId: string): InstallPackage {
  const formations = Array.from(store.formations.values()).filter(
    (f) => f.teamId === teamId,
  );
  const concepts = Array.from(store.concepts.values()).filter(
    (c) => c.teamId === teamId,
  );
  const plays = Array.from(store.plays.values()).filter(
    (p) => p.teamId === teamId,
  );
  const gamePlans = Array.from(store.gamePlans.values()).filter(
    (g) => g.teamId === teamId,
  );
  const blockingSchemes = Array.from(store.blockingSchemes.values()).filter(
    (b) => b.teamId === teamId,
  );

  return {
    version: PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    sourceTeamId: teamId,
    formations,
    concepts,
    plays,
    gamePlans,
    blockingSchemes,
  };
}

// ---------------------------------------------------------------------------
// validatePackage
// ---------------------------------------------------------------------------

/**
 * Validates that an unknown data blob has the correct InstallPackage shape.
 */
export function validatePackage(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Package must be a non-null object.'] };
  }

  const pkg = data as Record<string, unknown>;

  // Required top-level fields
  if (typeof pkg.version !== 'string') {
    errors.push('Missing or invalid "version" field (expected string).');
  }

  if (typeof pkg.sourceTeamId !== 'string') {
    errors.push('Missing or invalid "sourceTeamId" field (expected string).');
  }

  // Array fields
  const arrayFields = ['formations', 'concepts', 'plays', 'gamePlans', 'blockingSchemes'] as const;
  for (const field of arrayFields) {
    if (!Array.isArray(pkg[field])) {
      errors.push(`Missing or invalid "${field}" field (expected array).`);
    }
  }

  // Validate individual items have at least an id and name
  if (Array.isArray(pkg.formations)) {
    for (let i = 0; i < pkg.formations.length; i++) {
      const f = pkg.formations[i] as Record<string, unknown>;
      if (!f || typeof f.id !== 'string') errors.push(`formations[${i}] missing "id".`);
      if (!f || typeof f.name !== 'string') errors.push(`formations[${i}] missing "name".`);
    }
  }

  if (Array.isArray(pkg.plays)) {
    for (let i = 0; i < pkg.plays.length; i++) {
      const p = pkg.plays[i] as Record<string, unknown>;
      if (!p || typeof p.id !== 'string') errors.push(`plays[${i}] missing "id".`);
      if (!p || typeof p.name !== 'string') errors.push(`plays[${i}] missing "name".`);
    }
  }

  if (Array.isArray(pkg.concepts)) {
    for (let i = 0; i < pkg.concepts.length; i++) {
      const c = pkg.concepts[i] as Record<string, unknown>;
      if (!c || typeof c.id !== 'string') errors.push(`concepts[${i}] missing "id".`);
      if (!c || typeof c.name !== 'string') errors.push(`concepts[${i}] missing "name".`);
    }
  }

  if (Array.isArray(pkg.gamePlans)) {
    for (let i = 0; i < pkg.gamePlans.length; i++) {
      const g = pkg.gamePlans[i] as Record<string, unknown>;
      if (!g || typeof g.id !== 'string') errors.push(`gamePlans[${i}] missing "id".`);
      if (!g || typeof g.name !== 'string') errors.push(`gamePlans[${i}] missing "name".`);
    }
  }

  if (Array.isArray(pkg.blockingSchemes)) {
    for (let i = 0; i < pkg.blockingSchemes.length; i++) {
      const b = pkg.blockingSchemes[i] as Record<string, unknown>;
      if (!b || typeof b.id !== 'string') errors.push(`blockingSchemes[${i}] missing "id".`);
      if (!b || typeof b.name !== 'string') errors.push(`blockingSchemes[${i}] missing "name".`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// getMigrationPreview
// ---------------------------------------------------------------------------

/**
 * Return a summary of what will be imported from the package.
 */
export function getMigrationPreview(data: InstallPackage): MigrationPreview {
  return {
    formationCount: data.formations.length,
    conceptCount: data.concepts.length,
    playCount: data.plays.length,
    gamePlanCount: data.gamePlans.length,
    blockingSchemeCount: data.blockingSchemes.length,
    totalItems:
      data.formations.length +
      data.concepts.length +
      data.plays.length +
      data.gamePlans.length +
      data.blockingSchemes.length,
    formationNames: data.formations.map((f) => f.name),
    conceptNames: data.concepts.map((c) => c.name),
    playNames: data.plays.map((p) => p.name),
    gamePlanNames: data.gamePlans.map((g) => g.name),
    blockingSchemeNames: data.blockingSchemes.map((b) => b.name),
  };
}

// ---------------------------------------------------------------------------
// importInstall
// ---------------------------------------------------------------------------

/**
 * Import a package into a target team. All items are re-assigned to the
 * target team and new IDs are generated to avoid collisions.
 */
export function importInstall(
  data: InstallPackage,
  targetTeamId: TeamId,
): ImportResult {
  const validation = validatePackage(data);
  if (!validation.valid) {
    return {
      success: false,
      imported: emptyPreview(),
      errors: validation.errors,
    };
  }

  const errors: string[] = [];
  const now = new Date().toISOString();

  // Build an ID mapping so cross-references (formationId in plays, etc.) stay intact
  const idMap = new Map<string, string>();

  // Helper to generate a new unique ID
  let counter = 0;
  function newId(prefix: string): string {
    counter += 1;
    return `${prefix}_imported_${counter}_${Date.now()}`;
  }

  // Map old IDs to new IDs
  for (const f of data.formations) idMap.set(f.id, newId('formation'));
  for (const c of data.concepts) idMap.set(c.id, newId('concept'));
  for (const p of data.plays) idMap.set(p.id, newId('play'));
  for (const g of data.gamePlans) idMap.set(g.id, newId('gameplan'));
  for (const b of data.blockingSchemes) idMap.set(b.id, newId('blocking'));

  // Import formations
  const importedFormations: Formation[] = [];
  for (const f of data.formations) {
    try {
      const imported: Formation = {
        ...f,
        id: idMap.get(f.id)!,
        teamId: targetTeamId,
        updatedAt: now,
      };
      store.formations.set(imported.id, imported);
      importedFormations.push(imported);
    } catch (e) {
      errors.push(`Failed to import formation "${f.name}": ${(e as Error).message}`);
    }
  }

  // Import concepts
  const importedConcepts: Concept[] = [];
  for (const c of data.concepts) {
    try {
      const imported: Concept = {
        ...c,
        id: idMap.get(c.id)!,
        teamId: targetTeamId,
        updatedAt: now,
      };
      store.concepts.set(imported.id, imported);
      importedConcepts.push(imported);
    } catch (e) {
      errors.push(`Failed to import concept "${c.name}": ${(e as Error).message}`);
    }
  }

  // Import blocking schemes
  const importedSchemes: BlockingScheme[] = [];
  for (const b of data.blockingSchemes) {
    try {
      const imported: BlockingScheme = {
        ...b,
        id: idMap.get(b.id)!,
        teamId: targetTeamId,
        updatedAt: now,
      };
      store.blockingSchemes.set(imported.id, imported);
      importedSchemes.push(imported);
    } catch (e) {
      errors.push(`Failed to import blocking scheme "${b.name}": ${(e as Error).message}`);
    }
  }

  // Import plays — update formation/concept references
  const importedPlays: Play[] = [];
  for (const p of data.plays) {
    try {
      const imported: Play = {
        ...p,
        id: idMap.get(p.id)!,
        teamId: targetTeamId,
        formationId: idMap.get(p.formationId) ?? p.formationId,
        conceptId: p.conceptId ? (idMap.get(p.conceptId) ?? p.conceptId) : undefined,
        blockingSchemeId: p.blockingSchemeId
          ? (idMap.get(p.blockingSchemeId) ?? p.blockingSchemeId)
          : undefined,
        updatedAt: now,
      };
      store.plays.set(imported.id, imported);
      importedPlays.push(imported);
    } catch (e) {
      errors.push(`Failed to import play "${p.name}": ${(e as Error).message}`);
    }
  }

  // Import game plans — update play references in sections
  const importedGamePlans: GamePlan[] = [];
  for (const g of data.gamePlans) {
    try {
      const imported: GamePlan = {
        ...g,
        id: idMap.get(g.id)!,
        teamId: targetTeamId,
        sections: g.sections.map((s) => ({
          ...s,
          plays: s.plays.map((pr) => ({
            ...pr,
            playId: idMap.get(pr.playId) ?? pr.playId,
          })),
        })),
        updatedAt: now,
      };
      store.gamePlans.set(imported.id, imported);
      importedGamePlans.push(imported);
    } catch (e) {
      errors.push(`Failed to import game plan "${g.name}": ${(e as Error).message}`);
    }
  }

  return {
    success: errors.length === 0,
    imported: {
      formationCount: importedFormations.length,
      conceptCount: importedConcepts.length,
      playCount: importedPlays.length,
      gamePlanCount: importedGamePlans.length,
      blockingSchemeCount: importedSchemes.length,
      totalItems:
        importedFormations.length +
        importedConcepts.length +
        importedPlays.length +
        importedGamePlans.length +
        importedSchemes.length,
      formationNames: importedFormations.map((f) => f.name),
      conceptNames: importedConcepts.map((c) => c.name),
      playNames: importedPlays.map((p) => p.name),
      gamePlanNames: importedGamePlans.map((g) => g.name),
      blockingSchemeNames: importedSchemes.map((b) => b.name),
    },
    errors,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyPreview(): MigrationPreview {
  return {
    formationCount: 0,
    conceptCount: 0,
    playCount: 0,
    gamePlanCount: 0,
    blockingSchemeCount: 0,
    totalItems: 0,
    formationNames: [],
    conceptNames: [],
    playNames: [],
    gamePlanNames: [],
    blockingSchemeNames: [],
  };
}
