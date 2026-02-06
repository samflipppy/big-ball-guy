'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { RecentlyEdited } from '@/components/ui/RecentlyEdited';
import { useAppStore } from '@/stores/playStore';
import { restoreSessionState, type SessionState } from '@/lib/session';
import { cn } from '@/lib/utils';

// ---- Session Recovery Banner ----

function SessionRecoveryBanner({
  session,
  onRestore,
  onDismiss,
}: {
  session: SessionState;
  onRestore: () => void;
  onDismiss: () => void;
}) {
  const ageMs = Date.now() - session.timestamp;
  const ageMin = Math.floor(ageMs / 60_000);
  const ageLabel = ageMin < 1 ? 'just now' : ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin / 60)}h ago`;

  return (
    <div
      className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/40"
      data-testid="session-recovery-banner"
    >
      <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
      <span className="flex-1 text-amber-800 dark:text-amber-200">
        You have an unsaved session from {ageLabel}. Would you like to restore it?
      </span>
      <button
        onClick={onRestore}
        className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
        data-testid="restore-session-button"
      >
        Restore
      </button>
      <button
        onClick={onDismiss}
        className="rounded-md px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
        data-testid="dismiss-session-button"
      >
        Dismiss
      </button>
    </div>
  );
}

// ---- Layout ----

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen, toggleSidebar, setCurrentPlayId, setCanvasTool } = useAppStore();
  const [recoverySession, setRecoverySession] = useState<SessionState | null>(null);

  // On mount, check for a saved session
  useEffect(() => {
    const saved = restoreSessionState();
    if (saved) {
      setRecoverySession(saved);
    }
  }, []);

  const handleRestore = useCallback(() => {
    if (!recoverySession) return;
    // Apply the saved session state back to the store
    if (recoverySession.currentPlayId) {
      setCurrentPlayId(recoverySession.currentPlayId);
    }
    if (recoverySession.tool) {
      setCanvasTool(recoverySession.tool);
    }
    if (typeof recoverySession.sidebarOpen === 'boolean' && recoverySession.sidebarOpen !== sidebarOpen) {
      toggleSidebar();
    }
    setRecoverySession(null);
  }, [recoverySession, setCurrentPlayId, setCanvasTool, sidebarOpen, toggleSidebar]);

  const handleDismiss = useCallback(() => {
    setRecoverySession(null);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <CommandPalette />
      <Sidebar teamName="My Team" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Session recovery banner */}
        {recoverySession && (
          <SessionRecoveryBanner
            session={recoverySession}
            onRestore={handleRestore}
            onDismiss={handleDismiss}
          />
        )}

        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 px-4 dark:border-zinc-800">
          {/* Hamburger menu for mobile */}
          <button
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 md:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Collapse/expand button for desktop */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'hidden items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
              'dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 md:inline-flex',
            )}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>

          <div className="flex-1" />

          {/* Header actions */}
          <div className="flex items-center gap-2">
            <RecentlyEdited />
            <DarkModeToggle />
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Playbook Pro</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      <OfflineIndicator />
    </div>
  );
}
