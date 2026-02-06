'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { useGamePlan } from '@/hooks/useGamePlan';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

type SortBy = 'week' | 'date';

export default function GamePlanListPage() {
  const router = useRouter();
  const {
    gamePlans,
    loading,
    createGamePlan,
    loadAllGamePlans,
  } = useGamePlan();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('week');

  // Form state for new game plan
  const [opponentName, setOpponentName] = useState('');
  const [week, setWeek] = useState(1);
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [formError, setFormError] = useState('');

  // Load all game plans on mount
  useEffect(() => {
    loadAllGamePlans();
  }, [loadAllGamePlans]);

  // Sorted game plans
  const sortedPlans = useMemo(() => {
    const plans = [...gamePlans];
    if (sortBy === 'week') {
      plans.sort((a, b) => a.week - b.week);
    } else {
      plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return plans;
  }, [gamePlans, sortBy]);

  const handleCreateGamePlan = useCallback(async () => {
    if (!opponentName.trim()) {
      setFormError('Opponent name is required');
      return;
    }

    const plan = await createGamePlan({
      name: `Week ${week} vs ${opponentName.trim()}`,
      opponent: opponentName.trim(),
      week,
      season,
    });

    setShowCreateModal(false);
    setOpponentName('');
    setWeek(1);
    setFormError('');
    router.push(`/gameplan/${plan.id}`);
  }, [opponentName, week, season, createGamePlan, router]);

  const handleOpenCreate = useCallback(() => {
    setOpponentName('');
    setWeek(1);
    setSeason(new Date().getFullYear().toString());
    setFormError('');
    setShowCreateModal(true);
  }, []);

  const getTotalPlayCount = useCallback((plan: typeof gamePlans[0]): number => {
    return plan.sections.reduce((sum, s) => sum + s.plays.length, 0);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="gameplan-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading game plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="gameplan-list-page">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Game Plans</h1>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-700 dark:text-zinc-300"
            data-testid="sort-select"
            aria-label="Sort by"
          >
            <option value="week">Sort by Week</option>
            <option value="date">Sort by Date</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            data-testid="new-gameplan-btn"
          >
            New Game Plan
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedPlans.length === 0 ? (
          <EmptyState
            title="No game plans yet"
            description="Create your first game plan to start organizing plays for upcoming games."
            actionLabel="New Game Plan"
            onAction={handleOpenCreate}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="gameplan-grid">
            {sortedPlans.map((plan) => {
              const playCount = getTotalPlayCount(plan);
              return (
                <button
                  key={plan.id}
                  onClick={() => router.push(`/gameplan/${plan.id}`)}
                  className="flex flex-col text-left p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  data-testid={`gameplan-card-${plan.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold">
                      {plan.week}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {plan.season}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    vs {plan.opponent}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    Week {plan.week}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400" data-testid={`play-count-${plan.id}`}>
                      {playCount} {playCount === 1 ? 'play' : 'plays'}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {formatDate(plan.createdAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Game Plan Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} size="sm">
        <ModalHeader>New Game Plan</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="opponent-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Opponent
              </label>
              <input
                id="opponent-name"
                type="text"
                value={opponentName}
                onChange={(e) => {
                  setOpponentName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g., Lincoln High"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm',
                  formError ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-600',
                  'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                )}
                data-testid="opponent-input"
                autoFocus
              />
              {formError && (
                <p className="mt-1 text-xs text-red-500" data-testid="form-error">{formError}</p>
              )}
            </div>

            <div>
              <label htmlFor="week-number" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Week
              </label>
              <input
                id="week-number"
                type="number"
                min={1}
                max={20}
                value={week}
                onChange={(e) => setWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="week-input"
              />
            </div>

            <div>
              <label htmlFor="season-input" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Season
              </label>
              <input
                id="season-input"
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g., 2025"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="season-input"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCreateModal(false)}
            data-testid="cancel-create-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateGamePlan}
            data-testid="create-gameplan-btn"
          >
            Create Game Plan
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
