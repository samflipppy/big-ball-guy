'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useGamePlan } from '@/hooks/useGamePlan';
import { usePlaybook } from '@/hooks/usePlaybook';
import { useAutoSave } from '@/hooks/useAutoSave';
import { GamePlanSection } from '@/components/gameplan/GamePlanSection';
import { PlayPicker } from '@/components/gameplan/PlayPicker';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import type { GamePlan } from '@/types';

const SECTION_PRESETS = [
  '1st & 10',
  '2nd & Medium',
  '3rd & Short',
  '3rd & Long',
  'Red Zone',
  'Goal Line',
  '2-Minute',
];

export default function GamePlanEditorPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const {
    gamePlan,
    loading: gpLoading,
    loadGamePlan,
    updateGamePlan,
    addSection,
    removeSection,
    updateSection,
    addPlayToSection,
    removePlayFromSection,
    reorderPlaysInSection,
  } = useGamePlan(planId);

  const {
    allPlays,
    formations,
    isLoading: playsLoading,
  } = usePlaybook();

  const [searchQuery, setSearchQuery] = useState('');
  const [showPlayPicker, setShowPlayPicker] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  // Auto-save the game plan
  const handleAutoSave = useCallback(
    async (data: GamePlan) => {
      await updateGamePlan(data);
    },
    [updateGamePlan],
  );

  const { syncStatus } = useAutoSave(gamePlan as GamePlan, handleAutoSave, !!gamePlan);

  // Filter plays for the sidebar browser
  const filteredPlays = useMemo(() => {
    if (!searchQuery.trim()) return allPlays;
    const q = searchQuery.toLowerCase();
    return allPlays.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)),
    );
  }, [allPlays, searchQuery]);

  // Total play count
  const totalPlays = useMemo(() => {
    if (!gamePlan) return 0;
    return gamePlan.sections.reduce((sum, s) => sum + s.plays.length, 0);
  }, [gamePlan]);

  // Open play picker for a section
  const handleAddPlayClick = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    setShowPlayPicker(true);
  }, []);

  // Handle play selection from picker
  const handlePlaySelect = useCallback(
    (playIds: string[]) => {
      if (!activeSectionId) return;
      playIds.forEach((playId) => {
        addPlayToSection(activeSectionId, playId);
      });
      setShowPlayPicker(false);
      setActiveSectionId(null);
    },
    [activeSectionId, addPlayToSection],
  );

  // Add section from preset
  const handleAddPresetSection = useCallback(
    (situation: string) => {
      addSection(situation);
      setShowPresetMenu(false);
    },
    [addSection],
  );

  // Update section situation
  const handleUpdateSituation = useCallback(
    (sectionId: string, situation: string) => {
      updateSection(sectionId, { situation });
    },
    [updateSection],
  );

  // Update section notes
  const handleUpdateNotes = useCallback(
    (sectionId: string, notes: string) => {
      updateSection(sectionId, { notes });
    },
    [updateSection],
  );

  // Export (placeholder for now - could export to JSON / PDF)
  const handleExport = useCallback(() => {
    if (!gamePlan) return;
    const dataStr = JSON.stringify(gamePlan, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gameplan-${gamePlan.opponent}-week${gamePlan.week}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [gamePlan]);

  // Drag play from sidebar into a section
  const handleDragPlayFromBrowser = useCallback(
    (e: React.DragEvent, playId: string) => {
      e.dataTransfer.setData('playId', playId);
      e.dataTransfer.effectAllowed = 'copy';
    },
    [],
  );

  const isLoading = gpLoading || playsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="gameplan-editor-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading game plan...</p>
        </div>
      </div>
    );
  }

  if (!gamePlan) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4" data-testid="gameplan-not-found">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Game plan not found</p>
        <Link
          href="/gameplan"
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Back to Game Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="gameplan-editor-page">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
        <Link
          href="/gameplan"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          data-testid="back-to-gameplans"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Game Plans
        </Link>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />

        <div className="flex-1">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" data-testid="opponent-name">
            vs {gamePlan.opponent}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Week {gamePlan.week} | {totalPlays} {totalPlays === 1 ? 'play' : 'plays'}
          </p>
        </div>

        <span
          className={cn(
            'text-xs',
            syncStatus.isSyncing ? 'text-amber-500' : syncStatus.lastSaved ? 'text-green-500' : 'text-zinc-400',
          )}
          data-testid="save-status"
        >
          {syncStatus.isSyncing ? 'Saving...' : syncStatus.lastSaved ? 'Saved' : ''}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          data-testid="export-btn"
        >
          Export
        </Button>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Play Browser */}
        <aside className="w-72 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Play Browser
            </h3>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search plays..."
              debounceMs={200}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredPlays.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500" data-testid="no-plays-in-browser">
                No plays found
              </div>
            ) : (
              <div className="space-y-1" data-testid="play-browser-list">
                {filteredPlays.map((play) => (
                  <div
                    key={play.id}
                    draggable
                    onDragStart={(e) => handleDragPlayFromBrowser(e, play.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 cursor-grab hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    data-testid={`browser-play-${play.id}`}
                  >
                    <div className="w-8 h-6 bg-green-800 rounded flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-[5px] font-bold">
                        {play.name.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {play.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {play.personnel}
                        {play.tags.length > 0 && ` | ${play.tags.slice(0, 2).join(', ')}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right: Game Plan Sections */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
          {/* Add Section Controls */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPresetMenu(!showPresetMenu)}
                data-testid="add-section-btn"
              >
                Add Section
              </Button>

              {showPresetMenu && (
                <div className="absolute top-full left-0 mt-1 z-10 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1" data-testid="preset-menu">
                  {SECTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleAddPresetSection(preset)}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      data-testid={`preset-${preset.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {preset}
                    </button>
                  ))}
                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
                  <button
                    onClick={() => handleAddPresetSection('Custom')}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    data-testid="preset-custom"
                  >
                    + Custom Section
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          {gamePlan.sections.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-500" data-testid="empty-sections">
              <p className="text-sm">No sections yet. Add a section to start building your game plan.</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="sections-list">
              {gamePlan.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <GamePlanSection
                    key={section.id}
                    section={section}
                    plays={allPlays}
                    onUpdateSituation={handleUpdateSituation}
                    onUpdateNotes={handleUpdateNotes}
                    onRemoveSection={removeSection}
                    onRemovePlay={removePlayFromSection}
                    onReorderPlay={reorderPlaysInSection}
                    onAddPlayClick={handleAddPlayClick}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Play Picker Modal */}
      {showPlayPicker && (
        <PlayPicker
          plays={allPlays}
          formations={formations}
          recentPlayIds={[]}
          onSelect={handlePlaySelect}
          onClose={() => {
            setShowPlayPicker(false);
            setActiveSectionId(null);
          }}
          excludePlayIds={
            activeSectionId
              ? gamePlan.sections
                  .find((s) => s.id === activeSectionId)
                  ?.plays.map((p) => p.playId) ?? []
              : []
          }
        />
      )}
    </div>
  );
}
