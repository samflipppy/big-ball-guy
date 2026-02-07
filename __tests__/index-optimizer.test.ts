import { describe, it, expect } from 'vitest';
import {
  RECOMMENDED_INDEXES,
  generateCreateIndexSQL,
  analyzeQueryForIndex,
  estimateIndexSize,
  getIndexRecommendations,
} from '@/lib/db/index-optimizer';
import type { IndexDefinition, QueryLogEntry } from '@/lib/db/index-optimizer';

describe('index-optimizer', () => {
  // ---- RECOMMENDED_INDEXES ----
  describe('RECOMMENDED_INDEXES', () => {
    it('includes indexes for plays, formations, and game_plans', () => {
      const tables = RECOMMENDED_INDEXES.map((i) => i.table);
      expect(tables).toContain('plays');
      expect(tables).toContain('formations');
      expect(tables).toContain('game_plans');
    });

    it('includes a GIN index for tags', () => {
      const ginIndexes = RECOMMENDED_INDEXES.filter((i) => i.type === 'gin');
      expect(ginIndexes.length).toBeGreaterThan(0);
      const tagIndex = ginIndexes.find((i) => i.columns.includes('tags'));
      expect(tagIndex).toBeDefined();
    });

    it('includes a composite index on game_plans(team_id, season_id)', () => {
      const idx = RECOMMENDED_INDEXES.find(
        (i) =>
          i.table === 'game_plans' &&
          i.columns.includes('team_id') &&
          i.columns.includes('season_id'),
      );
      expect(idx).toBeDefined();
    });
  });

  // ---- generateCreateIndexSQL ----
  describe('generateCreateIndexSQL', () => {
    it('generates a btree index statement', () => {
      const idx: IndexDefinition = {
        table: 'plays',
        columns: ['team_id'],
        type: 'btree',
      };
      const sql = generateCreateIndexSQL(idx);
      expect(sql).toContain('CREATE INDEX');
      expect(sql).toContain('idx_plays_team_id');
      expect(sql).toContain('ON plays');
      expect(sql).toContain('(team_id)');
      expect(sql.endsWith(';')).toBe(true);
    });

    it('generates a UNIQUE index when unique is true', () => {
      const idx: IndexDefinition = {
        table: 'users',
        columns: ['email'],
        type: 'btree',
        unique: true,
      };
      const sql = generateCreateIndexSQL(idx);
      expect(sql).toContain('CREATE UNIQUE INDEX');
    });

    it('generates a GIN index with USING gin clause', () => {
      const idx: IndexDefinition = {
        table: 'plays',
        columns: ['tags'],
        type: 'gin',
      };
      const sql = generateCreateIndexSQL(idx);
      expect(sql).toContain('USING gin');
    });

    it('generates a hash index with USING hash clause', () => {
      const idx: IndexDefinition = {
        table: 'plays',
        columns: ['id'],
        type: 'hash',
      };
      const sql = generateCreateIndexSQL(idx);
      expect(sql).toContain('USING hash');
    });

    it('appends a WHERE clause for partial indexes', () => {
      const idx: IndexDefinition = {
        table: 'plays',
        columns: ['team_id'],
        type: 'btree',
        partial: 'deleted_at IS NULL',
      };
      const sql = generateCreateIndexSQL(idx);
      expect(sql).toContain('WHERE deleted_at IS NULL');
    });

    it('handles composite indexes', () => {
      const idx: IndexDefinition = {
        table: 'game_plans',
        columns: ['team_id', 'season_id'],
        type: 'btree',
      };
      const sql = generateCreateIndexSQL(idx);
      expect(sql).toContain('(team_id, season_id)');
      expect(sql).toContain('idx_game_plans_team_id_season_id');
    });
  });

  // ---- analyzeQueryForIndex ----
  describe('analyzeQueryForIndex', () => {
    it('suggests an index for a simple WHERE clause', () => {
      const recs = analyzeQueryForIndex(
        'SELECT * FROM plays WHERE team_id = $1',
      );
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].index.table).toBe('plays');
      expect(recs[0].index.columns).toContain('team_id');
    });

    it('suggests a composite index for WHERE + ORDER BY', () => {
      const recs = analyzeQueryForIndex(
        'SELECT * FROM plays WHERE team_id = $1 ORDER BY created_at DESC',
      );
      const composite = recs.find((r) => r.index.columns.length > 1);
      expect(composite).toBeDefined();
      expect(composite!.index.columns).toContain('team_id');
      expect(composite!.index.columns).toContain('created_at');
    });

    it('returns empty for a query without FROM', () => {
      const recs = analyzeQueryForIndex('SELECT 1');
      expect(recs).toHaveLength(0);
    });
  });

  // ---- estimateIndexSize ----
  describe('estimateIndexSize', () => {
    it('returns a positive number for valid inputs', () => {
      const size = estimateIndexSize('plays', ['team_id'], 10_000);
      expect(size).toBeGreaterThan(0);
    });

    it('returns 0 for 0 rows', () => {
      const size = estimateIndexSize('plays', ['team_id'], 0);
      expect(size).toBe(0);
    });

    it('composite index is larger than single-column index', () => {
      const single = estimateIndexSize('plays', ['team_id'], 10_000);
      const composite = estimateIndexSize('plays', ['team_id', 'created_at'], 10_000);
      expect(composite).toBeGreaterThan(single);
    });
  });

  // ---- getIndexRecommendations ----
  describe('getIndexRecommendations', () => {
    it('returns recommendations sorted by frequency', () => {
      const log: QueryLogEntry[] = [
        { query: 'SELECT * FROM plays WHERE team_id = $1', frequency: 50 },
        { query: 'SELECT * FROM formations WHERE team_id = $1', frequency: 200 },
      ];
      const recs = getIndexRecommendations(log);
      expect(recs.length).toBeGreaterThan(0);
      // highest frequency first
      expect(recs[0].index.table).toBe('formations');
    });

    it('deduplicates identical index recommendations', () => {
      const log: QueryLogEntry[] = [
        { query: 'SELECT * FROM plays WHERE team_id = $1', frequency: 10 },
        { query: 'SELECT * FROM plays WHERE team_id = $2', frequency: 20 },
      ];
      const recs = getIndexRecommendations(log);
      const playsRecs = recs.filter((r) => r.index.table === 'plays');
      // Should deduplicate since columns are the same
      expect(playsRecs.length).toBe(1);
    });

    it('upgrades impact to high for frequency >= 100', () => {
      const log: QueryLogEntry[] = [
        { query: 'SELECT * FROM plays WHERE team_id = $1', frequency: 150 },
      ];
      const recs = getIndexRecommendations(log);
      expect(recs[0].estimatedImpact).toBe('high');
    });
  });
});
