'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { debounce } from '@/lib/utils';
import type { SyncStatus } from '@/types';

const AUTO_SAVE_DELAY = 1500;

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  enabled = true,
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSaved: null,
    lastSynced: null,
    pendingChanges: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
  });

  const dataRef = useRef(data);
  const saveRef = useRef(saveFn);
  dataRef.current = data;
  saveRef.current = saveFn;

  const debouncedSave = useRef(
    debounce(async () => {
      try {
        setSyncStatus((s) => ({ ...s, isSyncing: true }));
        await saveRef.current(dataRef.current);
        setSyncStatus((s) => ({
          ...s,
          lastSaved: new Date().toISOString(),
          isSyncing: false,
          pendingChanges: 0,
        }));
      } catch {
        setSyncStatus((s) => ({ ...s, isSyncing: false }));
      }
    }, AUTO_SAVE_DELAY),
  ).current;

  useEffect(() => {
    if (enabled) {
      setSyncStatus((s) => ({ ...s, pendingChanges: s.pendingChanges + 1 }));
      debouncedSave();
    }
  }, [data, enabled, debouncedSave]);

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setSyncStatus((s) => ({ ...s, isOnline: true }));
    const onOffline = () => setSyncStatus((s) => ({ ...s, isOnline: false }));
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const forceSave = useCallback(async () => {
    await saveRef.current(dataRef.current);
    setSyncStatus((s) => ({
      ...s,
      lastSaved: new Date().toISOString(),
      pendingChanges: 0,
    }));
  }, []);

  return { syncStatus, forceSave };
}
