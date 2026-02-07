// ============================================================
// #227 — Database Index Optimization
// Utilities for recommending, generating, and analysing
// database indexes for the playbook schema.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IndexDefinition {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin';
  unique?: boolean;
  partial?: string; // optional WHERE clause for partial index
}

export interface IndexRecommendation {
  index: IndexDefinition;
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface QueryLogEntry {
  query: string;
  frequency: number;
}

// ---------------------------------------------------------------------------
// Recommended Indexes
// ---------------------------------------------------------------------------

export const RECOMMENDED_INDEXES: IndexDefinition[] = [
  // Plays
  {
    table: 'plays',
    columns: ['team_id'],
    type: 'btree',
  },
  {
    table: 'plays',
    columns: ['created_at'],
    type: 'btree',
  },
  {
    table: 'plays',
    columns: ['team_id', 'created_at'],
    type: 'btree',
  },
  // Formations
  {
    table: 'formations',
    columns: ['team_id'],
    type: 'btree',
  },
  // Game Plans
  {
    table: 'game_plans',
    columns: ['team_id'],
    type: 'btree',
  },
  {
    table: 'game_plans',
    columns: ['team_id', 'season_id'],
    type: 'btree',
  },
  // Tags — GIN for array/full-text search
  {
    table: 'plays',
    columns: ['tags'],
    type: 'gin',
  },
  // Search — GIN for full-text search on play names / notes
  {
    table: 'plays',
    columns: ['name', 'notes'],
    type: 'gin',
  },
];

// ---------------------------------------------------------------------------
// generateCreateIndexSQL
// ---------------------------------------------------------------------------

/**
 * Generate a CREATE INDEX SQL statement for the given index definition.
 */
export function generateCreateIndexSQL(index: IndexDefinition): string {
  const uniqueClause = index.unique ? 'UNIQUE ' : '';
  const indexName = `idx_${index.table}_${index.columns.join('_')}`;

  let usingClause: string;
  if (index.type === 'gin') {
    usingClause = `USING gin (${index.columns.join(', ')})`;
  } else if (index.type === 'hash') {
    usingClause = `USING hash (${index.columns.join(', ')})`;
  } else {
    usingClause = `(${index.columns.join(', ')})`;
  }

  let sql = `CREATE ${uniqueClause}INDEX ${indexName} ON ${index.table} ${usingClause}`;

  if (index.partial) {
    sql += ` WHERE ${index.partial}`;
  }

  return sql + ';';
}

// ---------------------------------------------------------------------------
// analyzeQueryForIndex
// ---------------------------------------------------------------------------

/**
 * Analyse a SQL query string and suggest potential indexes based on
 * WHERE clauses and ORDER BY clauses.
 */
export function analyzeQueryForIndex(query: string): IndexRecommendation[] {
  const recommendations: IndexRecommendation[] = [];
  const normalized = query.replace(/\s+/g, ' ').trim();

  // Extract table from FROM clause
  const fromMatch = normalized.match(/FROM\s+(\w+)/i);
  if (!fromMatch) return recommendations;
  const table = fromMatch[1];

  // Extract columns from WHERE clause
  const whereMatch = normalized.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i);
  const whereColumns: string[] = [];
  if (whereMatch) {
    const wherePart = whereMatch[1];
    const colMatches = wherePart.matchAll(/(\w+)\s*(?:=|>|<|>=|<=|!=|LIKE|IN|IS)/gi);
    for (const m of colMatches) {
      const col = m[1].toLowerCase();
      // Skip SQL keywords that aren't columns
      if (!['and', 'or', 'not', 'null', 'true', 'false'].includes(col)) {
        whereColumns.push(col);
      }
    }
  }

  // Extract columns from ORDER BY clause
  const orderMatch = normalized.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|$)/i);
  const orderColumns: string[] = [];
  if (orderMatch) {
    const orderPart = orderMatch[1];
    const cols = orderPart.split(',').map((c) => c.trim().split(/\s+/)[0].toLowerCase());
    orderColumns.push(...cols);
  }

  // Recommend index on WHERE columns
  if (whereColumns.length > 0) {
    recommendations.push({
      index: { table, columns: [...new Set(whereColumns)], type: 'btree' },
      reason: `Covers WHERE clause columns: ${whereColumns.join(', ')}`,
      estimatedImpact: whereColumns.length > 1 ? 'high' : 'medium',
    });
  }

  // Recommend index on ORDER BY columns if different from WHERE
  if (orderColumns.length > 0) {
    const combined = [...new Set([...whereColumns, ...orderColumns])];
    if (combined.length > whereColumns.length) {
      recommendations.push({
        index: { table, columns: combined, type: 'btree' },
        reason: `Covers WHERE + ORDER BY columns: ${combined.join(', ')}`,
        estimatedImpact: 'high',
      });
    }
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// estimateIndexSize
// ---------------------------------------------------------------------------

/**
 * Estimate the storage cost of an index in bytes.
 * Uses a simple model: ~8 bytes overhead per row + column data.
 */
export function estimateIndexSize(
  table: string,
  columns: string[],
  rowCount: number,
): number {
  // Average bytes per column entry (rough estimate)
  const avgBytesPerColumn: Record<string, number> = {
    id: 16, // UUID
    team_id: 16,
    season_id: 16,
    created_at: 8,
    updated_at: 8,
    name: 32,
    notes: 64,
    tags: 48,
  };

  const bytesPerRow = columns.reduce((sum, col) => {
    return sum + (avgBytesPerColumn[col] ?? 24); // default 24 bytes for unknown columns
  }, 8); // 8 bytes btree overhead per row

  // Index overhead: ~2x for btree internal nodes
  const rawSize = bytesPerRow * rowCount;
  const overhead = Math.ceil(rawSize * 0.3); // ~30% overhead for tree structure

  return rawSize + overhead;
}

// ---------------------------------------------------------------------------
// getIndexRecommendations
// ---------------------------------------------------------------------------

/**
 * Analyse a query log and return prioritised index recommendations.
 * Queries that run most frequently get higher priority.
 */
export function getIndexRecommendations(
  queryLog: QueryLogEntry[],
): IndexRecommendation[] {
  const allRecommendations: (IndexRecommendation & { frequency: number })[] = [];

  for (const entry of queryLog) {
    const recs = analyzeQueryForIndex(entry.query);
    for (const rec of recs) {
      allRecommendations.push({ ...rec, frequency: entry.frequency });
    }
  }

  // Deduplicate by table+columns key, keeping highest frequency
  const seen = new Map<string, IndexRecommendation & { frequency: number }>();
  for (const rec of allRecommendations) {
    const key = `${rec.index.table}:${rec.index.columns.join(',')}`;
    const existing = seen.get(key);
    if (!existing || rec.frequency > existing.frequency) {
      seen.set(key, rec);
    }
  }

  // Sort by frequency descending
  const sorted = [...seen.values()].sort((a, b) => b.frequency - a.frequency);

  // Upgrade impact based on frequency
  return sorted.map(({ frequency, ...rec }) => {
    if (frequency >= 100) rec.estimatedImpact = 'high';
    else if (frequency >= 10) rec.estimatedImpact = 'medium';
    return rec;
  });
}
