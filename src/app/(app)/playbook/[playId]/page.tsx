'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePlaybook } from '@/hooks/usePlaybook';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useAppStore } from '@/stores/playStore';
import { DrawingTools } from '@/components/canvas/DrawingTools';
import { PlayRenderer } from '@/components/canvas/PlayRenderer';
import { PERSONNEL_GROUPS, DEFENSIVE_FRONTS, COVERAGES, DEFAULT_DEFENSE_PLAYERS } from '@/lib/constants';
import type { Play, Formation, DefensiveOverlay } from '@/types';

export default function PlayEditorPage() {
  const params = useParams();
  const router = useRouter();
  const playId = params.playId as string;

  const {
    allPlays,
    formations,
    savePlay,
    getFormation,
    isLoading,
  } = usePlaybook();

  const setCurrentPlayId = useAppStore((s) => s.setCurrentPlayId);

  const [play, setPlay] = useState<Play | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showDefense, setShowDefense] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // Load play from store
  useEffect(() => {
    if (!isLoading && allPlays.length > 0) {
      const found = allPlays.find((p) => p.id === playId);
      if (found) {
        setPlay(found);
        setNameDraft(found.name);
        setCurrentPlayId(found.id);
      }
    }
  }, [playId, allPlays, isLoading, setCurrentPlayId]);

  // Auto-save
  const handleSave = useCallback(
    async (data: Play) => {
      await savePlay(data);
    },
    [savePlay],
  );

  const { syncStatus } = useAutoSave(play as Play, handleSave, !!play);

  // Current formation
  const formation = useMemo<Formation | undefined>(() => {
    if (!play) return undefined;
    return getFormation(play.formationId);
  }, [play, getFormation]);

  // Name editing
  const handleNameSubmit = useCallback(() => {
    const trimmed = nameDraft.trim();
    if (trimmed && play && trimmed !== play.name) {
      setPlay((prev) => (prev ? { ...prev, name: trimmed, updatedAt: new Date().toISOString() } : prev));
    } else if (play) {
      setNameDraft(play.name);
    }
    setIsEditingName(false);
  }, [nameDraft, play]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNameSubmit();
      } else if (e.key === 'Escape') {
        if (play) setNameDraft(play.name);
        setIsEditingName(false);
      }
    },
    [handleNameSubmit, play],
  );

  // Formation change
  const handleFormationChange = useCallback(
    (formationId: string) => {
      const newFormation = getFormation(formationId);
      if (newFormation && play) {
        setPlay({
          ...play,
          formationId,
          personnel: newFormation.personnel,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [play, getFormation],
  );

  // Properties updates
  const handleTagsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!play) return;
      const tags = e.target.value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      setPlay({ ...play, tags, updatedAt: new Date().toISOString() });
    },
    [play],
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!play) return;
      setPlay({ ...play, notes: e.target.value, updatedAt: new Date().toISOString() });
    },
    [play],
  );

  const handlePersonnelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!play) return;
      setPlay({ ...play, personnel: e.target.value, updatedAt: new Date().toISOString() });
    },
    [play],
  );

  const handleHashChange = useCallback(
    (hash: 'left' | 'middle' | 'right') => {
      if (!play) return;
      setPlay({ ...play, hash, updatedAt: new Date().toISOString() });
    },
    [play],
  );

  // Toggle defense overlay
  const handleToggleDefense = useCallback(() => {
    if (!play) return;
    if (showDefense) {
      setShowDefense(false);
    } else {
      if (!play.defensiveOverlay) {
        const overlay: DefensiveOverlay = {
          front: '4-3 Over',
          coverage: 'Cover 2',
          players: DEFAULT_DEFENSE_PLAYERS,
        };
        setPlay({ ...play, defensiveOverlay: overlay, updatedAt: new Date().toISOString() });
      }
      setShowDefense(true);
    }
  }, [play, showDefense]);

  // Save status text
  const saveStatusText = useMemo(() => {
    if (syncStatus.isSyncing) return 'Saving...';
    if (syncStatus.pendingChanges > 0) return 'Unsaved changes';
    if (syncStatus.lastSaved) return 'Saved';
    return '';
  }, [syncStatus]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="play-editor-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading play...</p>
        </div>
      </div>
    );
  }

  if (!play || !formation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4" data-testid="play-not-found">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Play not found</p>
        <Link
          href="/playbook"
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Back to Playbook
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="play-editor-page">
      {/* Top Bar */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2">
        <Link
          href="/playbook"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          data-testid="back-to-playbook"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Playbook
        </Link>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />

        {/* Play Name (editable inline) */}
        {isEditingName ? (
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            className="text-sm font-semibold bg-white dark:bg-zinc-900 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="play-name-input"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setNameDraft(play.name);
              setIsEditingName(true);
            }}
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            data-testid="play-name-display"
          >
            {play.name}
          </button>
        )}

        {/* Formation Selector */}
        <select
          value={play.formationId}
          onChange={(e) => handleFormationChange(e.target.value)}
          className="text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-zinc-700 dark:text-zinc-300"
          data-testid="formation-selector"
        >
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* Save Status */}
        <div className="ml-auto flex items-center gap-3">
          <span
            className={cn(
              'text-xs',
              syncStatus.isSyncing && 'text-amber-500',
              syncStatus.pendingChanges > 0 && !syncStatus.isSyncing && 'text-amber-500',
              syncStatus.pendingChanges === 0 && syncStatus.lastSaved && 'text-green-500',
            )}
            data-testid="save-status"
          >
            {saveStatusText}
          </span>

          <button
            onClick={handleToggleDefense}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border transition-colors',
              showDefense
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
            )}
            data-testid="toggle-defense-btn"
          >
            {showDefense ? 'Hide Defense' : 'Add Defense'}
          </button>

          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="text-xs px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            data-testid="toggle-panel-btn"
            aria-label={rightPanelOpen ? 'Hide properties' : 'Show properties'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Drawing Tools */}
          <div className="flex items-center justify-center py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <DrawingTools orientation="horizontal" />
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center bg-[#2d5a27] dark:bg-[#1a3d18] overflow-auto" data-testid="canvas-area">
            <PlayRenderer
              play={play}
              formation={formation}
              mode="full"
              width={800}
              height={500}
              showDefense={showDefense}
              showLabels={true}
              showRoutes={true}
              showBlocking={true}
              interactive={true}
            />
          </div>
        </div>

        {/* Right Panel (collapsible) */}
        {rightPanelOpen && (
          <aside
            className="w-72 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto"
            data-testid="properties-panel"
          >
            <div className="p-4 space-y-5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Play Properties</h3>

              {/* Tags */}
              <div>
                <label htmlFor="editor-tags" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Tags
                </label>
                <input
                  id="editor-tags"
                  type="text"
                  value={play.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="run, inside, quick..."
                  className="w-full text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  data-testid="tags-input"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="editor-notes" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Notes
                </label>
                <textarea
                  id="editor-notes"
                  value={play.notes ?? ''}
                  onChange={handleNotesChange}
                  placeholder="Coaching notes..."
                  rows={4}
                  className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  data-testid="notes-textarea"
                />
              </div>

              {/* Personnel */}
              <div>
                <label htmlFor="editor-personnel" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Personnel
                </label>
                <select
                  id="editor-personnel"
                  value={play.personnel}
                  onChange={handlePersonnelChange}
                  className="w-full text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  data-testid="personnel-select"
                >
                  {PERSONNEL_GROUPS.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.code} - {g.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hash */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Hash
                </label>
                <div className="flex gap-1" data-testid="hash-selector">
                  {(['left', 'middle', 'right'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => handleHashChange(h)}
                      className={cn(
                        'flex-1 text-xs py-1.5 rounded border transition-colors capitalize',
                        play.hash === h
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                      )}
                      data-testid={`hash-${h}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Defensive Overlay Settings */}
              {showDefense && play.defensiveOverlay && (
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Defense</h4>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="defense-front" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Front
                      </label>
                      <select
                        id="defense-front"
                        value={play.defensiveOverlay.front}
                        onChange={(e) => {
                          if (!play.defensiveOverlay) return;
                          setPlay({
                            ...play,
                            defensiveOverlay: { ...play.defensiveOverlay, front: e.target.value },
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className="w-full text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                        data-testid="defense-front-select"
                      >
                        {DEFENSIVE_FRONTS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="defense-coverage" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Coverage
                      </label>
                      <select
                        id="defense-coverage"
                        value={play.defensiveOverlay.coverage}
                        onChange={(e) => {
                          if (!play.defensiveOverlay) return;
                          setPlay({
                            ...play,
                            defensiveOverlay: { ...play.defensiveOverlay, coverage: e.target.value },
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className="w-full text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                        data-testid="defense-coverage-select"
                      >
                        {COVERAGES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
