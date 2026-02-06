import { getDB, type StoreName } from './indexeddb';

// ---- Types ----

export interface BackupData {
  version: number;
  createdAt: string;
  stores: Record<string, unknown[]>;
}

export interface BackupMetadata {
  size: number;
  entityCounts: Record<string, number>;
  createdAt: string;
}

// ---- Constants ----

const BACKUP_VERSION = 1;

/** All data stores to include in backups (excludes pendingSync queue). */
const ALL_STORES: StoreName[] = [
  'plays',
  'formations',
  'concepts',
  'gameplans',
  'practiceScripts',
  'blockingSchemes',
  'scoutingNotes',
  'folders',
];

// ---- Core API ----

/**
 * Export all IndexedDB stores to a JSON blob.
 * Captures the current state of every data store.
 */
export async function createBackup(): Promise<BackupData> {
  const db = await getDB();
  const stores: Record<string, unknown[]> = {};

  for (const storeName of ALL_STORES) {
    const data = await db.getAll(storeName);
    stores[storeName] = data;
  }

  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    stores,
  };
}

/**
 * Import data from a backup, clearing all existing data first.
 * Only stores that are known (in ALL_STORES) are imported.
 */
export async function restoreFromBackup(data: BackupData): Promise<void> {
  if (!data.version || !data.stores) {
    throw new Error('Invalid backup data: missing version or stores');
  }

  const db = await getDB();

  // Clear existing data in all stores
  for (const storeName of ALL_STORES) {
    await db.clear(storeName);
  }

  // Import data from backup
  for (const [storeName, entries] of Object.entries(data.stores)) {
    if (!ALL_STORES.includes(storeName as StoreName)) continue;

    for (const entry of entries) {
      await db.put(storeName, entry as { id: string });
    }
  }
}

/**
 * Get metadata about what a backup of the current data would contain.
 * Returns entity counts per store and an estimated total size in bytes.
 */
export async function getBackupMetadata(): Promise<BackupMetadata> {
  const db = await getDB();
  const entityCounts: Record<string, number> = {};
  let totalSize = 0;

  for (const storeName of ALL_STORES) {
    const data = await db.getAll(storeName);
    entityCounts[storeName] = data.length;
    totalSize += JSON.stringify(data).length;
  }

  return {
    size: totalSize,
    entityCounts,
    createdAt: new Date().toISOString(),
  };
}
