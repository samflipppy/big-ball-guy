import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BackupData } from '@/lib/db/backup';

const ALL_STORE_NAMES = [
  'plays',
  'formations',
  'concepts',
  'gameplans',
  'practiceScripts',
  'blockingSchemes',
  'scoutingNotes',
  'folders',
];

/** Helper: clear all main stores used by the backup module. */
async function clearAllStores() {
  const { getDB } = await import('@/lib/db/indexeddb');
  const db = await getDB();
  for (const store of ALL_STORE_NAMES) {
    await db.clear(store);
  }
}

describe('backup', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('createBackup', () => {
    it('should export all stores to a BackupData structure', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { createBackup } = await import('@/lib/db/backup');
      await clearAllStores();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Slant', teamId: 't1' } as never,
        false,
      );
      await dbPut(
        'formations',
        { id: 'f1', name: 'Shotgun', teamId: 't1' } as never,
        false,
      );

      const backup = await createBackup();

      expect(backup.version).toBe(1);
      expect(backup.createdAt).toBeDefined();
      expect(backup.stores).toBeDefined();
      expect(backup.stores.plays).toHaveLength(1);
      expect(backup.stores.formations).toHaveLength(1);
    });

    it('should include all known store names even when empty', async () => {
      await import('@/lib/db/indexeddb');
      const { createBackup } = await import('@/lib/db/backup');
      await clearAllStores();

      const backup = await createBackup();

      for (const store of ALL_STORE_NAMES) {
        expect(backup.stores[store]).toBeDefined();
        expect(Array.isArray(backup.stores[store])).toBe(true);
      }
    });

    it('should capture multiple entities per store', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { createBackup } = await import('@/lib/db/backup');
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
        'plays',
        { id: 'p3', name: 'Play 3', teamId: 't1' } as never,
        false,
      );

      const backup = await createBackup();

      expect(backup.stores.plays).toHaveLength(3);
    });
  });

  describe('restoreFromBackup', () => {
    it('should clear existing data and import backup data', async () => {
      const { dbPut, dbGet } = await import('@/lib/db/indexeddb');
      const { restoreFromBackup } = await import('@/lib/db/backup');
      await clearAllStores();

      // Existing data
      await dbPut(
        'plays',
        { id: 'existing', name: 'Old Play', teamId: 't1' } as never,
        false,
      );

      const backupData: BackupData = {
        version: 1,
        createdAt: '2025-06-01T00:00:00.000Z',
        stores: {
          plays: [{ id: 'restored', name: 'Restored Play', teamId: 't1' }],
          formations: [],
          concepts: [],
          gameplans: [],
          practiceScripts: [],
          blockingSchemes: [],
          scoutingNotes: [],
          folders: [],
        },
      };

      await restoreFromBackup(backupData);

      // Old data should be cleared
      const oldPlay = await dbGet('plays', 'existing');
      expect(oldPlay).toBeUndefined();

      // Backup data should be present
      const restoredPlay = await dbGet<{ id: string; name: string }>(
        'plays',
        'restored',
      );
      expect(restoredPlay).toBeDefined();
      expect(restoredPlay!.name).toBe('Restored Play');
    });

    it('should throw for invalid backup data without version', async () => {
      await import('@/lib/db/indexeddb');
      const { restoreFromBackup } = await import('@/lib/db/backup');

      await expect(
        restoreFromBackup({ stores: {} } as BackupData),
      ).rejects.toThrow('Invalid backup data');
    });

    it('should throw for invalid backup data without stores', async () => {
      await import('@/lib/db/indexeddb');
      const { restoreFromBackup } = await import('@/lib/db/backup');

      await expect(
        restoreFromBackup({ version: 1 } as BackupData),
      ).rejects.toThrow('Invalid backup data');
    });

    it('should ignore unknown store names in backup data', async () => {
      const { dbGet } = await import('@/lib/db/indexeddb');
      const { restoreFromBackup } = await import('@/lib/db/backup');
      await clearAllStores();

      const backupData: BackupData = {
        version: 1,
        createdAt: '2025-06-01T00:00:00.000Z',
        stores: {
          plays: [{ id: 'p1', name: 'Play 1' }],
          unknownStore: [{ id: 'x1', name: 'Unknown' }],
        },
      };

      // Should not throw
      await restoreFromBackup(backupData);

      const play = await dbGet<{ id: string; name: string }>('plays', 'p1');
      expect(play).toBeDefined();
      expect(play!.name).toBe('Play 1');
    });
  });

  describe('getBackupMetadata', () => {
    it('should return entity counts for each store', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { getBackupMetadata } = await import('@/lib/db/backup');
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
        'formations',
        { id: 'f1', name: 'Shotgun', teamId: 't1' } as never,
        false,
      );

      const metadata = await getBackupMetadata();

      expect(metadata.entityCounts.plays).toBe(2);
      expect(metadata.entityCounts.formations).toBe(1);
      expect(metadata.entityCounts.concepts).toBe(0);
    });

    it('should return a size estimate in bytes', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { getBackupMetadata } = await import('@/lib/db/backup');
      await clearAllStores();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Play 1', teamId: 't1' } as never,
        false,
      );

      const metadata = await getBackupMetadata();

      expect(metadata.size).toBeGreaterThan(0);
    });

    it('should include a createdAt timestamp', async () => {
      await import('@/lib/db/indexeddb');
      const { getBackupMetadata } = await import('@/lib/db/backup');
      await clearAllStores();

      const metadata = await getBackupMetadata();

      expect(metadata.createdAt).toBeDefined();
      expect(new Date(metadata.createdAt).getTime()).not.toBeNaN();
    });
  });

  describe('round-trip', () => {
    it('should preserve data through a backup and restore cycle', async () => {
      const { dbPut, dbGetAll } = await import('@/lib/db/indexeddb');
      const { createBackup, restoreFromBackup } = await import(
        '@/lib/db/backup'
      );
      await clearAllStores();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Play 1', teamId: 't1', tags: ['pass'] } as never,
        false,
      );
      await dbPut(
        'formations',
        { id: 'f1', name: 'Shotgun', teamId: 't1' } as never,
        false,
      );

      // Create backup
      const backup = await createBackup();

      // Simulate data loss: clear stores by restoring empty data
      await restoreFromBackup({
        version: 1,
        createdAt: new Date().toISOString(),
        stores: {
          plays: [],
          formations: [],
          concepts: [],
          gameplans: [],
          practiceScripts: [],
          blockingSchemes: [],
          scoutingNotes: [],
          folders: [],
        },
      });

      const emptyPlays = await dbGetAll('plays');
      expect(emptyPlays).toHaveLength(0);

      // Restore from backup
      await restoreFromBackup(backup);

      const plays = await dbGetAll<{ id: string; name: string }>('plays');
      expect(plays).toHaveLength(1);
      expect(plays[0].name).toBe('Play 1');

      const formations = await dbGetAll<{ id: string; name: string }>(
        'formations',
      );
      expect(formations).toHaveLength(1);
      expect(formations[0].name).toBe('Shotgun');
    });
  });
});
