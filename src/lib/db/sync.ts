import { getPendingSyncEntries, clearSyncEntry, type PendingSyncEntry } from './indexeddb';
import { createClient } from '@/lib/supabase/client';

const SYNC_INTERVAL = 30_000; // 30 seconds
let syncTimer: ReturnType<typeof setInterval> | null = null;

// Map local store names to Supabase table names
const storeToTable: Record<string, string> = {
  plays: 'plays',
  formations: 'formations',
  concepts: 'concepts',
  gameplans: 'game_plans',
  practiceScripts: 'practice_scripts',
  blockingSchemes: 'blocking_schemes',
  scoutingNotes: 'scouting_notes',
  folders: 'folders',
};

async function processSyncEntry(entry: PendingSyncEntry): Promise<boolean> {
  const supabase = createClient();
  const table = storeToTable[entry.storeName];

  if (!table) return false;

  try {
    switch (entry.action) {
      case 'create':
      case 'update': {
        const { error } = await supabase.from(table).upsert(entry.data as Record<string, unknown>);
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { id } = entry.data as { id: string };
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        break;
      }
    }
    return true;
  } catch (error) {
    console.error(`Sync failed for ${entry.storeName}:${entry.action}`, error);
    return false;
  }
}

export async function syncPendingChanges(): Promise<{ synced: number; failed: number }> {
  const entries = await getPendingSyncEntries();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    const success = await processSyncEntry(entry);
    if (success) {
      await clearSyncEntry(entry.id);
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

export function startBackgroundSync(): void {
  if (syncTimer) return;

  syncTimer = setInterval(async () => {
    if (navigator.onLine) {
      await syncPendingChanges();
    }
  }, SYNC_INTERVAL);

  // Also sync when coming back online
  window.addEventListener('online', () => {
    syncPendingChanges();
  });
}

export function stopBackgroundSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

export function getSyncStatus(): { isOnline: boolean } {
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}
