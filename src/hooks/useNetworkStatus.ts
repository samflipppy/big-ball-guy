'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface NetworkStatus {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether the user was offline at any point during this session */
  wasOffline: boolean;
  /** ISO timestamp of the last time the user was known to be online */
  lastOnlineAt: string | null;
}

export interface UseNetworkStatusOptions {
  /** Callback fired when the browser goes online */
  onOnline?: () => void;
  /** Callback fired when the browser goes offline */
  onOffline?: () => void;
}

/**
 * Hook that tracks online/offline state with history.
 * Returns the current network status and fires callbacks on state changes.
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}): NetworkStatus {
  const { onOnline, onOffline } = options;

  const onOnlineRef = useRef(onOnline);
  const onOfflineRef = useRef(onOffline);
  onOnlineRef.current = onOnline;
  onOfflineRef.current = onOffline;

  const [status, setStatus] = useState<NetworkStatus>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      isOnline,
      wasOffline: false,
      lastOnlineAt: isOnline ? new Date().toISOString() : null,
    };
  });

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({
      isOnline: true,
      wasOffline: prev.wasOffline || !prev.isOnline,
      lastOnlineAt: new Date().toISOString(),
    }));
    onOnlineRef.current?.();
  }, []);

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
    }));
    onOfflineRef.current?.();
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
