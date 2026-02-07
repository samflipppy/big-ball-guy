/**
 * Query Optimization (#139)
 *
 * Utilities for optimizing Supabase queries: batching, field selection,
 * and N+1 detection.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryConfig {
  table: string;
  select: string;
  filters: Record<string, unknown>;
  orderBy?: string;
  limit?: number;
}

export interface QueryLogEntry {
  table: string;
  timestamp: number;
  duration: number;
  rowCount: number;
}

export interface NPlusOneReport {
  detected: boolean;
  patterns: NPlusOnePattern[];
}

export interface NPlusOnePattern {
  table: string;
  count: number;
  /** Average time between repeated queries in ms */
  avgInterval: number;
}

// ---------------------------------------------------------------------------
// Field selection
// ---------------------------------------------------------------------------

const FIELD_MAP: Record<string, Record<string, string>> = {
  play: {
    list: 'id,name,formationId,category,tags,personnel,updatedAt',
    detail: 'id,name,formationId,conceptId,blockingSchemeId,assignments,defensiveOverlay,tags,notes,category,personnel,hash,teamId,folderId,createdAt,updatedAt',
    minimal: 'id,name',
  },
  formation: {
    list: 'id,name,side,personnel,tags,updatedAt',
    detail: 'id,name,side,players,personnel,tags,isCustom,teamId,createdAt,updatedAt',
    minimal: 'id,name,side',
  },
  concept: {
    list: 'id,name,description,tags,updatedAt',
    detail: 'id,name,description,routes,tags,teamId,createdAt,updatedAt',
    minimal: 'id,name',
  },
  gameplan: {
    list: 'id,name,opponent,week,season,updatedAt',
    detail: 'id,name,opponent,week,season,sections,notes,teamId,createdAt,updatedAt',
    minimal: 'id,name,opponent',
  },
};

/**
 * Returns an optimised `select` clause for a given entity type and detail
 * level. Falls back to `*` if the entity or level isn't mapped.
 */
export function selectFields(
  entityType: string,
  detail: 'list' | 'detail' | 'minimal',
): string {
  return FIELD_MAP[entityType]?.[detail] ?? '*';
}

// ---------------------------------------------------------------------------
// Optimize a single playbook query
// ---------------------------------------------------------------------------

/**
 * Takes an arbitrary filter bag and returns a tidy `QueryConfig` targeting
 * the `plays` table with sensible defaults.
 */
export function optimizePlaybookQuery(
  filters: Record<string, unknown>,
): QueryConfig {
  const config: QueryConfig = {
    table: 'plays',
    select: selectFields('play', 'list'),
    filters: {},
    orderBy: 'updatedAt',
    limit: 50,
  };

  // Only pass through known / safe filter keys
  const allowedKeys = [
    'teamId',
    'category',
    'personnel',
    'hash',
    'formationId',
    'folderId',
    'tags',
  ];

  for (const key of allowedKeys) {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      config.filters[key] = filters[key];
    }
  }

  // If caller provided a custom limit, respect it (clamped)
  if (typeof filters.limit === 'number') {
    config.limit = Math.min(Math.max(1, filters.limit as number), 200);
  }

  // If caller asked for a specific select detail level
  if (
    typeof filters.detail === 'string' &&
    ['list', 'detail', 'minimal'].includes(filters.detail as string)
  ) {
    config.select = selectFields('play', filters.detail as 'list' | 'detail' | 'minimal');
  }

  return config;
}

// ---------------------------------------------------------------------------
// Batch queries
// ---------------------------------------------------------------------------

export interface BatchedQuery {
  configs: QueryConfig[];
  /** A human-readable summary */
  summary: string;
}

/**
 * Combines multiple independent queries into a single batch descriptor.
 * Deduplicates queries that target the same table with the same filters.
 */
export function batchQueries(queries: QueryConfig[]): BatchedQuery {
  const seen = new Map<string, QueryConfig>();

  for (const q of queries) {
    const fingerprint = JSON.stringify({
      table: q.table,
      select: q.select,
      filters: q.filters,
      orderBy: q.orderBy,
      limit: q.limit,
    });

    if (!seen.has(fingerprint)) {
      seen.set(fingerprint, q);
    }
  }

  const deduplicated = Array.from(seen.values());

  return {
    configs: deduplicated,
    summary: `${deduplicated.length} unique queries (${queries.length - deduplicated.length} duplicates removed)`,
  };
}

// ---------------------------------------------------------------------------
// N+1 detection
// ---------------------------------------------------------------------------

/** Threshold: if the same table is queried this many times in a window, flag it */
const N_PLUS_ONE_THRESHOLD = 5;
/** Time window in ms (queries spread out more than this are probably fine) */
const N_PLUS_ONE_WINDOW_MS = 2000;

/**
 * Analyses a query log and detects N+1 patterns — i.e., the same table
 * being queried many times in rapid succession.
 */
export function detectNPlusOne(queryLog: QueryLogEntry[]): NPlusOneReport {
  // Group entries by table
  const byTable = new Map<string, QueryLogEntry[]>();
  for (const entry of queryLog) {
    const list = byTable.get(entry.table) || [];
    list.push(entry);
    byTable.set(entry.table, list);
  }

  const patterns: NPlusOnePattern[] = [];

  for (const [table, entries] of byTable) {
    if (entries.length < N_PLUS_ONE_THRESHOLD) continue;

    // Sort by timestamp
    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

    // Find clusters within the time window
    let clusterStart = 0;
    for (let i = 1; i <= sorted.length; i++) {
      const outOfWindow =
        i === sorted.length ||
        sorted[i].timestamp - sorted[clusterStart].timestamp > N_PLUS_ONE_WINDOW_MS;

      if (outOfWindow) {
        const clusterSize = i - clusterStart;
        if (clusterSize >= N_PLUS_ONE_THRESHOLD) {
          const cluster = sorted.slice(clusterStart, i);
          const totalInterval =
            cluster[cluster.length - 1].timestamp - cluster[0].timestamp;
          const avgInterval =
            cluster.length > 1 ? totalInterval / (cluster.length - 1) : 0;

          patterns.push({
            table,
            count: clusterSize,
            avgInterval: Math.round(avgInterval),
          });
        }
        clusterStart = i;
      }
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}
