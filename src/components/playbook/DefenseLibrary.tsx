'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFENSIVE_FRONTS_LIBRARY,
  COVERAGES_LIBRARY,
  type DefensiveFront,
  type CoverageDefinition,
} from '@/lib/defenses';
import type { Player } from '@/types';

interface DefenseLibraryProps {
  onSelectFront: (front: DefensiveFront) => void;
  onSelectCoverage: (coverage: CoverageDefinition) => void;
  selectedFront?: string;
  selectedCoverage?: string;
  className?: string;
}

type TabValue = 'fronts' | 'coverages';

/**
 * Mini-field preview showing defensive player positions as dots.
 */
function FrontMiniPreview({
  players,
  selected,
}: {
  players: Player[];
  selected: boolean;
}) {
  return (
    <svg
      viewBox="0 0 800 300"
      className="w-full h-full"
      data-testid="front-preview"
    >
      <rect x={0} y={0} width={800} height={300} rx={4} fill={selected ? '#1e3a5f' : '#1a2e1a'} />
      {/* LOS */}
      <line x1={0} y1={248} x2={800} y2={248} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
      {/* Player dots */}
      {players.map((p) => (
        <circle
          key={p.id}
          cx={p.location.x}
          cy={p.location.y}
          r={14}
          fill={selected ? '#60a5fa' : '#dc2626'}
          stroke="white"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

/**
 * Coverage mini preview showing zone areas.
 */
function CoverageMiniPreview({
  coverage,
  selected,
}: {
  coverage: CoverageDefinition;
  selected: boolean;
}) {
  return (
    <svg
      viewBox="0 0 800 300"
      className="w-full h-full"
      data-testid="coverage-preview"
    >
      <rect x={0} y={0} width={800} height={300} rx={4} fill={selected ? '#1e3a5f' : '#1a2e1a'} />
      {/* LOS */}
      <line x1={0} y1={248} x2={800} y2={248} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
      {/* Zone areas */}
      {coverage.zones
        .filter((z) => z.type === 'zone' && z.area)
        .map((z, i) => (
          <rect
            key={`zone-${i}`}
            x={z.area!.x}
            y={z.area!.y}
            width={z.area!.width}
            height={z.area!.height}
            fill={selected ? 'rgba(96,165,250,0.18)' : 'rgba(239,68,68,0.18)'}
            stroke={selected ? 'rgba(96,165,250,0.5)' : 'rgba(239,68,68,0.4)'}
            strokeWidth={1}
            rx={3}
          />
        ))}
      {/* Man markers */}
      {coverage.zones
        .filter((z) => z.type === 'man')
        .map((z, i) => (
          <circle
            key={`man-${i}`}
            cx={400 + (i - 2) * 80}
            cy={180}
            r={6}
            fill="none"
            stroke={selected ? '#60a5fa' : '#f87171'}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        ))}
    </svg>
  );
}

export default function DefenseLibrary({
  onSelectFront,
  onSelectCoverage,
  selectedFront,
  selectedCoverage,
  className,
}: DefenseLibraryProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('fronts');

  const fronts = useMemo(() => DEFENSIVE_FRONTS_LIBRARY, []);
  const coverages = useMemo(() => COVERAGES_LIBRARY, []);

  return (
    <div className={cn('flex flex-col', className)} data-testid="defense-library">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900">Defensive Library</h3>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-zinc-200"
        data-testid="defense-tabs"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'fronts'}
          onClick={() => setActiveTab('fronts')}
          className={cn(
            'flex-1 py-2 text-xs font-medium text-center transition-colors',
            activeTab === 'fronts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-zinc-500 hover:text-zinc-700',
          )}
          data-testid="tab-fronts"
        >
          Fronts
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'coverages'}
          onClick={() => setActiveTab('coverages')}
          className={cn(
            'flex-1 py-2 text-xs font-medium text-center transition-colors',
            activeTab === 'coverages'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-zinc-500 hover:text-zinc-700',
          )}
          data-testid="tab-coverages"
        >
          Coverages
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'fronts' && (
          <div className="grid grid-cols-2 gap-3" data-testid="fronts-grid">
            {fronts.map((front) => {
              const isSelected = selectedFront === front.id;
              return (
                <button
                  key={front.id}
                  onClick={() => onSelectFront(front)}
                  className={cn(
                    'flex flex-col items-center rounded-lg border p-2 transition-all hover:shadow-md',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-zinc-200 bg-white hover:border-zinc-300',
                  )}
                  data-testid={`front-card-${front.id}`}
                  title={front.description}
                >
                  <div className="mb-1 h-12 w-full">
                    <FrontMiniPreview players={front.players} selected={isSelected} />
                  </div>
                  <span className="text-xs font-medium text-zinc-800 truncate w-full text-center">
                    {front.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'coverages' && (
          <div className="grid grid-cols-2 gap-3" data-testid="coverages-grid">
            {coverages.map((coverage) => {
              const isSelected = selectedCoverage === coverage.id;
              return (
                <button
                  key={coverage.id}
                  onClick={() => onSelectCoverage(coverage)}
                  className={cn(
                    'flex flex-col items-center rounded-lg border p-2 transition-all hover:shadow-md',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-zinc-200 bg-white hover:border-zinc-300',
                  )}
                  data-testid={`coverage-card-${coverage.id}`}
                  title={coverage.description}
                >
                  <div className="mb-1 h-12 w-full">
                    <CoverageMiniPreview coverage={coverage} selected={isSelected} />
                  </div>
                  <span className="text-xs font-medium text-zinc-800 truncate w-full text-center">
                    {coverage.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
