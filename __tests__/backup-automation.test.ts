import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BACKUP_SCHEDULE,
  shouldRunBackup,
  getBackupHistory,
  verifyBackupIntegrity,
  calculateRetentionPolicy,
} from '@/lib/db/backup-automation';
import type { BackupSchedule, BackupManifest } from '@/lib/db/backup-automation';

describe('backup-automation', () => {
  // ---- DEFAULT_BACKUP_SCHEDULE ----
  describe('DEFAULT_BACKUP_SCHEDULE', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_BACKUP_SCHEDULE.frequency).toBe('daily');
      expect(DEFAULT_BACKUP_SCHEDULE.retentionDays).toBe(30);
      expect(DEFAULT_BACKUP_SCHEDULE.time).toBe('02:00');
      expect(DEFAULT_BACKUP_SCHEDULE.enabled).toBe(true);
    });
  });

  // ---- shouldRunBackup ----
  describe('shouldRunBackup', () => {
    it('returns true when last backup is more than 24h ago (daily)', () => {
      const schedule: BackupSchedule = { ...DEFAULT_BACKUP_SCHEDULE, frequency: 'daily' };
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      expect(shouldRunBackup(schedule, twoDaysAgo)).toBe(true);
    });

    it('returns false when last backup is recent (daily)', () => {
      const schedule: BackupSchedule = { ...DEFAULT_BACKUP_SCHEDULE, frequency: 'daily' };
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      expect(shouldRunBackup(schedule, oneHourAgo)).toBe(false);
    });

    it('returns false when schedule is disabled', () => {
      const schedule: BackupSchedule = { ...DEFAULT_BACKUP_SCHEDULE, enabled: false };
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldRunBackup(schedule, weekAgo)).toBe(false);
    });

    it('returns true for weekly when more than 7 days have passed', () => {
      const schedule: BackupSchedule = { ...DEFAULT_BACKUP_SCHEDULE, frequency: 'weekly' };
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldRunBackup(schedule, tenDaysAgo)).toBe(true);
    });

    it('returns true for monthly when more than 30 days have passed', () => {
      const schedule: BackupSchedule = { ...DEFAULT_BACKUP_SCHEDULE, frequency: 'monthly' };
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldRunBackup(schedule, fortyDaysAgo)).toBe(true);
    });

    it('returns true when lastBackup is an invalid date', () => {
      const schedule: BackupSchedule = DEFAULT_BACKUP_SCHEDULE;
      expect(shouldRunBackup(schedule, 'not-a-date')).toBe(true);
    });
  });

  // ---- getBackupHistory ----
  describe('getBackupHistory', () => {
    it('returns the requested number of backups', () => {
      const history = getBackupHistory(5);
      expect(history).toHaveLength(5);
    });

    it('defaults to 10 backups', () => {
      const history = getBackupHistory();
      expect(history).toHaveLength(10);
    });

    it('each manifest has required fields', () => {
      const history = getBackupHistory(3);
      for (const manifest of history) {
        expect(manifest.id).toBeTruthy();
        expect(manifest.createdAt).toBeTruthy();
        expect(manifest.size).toBeGreaterThan(0);
        expect(manifest.tables.length).toBeGreaterThan(0);
        expect(['completed', 'failed', 'in-progress']).toContain(manifest.status);
      }
    });
  });

  // ---- verifyBackupIntegrity ----
  describe('verifyBackupIntegrity', () => {
    it('validates a complete backup as valid', () => {
      const manifest: BackupManifest = {
        id: 'backup_1',
        createdAt: new Date().toISOString(),
        size: 1024 * 1024,
        tables: ['plays', 'formations', 'game_plans', 'teams', 'users'],
        status: 'completed',
      };
      const result = verifyBackupIntegrity(manifest);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('flags a non-completed backup', () => {
      const manifest: BackupManifest = {
        id: 'backup_2',
        createdAt: new Date().toISOString(),
        size: 1024,
        tables: ['plays', 'formations', 'game_plans', 'teams'],
        status: 'in-progress',
      };
      const result = verifyBackupIntegrity(manifest);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('in-progress'))).toBe(true);
    });

    it('flags zero backup size', () => {
      const manifest: BackupManifest = {
        id: 'backup_3',
        createdAt: new Date().toISOString(),
        size: 0,
        tables: ['plays', 'formations', 'game_plans', 'teams'],
        status: 'completed',
      };
      const result = verifyBackupIntegrity(manifest);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('zero'))).toBe(true);
    });

    it('flags missing required tables', () => {
      const manifest: BackupManifest = {
        id: 'backup_4',
        createdAt: new Date().toISOString(),
        size: 1024,
        tables: ['plays'], // missing formations, game_plans, teams
        status: 'completed',
      };
      const result = verifyBackupIntegrity(manifest);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('formations'))).toBe(true);
    });

    it('flags empty tables array', () => {
      const manifest: BackupManifest = {
        id: 'backup_5',
        createdAt: new Date().toISOString(),
        size: 1024,
        tables: [],
        status: 'completed',
      };
      const result = verifyBackupIntegrity(manifest);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('no tables'))).toBe(true);
    });
  });

  // ---- calculateRetentionPolicy ----
  describe('calculateRetentionPolicy', () => {
    it('keeps recent backups and deletes old ones', () => {
      const now = new Date();
      const recent: BackupManifest = {
        id: 'recent',
        createdAt: now.toISOString(),
        size: 1024,
        tables: ['plays'],
        status: 'completed',
      };
      const old: BackupManifest = {
        id: 'old',
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        size: 1024,
        tables: ['plays'],
        status: 'completed',
      };

      const result = calculateRetentionPolicy([recent, old], 30);
      expect(result.keep).toHaveLength(1);
      expect(result.keep[0].id).toBe('recent');
      expect(result.delete).toHaveLength(1);
      expect(result.delete[0].id).toBe('old');
    });

    it('keeps all backups when none are past retention', () => {
      const now = new Date();
      const backups: BackupManifest[] = [
        { id: 'b1', createdAt: now.toISOString(), size: 1024, tables: ['plays'], status: 'completed' },
        { id: 'b2', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), size: 1024, tables: ['plays'], status: 'completed' },
      ];
      const result = calculateRetentionPolicy(backups, 30);
      expect(result.keep).toHaveLength(2);
      expect(result.delete).toHaveLength(0);
    });

    it('deletes all backups when retention is 0 days', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const backups: BackupManifest[] = [
        { id: 'b1', createdAt: yesterday, size: 1024, tables: ['plays'], status: 'completed' },
      ];
      const result = calculateRetentionPolicy(backups, 0);
      expect(result.delete).toHaveLength(1);
      expect(result.keep).toHaveLength(0);
    });
  });
});
