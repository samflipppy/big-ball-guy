// ============================================================
// #223 — Database Connection Pooling
// A client-side connection pool abstraction for Supabase.
// Manages connection lifecycle, health checks, and monitoring.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
}

export interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  created: number;
  destroyed: number;
}

export type PoolEventType = 'acquire' | 'release' | 'timeout' | 'error';

export interface PoolEvent {
  type: PoolEventType;
  connectionId: string;
  timestamp: number;
  details?: string;
}

export interface PoolConnection {
  id: string;
  createdAt: number;
  lastUsedAt: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  idleTimeoutMs: 30_000,
  acquireTimeoutMs: 5_000,
};

// ---------------------------------------------------------------------------
// ConnectionPool
// ---------------------------------------------------------------------------

export class ConnectionPool {
  private config: PoolConfig;
  private connections: PoolConnection[] = [];
  private waitQueue: Array<{
    resolve: (conn: PoolConnection) => void;
    reject: (err: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }> = [];
  private events: PoolEvent[] = [];
  private idCounter = 0;
  private totalCreated = 0;
  private totalDestroyed = 0;
  private drained = false;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    // Seed pool with minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      this.connections.push(this.createConnection());
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Acquire an idle connection from the pool. If none are available and the
   * pool is below maxConnections a new one is created. Otherwise the caller
   * is queued until a connection is released (subject to acquireTimeoutMs).
   */
  async acquire(): Promise<PoolConnection> {
    if (this.drained) {
      throw new Error('Connection pool has been drained');
    }

    // Try to find an idle connection
    const idle = this.connections.find((c) => !c.active);
    if (idle) {
      idle.active = true;
      idle.lastUsedAt = Date.now();
      this.emitEvent('acquire', idle.id);
      return idle;
    }

    // Create a new one if we haven't reached max
    if (this.connections.length < this.config.maxConnections) {
      const conn = this.createConnection();
      conn.active = true;
      conn.lastUsedAt = Date.now();
      this.connections.push(conn);
      this.emitEvent('acquire', conn.id);
      return conn;
    }

    // Otherwise wait
    return new Promise<PoolConnection>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const idx = this.waitQueue.findIndex((w) => w.resolve === resolve);
        if (idx !== -1) this.waitQueue.splice(idx, 1);
        this.emitEvent('timeout', 'none', 'Acquire timeout exceeded');
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeoutMs);

      this.waitQueue.push({ resolve, reject, timeoutId });
    });
  }

  /**
   * Release a connection back to the pool, making it available for reuse.
   */
  release(connection: PoolConnection): void {
    const conn = this.connections.find((c) => c.id === connection.id);
    if (!conn) return;

    conn.active = false;
    conn.lastUsedAt = Date.now();
    this.emitEvent('release', conn.id);

    // If someone is waiting, hand them the connection immediately
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      clearTimeout(waiter.timeoutId);
      conn.active = true;
      conn.lastUsedAt = Date.now();
      this.emitEvent('acquire', conn.id);
      waiter.resolve(conn);
    }
  }

  /**
   * Drain the pool — release all connections and reject waiters.
   */
  drain(): void {
    this.drained = true;

    // Reject all waiters
    for (const waiter of this.waitQueue) {
      clearTimeout(waiter.timeoutId);
      waiter.reject(new Error('Connection pool drained'));
    }
    this.waitQueue = [];

    // Destroy all connections
    for (const conn of this.connections) {
      this.totalDestroyed++;
    }
    this.connections = [];
  }

  /**
   * Remove connections that have been idle longer than idleTimeoutMs,
   * while preserving at least minConnections.
   */
  evictIdle(): number {
    const now = Date.now();
    let evicted = 0;

    this.connections = this.connections.filter((conn) => {
      if (conn.active) return true;

      const idle = now - conn.lastUsedAt;
      if (
        idle > this.config.idleTimeoutMs &&
        this.connections.length - evicted > this.config.minConnections
      ) {
        evicted++;
        this.totalDestroyed++;
        return false;
      }
      return true;
    });

    return evicted;
  }

  // -----------------------------------------------------------------------
  // Stats & Health
  // -----------------------------------------------------------------------

  getPoolStats(): PoolStats {
    const active = this.connections.filter((c) => c.active).length;
    return {
      total: this.connections.length,
      active,
      idle: this.connections.length - active,
      waiting: this.waitQueue.length,
      created: this.totalCreated,
      destroyed: this.totalDestroyed,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (this.drained) {
      return { healthy: false, message: 'Pool has been drained' };
    }

    const stats = this.getPoolStats();
    if (stats.total === 0) {
      return { healthy: false, message: 'No connections in pool' };
    }

    if (stats.idle === 0 && stats.waiting > 0) {
      return { healthy: false, message: 'All connections busy with waiters queued' };
    }

    return { healthy: true, message: `Pool OK: ${stats.idle} idle / ${stats.total} total` };
  }

  getEvents(): PoolEvent[] {
    return [...this.events];
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private createConnection(): PoolConnection {
    this.idCounter++;
    this.totalCreated++;
    return {
      id: `conn_${this.idCounter}`,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      active: false,
    };
  }

  private emitEvent(type: PoolEventType, connectionId: string, details?: string): void {
    this.events.push({
      type,
      connectionId,
      timestamp: Date.now(),
      details,
    });
  }
}
