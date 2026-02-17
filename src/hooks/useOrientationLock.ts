'use client';

import { useState, useCallback, useEffect } from 'react';

// Type for screen orientation with optional lock/unlock methods
type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: 'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'portrait-primary' | 'portrait-secondary' | 'natural' | 'any') => Promise<void>;
};

export interface OrientationLockInfo {
  isLocked: boolean;
  lock: () => Promise<void>;
  unlock: () => void;
  currentOrientation: 'portrait' | 'landscape';
}

/**
 * Hook that locks the screen to landscape orientation when in canvas/sketch mode.
 *
 * Uses the Screen Orientation API when available.
 * Falls back to tracking orientation so a "Rotate device" overlay can be shown.
 */
export function useOrientationLock(): OrientationLockInfo {
  const [isLocked, setIsLocked] = useState(false);
  const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'landscape';
    return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
  });

  // Update current orientation on changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleOrientationChange() {
      const isLandscape = window.innerWidth >= window.innerHeight;
      setCurrentOrientation(isLandscape ? 'landscape' : 'portrait');
    }

    // Listen for orientation changes via Screen Orientation API
    if (screen?.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Also listen for resize as fallback
    window.addEventListener('resize', handleOrientationChange);

    // Initial check
    handleOrientationChange();

    return () => {
      if (screen?.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const lock = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const orientation = screen?.orientation as ScreenOrientationWithLock | undefined;
      if (orientation?.lock) {
        await orientation.lock('landscape');
        setIsLocked(true);
      } else {
        // Fallback: just mark as locked; the UI should show a rotate overlay
        setIsLocked(true);
      }
    } catch {
      // The API may throw if not supported or not in fullscreen
      // Still mark as locked for the UI overlay fallback
      setIsLocked(true);
    }
  }, []);

  const unlock = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // unlock is a standard method on ScreenOrientation
      screen?.orientation?.unlock();
    } catch {
      // Ignore errors on unlock
    }

    setIsLocked(false);
  }, []);

  return {
    isLocked,
    lock,
    unlock,
    currentOrientation,
  };
}

export default useOrientationLock;
