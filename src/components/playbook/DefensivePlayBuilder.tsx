'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFENSIVE_FRONTS_LIBRARY,
  COVERAGES_LIBRARY,
  type DefensiveFront,
  type CoverageDefinition,
} from '@/lib/defenses';
import type { DefensiveOverlay, Player } from '@/types';

interface DefensivePlayBuilderProps {
  onApplyDefense: (defense: DefensiveOverlay) => void;
  className?: string;
}

type BlitzPackage = {
  id: string;
  name: string;
  description: string;
  rushers: string[];
};

const BLITZ_PACKAGES: BlitzPackage[] = [
  {
    id: 'no-blitz',
    name: 'No Blitz',
    description: 'Base pass rush only',
    rushers: [],
  },
  {
    id: 'mlb-blitz',
    name: 'Mike Blitz',
    description: 'MLB blitzes A-gap',
    rushers: ['mlb'],
  },
  {
    id: 'sam-blitz',
    name: 'Sam Blitz',
    description: 'Strong-side LB blitzes',
    rushers: ['slb'],
  },
  {
    id: 'will-blitz',
    name: 'Will Blitz',
    description: 'Weak-side LB blitzes',
    rushers: ['wlb'],
  },
  {
    id: 'ss-blitz',
    name: 'SS Blitz',
    description: 'Strong safety blitzes off edge',
    rushers: ['ss'],
  },
  {
    id: 'cb-blitz',
    name: 'Corner Blitz',
    description: 'Cornerback blitzes',
    rushers: ['cb1'],
  },
  {
    id: 'zone-blitz',
    name: 'Zone Blitz',
    description: 'DE drops into coverage, LB rushes',
    rushers: ['mlb', 'wlb'],
  },
  {
    id: 'double-a-gap',
    name: 'Double A-Gap',
    description: 'Both ILBs blitz A-gaps',
    rushers: ['mlb', 'ilb1', 'ilb2'],
  },
];

export default function DefensivePlayBuilder({
  onApplyDefense,
  className,
}: DefensivePlayBuilderProps) {
  const [selectedFront, setSelectedFront] = useState<DefensiveFront | null>(null);
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageDefinition | null>(null);
  const [selectedBlitz, setSelectedBlitz] = useState<BlitzPackage>(BLITZ_PACKAGES[0]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Combine front and coverage to create the defense
  const defensivePlayers = useMemo((): Player[] => {
    if (!selectedFront) return [];
    return selectedFront.players;
  }, [selectedFront]);

  const handleFrontSelect = useCallback((front: DefensiveFront) => {
    setSelectedFront(front);
    setStep(2);
  }, []);

  const handleCoverageSelect = useCallback((coverage: CoverageDefinition) => {
    setSelectedCoverage(coverage);
    setStep(3);
  }, []);

  const handleBlitzSelect = useCallback((blitz: BlitzPackage) => {
    setSelectedBlitz(blitz);
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedFront || !selectedCoverage) return;

    const defense: DefensiveOverlay = {
      front: selectedFront.name,
      coverage: selectedCoverage.name,
      players: defensivePlayers,
      blitz: selectedBlitz.id !== 'no-blitz' ? selectedBlitz.name : undefined,
    };

    onApplyDefense(defense);
  }, [selectedFront, selectedCoverage, selectedBlitz, defensivePlayers, onApplyDefense]);

  const handleBack = useCallback(() => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }, [step]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            step >= 1 ? 'text-red-600' : 'text-zinc-400'
          )}
        >
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
              step >= 1 ? 'bg-red-600 text-white' : 'bg-zinc-300 text-zinc-500'
            )}
          >
            1
          </span>
          Front
        </div>
        <div className="h-px flex-1 bg-zinc-300" />
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            step >= 2 ? 'text-red-600' : 'text-zinc-400'
          )}
        >
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
              step >= 2 ? 'bg-red-600 text-white' : 'bg-zinc-300 text-zinc-500'
            )}
          >
            2
          </span>
          Coverage
        </div>
        <div className="h-px flex-1 bg-zinc-300" />
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            step >= 3 ? 'text-red-600' : 'text-zinc-400'
          )}
        >
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
              step >= 3 ? 'bg-red-600 text-white' : 'bg-zinc-300 text-zinc-500'
            )}
          >
            3
          </span>
          Blitz
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Step 1: Select Front */}
        {step === 1 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Select Defensive Front
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DEFENSIVE_FRONTS_LIBRARY.map((front) => (
                <button
                  key={front.id}
                  onClick={() => handleFrontSelect(front)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                    selectedFront?.id === front.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                  )}
                >
                  {/* Mini preview */}
                  <div className="w-full h-12 mb-2 rounded bg-emerald-900 relative overflow-hidden">
                    <svg viewBox="0 0 800 250" className="w-full h-full">
                      <line
                        x1={0}
                        y1={248}
                        x2={800}
                        y2={248}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={2}
                      />
                      {front.players.map((p) => (
                        <g key={p.id}>
                          {p.position === 'DE' || p.position === 'DT' || p.position === 'NT' ? (
                            <rect
                              x={p.location.x - 8}
                              y={p.location.y - 8}
                              width={16}
                              height={16}
                              fill="#dc2626"
                              stroke="white"
                              strokeWidth={1}
                            />
                          ) : (
                            <polygon
                              points={`${p.location.x},${p.location.y - 10} ${p.location.x - 9},${p.location.y + 6} ${p.location.x + 9},${p.location.y + 6}`}
                              fill="#dc2626"
                              stroke="white"
                              strokeWidth={1}
                            />
                          )}
                        </g>
                      ))}
                    </svg>
                  </div>
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {front.name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                    {front.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Coverage */}
        {step === 2 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Select Coverage
              </h3>
              <button
                onClick={handleBack}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                ← Back to Fronts
              </button>
            </div>

            {/* Selected Front Preview */}
            {selectedFront && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  Selected Front: {selectedFront.name}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {COVERAGES_LIBRARY.map((coverage) => (
                <button
                  key={coverage.id}
                  onClick={() => handleCoverageSelect(coverage)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                    selectedCoverage?.id === coverage.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                  )}
                >
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {coverage.name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                    {coverage.description}
                  </span>
                  <div className="flex gap-1 mt-2">
                    {coverage.zones.filter((z) => z.type === 'man').length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {coverage.zones.filter((z) => z.type === 'man').length} Man
                      </span>
                    )}
                    {coverage.zones.filter((z) => z.type === 'zone').length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {coverage.zones.filter((z) => z.type === 'zone').length} Zone
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Blitz Package */}
        {step === 3 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Select Blitz Package
              </h3>
              <button
                onClick={handleBack}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                ← Back to Coverage
              </button>
            </div>

            {/* Selected Front & Coverage Preview */}
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex gap-3 text-xs">
                <span className="font-medium text-red-700 dark:text-red-400">
                  Front: {selectedFront?.name}
                </span>
                <span className="text-red-300 dark:text-red-700">|</span>
                <span className="font-medium text-red-700 dark:text-red-400">
                  Coverage: {selectedCoverage?.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {BLITZ_PACKAGES.map((blitz) => (
                <button
                  key={blitz.id}
                  onClick={() => handleBlitzSelect(blitz)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                    selectedBlitz.id === blitz.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                  )}
                >
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {blitz.name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {blitz.description}
                  </span>
                </button>
              ))}
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              disabled={!selectedFront || !selectedCoverage}
              className={cn(
                'w-full py-2.5 rounded-lg font-medium transition-colors',
                selectedFront && selectedCoverage
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
              )}
            >
              Create Defensive Play
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
