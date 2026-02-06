import { openDB, type IDBPDatabase } from 'idb';
import { generateId } from '@/lib/utils';
import { getDB } from './indexeddb';

// ---- Types ----

export interface TrashEntry {
  id: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  deletedAt: string;
}

// ---- IndexedDB for trash ----

const TRASH_DB_NAME = 'playbook-trash-db';
const TRASH_DB_VERSION = 1;
const TRASH_STORE = 'trash';

let trashDbPromise: Promise<IDBPDatabase> | null = null;

export function getTrashDB(): Promise<IDBPDatabase> {
  if (!trashDbPromise) {
    trashDbPromise = openDB(TRASH_DB_NAME, TRASH_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TRASH_STORE)) {
          const store = db.createObjectStore(TRASH_STORE, { keyPath: 'id' });
          store.createIndex('entityType', 'entityType');
          store.createIndex('entityId', 'entityId');
          store.createIndex('deletedAt', 'deletedAt');
        }
      },
    });
  }
  return trashDbPromise;
}

/** For testing: reset the cached DB promise and clear all stored entries */
export async function resetTrashDB(): Promise<void> {
  if (trashDbPromise) {
    try {
      const db = await trashDbPromise;
      await db.clear(TRASH_STORE);
    } catch {
      // DB may not exist yet
    }
  }
  trashDbPromise = null;
}

// ---- Core API ----

/**
 * Soft-delete an entity: copies it to the trash store and removes it
 * from the main store. The original data is preserved in the trash entry.
 */
export async function softDelete(
  entityType: string,
  id: string,
): Promise<TrashEntry> {
  const mainDb = await getDB();
  const entity = await mainDb.get(entityType, id);

  if (!entity) {
    throw new Error(`Entity ${entityType}/${id} not found`);
  }

  const trashEntry: TrashEntry = {
    id: generateId(),
    entityType,
    entityId: id,
    data: entity as Record<string, unknown>,
    deletedAt: new Date().toISOString(),
  };

  const trashDb = await getTrashDB();
  await trashDb.put(TRASH_STORE, trashEntry);
  await mainDb.delete(entityType, id);

  return trashEntry;
}

/**
 * Restore a soft-deleted entity from the trash back to its original store.
 */
export async function restore(
  entityType: string,
  id: string,
): Promise<Record<string, unknown>> {
  const trashDb = await getTrashDB();
  const allTrash: TrashEntry[] = await trashDb.getAll(TRASH_STORE);

  const entry = allTrash.find(
    (e) => e.entityType === entityType && e.entityId === id,
  );

  if (!entry) {
    throw new Error(`Trash entry for ${entityType}/${id} not found`);
  }

  const mainDb = await getDB();
  const restoredData = { ...entry.data };

  await mainDb.put(entityType, restoredData as { id: string });
  await trashDb.delete(TRASH_STORE, entry.id);

  return restoredData;
}

/**
 * List soft-deleted items, optionally filtered by entity type.
 * Results are sorted with the most recently deleted items first.
 */
export async function getTrash(entityType?: string): Promise<TrashEntry[]> {
  const trashDb = await getTrashDB();
  const all: TrashEntry[] = await trashDb.getAll(TRASH_STORE);

  const filtered = entityType
    ? all.filter((e) => e.entityType === entityType)
    : all;

  return filtered.sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  );
}

/**
 * Permanently delete an entity from the trash (cannot be undone).
 */
export async function permanentDelete(
  entityType: string,
  id: string,
): Promise<void> {
  const trashDb = await getTrashDB();
  const allTrash: TrashEntry[] = await trashDb.getAll(TRASH_STORE);

  const entry = allTrash.find(
    (e) => e.entityType === entityType && e.entityId === id,
  );

  if (!entry) {
    throw new Error(`Trash entry for ${entityType}/${id} not found`);
  }

  await trashDb.delete(TRASH_STORE, entry.id);
}

/**
 * Bulk permanent delete of trash items.
 * If olderThanDays is specified, only items deleted more than that many
 * days ago are removed. Otherwise, the entire trash is emptied.
 * Returns the number of items deleted.
 */
export async function emptyTrash(olderThanDays?: number): Promise<number> {
  const trashDb = await getTrashDB();
  const all: TrashEntry[] = await trashDb.getAll(TRASH_STORE);

  let toDelete: TrashEntry[];

  if (olderThanDays !== undefined) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffTime = cutoff.getTime();

    toDelete = all.filter(
      (e) => new Date(e.deletedAt).getTime() < cutoffTime,
    );
  } else {
    toDelete = all;
  }

  for (const entry of toDelete) {
    await trashDb.delete(TRASH_STORE, entry.id);
  }

  return toDelete.length;
}
