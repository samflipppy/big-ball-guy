import { openDB, type IDBPDatabase } from 'idb';
import type { Play, Formation, Concept, GamePlan, PracticeScript, BlockingScheme, ScoutingNote, Folder } from '@/types';

const DB_NAME = 'playbook-db';
const DB_VERSION = 1;

export type StoreName = 'plays' | 'formations' | 'concepts' | 'gameplans' | 'practiceScripts' | 'blockingSchemes' | 'scoutingNotes' | 'folders' | 'pendingSync';

export interface PendingSyncEntry {
  id: string;
  storeName: StoreName;
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Play stores
        if (!db.objectStoreNames.contains('plays')) {
          const playStore = db.createObjectStore('plays', { keyPath: 'id' });
          playStore.createIndex('teamId', 'teamId');
          playStore.createIndex('folderId', 'folderId');
          playStore.createIndex('formationId', 'formationId');
        }
        if (!db.objectStoreNames.contains('formations')) {
          const formationStore = db.createObjectStore('formations', { keyPath: 'id' });
          formationStore.createIndex('teamId', 'teamId');
        }
        if (!db.objectStoreNames.contains('concepts')) {
          const conceptStore = db.createObjectStore('concepts', { keyPath: 'id' });
          conceptStore.createIndex('teamId', 'teamId');
        }
        if (!db.objectStoreNames.contains('gameplans')) {
          const gpStore = db.createObjectStore('gameplans', { keyPath: 'id' });
          gpStore.createIndex('teamId', 'teamId');
        }
        if (!db.objectStoreNames.contains('practiceScripts')) {
          const psStore = db.createObjectStore('practiceScripts', { keyPath: 'id' });
          psStore.createIndex('teamId', 'teamId');
        }
        if (!db.objectStoreNames.contains('blockingSchemes')) {
          const bsStore = db.createObjectStore('blockingSchemes', { keyPath: 'id' });
          bsStore.createIndex('teamId', 'teamId');
        }
        if (!db.objectStoreNames.contains('scoutingNotes')) {
          const snStore = db.createObjectStore('scoutingNotes', { keyPath: 'id' });
          snStore.createIndex('gamePlanId', 'gamePlanId');
          snStore.createIndex('teamId', 'teamId');
        }
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('teamId', 'teamId');
          folderStore.createIndex('parentId', 'parentId');
        }
        // Pending sync queue
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

// Generic CRUD operations
export async function dbGet<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(storeName, id);
}

export async function dbGetAll<T>(storeName: StoreName, teamId?: string): Promise<T[]> {
  const db = await getDB();
  if (teamId) {
    return db.getAllFromIndex(storeName, 'teamId', teamId);
  }
  return db.getAll(storeName);
}

export async function dbPut<T extends { id: string }>(
  storeName: StoreName,
  data: T,
  addToSyncQueue = true,
): Promise<void> {
  const db = await getDB();

  // Check if record exists BEFORE starting the transaction to avoid
  // the transaction finishing while we await the get().
  let existing: unknown | undefined;
  if (addToSyncQueue) {
    try {
      existing = await db.get(storeName, data.id);
    } catch {
      // Store may not have the record yet
    }
  }

  const tx = db.transaction([storeName, 'pendingSync'], 'readwrite');
  tx.objectStore(storeName).put(data);

  if (addToSyncQueue) {
    const syncEntry: PendingSyncEntry = {
      id: `${storeName}-${data.id}-${Date.now()}`,
      storeName,
      action: existing ? 'update' : 'create',
      data,
      timestamp: Date.now(),
    };
    tx.objectStore('pendingSync').put(syncEntry);
  }

  await tx.done;
}

export async function dbDelete(
  storeName: StoreName,
  id: string,
  addToSyncQueue = true,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([storeName, 'pendingSync'], 'readwrite');
  tx.objectStore(storeName).delete(id);

  if (addToSyncQueue) {
    const syncEntry: PendingSyncEntry = {
      id: `${storeName}-${id}-${Date.now()}`,
      storeName,
      action: 'delete',
      data: { id },
      timestamp: Date.now(),
    };
    tx.objectStore('pendingSync').put(syncEntry);
  }

  await tx.done;
}

export async function getPendingSyncEntries(): Promise<PendingSyncEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingSync', 'timestamp');
}

export async function clearSyncEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingSync', id);
}

// Type-safe convenience methods
export const plays = {
  get: (id: string) => dbGet<Play>('plays', id),
  getAll: (teamId?: string) => dbGetAll<Play>('plays', teamId),
  put: (play: Play) => dbPut('plays', play),
  delete: (id: string) => dbDelete('plays', id),
};

export const formations = {
  get: (id: string) => dbGet<Formation>('formations', id),
  getAll: (teamId?: string) => dbGetAll<Formation>('formations', teamId),
  put: (formation: Formation) => dbPut('formations', formation),
  delete: (id: string) => dbDelete('formations', id),
};

export const concepts = {
  get: (id: string) => dbGet<Concept>('concepts', id),
  getAll: (teamId?: string) => dbGetAll<Concept>('concepts', teamId),
  put: (concept: Concept) => dbPut('concepts', concept),
  delete: (id: string) => dbDelete('concepts', id),
};

export const gameplans = {
  get: (id: string) => dbGet<GamePlan>('gameplans', id),
  getAll: (teamId?: string) => dbGetAll<GamePlan>('gameplans', teamId),
  put: (gp: GamePlan) => dbPut('gameplans', gp),
  delete: (id: string) => dbDelete('gameplans', id),
};

export const practiceScripts = {
  get: (id: string) => dbGet<PracticeScript>('practiceScripts', id),
  getAll: (teamId?: string) => dbGetAll<PracticeScript>('practiceScripts', teamId),
  put: (ps: PracticeScript) => dbPut('practiceScripts', ps),
  delete: (id: string) => dbDelete('practiceScripts', id),
};

export const blockingSchemes = {
  get: (id: string) => dbGet<BlockingScheme>('blockingSchemes', id),
  getAll: (teamId?: string) => dbGetAll<BlockingScheme>('blockingSchemes', teamId),
  put: (bs: BlockingScheme) => dbPut('blockingSchemes', bs),
  delete: (id: string) => dbDelete('blockingSchemes', id),
};

export const scoutingNotes = {
  get: (id: string) => dbGet<ScoutingNote>('scoutingNotes', id),
  getAll: (teamId?: string) => dbGetAll<ScoutingNote>('scoutingNotes', teamId),
  put: (sn: ScoutingNote) => dbPut('scoutingNotes', sn),
  delete: (id: string) => dbDelete('scoutingNotes', id),
};

export const folders = {
  get: (id: string) => dbGet<Folder>('folders', id),
  getAll: (teamId?: string) => dbGetAll<Folder>('folders', teamId),
  put: (folder: Folder) => dbPut('folders', folder),
  delete: (id: string) => dbDelete('folders', id),
};
