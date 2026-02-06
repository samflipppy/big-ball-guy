'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/playStore';

// --- Types ---
type ResultCategory = 'Plays' | 'Formations' | 'Game Plans' | 'Actions';

interface SearchResult {
  id: string;
  name: string;
  category: ResultCategory;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

// --- Icons ---
const PlayIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const FormationIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const GamePlanIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const ActionIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

// --- Category badge colors ---
const categoryColors: Record<ResultCategory, string> = {
  Plays: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  Formations: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Game Plans': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Actions: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
};

// --- Recent searches (persisted in memory for session) ---
const RECENT_KEY = 'command-palette-recent';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const stored = sessionStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // sessionStorage unavailable
  }
}

// --- Component ---
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { plays, formations, gameplans, toggleDarkMode, setCurrentMode } = useAppStore();

  // --- Cmd+K / Ctrl+K listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      // Small delay so the modal is rendered before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // --- Build results ---
  const actionResults: SearchResult[] = useMemo(
    () => [
      {
        id: 'action-new-play',
        name: 'Create New Play',
        category: 'Actions' as ResultCategory,
        icon: <ActionIcon />,
        shortcut: undefined,
        onSelect: () => {
          router.push('/playbook');
          setCurrentMode('playbook');
        },
      },
      {
        id: 'action-new-gameplan',
        name: 'Create New Game Plan',
        category: 'Actions' as ResultCategory,
        icon: <ActionIcon />,
        shortcut: undefined,
        onSelect: () => {
          router.push('/gameplan');
          setCurrentMode('gameplan');
        },
      },
      {
        id: 'action-toggle-dark',
        name: 'Toggle Dark Mode',
        category: 'Actions' as ResultCategory,
        icon: <ActionIcon />,
        shortcut: undefined,
        onSelect: () => {
          toggleDarkMode();
        },
      },
      {
        id: 'action-quick-sketch',
        name: 'Open Quick Sketch',
        category: 'Actions' as ResultCategory,
        icon: <ActionIcon />,
        shortcut: undefined,
        onSelect: () => {
          router.push('/sketch');
          setCurrentMode('sketch');
        },
      },
    ],
    [router, toggleDarkMode, setCurrentMode],
  );

  const allResults: SearchResult[] = useMemo(() => {
    const playResults: SearchResult[] = plays.map((play) => ({
      id: `play-${play.id}`,
      name: play.name,
      category: 'Plays' as ResultCategory,
      icon: <PlayIcon />,
      onSelect: () => {
        router.push(`/playbook/${play.id}`);
      },
    }));

    const formationResults: SearchResult[] = formations.map((f) => ({
      id: `formation-${f.id}`,
      name: f.name,
      category: 'Formations' as ResultCategory,
      icon: <FormationIcon />,
      onSelect: () => {
        router.push(`/playbook?formation=${encodeURIComponent(f.id)}`);
      },
    }));

    const gameplanResults: SearchResult[] = gameplans.map((gp) => ({
      id: `gameplan-${gp.id}`,
      name: gp.name,
      category: 'Game Plans' as ResultCategory,
      icon: <GamePlanIcon />,
      onSelect: () => {
        router.push(`/gameplan/${gp.id}`);
      },
    }));

    return [...playResults, ...formationResults, ...gameplanResults, ...actionResults];
  }, [plays, formations, gameplans, actionResults, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allResults.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, allResults]);

  const recentSearches = useMemo(() => (query.trim() === '' ? getRecentSearches() : []), [query]);

  // Reset index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length, query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // --- Keyboard navigation ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = filtered.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(count, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + Math.max(count, 1)) % Math.max(count, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIndex]) {
          const item = filtered[activeIndex];
          if (query.trim()) {
            addRecentSearch(query.trim());
          }
          item.onSelect();
          close();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [filtered, activeIndex, close, query],
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (query.trim()) {
        addRecentSearch(query.trim());
      }
      result.onSelect();
      close();
    },
    [close, query],
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      close();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-scale-in mx-4"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center border-b border-zinc-200 px-4 dark:border-zinc-700">
          <svg
            className="mr-3 h-5 w-5 shrink-0 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plays, formations, game plans..."
            className="flex-1 bg-transparent py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label="Search command palette"
            role="combobox"
            aria-expanded={filtered.length > 0}
            aria-activedescendant={filtered[activeIndex] ? `result-${filtered[activeIndex].id}` : undefined}
          />
          <kbd className="ml-2 hidden items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 sm:inline-flex">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2" role="listbox">
          {/* Recent searches when empty */}
          {query.trim() === '' && recentSearches.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                Recent Searches
              </p>
              {recentSearches.map((recent) => (
                <button
                  key={recent}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  onClick={() => setQuery(recent)}
                >
                  <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recent}
                </button>
              ))}
            </div>
          )}

          {/* Empty query, no recent */}
          {query.trim() === '' && recentSearches.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Type to search across plays, formations, and game plans...
            </p>
          )}

          {/* Search results */}
          {query.trim() !== '' && filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500" data-testid="no-results">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {filtered.map((result, index) => (
            <button
              key={result.id}
              id={`result-${result.id}`}
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                index === activeIndex
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
              )}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">{result.icon}</span>
              <span className="flex-1 truncate">{result.name}</span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  categoryColors[result.category],
                )}
              >
                {result.category}
              </span>
              {result.shortcut && (
                <kbd className="shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                  {result.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">&uarr;</kbd>
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">&darr;</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">&crarr;</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
