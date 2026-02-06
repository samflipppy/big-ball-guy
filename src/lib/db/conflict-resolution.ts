import { openDB, type IDBPDatabase } from 'idb';
import { generateId } from '@/lib/utils';

// ---- Types ----

export type ConflictStrategy = 'last-write-wins' | 'merge' | 'manual';

export interface SyncRecord {
  id: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface ConflictResult {
  resolved: boolean;
  strategy: ConflictStrategy;
  result: SyncRecord;
  conflictingFields: string[];
}

export interface ConflictHistoryEntry {
  id: string;
  entityId: string;
  localRecord: SyncRecord;
  remoteRecord: SyncRecord;
  strategy: ConflictStrategy;
  result: SyncRecord;
  conflictingFields: string[];
  resolvedAt: string;
}

// ---- IndexedDB for conflict history ----

const CONFLICT_DB_NAME = 'playbook-conflicts-db';
const CONFLICT_DB_VERSION = 1;
const CONFLICT_STORE = 'conflict-history';

let conflictDbPromise: Promise<IDBPDatabase> | null = null;

export function getConflictDB(): Promise<IDBPDatabase> {
  if (!conflictDbPromise) {
    conflictDbPromise = openDB(CONFLICT_DB_NAME, CONFLICT_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CONFLICT_STORE)) {
          const store = db.createObjectStore(CONFLICT_STORE, { keyPath: 'id' });
          store.createIndex('entityId', 'entityId');
          store.createIndex('resolvedAt', 'resolvedAt');
        }
      },
    });
  }
  return conflictDbPromise;
}

/** For testing: reset the cached DB promise and clear all stored entries */
export async function resetConflictDB(): Promise<void> {
  if (conflictDbPromise) {
    try {
      const db = await conflictDbPromise;
      await db.clear(CONFLICT_STORE);
    } catch {
      // DB may not exist yet
    }
  }
  conflictDbPromise = null;
}

// ---- Core API ----

/**
 * Detect conflicts between a local and remote record by comparing
 * updatedAt timestamps and field-level changes. Fields like id,
 * updatedAt, and createdAt are excluded from conflict detection.
 */
export function detectConflict(
  local: SyncRecord,
  remote: SyncRecord,
): { hasConflict: boolean; conflictingFields: string[] } {
  const conflictingFields = getConflictingFields(local, remote);
  return {
    hasConflict: conflictingFields.length > 0,
    conflictingFields,
  };
}

/**
 * Resolve a conflict between local and remote records using the given strategy.
 *
 * - last-write-wins: picks the record with the newer updatedAt
 * - merge: field-level merge (non-conflicting auto-merge, conflicting use latest)
 * - manual: returns unresolved with the local record for the caller to decide
 */
export async function resolveConflict(
  local: SyncRecord,
  remote: SyncRecord,
  strategy: ConflictStrategy,
): Promise<ConflictResult> {
  const { hasConflict, conflictingFields } = detectConflict(local, remote);

  if (!hasConflict) {
    return { resolved: true, strategy, result: local, conflictingFields: [] };
  }

  let result: SyncRecord;

  switch (strategy) {
    case 'last-write-wins': {
      const localTime = new Date(local.updatedAt).getTime();
      const remoteTime = new Date(remote.updatedAt).getTime();
      result = remoteTime >= localTime ? { ...remote } : { ...local };
      break;
    }
    case 'merge': {
      result = mergeRecords(local, remote);
      break;
    }
    case 'manual': {
      return {
        resolved: false,
        strategy,
        result: local,
        conflictingFields,
      };
    }
  }

  // Track in conflict history
  await trackConflict(local, remote, strategy, result, conflictingFields);

  return { resolved: true, strategy, result, conflictingFields };
}

/**
 * Field-level merge of two records.
 * Non-conflicting fields are auto-merged. Conflicting fields use the value
 * from the record with the more recent updatedAt.
 */
export function mergeRecords(local: SyncRecord, remote: SyncRecord): SyncRecord {
  const merged: SyncRecord = { id: local.id, updatedAt: local.updatedAt };
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const excludeFields = new Set(['id', 'createdAt']);

  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  for (const key of allKeys) {
    if (excludeFields.has(key)) continue;

    const localVal = JSON.stringify(local[key]);
    const remoteVal = JSON.stringify(remote[key]);

    if (key === 'updatedAt') {
      merged.updatedAt = remoteTime >= localTime ? remote.updatedAt : local.updatedAt;
    } else if (localVal === remoteVal) {
      // No conflict on this field — keep the shared value
      merged[key] = local[key];
    } else {
      // Conflicting field — use the value from the newer record
      merged[key] = remoteTime >= localTime ? remote[key] : local[key];
    }
  }

  // Preserve createdAt from local
  if ('createdAt' in local) {
    merged.createdAt = local.createdAt;
  }

  return merged;
}

/**
 * Retrieve the conflict history log, optionally filtered by entity id.
 */
export async function getConflictHistory(
  entityId?: string,
): Promise<ConflictHistoryEntry[]> {
  const db = await getConflictDB();
  const all: ConflictHistoryEntry[] = await db.getAll(CONFLICT_STORE);

  if (entityId) {
    return all.filter((e) => e.entityId === entityId);
  }

  return all.sort(
    (a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime(),
  );
}

// ---- Helpers ----

function getConflictingFields(local: SyncRecord, remote: SyncRecord): string[] {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const conflicting: string[] = [];
  const excludeFields = new Set(['id', 'updatedAt', 'createdAt']);

  for (const key of allKeys) {
    if (excludeFields.has(key)) continue;
    if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
      conflicting.push(key);
    }
  }

  return conflicting;
}

async function trackConflict(
  local: SyncRecord,
  remote: SyncRecord,
  strategy: ConflictStrategy,
  result: SyncRecord,
  conflictingFields: string[],
): Promise<void> {
  const db = await getConflictDB();
  const entry: ConflictHistoryEntry = {
    id: generateId(),
    entityId: local.id,
    localRecord: local,
    remoteRecord: remote,
    strategy,
    result,
    conflictingFields,
    resolvedAt: new Date().toISOString(),
  };
  await db.put(CONFLICT_STORE, entry);
}
