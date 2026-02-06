'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { generateId, formatDate } from '@/lib/utils';
import { useGamePlan } from '@/hooks/useGamePlan';
import { usePlaybook } from '@/hooks/usePlaybook';
import { useAppStore } from '@/stores/playStore';
import { practiceScripts as practiceScriptsDb } from '@/lib/db/indexeddb';
import { PracticeScriptEditor } from '@/components/gameplan/PracticeScriptEditor';
import { PlayPicker } from '@/components/gameplan/PlayPicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { PracticeScript, PlayRef } from '@/types';

export default function PracticePage() {
  const { allPlays, formations, isLoading: playsLoading } = usePlaybook();
  const { gamePlans, loadAllGamePlans } = useGamePlan();
  const currentTeamId = useAppStore((s) => s.currentTeamId);

  const [scripts, setScripts] = useState<PracticeScript[]>([]);
  const [activeScript, setActiveScript] = useState<PracticeScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayPicker, setShowPlayPicker] = useState(false);
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);

  // Load all practice scripts
  useEffect(() => {
    async function loadScripts() {
      setLoading(true);
      try {
        const all = await practiceScriptsDb.getAll(currentTeamId ?? undefined);
        setScripts(all);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    loadScripts();
    loadAllGamePlans();
  }, [currentTeamId, loadAllGamePlans]);

  // Create a new practice script
  const handleNewScript = useCallback(() => {
    const now = new Date().toISOString();
    const newScript: PracticeScript = {
      id: generateId(),
      name: `Practice - ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString().split('T')[0],
      periods: [],
      teamId: currentTeamId ?? '',
      createdAt: now,
      updatedAt: now,
    };
    setScripts((prev) => [...prev, newScript]);
    setActiveScript(newScript);
    practiceScriptsDb.put(newScript);
  }, [currentTeamId]);

  // Update active script
  const handleScriptChange = useCallback(
    async (updated: PracticeScript) => {
      setActiveScript(updated);
      setScripts((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      await practiceScriptsDb.put(updated);
    },
    [],
  );

  // Handle date change
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeScript) return;
      const updated = { ...activeScript, date: e.target.value, updatedAt: new Date().toISOString() };
      handleScriptChange(updated);
    },
    [activeScript, handleScriptChange],
  );

  // Handle game plan link
  const handleGamePlanChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!activeScript) return;
      const gamePlanId = e.target.value || undefined;
      const updated = { ...activeScript, gamePlanId, updatedAt: new Date().toISOString() };
      handleScriptChange(updated);
    },
    [activeScript, handleScriptChange],
  );

  // Delete a script
  const handleDeleteScript = useCallback(
    async (scriptId: string) => {
      await practiceScriptsDb.delete(scriptId);
      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
      if (activeScript?.id === scriptId) {
        setActiveScript(null);
      }
    },
    [activeScript],
  );

  // Add play to period
  const handleAddPlayToPeriod = useCallback((periodId: string) => {
    setActivePeriodId(periodId);
    setShowPlayPicker(true);
  }, []);

  // Handle play selection from picker
  const handlePlaySelect = useCallback(
    (playIds: string[]) => {
      if (!activeScript || !activePeriodId) return;
      const periods = activeScript.periods.map((p) => {
        if (p.id !== activePeriodId) return p;
        const newRefs: PlayRef[] = playIds
          .filter((pid) => !p.plays.some((pr) => pr.playId === pid))
          .map((pid, i) => ({ playId: pid, order: p.plays.length + i }));
        return { ...p, plays: [...p.plays, ...newRefs] };
      });
      const updated = { ...activeScript, periods, updatedAt: new Date().toISOString() };
      handleScriptChange(updated);
      setShowPlayPicker(false);
      setActivePeriodId(null);
    },
    [activeScript, activePeriodId, handleScriptChange],
  );

  // Script stats helper
  const getScriptStats = useCallback((script: PracticeScript) => {
    const totalPlays = script.periods.reduce((sum, p) => sum + p.plays.length, 0);
    const totalTime = script.periods.reduce((sum, p) => sum + p.duration, 0);
    return { totalPlays, totalTime };
  }, []);

  // Linked game plan name helper
  const getGamePlanName = useCallback(
    (gamePlanId?: string) => {
      if (!gamePlanId) return null;
      const gp = gamePlans.find((p) => p.id === gamePlanId);
      return gp ? `vs ${gp.opponent} (Wk ${gp.week})` : null;
    },
    [gamePlans],
  );

  const isPageLoading = loading || playsLoading;

  if (isPageLoading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="practice-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading practice scripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="practice-page">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Practice Scripts</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={handleNewScript}
          data-testid="new-script-btn"
        >
          New Practice Script
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Script List Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
          {scripts.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No practice scripts"
                description="Create your first practice script to organize plays for practice."
                actionLabel="New Script"
                onAction={handleNewScript}
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800" data-testid="script-list">
              {scripts.map((script) => {
                const stats = getScriptStats(script);
                const gpName = getGamePlanName(script.gamePlanId);
                const isActive = activeScript?.id === script.id;
                return (
                  <div
                    key={script.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border-l-2 border-transparent',
                    )}
                    onClick={() => setActiveScript(script)}
                    data-testid={`script-item-${script.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {script.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {formatDate(script.date)}
                      </p>
                      {gpName && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                          {gpName}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                        {stats.totalPlays} plays | {stats.totalTime}min
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScript(script.id);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                      data-testid={`delete-script-${script.id}`}
                      aria-label={`Delete ${script.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
          {activeScript ? (
            <div className="space-y-4">
              {/* Script Header */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div>
                  <label htmlFor="practice-date" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Practice Date
                  </label>
                  <input
                    id="practice-date"
                    type="date"
                    value={activeScript.date}
                    onChange={handleDateChange}
                    className="text-sm px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    data-testid="practice-date-input"
                  />
                </div>

                <div>
                  <label htmlFor="linked-gameplan" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Linked Game Plan
                  </label>
                  <select
                    id="linked-gameplan"
                    value={activeScript.gamePlanId ?? ''}
                    onChange={handleGamePlanChange}
                    className="text-sm px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    data-testid="gameplan-select"
                  >
                    <option value="">No linked game plan</option>
                    {gamePlans.map((gp) => (
                      <option key={gp.id} value={gp.id}>
                        Wk {gp.week} vs {gp.opponent}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Practice Script Editor */}
              <PracticeScriptEditor
                script={activeScript}
                plays={allPlays}
                onChange={handleScriptChange}
                onAddPlayToPeriod={handleAddPlayToPeriod}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-zinc-400 dark:text-zinc-500" data-testid="no-script-selected">
                <p className="text-sm">Select a practice script or create a new one</p>
              </div>
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
            setActivePeriodId(null);
          }}
        />
      )}
    </div>
  );
}
