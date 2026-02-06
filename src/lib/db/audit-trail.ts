import { openDB, type IDBPDatabase } from 'idb';
import { generateId } from '@/lib/utils';

// ---- Types ----

export interface AuditAction {
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'share';
  userId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface AuditLogEntry extends AuditAction {
  id: string;
}

export interface AuditLogFilters {
  entityId?: string;
  userId?: string;
  action?: string;
  since?: string;
  until?: string;
}

// ---- IndexedDB for audit log ----

const AUDIT_DB_NAME = 'playbook-audit-db';
const AUDIT_DB_VERSION = 1;
const AUDIT_STORE = 'audit-log';

let auditDbPromise: Promise<IDBPDatabase> | null = null;

export function getAuditDB(): Promise<IDBPDatabase> {
  if (!auditDbPromise) {
    auditDbPromise = openDB(AUDIT_DB_NAME, AUDIT_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(AUDIT_STORE)) {
          const store = db.createObjectStore(AUDIT_STORE, { keyPath: 'id' });
          store.createIndex('entityId', 'entityId');
          store.createIndex('userId', 'userId');
          store.createIndex('action', 'action');
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }
  return auditDbPromise;
}

/** For testing: reset the cached DB promise and clear all stored entries */
export async function resetAuditDB(): Promise<void> {
  try {
    const db = await getAuditDB();
    await db.clear(AUDIT_STORE);
  } catch {
    // DB may not exist yet
  }
  auditDbPromise = null;
}

// ---- Core API ----

/**
 * Log an action to the audit trail.
 */
export async function logAction(action: AuditAction): Promise<AuditLogEntry> {
  const db = await getAuditDB();
  const entry: AuditLogEntry = {
    id: generateId(),
    ...action,
  };
  await db.put(AUDIT_STORE, entry);
  return entry;
}

/**
 * Retrieve filtered audit log entries.
 * All filters are optional and can be combined. Results are sorted
 * with the most recent entries first.
 */
export async function getAuditLog(
  filters: AuditLogFilters = {},
): Promise<AuditLogEntry[]> {
  const db = await getAuditDB();
  let entries: AuditLogEntry[] = await db.getAll(AUDIT_STORE);

  if (filters.entityId) {
    entries = entries.filter((e) => e.entityId === filters.entityId);
  }
  if (filters.userId) {
    entries = entries.filter((e) => e.userId === filters.userId);
  }
  if (filters.action) {
    entries = entries.filter((e) => e.action === filters.action);
  }
  if (filters.since) {
    const sinceTime = new Date(filters.since).getTime();
    entries = entries.filter(
      (e) => new Date(e.timestamp).getTime() >= sinceTime,
    );
  }
  if (filters.until) {
    const untilTime = new Date(filters.until).getTime();
    entries = entries.filter(
      (e) => new Date(e.timestamp).getTime() <= untilTime,
    );
  }

  return entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Get the full audit history for a specific entity,
 * sorted with the most recent entries first.
 */
export async function getEntityHistory(
  entityType: string,
  entityId: string,
): Promise<AuditLogEntry[]> {
  const db = await getAuditDB();
  const all: AuditLogEntry[] = await db.getAll(AUDIT_STORE);

  return all
    .filter((e) => e.entityType === entityType && e.entityId === entityId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}
