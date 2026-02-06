import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuditAction } from '@/lib/db/audit-trail';

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `at-id-${++counter}`,
  };
});

function makeAction(overrides: Partial<AuditAction> = {}): AuditAction {
  return {
    entityType: 'plays',
    entityId: 'play-1',
    action: 'create',
    userId: 'user-1',
    timestamp: '2025-06-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('audit-trail', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('logAction', () => {
    it('should create an audit log entry with a generated id', async () => {
      const { logAction, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      const action = makeAction();
      const entry = await logAction(action);

      expect(entry.id).toBeDefined();
      expect(entry.entityType).toBe('plays');
      expect(entry.entityId).toBe('play-1');
      expect(entry.action).toBe('create');
      expect(entry.userId).toBe('user-1');
      expect(entry.timestamp).toBe('2025-06-01T12:00:00.000Z');
    });

    it('should store action details when provided', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      const action = makeAction({
        details: { fieldChanged: 'name', oldValue: 'Old', newValue: 'New' },
      });
      await logAction(action);

      const log = await getAuditLog();
      expect(log).toHaveLength(1);
      expect(log[0].details).toEqual({
        fieldChanged: 'name',
        oldValue: 'Old',
        newValue: 'New',
      });
    });
  });

  describe('getAuditLog', () => {
    it('should return all entries when no filters specified', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(makeAction({ entityId: 'p1' }));
      await logAction(makeAction({ entityId: 'p2' }));
      await logAction(makeAction({ entityId: 'p3' }));

      const log = await getAuditLog();
      expect(log).toHaveLength(3);
    });

    it('should filter by entityId', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(makeAction({ entityId: 'p1' }));
      await logAction(makeAction({ entityId: 'p2' }));

      const log = await getAuditLog({ entityId: 'p1' });
      expect(log).toHaveLength(1);
      expect(log[0].entityId).toBe('p1');
    });

    it('should filter by userId', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(makeAction({ userId: 'coach-1' }));
      await logAction(makeAction({ userId: 'coach-2' }));

      const log = await getAuditLog({ userId: 'coach-1' });
      expect(log).toHaveLength(1);
      expect(log[0].userId).toBe('coach-1');
    });

    it('should filter by action type', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(makeAction({ action: 'create' }));
      await logAction(makeAction({ action: 'update' }));
      await logAction(makeAction({ action: 'delete' }));

      const log = await getAuditLog({ action: 'update' });
      expect(log).toHaveLength(1);
      expect(log[0].action).toBe('update');
    });

    it('should filter by time range using since and until', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(
        makeAction({ timestamp: '2025-01-01T00:00:00.000Z', entityId: 'old' }),
      );
      await logAction(
        makeAction({ timestamp: '2025-06-15T00:00:00.000Z', entityId: 'mid' }),
      );
      await logAction(
        makeAction({ timestamp: '2025-12-01T00:00:00.000Z', entityId: 'new' }),
      );

      const log = await getAuditLog({
        since: '2025-06-01T00:00:00.000Z',
        until: '2025-07-01T00:00:00.000Z',
      });

      expect(log).toHaveLength(1);
      expect(log[0].entityId).toBe('mid');
    });

    it('should return results sorted by timestamp descending', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(
        makeAction({
          timestamp: '2025-01-01T00:00:00.000Z',
          entityId: 'first',
        }),
      );
      await logAction(
        makeAction({
          timestamp: '2025-06-01T00:00:00.000Z',
          entityId: 'second',
        }),
      );
      await logAction(
        makeAction({
          timestamp: '2025-12-01T00:00:00.000Z',
          entityId: 'third',
        }),
      );

      const log = await getAuditLog();

      expect(log[0].entityId).toBe('third');
      expect(log[1].entityId).toBe('second');
      expect(log[2].entityId).toBe('first');
    });

    it('should combine multiple filters', async () => {
      const { logAction, getAuditLog, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(
        makeAction({ userId: 'coach-1', action: 'create', entityId: 'p1' }),
      );
      await logAction(
        makeAction({ userId: 'coach-1', action: 'update', entityId: 'p1' }),
      );
      await logAction(
        makeAction({ userId: 'coach-2', action: 'create', entityId: 'p2' }),
      );

      const log = await getAuditLog({ userId: 'coach-1', action: 'create' });

      expect(log).toHaveLength(1);
      expect(log[0].entityId).toBe('p1');
      expect(log[0].action).toBe('create');
    });
  });

  describe('getEntityHistory', () => {
    it('should return the full history for a specific entity', async () => {
      const { logAction, getEntityHistory, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      await logAction(
        makeAction({
          entityType: 'plays',
          entityId: 'play-5',
          action: 'create',
        }),
      );
      await logAction(
        makeAction({
          entityType: 'plays',
          entityId: 'play-5',
          action: 'update',
        }),
      );
      await logAction(
        makeAction({
          entityType: 'plays',
          entityId: 'play-5',
          action: 'share',
        }),
      );
      // Different entity — should not appear
      await logAction(
        makeAction({
          entityType: 'plays',
          entityId: 'play-6',
          action: 'create',
        }),
      );

      const history = await getEntityHistory('plays', 'play-5');

      expect(history).toHaveLength(3);
      history.forEach((h) => {
        expect(h.entityId).toBe('play-5');
        expect(h.entityType).toBe('plays');
      });
    });

    it('should return empty array when entity has no history', async () => {
      const { getEntityHistory, resetAuditDB } = await import(
        '@/lib/db/audit-trail'
      );
      await resetAuditDB();

      const history = await getEntityHistory('plays', 'nonexistent');
      expect(history).toEqual([]);
    });
  });
});
