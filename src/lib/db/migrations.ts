import { openDB, type IDBPDatabase } from 'idb';

// ---- Types ----

export interface Migration {
  version: number;
  up: (db: IDBPDatabase) => Promise<void>;
  description: string;
}

export interface AppliedMigration {
  id: string;
  version: number;
  description: string;
  appliedAt: string;
}

export interface MigrationStatus {
  currentVersion: number;
  pendingMigrations: Migration[];
}

// ---- IndexedDB for migration metadata ----

const MIGRATIONS_DB_NAME = 'playbook-migrations-db';
const MIGRATIONS_DB_VERSION = 1;
const MIGRATIONS_STORE = 'migrations';

let migrationsDbPromise: Promise<IDBPDatabase> | null = null;

export function getMigrationsDB(): Promise<IDBPDatabase> {
  if (!migrationsDbPromise) {
    migrationsDbPromise = openDB(MIGRATIONS_DB_NAME, MIGRATIONS_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MIGRATIONS_STORE)) {
          db.createObjectStore(MIGRATIONS_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return migrationsDbPromise;
}

/** For testing: reset the cached DB promise and clear all stored entries */
export async function resetMigrationsDB(): Promise<void> {
  if (migrationsDbPromise) {
    try {
      const db = await migrationsDbPromise;
      await db.clear(MIGRATIONS_STORE);
    } catch {
      // DB may not exist yet
    }
  }
  migrationsDbPromise = null;
}

// ---- Migration Registry ----

/**
 * All known migrations, sorted by version number.
 * Each migration has a version, a description, and an `up` function
 * that receives the main IDBPDatabase to perform schema/data changes.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema - create base stores',
    up: async () => {
      // Base stores are created by indexeddb.ts upgrade handler
    },
  },
  {
    version: 2,
    description: 'Add trash store for soft deletes',
    up: async () => {
      // Trash store is managed by soft-delete.ts
    },
  },
  {
    version: 3,
    description: 'Add audit log store',
    up: async () => {
      // Audit store is managed by audit-trail.ts
    },
  },
];

// ---- Core API ----

/**
 * Run all pending migrations in version order.
 * Migrations that have already been applied (tracked in the migrations meta store)
 * are skipped. Returns the list of newly applied migrations.
 */
export async function runMigrations(
  db: IDBPDatabase,
): Promise<AppliedMigration[]> {
  const migrationDb = await getMigrationsDB();
  const applied: AppliedMigration[] = await migrationDb.getAll(MIGRATIONS_STORE);
  const appliedVersions = new Set(applied.map((m) => m.version));

  const pending = migrations
    .filter((m) => !appliedVersions.has(m.version))
    .sort((a, b) => a.version - b.version);

  const newlyApplied: AppliedMigration[] = [];

  for (const migration of pending) {
    await migration.up(db);

    const record: AppliedMigration = {
      id: `migration-v${migration.version}`,
      version: migration.version,
      description: migration.description,
      appliedAt: new Date().toISOString(),
    };

    await migrationDb.put(MIGRATIONS_STORE, record);
    newlyApplied.push(record);
  }

  return newlyApplied;
}

/**
 * Get the current migration status: which version we are at and
 * which migrations are still pending.
 */
export async function getMigrationStatus(): Promise<MigrationStatus> {
  const migrationDb = await getMigrationsDB();
  const applied: AppliedMigration[] = await migrationDb.getAll(MIGRATIONS_STORE);
  const appliedVersions = new Set(applied.map((m) => m.version));

  const currentVersion =
    applied.length > 0 ? Math.max(...applied.map((m) => m.version)) : 0;

  const pendingMigrations = migrations
    .filter((m) => !appliedVersions.has(m.version))
    .sort((a, b) => a.version - b.version);

  return {
    currentVersion,
    pendingMigrations,
  };
}
