'use client';

import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAppStore } from '@/stores/playStore';
import type { AppMode } from '@/types';

interface NavTab {
  mode: AppMode;
  label: string;
  icon: React.ReactNode;
}

const tabs: NavTab[] = [
  {
    mode: 'sketch',
    label: 'Sketch',
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
    label: 'Game Plan',
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

/**
 * Bottom navigation bar for mobile and tablet.
 * Shows 5 tabs: Sketch, Playbook, Game Plan, Practice, Game Day.
 * Only visible on mobile and tablet breakpoints.
 * Replaces the sidebar on small screens.
 */
export function MobileNav() {
  const { isDesktop } = useBreakpoint();
  const { currentMode, setCurrentMode } = useAppStore();

  // Hide on desktop
  if (isDesktop) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95"
      role="navigation"
      aria-label="Mobile navigation"
      data-testid="mobile-nav"
    >
      {tabs.map((tab) => {
        const isActive = currentMode === tab.mode;

        return (
          <button
            key={tab.mode}
            onClick={() => setCurrentMode(tab.mode)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            data-testid={`mobile-nav-tab-${tab.mode}`}
          >
            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-blue-600 dark:bg-blue-400"
                data-testid="active-indicator"
              />
            )}

            <span className="shrink-0">{tab.icon}</span>
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileNav;
