import { describe, it, expect } from 'vitest';
import {
  ConnectionPool,
  DEFAULT_POOL_CONFIG,
} from '@/lib/db/connection-pool';
import type { PoolConfig, PoolStats, PoolEvent, PoolConnection } from '@/lib/db/connection-pool';

describe('connection-pool', () => {
  // ---- DEFAULT_POOL_CONFIG ----
  describe('DEFAULT_POOL_CONFIG', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_POOL_CONFIG.maxConnections).toBe(10);
      expect(DEFAULT_POOL_CONFIG.minConnections).toBe(2);
      expect(DEFAULT_POOL_CONFIG.idleTimeoutMs).toBe(30_000);
      expect(DEFAULT_POOL_CONFIG.acquireTimeoutMs).toBe(5_000);
    });
  });

  // ---- ConnectionPool constructor ----
  describe('constructor', () => {
    it('seeds pool with minConnections', () => {
      const pool = new ConnectionPool({ minConnections: 3, maxConnections: 5 });
      const stats = pool.getPoolStats();
      expect(stats.total).toBe(3);
      expect(stats.idle).toBe(3);
      expect(stats.active).toBe(0);
    });

    it('uses default config when no overrides provided', () => {
      const pool = new ConnectionPool();
      const stats = pool.getPoolStats();
      expect(stats.total).toBe(DEFAULT_POOL_CONFIG.minConnections);
    });
  });

  // ---- acquire ----
  describe('acquire', () => {
    it('acquires an idle connection', async () => {
      const pool = new ConnectionPool({ minConnections: 2, maxConnections: 5 });
      const conn = await pool.acquire();
      expect(conn).toBeDefined();
      expect(conn.active).toBe(true);
      expect(conn.id).toMatch(/^conn_/);
    });

    it('creates a new connection when all are active and under max', async () => {
      const pool = new ConnectionPool({ minConnections: 1, maxConnections: 3 });
      const c1 = await pool.acquire();
      const stats = pool.getPoolStats();
      expect(stats.active).toBe(1);
      // acquire another — should create new since the first is active
      const c2 = await pool.acquire();
      expect(c2.id).not.toBe(c1.id);
      expect(pool.getPoolStats().total).toBe(2);
    });

    it('throws on acquire after drain', async () => {
      const pool = new ConnectionPool({ minConnections: 1, maxConnections: 2 });
      pool.drain();
      await expect(pool.acquire()).rejects.toThrow('drained');
    });

    it('times out when pool is full and no connections are released', async () => {
      const pool = new ConnectionPool({
        minConnections: 1,
        maxConnections: 1,
        acquireTimeoutMs: 50,
      });
      await pool.acquire(); // takes the only slot
      await expect(pool.acquire()).rejects.toThrow('timeout');
    });
  });

  // ---- release ----
  describe('release', () => {
    it('makes a connection available again', async () => {
      const pool = new ConnectionPool({ minConnections: 1, maxConnections: 1 });
      const conn = await pool.acquire();
      pool.release(conn);
      const stats = pool.getPoolStats();
      expect(stats.idle).toBe(1);
      expect(stats.active).toBe(0);
    });

    it('hands connection to a waiting acquirer', async () => {
      const pool = new ConnectionPool({
        minConnections: 1,
        maxConnections: 1,
        acquireTimeoutMs: 2000,
      });
      const conn = await pool.acquire();

      // Start a second acquire (will wait)
      const acquirePromise = pool.acquire();

      // Release the first connection
      pool.release(conn);

      const conn2 = await acquirePromise;
      expect(conn2.id).toBe(conn.id); // same connection reused
    });
  });

  // ---- drain ----
  describe('drain', () => {
    it('removes all connections and rejects waiters', async () => {
      const pool = new ConnectionPool({
        minConnections: 1,
        maxConnections: 1,
        acquireTimeoutMs: 5000,
      });
      await pool.acquire();
      const waitPromise = pool.acquire().catch((e: Error) => e.message);

      pool.drain();

      const msg = await waitPromise;
      expect(msg).toContain('drained');
      expect(pool.getPoolStats().total).toBe(0);
    });
  });

  // ---- getPoolStats ----
  describe('getPoolStats', () => {
    it('tracks created and destroyed counts', async () => {
      const pool = new ConnectionPool({ minConnections: 2, maxConnections: 4 });
      await pool.acquire();
      await pool.acquire();
      await pool.acquire(); // creates a 3rd
      const stats = pool.getPoolStats();
      expect(stats.created).toBe(3); // 2 seeded + 1 new
      expect(stats.total).toBe(3);
      pool.drain();
      const after = pool.getPoolStats();
      expect(after.destroyed).toBe(3);
      expect(after.total).toBe(0);
    });
  });

  // ---- healthCheck ----
  describe('healthCheck', () => {
    it('reports healthy when pool has idle connections', async () => {
      const pool = new ConnectionPool({ minConnections: 2, maxConnections: 5 });
      const result = await pool.healthCheck();
      expect(result.healthy).toBe(true);
      expect(result.message).toContain('OK');
    });

    it('reports unhealthy after drain', async () => {
      const pool = new ConnectionPool();
      pool.drain();
      const result = await pool.healthCheck();
      expect(result.healthy).toBe(false);
      expect(result.message).toContain('drained');
    });
  });

  // ---- events ----
  describe('events', () => {
    it('records acquire and release events', async () => {
      const pool = new ConnectionPool({ minConnections: 1, maxConnections: 2 });
      const conn = await pool.acquire();
      pool.release(conn);
      const events = pool.getEvents();
      const types = events.map((e) => e.type);
      expect(types).toContain('acquire');
      expect(types).toContain('release');
    });
  });
});
