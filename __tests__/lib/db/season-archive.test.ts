import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `sa-id-${++counter}`,
  };
});

/** Helper: clear archive store and the main stores we read from. */
async function clearAllStores() {
  const { getDB } = await import('@/lib/db/indexeddb');
  const { resetArchiveDB } = await import('@/lib/db/season-archive');
  await resetArchiveDB();
  const db = await getDB();
  await db.clear('plays');
  await db.clear('formations');
  await db.clear('gameplans');
  await db.clear('concepts');
  await db.clear('folders');
}

describe('season-archive', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('archiveSeason', () => {
    it('should create an archive with all current data', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { archiveSeason } = await import('@/lib/db/season-archive');
      await clearAllStores();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Slant Route', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'formations',
        { id: 'f1', name: 'Shotgun', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'gameplans',
        { id: 'gp1', name: 'Week 1', teamId: 't1' } as never,
        false,
      );

      const archive = await archiveSeason('2025', 'Season 2025');

      expect(archive.id).toBeDefined();
      expect(archive.seasonId).toBe('2025');
      expect(archive.label).toBe('Season 2025');
      expect(archive.plays).toHaveLength(1);
      expect(archive.formations).toHaveLength(1);
      expect(archive.gamePlans).toHaveLength(1);
      expect(archive.createdAt).toBeDefined();
    });

    it('should include correct metadata counts', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { archiveSeason } = await import('@/lib/db/season-archive');
      await clearAllStores();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Play 1', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'plays',
        { id: 'p2', name: 'Play 2', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'concepts',
        { id: 'c1', name: 'Mesh', teamId: 't1' } as never,
        false,
      );

      const archive = await archiveSeason('2025', 'Season 2025');

      expect(archive.metadata.playCount).toBe(2);
      expect(archive.metadata.formationCount).toBe(0);
      expect(archive.metadata.gamePlanCount).toBe(0);
      expect(archive.metadata.conceptCount).toBe(1);
    });

    it('should include plays, formations, game plans, concepts, and folders', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { archiveSeason } = await import('@/lib/db/season-archive');
      await clearAllStores();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Play 1', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'formations',
        { id: 'f1', name: 'Shotgun', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'gameplans',
        { id: 'gp1', name: 'Week 1', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'concepts',
        { id: 'c1', name: 'Mesh', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'folders',
        { id: 'fo1', name: 'Run Plays', teamId: 't1' } as never,
        false,
      );

      const archive = await archiveSeason('2025', 'Full Season');

      expect(archive.plays).toHaveLength(1);
      expect(archive.formations).toHaveLength(1);
      expect(archive.gamePlans).toHaveLength(1);
      expect(archive.concepts).toHaveLength(1);
      expect(archive.folders).toHaveLength(1);
    });
  });

  describe('getArchivedSeasons', () => {
    it('should list all archived seasons', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { archiveSeason, getArchivedSeasons } = await import(
        '@/lib/db/season-archive'
      );
      await clearAllStores();

      // Need some data to archive
      await dbPut(
        'plays',
        { id: 'p1', name: 'Play', teamId: 't1' } as never,
        false,
      );

      await archiveSeason('2024', 'Season 2024');
      await archiveSeason('2025', 'Season 2025');

      const seasons = await getArchivedSeasons();

      expect(seasons).toHaveLength(2);
    });

    it('should return archives sorted by date descending', async () => {
      const { getArchiveDB, getArchivedSeasons } = await import(
        '@/lib/db/season-archive'
      );
      await clearAllStores();

      const archiveDb = await getArchiveDB();
      await archiveDb.put('season-archives', {
        id: 'a1',
        seasonId: '2023',
        label: 'Season 2023',
        plays: [],
        formations: [],
        gamePlans: [],
        concepts: [],
        folders: [],
        createdAt: '2023-12-01T00:00:00.000Z',
        metadata: {
          playCount: 0,
          formationCount: 0,
          gamePlanCount: 0,
          conceptCount: 0,
        },
      });
      await archiveDb.put('season-archives', {
        id: 'a2',
        seasonId: '2025',
        label: 'Season 2025',
        plays: [],
        formations: [],
        gamePlans: [],
        concepts: [],
        folders: [],
        createdAt: '2025-12-01T00:00:00.000Z',
        metadata: {
          playCount: 0,
          formationCount: 0,
          gamePlanCount: 0,
          conceptCount: 0,
        },
      });

      const seasons = await getArchivedSeasons();

      expect(seasons[0].seasonId).toBe('2025');
      expect(seasons[1].seasonId).toBe('2023');
    });

    it('should return empty array when no archives exist', async () => {
      const { getArchivedSeasons } = await import('@/lib/db/season-archive');
      await clearAllStores();

      const seasons = await getArchivedSeasons();
      expect(seasons).toEqual([]);
    });
  });

  describe('restoreSeason', () => {
    it('should restore archived data back to active stores', async () => {
      const { dbPut, dbGetAll } = await import('@/lib/db/indexeddb');
      const { archiveSeason, restoreSeason } = await import(
        '@/lib/db/season-archive'
      );
      await clearAllStores();

      // Set up data and archive
      await dbPut(
        'plays',
        { id: 'p1', name: 'Archived Play', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'formations',
        { id: 'f1', name: 'Archived Formation', teamId: 't1' } as never,
        false,
      );

      const archive = await archiveSeason('2025', 'Season 2025');

      // Clear the main stores to simulate a fresh season
      const { getDB } = await import('@/lib/db/indexeddb');
      const db = await getDB();
      await db.clear('plays');
      await db.clear('formations');

      // Verify stores are empty
      const emptyPlays = await dbGetAll('plays');
      expect(emptyPlays).toHaveLength(0);

      // Restore
      const restored = await restoreSeason(archive.id);

      expect(restored.seasonId).toBe('2025');

      // Verify data is back
      const plays = await dbGetAll<{ id: string; name: string }>('plays');
      expect(plays).toHaveLength(1);
      expect(plays[0].name).toBe('Archived Play');

      const formations = await dbGetAll<{ id: string; name: string }>(
        'formations',
      );
      expect(formations).toHaveLength(1);
      expect(formations[0].name).toBe('Archived Formation');
    });

    it('should throw when archive does not exist', async () => {
      const { restoreSeason } = await import('@/lib/db/season-archive');
      await clearAllStores();

      await expect(restoreSeason('nonexistent')).rejects.toThrow(
        'Archive nonexistent not found',
      );
    });
  });

  describe('deleteArchive', () => {
    it('should permanently remove an archive', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { archiveSeason, deleteArchive, getArchivedSeasons } = await import(
        '@/lib/db/season-archive'
      );
      await clearAllStores();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Play', teamId: 't1' } as never,
        false,
      );

      const archive = await archiveSeason('2025', 'Season 2025');
      await deleteArchive(archive.id);

      const seasons = await getArchivedSeasons();
      expect(seasons).toHaveLength(0);
    });

    it('should throw when archive does not exist', async () => {
      const { deleteArchive } = await import('@/lib/db/season-archive');
      await clearAllStores();

      await expect(deleteArchive('nonexistent')).rejects.toThrow(
        'Archive nonexistent not found',
      );
    });
  });
});
