'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/playStore';
import type { AppMode, SyncStatus } from '@/types';

const MODE_ROUTES: Record<AppMode, string> = {
  sketch: '/sketch',
  playbook: '/playbook',
  gameplan: '/gameplan',
  practice: '/practice',
  gameday: '/gameday',
};

interface NavItem {
  mode: AppMode;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    mode: 'sketch',
    label: 'Quick Sketch',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
    ),
  },
  {
    mode: 'playbook',
    label: 'Playbook',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    mode: 'gameplan',
    label: 'Game Plans',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    mode: 'practice',
    label: 'Practice',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    mode: 'gameday',
    label: 'Game Day',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    ),
  },
];

export interface SidebarProps {
  syncStatus?: SyncStatus;
  teamName?: string;
}

export function Sidebar({ syncStatus, teamName = 'My Team' }: SidebarProps) {
  const { currentMode, setCurrentMode, sidebarOpen, toggleSidebar } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  // Sync currentMode from pathname on mount/navigation
  useEffect(() => {
    const entry = Object.entries(MODE_ROUTES).find(([, route]) => pathname?.startsWith(route));
    if (entry) {
      const mode = entry[0] as AppMode;
      if (mode !== currentMode) {
        setCurrentMode(mode);
      }
    }
  }, [pathname, currentMode, setCurrentMode]);

  // Close sidebar on mobile when clicking outside
  const handleOverlayClick = useCallback(() => {
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  }, [sidebarOpen, toggleSidebar]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && window.innerWidth < 768) {
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, toggleSidebar]);

  const syncDotColor = syncStatus
    ? syncStatus.isSyncing
      ? 'bg-amber-500 animate-pulse'
      : !syncStatus.isOnline
        ? 'bg-red-500'
        : 'bg-green-500'
    : 'bg-green-500';

  const syncLabel = syncStatus
    ? syncStatus.isSyncing
      ? 'Syncing'
      : !syncStatus.isOnline
        ? 'Offline'
        : 'Online'
    : 'Online';

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={handleOverlayClick}
          aria-hidden="true"
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950',
          // Mobile: slide-over drawer
          'md:relative md:translate-x-0',
          sidebarOpen
            ? 'w-60 translate-x-0'
            : 'w-16 -translate-x-full md:translate-x-0',
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Team name / logo */}
        <div className="flex h-14 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            {teamName.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <span className="ml-3 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {teamName}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="App modes">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentMode === item.mode;
              return (
                <li key={item.mode}>
                  <button
                    onClick={() => {
                      setCurrentMode(item.mode);
                      router.push(MODE_ROUTES[item.mode]);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                      !sidebarOpen && 'justify-center px-0',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.label}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section: sync status + settings */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          {/* Sync status */}
          <div className={cn('flex items-center gap-2 px-2 py-1.5', !sidebarOpen && 'justify-center')}>
            <span
              className={cn('h-2 w-2 rounded-full shrink-0', syncDotColor)}
              aria-hidden="true"
            />
            {sidebarOpen && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{syncLabel}</span>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={() => router.push('/settings')}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors',
              'hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
              !sidebarOpen && 'justify-center px-0',
            )}
            aria-label="Settings"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {sidebarOpen && <span>Settings</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
