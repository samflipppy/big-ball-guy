// ============================================================
// #346 — Database Backup Automation
// Scheduling, verification, and retention logic for
// automated Supabase database backups.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackupSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  time: string; // HH:mm in 24h format
  enabled: boolean;
}

export interface BackupManifest {
  id: string;
  createdAt: string; // ISO 8601
  size: number; // bytes
  tables: string[];
  status: 'completed' | 'failed' | 'in-progress';
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_BACKUP_SCHEDULE: BackupSchedule = {
  frequency: 'daily',
  retentionDays: 30,
  time: '02:00',
  enabled: true,
};

// ---------------------------------------------------------------------------
// shouldRunBackup
// ---------------------------------------------------------------------------

/**
 * Determine whether a backup should be triggered based on the schedule
 * and the timestamp of the last successful backup.
 */
export function shouldRunBackup(schedule: BackupSchedule, lastBackup: string): boolean {
  if (!schedule.enabled) return false;

  const lastDate = new Date(lastBackup);
  const now = new Date();

  if (isNaN(lastDate.getTime())) return true; // invalid date -> run backup

  const diffMs = now.getTime() - lastDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  switch (schedule.frequency) {
    case 'daily':
      return diffHours >= 24;
    case 'weekly':
      return diffDays >= 7;
    case 'monthly':
      return diffDays >= 30;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// getBackupHistory
// ---------------------------------------------------------------------------

/**
 * Return recent backup manifests. In production this would query a backup
 * metadata table; here it returns mock data.
 */
export function getBackupHistory(limit: number = 10): BackupManifest[] {
  const tables = ['plays', 'formations', 'game_plans', 'teams', 'users', 'tags'];
  const manifests: BackupManifest[] = [];

  for (let i = 0; i < Math.min(limit, 30); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    manifests.push({
      id: `backup_${i + 1}`,
      createdAt: date.toISOString(),
      size: 1024 * 1024 * (50 + Math.floor(Math.random() * 50)), // 50-100 MB
      tables,
      status: i === 0 && Math.random() < 0.1 ? 'in-progress' : 'completed',
    });
  }

  return manifests;
}

// ---------------------------------------------------------------------------
// verifyBackupIntegrity
// ---------------------------------------------------------------------------

/**
 * Validate that a backup manifest is complete and consistent.
 */
export function verifyBackupIntegrity(
  manifest: BackupManifest,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (manifest.status !== 'completed') {
    issues.push(`Backup status is '${manifest.status}', expected 'completed'`);
  }

  if (manifest.size <= 0) {
    issues.push('Backup size is zero or negative');
  }

  if (manifest.tables.length === 0) {
    issues.push('Backup contains no tables');
  }

  const requiredTables = ['plays', 'formations', 'game_plans', 'teams'];
  for (const table of requiredTables) {
    if (!manifest.tables.includes(table)) {
      issues.push(`Missing required table: ${table}`);
    }
  }

  const createdDate = new Date(manifest.createdAt);
  if (isNaN(createdDate.getTime())) {
    issues.push('Invalid createdAt timestamp');
  }

  if (!manifest.id || manifest.id.trim() === '') {
    issues.push('Backup ID is missing');
  }

  return { valid: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// calculateRetentionPolicy
// ---------------------------------------------------------------------------

/**
 * Given a list of backups and a retention period, return the IDs of
 * backups that should be deleted (older than retentionDays).
 */
export function calculateRetentionPolicy(
  backups: BackupManifest[],
  retentionDays: number,
): { keep: BackupManifest[]; delete: BackupManifest[] } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffMs = cutoff.getTime();

  const keep: BackupManifest[] = [];
  const toDelete: BackupManifest[] = [];

  for (const backup of backups) {
    const backupDate = new Date(backup.createdAt);
    if (backupDate.getTime() < cutoffMs) {
      toDelete.push(backup);
    } else {
      keep.push(backup);
    }
  }

  return { keep, delete: toDelete };
}
