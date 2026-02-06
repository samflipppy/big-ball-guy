import { openDB, type IDBPDatabase } from 'idb';
import { generateId } from '@/lib/utils';
import type { Play, PlayId, PlayerAssignment, Route, BlockingAssignment } from '@/types';

// ---- Types ----

export interface PlayVersion {
  id: string;
  playId: PlayId;
  snapshot: Play;
  createdAt: string;
  label?: string;
}

export interface PlayDiff {
  addedRoutes: { playerId: string; route: Route }[];
  removedRoutes: { playerId: string; route: Route }[];
  movedPlayers: { playerId: string; from: { x: number; y: number }; to: { x: number; y: number } }[];
  changedBlocking: { playerId: string; from?: BlockingAssignment; to?: BlockingAssignment }[];
  metadataChanges: { field: string; from: unknown; to: unknown }[];
}

// ---- IndexedDB for versions ----

const VERSIONS_DB_NAME = 'playbook-versions-db';
const VERSIONS_DB_VERSION = 1;
const VERSIONS_STORE = 'versions';

let versionsDbPromise: Promise<IDBPDatabase> | null = null;

export function getVersionsDB(): Promise<IDBPDatabase> {
  if (!versionsDbPromise) {
    versionsDbPromise = openDB(VERSIONS_DB_NAME, VERSIONS_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
          const store = db.createObjectStore(VERSIONS_STORE, { keyPath: 'id' });
          store.createIndex('playId', 'playId');
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return versionsDbPromise;
}

/** For testing: reset the cached DB promise */
export function resetVersionsDB(): void {
  versionsDbPromise = null;
}

// ---- Core API ----

/**
 * Create a version snapshot of the current play state.
 */
export async function createVersion(play: Play, label?: string): Promise<PlayVersion> {
  const db = await getVersionsDB();
  const version: PlayVersion = {
    id: generateId(),
    playId: play.id,
    snapshot: structuredClone(play),
    createdAt: new Date().toISOString(),
    label: label ?? generateAutoLabel(play),
  };
  await db.put(VERSIONS_STORE, version);
  return version;
}

/**
 * Get all versions for a play, sorted by createdAt descending (newest first).
 */
export async function getVersions(playId: PlayId): Promise<PlayVersion[]> {
  const db = await getVersionsDB();
  const all: PlayVersion[] = await db.getAllFromIndex(VERSIONS_STORE, 'playId', playId);
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Restore a play to a previous version.
 * This creates a new version with the restored state (so the timeline always moves forward).
 * Returns the restored Play snapshot.
 */
export async function restoreVersion(
  playId: PlayId,
  versionId: string,
): Promise<Play> {
  const db = await getVersionsDB();
  const version: PlayVersion | undefined = await db.get(VERSIONS_STORE, versionId);

  if (!version) {
    throw new Error(`Version ${versionId} not found`);
  }

  if (version.playId !== playId) {
    throw new Error(`Version ${versionId} does not belong to play ${playId}`);
  }

  const restoredPlay: Play = {
    ...structuredClone(version.snapshot),
    id: playId,
    updatedAt: new Date().toISOString(),
  };

  // Create a new version recording this restore
  await createVersion(restoredPlay, `Restored to "${version.label ?? version.createdAt}"`);

  return restoredPlay;
}

/**
 * Compare two versions and produce a diff.
 */
export function diffVersions(v1: PlayVersion, v2: PlayVersion): PlayDiff {
  const snap1 = v1.snapshot;
  const snap2 = v2.snapshot;

  const diff: PlayDiff = {
    addedRoutes: [],
    removedRoutes: [],
    movedPlayers: [],
    changedBlocking: [],
    metadataChanges: [],
  };

  // Build assignment maps keyed by playerId
  const assignments1 = buildAssignmentMap(snap1.assignments);
  const assignments2 = buildAssignmentMap(snap2.assignments);

  // Find route changes
  const allPlayerIds = new Set([...assignments1.keys(), ...assignments2.keys()]);

  for (const pid of allPlayerIds) {
    const a1 = assignments1.get(pid);
    const a2 = assignments2.get(pid);

    // Route: added
    if (!a1?.route && a2?.route) {
      diff.addedRoutes.push({ playerId: pid, route: a2.route });
    }
    // Route: removed
    else if (a1?.route && !a2?.route) {
      diff.removedRoutes.push({ playerId: pid, route: a1.route });
    }
    // Route: changed (compare by serialization)
    else if (a1?.route && a2?.route) {
      if (JSON.stringify(a1.route) !== JSON.stringify(a2.route)) {
        diff.removedRoutes.push({ playerId: pid, route: a1.route });
        diff.addedRoutes.push({ playerId: pid, route: a2.route });
      }
    }

    // Blocking changes
    const b1 = a1?.blocking;
    const b2 = a2?.blocking;
    if (JSON.stringify(b1) !== JSON.stringify(b2)) {
      diff.changedBlocking.push({ playerId: pid, from: b1, to: b2 });
    }
  }

  // Check for player moves in the formation snapshot
  // We compare player locations from the play snapshot
  // Players are defined in assignments with playerId referencing formation players
  // For simplicity, we look at all assignment playerIds and compare their routes start positions

  // Metadata changes
  const metaFields: (keyof Play)[] = ['name', 'formationId', 'tags', 'notes', 'category', 'personnel', 'hash'];
  for (const field of metaFields) {
    const val1 = snap1[field];
    const val2 = snap2[field];
    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      diff.metadataChanges.push({ field, from: val1, to: val2 });
    }
  }

  return diff;
}

// ---- Auto-labeling ----

function generateAutoLabel(play: Play): string {
  const routeCount = play.assignments.filter((a) => a.route).length;
  const blockCount = play.assignments.filter((a) => a.blocking).length;

  const parts: string[] = [];
  if (routeCount > 0) parts.push(`${routeCount} route${routeCount > 1 ? 's' : ''}`);
  if (blockCount > 0) parts.push(`${blockCount} block${blockCount > 1 ? 's' : ''}`);

  if (parts.length > 0) {
    return `${play.name} - ${parts.join(', ')}`;
  }
  return play.name;
}

// ---- Auto-versioning ----

const lastVersionTimes = new Map<PlayId, number>();
const AUTO_VERSION_THROTTLE_MS = 30_000; // 30 seconds

/**
 * Auto-version a play if enough time has passed since the last version.
 * Returns the new version if created, or null if throttled.
 */
export async function autoVersion(play: Play): Promise<PlayVersion | null> {
  const now = Date.now();
  const lastTime = lastVersionTimes.get(play.id) ?? 0;

  if (now - lastTime < AUTO_VERSION_THROTTLE_MS) {
    return null; // throttled
  }

  lastVersionTimes.set(play.id, now);
  return createVersion(play);
}

/** Reset the throttle state (useful for testing). */
export function resetAutoVersionThrottle(): void {
  lastVersionTimes.clear();
}

// ---- Helpers ----

function buildAssignmentMap(
  assignments: PlayerAssignment[],
): Map<string, PlayerAssignment> {
  const map = new Map<string, PlayerAssignment>();
  for (const a of assignments) {
    map.set(a.playerId, a);
  }
  return map;
}
