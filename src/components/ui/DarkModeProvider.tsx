'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/playStore';

const STORAGE_KEY = 'darkMode';

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  // On initial mount, read localStorage preference and sync store
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const prefersDark = stored === 'true';
      // Only toggle if the store value differs from the persisted value
      if (prefersDark !== useAppStore.getState().darkMode) {
        toggleDarkMode();
      }
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark !== useAppStore.getState().darkMode) {
        toggleDarkMode();
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync dark class on <html> and persist to localStorage whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  return <>{children}</>;
}
