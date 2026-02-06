import { openDB, type IDBPDatabase } from 'idb';
import { generateId } from '@/lib/utils';
import { getDB } from './indexeddb';

// ---- Types ----

export interface SeasonArchive {
  id: string;
  seasonId: string;
  label: string;
  plays: unknown[];
  formations: unknown[];
  gamePlans: unknown[];
  concepts: unknown[];
  folders: unknown[];
  createdAt: string;
  metadata: {
    playCount: number;
    formationCount: number;
    gamePlanCount: number;
    conceptCount: number;
  };
}

// ---- IndexedDB for archives ----

const ARCHIVE_DB_NAME = 'playbook-archives-db';
const ARCHIVE_DB_VERSION = 1;
const ARCHIVE_STORE = 'season-archives';

let archiveDbPromise: Promise<IDBPDatabase> | null = null;

export function getArchiveDB(): Promise<IDBPDatabase> {
  if (!archiveDbPromise) {
    archiveDbPromise = openDB(ARCHIVE_DB_NAME, ARCHIVE_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ARCHIVE_STORE)) {
          const store = db.createObjectStore(ARCHIVE_STORE, { keyPath: 'id' });
          store.createIndex('seasonId', 'seasonId');
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return archiveDbPromise;
}

/** For testing: reset the cached DB promise and clear all stored entries */
export async function resetArchiveDB(): Promise<void> {
  if (archiveDbPromise) {
    try {
      const db = await archiveDbPromise;
      await db.clear(ARCHIVE_STORE);
    } catch {
      // DB may not exist yet
    }
  }
  archiveDbPromise = null;
}

// ---- Core API ----

/**
 * Archive all plays, formations, game plans, concepts, and folders
 * to a named season archive. This copies the current state — it does
 * NOT remove the data from the active stores.
 */
export async function archiveSeason(
  seasonId: string,
  label: string,
): Promise<SeasonArchive> {
  const mainDb = await getDB();

  const plays = await mainDb.getAll('plays');
  const formations = await mainDb.getAll('formations');
  const gamePlans = await mainDb.getAll('gameplans');
  const concepts = await mainDb.getAll('concepts');
  const folders = await mainDb.getAll('folders');

  const archive: SeasonArchive = {
    id: generateId(),
    seasonId,
    label,
    plays: plays.map((p) => ({ ...p })),
    formations: formations.map((f) => ({ ...f })),
    gamePlans: gamePlans.map((g) => ({ ...g })),
    concepts: concepts.map((c) => ({ ...c })),
    folders: folders.map((f) => ({ ...f })),
    createdAt: new Date().toISOString(),
    metadata: {
      playCount: plays.length,
      formationCount: formations.length,
      gamePlanCount: gamePlans.length,
      conceptCount: concepts.length,
    },
  };

  const archiveDb = await getArchiveDB();
  await archiveDb.put(ARCHIVE_STORE, archive);

  return archive;
}

/**
 * List all archived seasons with their metadata,
 * sorted with the most recent first.
 */
export async function getArchivedSeasons(): Promise<SeasonArchive[]> {
  const archiveDb = await getArchiveDB();
  const all: SeasonArchive[] = await archiveDb.getAll(ARCHIVE_STORE);

  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Restore a season from archive back to the active stores.
 * Existing data in the active stores is NOT cleared — archived entities
 * are added (or overwritten if IDs collide).
 */
export async function restoreSeason(archiveId: string): Promise<SeasonArchive> {
  const archiveDb = await getArchiveDB();
  const archive: SeasonArchive | undefined = await archiveDb.get(
    ARCHIVE_STORE,
    archiveId,
  );

  if (!archive) {
    throw new Error(`Archive ${archiveId} not found`);
  }

  const mainDb = await getDB();

  for (const play of archive.plays) {
    await mainDb.put('plays', play as { id: string });
  }
  for (const formation of archive.formations) {
    await mainDb.put('formations', formation as { id: string });
  }
  for (const gamePlan of archive.gamePlans) {
    await mainDb.put('gameplans', gamePlan as { id: string });
  }
  for (const concept of archive.concepts) {
    await mainDb.put('concepts', concept as { id: string });
  }
  for (const folder of archive.folders) {
    await mainDb.put('folders', folder as { id: string });
  }

  return archive;
}

/**
 * Permanently delete an archived season.
 */
export async function deleteArchive(archiveId: string): Promise<void> {
  const archiveDb = await getArchiveDB();
  const archive = await archiveDb.get(ARCHIVE_STORE, archiveId);

  if (!archive) {
    throw new Error(`Archive ${archiveId} not found`);
  }

  await archiveDb.delete(ARCHIVE_STORE, archiveId);
}
