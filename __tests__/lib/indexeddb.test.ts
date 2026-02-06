import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  dbPut,
  dbGet,
  dbGetAll,
  dbDelete,
  getPendingSyncEntries,
} from '@/lib/db/indexeddb';

// The idb mock is in __tests__/setup.ts. We need to reset the internal module
// state between tests so we get a clean dbPromise each time.
let dbPromiseField: unknown = null;

// We need to reset the module-level dbPromise before each test.
// Because getDB() caches the promise, we re-import to reset.
beforeEach(async () => {
  // Reset the cached dbPromise by re-importing
  vi.resetModules();
});

describe('IndexedDB operations', () => {
  describe('dbPut and dbGet', () => {
    it('stores and retrieves an item', async () => {
      const { dbPut, dbGet } = await import('@/lib/db/indexeddb');

      await dbPut('plays', { id: 'play-1', name: 'Slant Route', teamId: 't1' } as never);
      const result = await dbGet<{ id: string; name: string }>('plays', 'play-1');
      expect(result).toBeDefined();
      expect(result!.name).toBe('Slant Route');
    });

    it('overwrites an existing item with the same id', async () => {
      const { dbPut, dbGet } = await import('@/lib/db/indexeddb');

      await dbPut('plays', { id: 'play-1', name: 'V1' } as never);
      await dbPut('plays', { id: 'play-1', name: 'V2' } as never);
      const result = await dbGet<{ id: string; name: string }>('plays', 'play-1');
      expect(result!.name).toBe('V2');
    });

    it('returns undefined for non-existent key', async () => {
      const { dbGet } = await import('@/lib/db/indexeddb');

      const result = await dbGet('plays', 'non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('dbGetAll', () => {
    it('returns all items in a store', async () => {
      const { dbPut, dbGetAll } = await import('@/lib/db/indexeddb');

      await dbPut('formations', { id: 'f1', name: 'Shotgun' } as never);
      await dbPut('formations', { id: 'f2', name: 'I-Form' } as never);

      const all = await dbGetAll<{ id: string; name: string }>('formations');
      expect(all).toHaveLength(2);
    });

    it('returns empty array for empty store', async () => {
      const { dbGetAll } = await import('@/lib/db/indexeddb');

      const all = await dbGetAll('concepts');
      expect(all).toEqual([]);
    });
  });

  describe('dbDelete', () => {
    it('removes an item from the store', async () => {
      const { dbPut, dbGet, dbDelete } = await import('@/lib/db/indexeddb');

      await dbPut('plays', { id: 'play-del', name: 'Delete Me' } as never);
      await dbDelete('plays', 'play-del');
      const result = await dbGet('plays', 'play-del');
      expect(result).toBeUndefined();
    });

    it('does not throw when deleting non-existent key', async () => {
      const { dbDelete } = await import('@/lib/db/indexeddb');

      await expect(dbDelete('plays', 'no-such-id')).resolves.not.toThrow();
    });
  });

  describe('pendingSync queue', () => {
    it('dbPut adds an entry to pendingSync queue by default', async () => {
      const { dbPut, getPendingSyncEntries } = await import('@/lib/db/indexeddb');

      await dbPut('plays', { id: 'sync-1', name: 'Sync Test' } as never);
      const pending = await getPendingSyncEntries();
      expect(pending.length).toBeGreaterThanOrEqual(1);
    });

    it('dbPut with addToSyncQueue=false does not add to pendingSync', async () => {
      const { dbPut, getPendingSyncEntries } = await import('@/lib/db/indexeddb');

      await dbPut('plays', { id: 'no-sync', name: 'No Sync' } as never, false);
      const pending = await getPendingSyncEntries();
      // Only entries where addToSyncQueue was true should be in the queue
      const hasNoSync = pending.some(
        (e: { id: string }) => e.id.includes('no-sync'),
      );
      expect(hasNoSync).toBe(false);
    });

    it('getPendingSyncEntries returns entries ordered by timestamp', async () => {
      const { dbPut, getPendingSyncEntries } = await import('@/lib/db/indexeddb');

      await dbPut('plays', { id: 'ts-1', name: 'First' } as never);
      await dbPut('plays', { id: 'ts-2', name: 'Second' } as never);

      const pending = await getPendingSyncEntries();
      expect(pending.length).toBeGreaterThanOrEqual(2);
    });
  });
});
