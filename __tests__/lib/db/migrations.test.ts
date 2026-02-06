import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('migrations', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('migrations array', () => {
    it('should contain a list of migrations sorted by version', async () => {
      const { migrations, resetMigrationsDB } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      expect(migrations.length).toBeGreaterThanOrEqual(1);

      for (let i = 1; i < migrations.length; i++) {
        expect(migrations[i].version).toBeGreaterThan(
          migrations[i - 1].version,
        );
      }
    });

    it('should have a description and up function for each migration', async () => {
      const { migrations, resetMigrationsDB } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      for (const m of migrations) {
        expect(typeof m.version).toBe('number');
        expect(typeof m.description).toBe('string');
        expect(m.description.length).toBeGreaterThan(0);
        expect(typeof m.up).toBe('function');
      }
    });
  });

  describe('runMigrations', () => {
    it('should apply all pending migrations', async () => {
      const { openDB } = await import('idb');
      const { runMigrations, resetMigrationsDB, migrations } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      const mockDb = await openDB('test', 1);
      const applied = await runMigrations(mockDb);

      expect(applied).toHaveLength(migrations.length);
      expect(applied[0].version).toBe(1);
    });

    it('should skip already-applied migrations', async () => {
      const { openDB } = await import('idb');
      const { runMigrations, resetMigrationsDB, migrations } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      const mockDb = await openDB('test', 1);

      // Run once
      const firstRun = await runMigrations(mockDb);
      expect(firstRun).toHaveLength(migrations.length);

      // Run again — should have nothing to apply
      const secondRun = await runMigrations(mockDb);
      expect(secondRun).toHaveLength(0);
    });

    it('should apply migrations in version order', async () => {
      const { openDB } = await import('idb');
      const { runMigrations, resetMigrationsDB } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      const mockDb = await openDB('test', 1);
      const applied = await runMigrations(mockDb);

      for (let i = 1; i < applied.length; i++) {
        expect(applied[i].version).toBeGreaterThan(applied[i - 1].version);
      }
    });

    it('should record each applied migration with metadata', async () => {
      const { openDB } = await import('idb');
      const { runMigrations, resetMigrationsDB } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      const mockDb = await openDB('test', 1);
      const applied = await runMigrations(mockDb);

      for (const m of applied) {
        expect(m.id).toBeDefined();
        expect(m.version).toBeDefined();
        expect(m.description).toBeDefined();
        expect(m.appliedAt).toBeDefined();
        expect(new Date(m.appliedAt).getTime()).not.toBeNaN();
      }
    });

    it('should call the up function for each pending migration', async () => {
      const { openDB } = await import('idb');
      const { runMigrations, migrations, resetMigrationsDB } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      // Spy on the up functions
      const spies = migrations.map((m) => vi.spyOn(m, 'up'));

      const mockDb = await openDB('test', 1);
      await runMigrations(mockDb);

      for (const spy of spies) {
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(mockDb);
      }
    });
  });

  describe('getMigrationStatus', () => {
    it('should return currentVersion 0 when no migrations applied', async () => {
      const { getMigrationStatus, resetMigrationsDB } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      const status = await getMigrationStatus();

      expect(status.currentVersion).toBe(0);
    });

    it('should return all migrations as pending when none applied', async () => {
      const { getMigrationStatus, migrations, resetMigrationsDB } =
        await import('@/lib/db/migrations');
      await resetMigrationsDB();

      const status = await getMigrationStatus();

      expect(status.pendingMigrations).toHaveLength(migrations.length);
    });

    it('should reflect current version after running migrations', async () => {
      const { openDB } = await import('idb');
      const { runMigrations, getMigrationStatus, migrations, resetMigrationsDB } =
        await import('@/lib/db/migrations');
      await resetMigrationsDB();

      const mockDb = await openDB('test', 1);
      await runMigrations(mockDb);

      const status = await getMigrationStatus();

      // Current version should be the highest version in the migrations array
      const maxVersion = Math.max(...migrations.map((m) => m.version));
      expect(status.currentVersion).toBe(maxVersion);
      expect(status.pendingMigrations).toHaveLength(0);
    });

    it('should list pending migrations in version order', async () => {
      const { getMigrationStatus, resetMigrationsDB } = await import(
        '@/lib/db/migrations'
      );
      await resetMigrationsDB();

      const status = await getMigrationStatus();

      for (let i = 1; i < status.pendingMigrations.length; i++) {
        expect(status.pendingMigrations[i].version).toBeGreaterThan(
          status.pendingMigrations[i - 1].version,
        );
      }
    });
  });
});
