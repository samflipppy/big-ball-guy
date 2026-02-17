'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BUILT_IN_BLOCKING_SCHEMES, applyBlockingScheme } from '@/lib/blocking-schemes';
import type { Formation, BlockingScheme, PlayerAssignment } from '@/types';

interface RunPlayBuilderProps {
  formation: Formation;
  onApplyScheme: (assignments: PlayerAssignment[], schemeId: string) => void;
  className?: string;
}

type RunDirection = 'left' | 'right' | 'middle';

const RUN_SCHEMES = BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'run');

export default function RunPlayBuilder({
  formation,
  onApplyScheme,
  className,
}: RunPlayBuilderProps) {
  const [selectedScheme, setSelectedScheme] = useState<BlockingScheme | null>(null);
  const [ballCarrier, setBallCarrier] = useState<string>('rb');
  const [runDirection, setRunDirection] = useState<RunDirection>('middle');
  const [showDetails, setShowDetails] = useState(false);

  // Find eligible ball carriers (RB, FB, QB for designed runs)
  const eligibleCarriers = useMemo(() => {
    return formation.players.filter(
      (p) =>
        p.position === 'RB' ||
        p.position === 'FB' ||
        p.position === 'QB' ||
        p.label === 'RB' ||
        p.label === 'FB' ||
        p.label === 'TB'
    );
  }, [formation]);

  const handleSchemeSelect = useCallback((scheme: BlockingScheme) => {
    setSelectedScheme(scheme);
    setShowDetails(true);
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedScheme) return;

    const assignments = applyBlockingScheme(selectedScheme, formation);

    // Add ball carrier assignment
    const carrierPlayer = formation.players.find((p) => p.id === ballCarrier);
    if (carrierPlayer) {
      const carrierAssignment: PlayerAssignment = {
        playerId: ballCarrier,
        label: `Ball carrier - ${runDirection}`,
      };
      assignments.push(carrierAssignment);
    }

    onApplyScheme(assignments, selectedScheme.id);
  }, [selectedScheme, formation, ballCarrier, runDirection, onApplyScheme]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Scheme Grid */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Select Blocking Scheme
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {RUN_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => handleSchemeSelect(scheme)}
              className={cn(
                'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                selectedScheme?.id === scheme.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
              )}
            >
              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                {scheme.name}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                {scheme.description}
              </span>
              <div className="flex flex-wrap gap-1 mt-2">
                {scheme.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scheme Details Panel */}
      {showDetails && selectedScheme && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-900">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            {selectedScheme.name} Details
          </h4>

          {/* Blocking Rules */}
          <div className="mb-4">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Blocking Assignments:
            </p>
            <div className="space-y-1">
              {selectedScheme.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs bg-white dark:bg-zinc-800 p-2 rounded border border-zinc-200 dark:border-zinc-700"
                >
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 w-8">
                    {rule.position}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400 flex-1">
                    {rule.rule}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {rule.blockType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ball Carrier Selection */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Ball Carrier
            </label>
            <select
              value={ballCarrier}
              onChange={(e) => setBallCarrier(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm"
            >
              {eligibleCarriers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.position})
                </option>
              ))}
            </select>
          </div>

          {/* Run Direction */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Run Direction
            </label>
            <div className="flex gap-2">
              {(['left', 'middle', 'right'] as RunDirection[]).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setRunDirection(dir)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                    runDirection === dir
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  )}
                >
                  {dir === 'left' && '← Left'}
                  {dir === 'middle' && 'Middle'}
                  {dir === 'right' && 'Right →'}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Blocking Scheme
          </button>
        </div>
      )}
    </div>
  );
}
