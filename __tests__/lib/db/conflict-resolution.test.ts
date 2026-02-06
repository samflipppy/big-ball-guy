import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `cr-id-${++counter}`,
  };
});

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entity-1',
    name: 'Test Entity',
    updatedAt: '2025-06-01T12:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('conflict-resolution', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('detectConflict', () => {
    it('should return no conflict for identical records', async () => {
      const { detectConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord();
      const remote = makeRecord();

      const result = detectConflict(local, remote);

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingFields).toEqual([]);
    });

    it('should detect conflicting fields when values differ', async () => {
      const { detectConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({ name: 'Local Name' });
      const remote = makeRecord({ name: 'Remote Name' });

      const result = detectConflict(local, remote);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingFields).toContain('name');
    });

    it('should exclude id, updatedAt, and createdAt from conflict detection', async () => {
      const { detectConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({
        updatedAt: '2025-06-01T12:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
      });
      const remote = makeRecord({
        updatedAt: '2025-06-02T12:00:00.000Z',
        createdAt: '2025-01-02T00:00:00.000Z',
      });

      const result = detectConflict(local, remote);

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingFields).not.toContain('id');
      expect(result.conflictingFields).not.toContain('updatedAt');
      expect(result.conflictingFields).not.toContain('createdAt');
    });

    it('should detect multiple conflicting fields', async () => {
      const { detectConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({ name: 'Local', tags: ['a'] });
      const remote = makeRecord({ name: 'Remote', tags: ['b'] });

      const result = detectConflict(local, remote);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingFields).toContain('name');
      expect(result.conflictingFields).toContain('tags');
      expect(result.conflictingFields).toHaveLength(2);
    });
  });

  describe('resolveConflict', () => {
    it('should return resolved=true with no changes when there is no conflict', async () => {
      const { resolveConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord();
      const remote = makeRecord();

      const result = await resolveConflict(local, remote, 'last-write-wins');

      expect(result.resolved).toBe(true);
      expect(result.conflictingFields).toEqual([]);
      expect(result.result.name).toBe('Test Entity');
    });

    it('should pick the remote record with last-write-wins when remote is newer', async () => {
      const { resolveConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({
        name: 'Local Name',
        updatedAt: '2025-06-01T12:00:00.000Z',
      });
      const remote = makeRecord({
        name: 'Remote Name',
        updatedAt: '2025-06-02T12:00:00.000Z',
      });

      const result = await resolveConflict(local, remote, 'last-write-wins');

      expect(result.resolved).toBe(true);
      expect(result.result.name).toBe('Remote Name');
    });

    it('should pick the local record with last-write-wins when local is newer', async () => {
      const { resolveConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({
        name: 'Local Name',
        updatedAt: '2025-06-05T12:00:00.000Z',
      });
      const remote = makeRecord({
        name: 'Remote Name',
        updatedAt: '2025-06-02T12:00:00.000Z',
      });

      const result = await resolveConflict(local, remote, 'last-write-wins');

      expect(result.resolved).toBe(true);
      expect(result.result.name).toBe('Local Name');
    });

    it('should return resolved=false for manual strategy', async () => {
      const { resolveConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({ name: 'Local Name' });
      const remote = makeRecord({ name: 'Remote Name' });

      const result = await resolveConflict(local, remote, 'manual');

      expect(result.resolved).toBe(false);
      expect(result.strategy).toBe('manual');
      expect(result.result.name).toBe('Local Name');
      expect(result.conflictingFields).toContain('name');
    });

    it('should use merge strategy to combine records', async () => {
      const { resolveConflict, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({
        name: 'Local Name',
        category: 'run',
        updatedAt: '2025-06-01T12:00:00.000Z',
      });
      const remote = makeRecord({
        name: 'Remote Name',
        category: 'run',
        notes: 'Added notes',
        updatedAt: '2025-06-02T12:00:00.000Z',
      });

      const result = await resolveConflict(local, remote, 'merge');

      expect(result.resolved).toBe(true);
      expect(result.strategy).toBe('merge');
      // name conflicts -> remote is newer, so remote wins
      expect(result.result.name).toBe('Remote Name');
      // category is the same -> kept
      expect(result.result.category).toBe('run');
      // notes only in remote -> merged in
      expect(result.result.notes).toBe('Added notes');
    });
  });

  describe('mergeRecords', () => {
    it('should auto-merge non-conflicting fields', async () => {
      const { mergeRecords, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({
        name: 'Same Name',
        localField: 'local-only',
        updatedAt: '2025-06-01T12:00:00.000Z',
      });
      const remote = makeRecord({
        name: 'Same Name',
        remoteField: 'remote-only',
        updatedAt: '2025-06-02T12:00:00.000Z',
      });

      const merged = mergeRecords(local, remote);

      expect(merged.name).toBe('Same Name');
      expect(merged.localField).toBe('local-only');
      expect(merged.remoteField).toBe('remote-only');
    });

    it('should use latest value for conflicting fields', async () => {
      const { mergeRecords, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({
        name: 'Old Name',
        updatedAt: '2025-06-01T12:00:00.000Z',
      });
      const remote = makeRecord({
        name: 'New Name',
        updatedAt: '2025-06-02T12:00:00.000Z',
      });

      const merged = mergeRecords(local, remote);

      expect(merged.name).toBe('New Name');
      expect(merged.updatedAt).toBe('2025-06-02T12:00:00.000Z');
    });

    it('should preserve createdAt from local record', async () => {
      const { mergeRecords, resetConflictDB } = await import(
        '@/lib/db/conflict-resolution'
      );
      await resetConflictDB();

      const local = makeRecord({
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-06-01T12:00:00.000Z',
      });
      const remote = makeRecord({
        createdAt: '2025-02-01T00:00:00.000Z',
        updatedAt: '2025-06-02T12:00:00.000Z',
      });

      const merged = mergeRecords(local, remote);

      expect(merged.createdAt).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('getConflictHistory', () => {
    it('should track resolved conflicts in history', async () => {
      const { resolveConflict, getConflictHistory, resetConflictDB } =
        await import('@/lib/db/conflict-resolution');
      await resetConflictDB();

      const local = makeRecord({ name: 'Local' });
      const remote = makeRecord({ name: 'Remote' });

      await resolveConflict(local, remote, 'last-write-wins');

      const history = await getConflictHistory();

      expect(history).toHaveLength(1);
      expect(history[0].entityId).toBe('entity-1');
      expect(history[0].strategy).toBe('last-write-wins');
      expect(history[0].conflictingFields).toContain('name');
    });

    it('should filter conflict history by entityId', async () => {
      const { resolveConflict, getConflictHistory, resetConflictDB } =
        await import('@/lib/db/conflict-resolution');
      await resetConflictDB();

      const local1 = makeRecord({ id: 'e1', name: 'L1' });
      const remote1 = makeRecord({ id: 'e1', name: 'R1' });
      await resolveConflict(local1, remote1, 'last-write-wins');

      const local2 = makeRecord({ id: 'e2', name: 'L2' });
      const remote2 = makeRecord({ id: 'e2', name: 'R2' });
      await resolveConflict(local2, remote2, 'last-write-wins');

      const history = await getConflictHistory('e1');

      expect(history).toHaveLength(1);
      expect(history[0].entityId).toBe('e1');
    });

    it('should not track manual (unresolved) conflicts in history', async () => {
      const { resolveConflict, getConflictHistory, resetConflictDB } =
        await import('@/lib/db/conflict-resolution');
      await resetConflictDB();

      const local = makeRecord({ name: 'Local' });
      const remote = makeRecord({ name: 'Remote' });

      await resolveConflict(local, remote, 'manual');

      const history = await getConflictHistory();

      expect(history).toHaveLength(0);
    });
  });
});
