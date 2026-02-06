import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `sd-id-${++counter}`,
  };
});

describe('soft-delete', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('softDelete', () => {
    it('should move an entity from the main store to the trash', async () => {
      const { dbPut, dbGet } = await import('@/lib/db/indexeddb');
      const { softDelete, getTrash, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

      await dbPut(
        'plays',
        { id: 'play-1', name: 'Slant Route', teamId: 't1' } as never,
        false,
      );

      const entry = await softDelete('plays', 'play-1');

      expect(entry.entityType).toBe('plays');
      expect(entry.entityId).toBe('play-1');
      expect(entry.data.name).toBe('Slant Route');
      expect(entry.deletedAt).toBeDefined();

      // Should be removed from main store
      const play = await dbGet('plays', 'play-1');
      expect(play).toBeUndefined();

      // Should be in trash
      const trash = await getTrash();
      expect(trash).toHaveLength(1);
      expect(trash[0].entityId).toBe('play-1');
    });

    it('should throw when the entity does not exist', async () => {
      await import('@/lib/db/indexeddb');
      const { softDelete, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

      await expect(softDelete('plays', 'nonexistent')).rejects.toThrow(
        'Entity plays/nonexistent not found',
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted entity back to the main store', async () => {
      const { dbPut, dbGet } = await import('@/lib/db/indexeddb');
      const { softDelete, restore, getTrash, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

      await dbPut(
        'plays',
        { id: 'play-2', name: 'Screen Pass', teamId: 't1' } as never,
        false,
      );

      await softDelete('plays', 'play-2');

      const restored = await restore('plays', 'play-2');

      expect(restored.name).toBe('Screen Pass');
      expect(restored.id).toBe('play-2');

      // Should be back in main store
      const play = await dbGet<{ id: string; name: string }>('plays', 'play-2');
      expect(play).toBeDefined();
      expect(play!.name).toBe('Screen Pass');

      // Should be removed from trash
      const trash = await getTrash();
      expect(trash).toHaveLength(0);
    });

    it('should throw when the trash entry does not exist', async () => {
      await import('@/lib/db/indexeddb');
      const { restore, resetTrashDB } = await import('@/lib/db/soft-delete');
      await resetTrashDB();

      await expect(restore('plays', 'nonexistent')).rejects.toThrow(
        'Trash entry for plays/nonexistent not found',
      );
    });
  });

  describe('getTrash', () => {
    it('should list all trashed items', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { softDelete, getTrash, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

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

      await softDelete('plays', 'p1');
      await softDelete('formations', 'f1');

      const trash = await getTrash();
      expect(trash).toHaveLength(2);
    });

    it('should filter trash by entity type', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { softDelete, getTrash, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

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

      await softDelete('plays', 'p1');
      await softDelete('formations', 'f1');

      const playTrash = await getTrash('plays');
      expect(playTrash).toHaveLength(1);
      expect(playTrash[0].entityType).toBe('plays');

      const formationTrash = await getTrash('formations');
      expect(formationTrash).toHaveLength(1);
      expect(formationTrash[0].entityType).toBe('formations');
    });
  });

  describe('permanentDelete', () => {
    it('should permanently remove an entity from the trash', async () => {
      const { dbPut } = await import('@/lib/db/indexeddb');
      const { softDelete, permanentDelete, getTrash, resetTrashDB } =
        await import('@/lib/db/soft-delete');
      await resetTrashDB();

      await dbPut(
        'plays',
        { id: 'p1', name: 'Play 1', teamId: 't1' } as never,
        false,
      );
      await softDelete('plays', 'p1');

      await permanentDelete('plays', 'p1');

      const trash = await getTrash();
      expect(trash).toHaveLength(0);
    });

    it('should throw when the trash entry does not exist', async () => {
      await import('@/lib/db/indexeddb');
      const { permanentDelete, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

      await expect(permanentDelete('plays', 'nonexistent')).rejects.toThrow(
        'Trash entry for plays/nonexistent not found',
      );
    });
  });

  describe('emptyTrash', () => {
    it('should remove all items from the trash when no days specified', async () => {
      const { getTrashDB, emptyTrash, getTrash, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

      const trashDb = await getTrashDB();
      await trashDb.put('trash', {
        id: 'trash-1',
        entityType: 'plays',
        entityId: 'p1',
        data: { id: 'p1', name: 'Play 1' },
        deletedAt: new Date().toISOString(),
      });
      await trashDb.put('trash', {
        id: 'trash-2',
        entityType: 'plays',
        entityId: 'p2',
        data: { id: 'p2', name: 'Play 2' },
        deletedAt: new Date().toISOString(),
      });

      const count = await emptyTrash();

      expect(count).toBe(2);
      const remaining = await getTrash();
      expect(remaining).toHaveLength(0);
    });

    it('should only remove items older than the specified number of days', async () => {
      const { getTrashDB, emptyTrash, getTrash, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

      const now = Date.now();
      const sixtyDaysAgo = new Date(
        now - 60 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const fiveDaysAgo = new Date(
        now - 5 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const trashDb = await getTrashDB();
      await trashDb.put('trash', {
        id: 'trash-old',
        entityType: 'plays',
        entityId: 'p-old',
        data: { id: 'p-old', name: 'Old Play' },
        deletedAt: sixtyDaysAgo,
      });
      await trashDb.put('trash', {
        id: 'trash-recent',
        entityType: 'plays',
        entityId: 'p-recent',
        data: { id: 'p-recent', name: 'Recent Play' },
        deletedAt: fiveDaysAgo,
      });

      const count = await emptyTrash(30);

      expect(count).toBe(1);
      const remaining = await getTrash();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].entityId).toBe('p-recent');
    });

    it('should return 0 when trash is already empty', async () => {
      const { emptyTrash, resetTrashDB } = await import(
        '@/lib/db/soft-delete'
      );
      await resetTrashDB();

      const count = await emptyTrash();
      expect(count).toBe(0);
    });
  });
});
