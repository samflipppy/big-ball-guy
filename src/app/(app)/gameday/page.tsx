'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useGamePlan } from '@/hooks/useGamePlan';
import { usePlaybook } from '@/hooks/usePlaybook';
import { CallSheetView } from '@/components/gameplan/CallSheetView';
import { WristbandGenerator } from '@/components/gameplan/WristbandGenerator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import type { CallSheet, CallSheetSection, GamePlan } from '@/types';

type ViewTab = 'callsheet' | 'wristband';

export default function GameDayPage() {
  const { gamePlans, loadAllGamePlans } = useGamePlan();
  const { allPlays, isLoading: playsLoading } = usePlaybook();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ViewTab>('callsheet');
  const [searchQuery, setSearchQuery] = useState('');

  // Load game plans on mount
  useEffect(() => {
    loadAllGamePlans();
  }, [loadAllGamePlans]);

  // Auto-select first game plan if available
  useEffect(() => {
    if (gamePlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(gamePlans[0].id);
    }
  }, [gamePlans, selectedPlanId]);

  // Selected game plan
  const selectedPlan = useMemo<GamePlan | undefined>(() => {
    return gamePlans.find((gp) => gp.id === selectedPlanId);
  }, [gamePlans, selectedPlanId]);

  // Build call sheet from game plan
  const callSheet = useMemo<CallSheet | null>(() => {
    if (!selectedPlan) return null;
    const sections: CallSheetSection[] = selectedPlan.sections.map((s) => ({
      name: s.situation,
      plays: s.plays,
      color: undefined,
    }));
    return {
      id: `callsheet-${selectedPlan.id}`,
      gamePlanId: selectedPlan.id,
      sections,
      teamId: selectedPlan.teamId,
      createdAt: selectedPlan.createdAt,
      updatedAt: selectedPlan.updatedAt,
    };
  }, [selectedPlan]);

  // Filtered call sheet based on search query
  const filteredCallSheet = useMemo<CallSheet | null>(() => {
    if (!callSheet) return null;
    if (!searchQuery.trim()) return callSheet;

    const q = searchQuery.toLowerCase();
    const filteredSections = callSheet.sections
      .map((section) => {
        const filteredPlays = section.plays.filter((playRef) => {
          const play = allPlays.find((p) => p.id === playRef.playId);
          if (!play) return false;
          return (
            play.name.toLowerCase().includes(q) ||
            play.tags.some((t) => t.toLowerCase().includes(q)) ||
            play.personnel.toLowerCase().includes(q) ||
            section.name.toLowerCase().includes(q)
          );
        });
        return { ...section, plays: filteredPlays };
      })
      .filter((section) => section.plays.length > 0);

    return { ...callSheet, sections: filteredSections };
  }, [callSheet, searchQuery, allPlays]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle game plan selection
  const handlePlanChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlanId(e.target.value);
    setSearchQuery('');
  }, []);

  if (playsLoading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="gameday-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="gameday-page">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 print:hidden">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Game Day</h1>

        {/* Game Plan Selector */}
        <select
          value={selectedPlanId}
          onChange={handlePlanChange}
          className="text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="gameplan-selector"
          aria-label="Select game plan"
        >
          <option value="">Select a game plan</option>
          {gamePlans.map((gp) => (
            <option key={gp.id} value={gp.id}>
              Wk {gp.week} vs {gp.opponent} ({gp.season})
            </option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5">
          <button
            onClick={() => setActiveTab('callsheet')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              activeTab === 'callsheet'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
            data-testid="tab-callsheet"
          >
            Call Sheet
          </button>
          <button
            onClick={() => setActiveTab('wristband')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              activeTab === 'wristband'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
            data-testid="tab-wristband"
          >
            Wristband
          </button>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="w-64">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Filter plays..."
            debounceMs={200}
          />
        </div>

        {/* Print */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrint}
          data-testid="print-btn"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
        {!selectedPlan ? (
          <EmptyState
            title="Select a game plan"
            description="Choose a game plan from the dropdown above to view the call sheet or generate wristbands."
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            }
          />
        ) : !filteredCallSheet || filteredCallSheet.sections.length === 0 ? (
          searchQuery.trim() ? (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-500" data-testid="no-search-results">
              <p className="text-sm">No plays match your search.</p>
            </div>
          ) : (
            <EmptyState
              title="Empty game plan"
              description="This game plan has no plays. Add plays in the Game Plan editor first."
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          )
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Plan Header */}
            <div className="mb-6 print:mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100" data-testid="plan-header">
                Week {selectedPlan.week} vs {selectedPlan.opponent}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {selectedPlan.season} | {selectedPlan.sections.reduce((sum, s) => sum + s.plays.length, 0)} plays
              </p>
            </div>

            {/* View Content */}
            {activeTab === 'callsheet' ? (
              <CallSheetView
                callSheet={filteredCallSheet}
                plays={allPlays}
              />
            ) : (
              <WristbandGenerator
                callSheet={filteredCallSheet}
                plays={allPlays}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
