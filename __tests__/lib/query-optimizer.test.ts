import { describe, it, expect } from 'vitest';
import {
  selectFields,
  optimizePlaybookQuery,
  batchQueries,
  detectNPlusOne,
  type QueryConfig,
  type QueryLogEntry,
} from '@/lib/query-optimizer';

// ---------------------------------------------------------------------------
// selectFields
// ---------------------------------------------------------------------------

describe('selectFields', () => {
  it('returns list fields for play/list', () => {
    const fields = selectFields('play', 'list');
    expect(fields).toContain('id');
    expect(fields).toContain('name');
    expect(fields).not.toContain('assignments');
  });

  it('returns detail fields for play/detail', () => {
    const fields = selectFields('play', 'detail');
    expect(fields).toContain('assignments');
    expect(fields).toContain('defensiveOverlay');
  });

  it('returns minimal fields for play/minimal', () => {
    const fields = selectFields('play', 'minimal');
    expect(fields).toBe('id,name');
  });

  it('returns * for unknown entity type', () => {
    expect(selectFields('unknown_type', 'list')).toBe('*');
  });

  it('returns * for unknown detail level on valid entity', () => {
    expect(selectFields('play', 'nonexistent' as 'list')).toBe('*');
  });

  it('returns formation list fields', () => {
    const fields = selectFields('formation', 'list');
    expect(fields).toContain('name');
    expect(fields).toContain('side');
  });

  it('returns concept detail fields', () => {
    const fields = selectFields('concept', 'detail');
    expect(fields).toContain('routes');
  });

  it('returns gameplan minimal fields', () => {
    const fields = selectFields('gameplan', 'minimal');
    expect(fields).toContain('opponent');
  });
});

// ---------------------------------------------------------------------------
// optimizePlaybookQuery
// ---------------------------------------------------------------------------

describe('optimizePlaybookQuery', () => {
  it('returns a query targeting the plays table', () => {
    const config = optimizePlaybookQuery({});
    expect(config.table).toBe('plays');
  });

  it('defaults to list-level select fields', () => {
    const config = optimizePlaybookQuery({});
    expect(config.select).toContain('id');
    expect(config.select).toContain('name');
    expect(config.select).not.toContain('assignments');
  });

  it('passes through allowed filter keys', () => {
    const config = optimizePlaybookQuery({
      teamId: 'team-1',
      category: 'run',
      personnel: '11',
    });
    expect(config.filters.teamId).toBe('team-1');
    expect(config.filters.category).toBe('run');
    expect(config.filters.personnel).toBe('11');
  });

  it('ignores unknown filter keys', () => {
    const config = optimizePlaybookQuery({ dangerousKey: 'DROP TABLE' });
    expect(config.filters).not.toHaveProperty('dangerousKey');
  });

  it('ignores null / empty filter values', () => {
    const config = optimizePlaybookQuery({ teamId: null, category: '' });
    expect(Object.keys(config.filters)).toHaveLength(0);
  });

  it('respects a custom limit (clamped to 200)', () => {
    const config = optimizePlaybookQuery({ limit: 500 });
    expect(config.limit).toBe(200);
  });

  it('clamps limit to at least 1', () => {
    const config = optimizePlaybookQuery({ limit: -10 });
    expect(config.limit).toBe(1);
  });

  it('defaults orderBy to updatedAt', () => {
    const config = optimizePlaybookQuery({});
    expect(config.orderBy).toBe('updatedAt');
  });

  it('defaults limit to 50', () => {
    const config = optimizePlaybookQuery({});
    expect(config.limit).toBe(50);
  });

  it('accepts detail level override', () => {
    const config = optimizePlaybookQuery({ detail: 'detail' });
    expect(config.select).toContain('assignments');
  });
});

// ---------------------------------------------------------------------------
// batchQueries
// ---------------------------------------------------------------------------

describe('batchQueries', () => {
  const q1: QueryConfig = {
    table: 'plays',
    select: 'id,name',
    filters: { teamId: 't1' },
  };

  const q2: QueryConfig = {
    table: 'formations',
    select: 'id,name',
    filters: { teamId: 't1' },
  };

  it('returns all queries when none are duplicates', () => {
    const batch = batchQueries([q1, q2]);
    expect(batch.configs).toHaveLength(2);
  });

  it('deduplicates identical queries', () => {
    const batch = batchQueries([q1, { ...q1 }, q2]);
    expect(batch.configs).toHaveLength(2);
    expect(batch.summary).toContain('1 duplicates removed');
  });

  it('handles an empty query list', () => {
    const batch = batchQueries([]);
    expect(batch.configs).toHaveLength(0);
    expect(batch.summary).toContain('0 unique');
  });

  it('treats queries with different filters as distinct', () => {
    const qDiff = { ...q1, filters: { teamId: 't2' } };
    const batch = batchQueries([q1, qDiff]);
    expect(batch.configs).toHaveLength(2);
  });

  it('preserves query order (first seen)', () => {
    const batch = batchQueries([q1, q2, q1]);
    expect(batch.configs[0].table).toBe('plays');
    expect(batch.configs[1].table).toBe('formations');
  });

  it('summary includes correct unique count', () => {
    const batch = batchQueries([q1, q1, q1, q2]);
    expect(batch.summary).toContain('2 unique');
    expect(batch.summary).toContain('2 duplicates removed');
  });

  it('single query produces no duplicates', () => {
    const batch = batchQueries([q1]);
    expect(batch.configs).toHaveLength(1);
    expect(batch.summary).toContain('0 duplicates');
  });

  it('considers different limits as distinct', () => {
    const qLimit = { ...q1, limit: 10 };
    const batch = batchQueries([q1, qLimit]);
    expect(batch.configs).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// detectNPlusOne
// ---------------------------------------------------------------------------

describe('detectNPlusOne', () => {
  const baseTimestamp = 1700000000000;

  function makeEntries(
    table: string,
    count: number,
    intervalMs: number,
    startTs: number = baseTimestamp,
  ): QueryLogEntry[] {
    return Array.from({ length: count }, (_, i) => ({
      table,
      timestamp: startTs + i * intervalMs,
      duration: 10,
      rowCount: 1,
    }));
  }

  it('detects N+1 when 5+ queries hit the same table within 2s', () => {
    const log = makeEntries('players', 6, 100);
    const report = detectNPlusOne(log);
    expect(report.detected).toBe(true);
    expect(report.patterns).toHaveLength(1);
    expect(report.patterns[0].table).toBe('players');
    expect(report.patterns[0].count).toBe(6);
  });

  it('does not flag queries below the threshold count', () => {
    const log = makeEntries('players', 3, 100);
    const report = detectNPlusOne(log);
    expect(report.detected).toBe(false);
  });

  it('does not flag queries spread far apart', () => {
    const log = makeEntries('players', 6, 5000); // 5s apart
    const report = detectNPlusOne(log);
    expect(report.detected).toBe(false);
  });

  it('handles an empty query log', () => {
    const report = detectNPlusOne([]);
    expect(report.detected).toBe(false);
    expect(report.patterns).toHaveLength(0);
  });

  it('detects patterns in multiple tables', () => {
    const log = [
      ...makeEntries('plays', 6, 100, baseTimestamp),
      ...makeEntries('formations', 6, 100, baseTimestamp),
    ];
    const report = detectNPlusOne(log);
    expect(report.detected).toBe(true);
    expect(report.patterns).toHaveLength(2);
  });

  it('reports avgInterval', () => {
    const log = makeEntries('plays', 5, 200);
    const report = detectNPlusOne(log);
    expect(report.detected).toBe(true);
    expect(report.patterns[0].avgInterval).toBe(200);
  });

  it('ignores queries to different tables mixed together', () => {
    const mixed: QueryLogEntry[] = [
      { table: 'a', timestamp: baseTimestamp, duration: 5, rowCount: 1 },
      { table: 'b', timestamp: baseTimestamp + 100, duration: 5, rowCount: 1 },
      { table: 'a', timestamp: baseTimestamp + 200, duration: 5, rowCount: 1 },
      { table: 'b', timestamp: baseTimestamp + 300, duration: 5, rowCount: 1 },
    ];
    const report = detectNPlusOne(mixed);
    expect(report.detected).toBe(false); // only 2 per table
  });

  it('handles exactly 5 queries (threshold boundary)', () => {
    const log = makeEntries('plays', 5, 100);
    const report = detectNPlusOne(log);
    expect(report.detected).toBe(true);
    expect(report.patterns[0].count).toBe(5);
  });
});
