'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Play, Formation, PlayerPosition, OffensivePosition } from '@/types';

// --- Position group definitions ---

export type PositionGroup = 'QB' | 'RB/FB' | 'WR/TE' | 'OL';

const POSITION_GROUPS: Record<PositionGroup, OffensivePosition[]> = {
  QB: ['QB'],
  'RB/FB': ['RB', 'FB'],
  'WR/TE': ['WR', 'TE', 'X', 'Y', 'Z', 'H', 'F'],
  OL: ['LT', 'LG', 'C', 'RG', 'RT', 'T'],
};

const TAB_ORDER: PositionGroup[] = ['QB', 'RB/FB', 'WR/TE', 'OL'];

// --- Props ---

export interface PositionFilteredViewProps {
  plays: Play[];
  formations: Formation[];
  selectedPosition?: PositionGroup;
  onPlayClick?: (playId: string) => void;
  className?: string;
}

// --- Helpers ---

function positionMatchesGroup(
  position: PlayerPosition,
  group: PositionGroup,
): boolean {
  return (POSITION_GROUPS[group] as string[]).includes(position);
}

function getFilteredPlaysWithPlayers(
  plays: Play[],
  formations: Formation[],
  group: PositionGroup,
): { play: Play; formation: Formation; playerIds: string[] }[] {
  const formationMap = new Map<string, Formation>();
  for (const f of formations) {
    formationMap.set(f.id, f);
  }

  const results: { play: Play; formation: Formation; playerIds: string[] }[] = [];

  for (const play of plays) {
    const formation = formationMap.get(play.formationId);
    if (!formation) continue;

    // Find players in this formation that match the position group
    const matchingPlayers = formation.players.filter((p) =>
      positionMatchesGroup(p.position, group),
    );

    if (matchingPlayers.length === 0) continue;

    // Check if any of these players have an assignment in the play
    const matchingPlayerIds = matchingPlayers
      .filter((p) => play.assignments.some((a) => a.playerId === p.id))
      .map((p) => p.id);

    // Include the play even if there are matching players without explicit assignments
    // (the position exists in the formation)
    results.push({
      play,
      formation,
      playerIds: matchingPlayerIds.length > 0 ? matchingPlayerIds : matchingPlayers.map((p) => p.id),
    });
  }

  return results;
}

// --- Sub-components ---

function PlayCardFiltered({
  play,
  formation,
  highlightPlayerIds,
  onClick,
}: {
  play: Play;
  formation: Formation;
  highlightPlayerIds: string[];
  onClick?: (playId: string) => void;
}) {
  const handleClick = useCallback(() => {
    onClick?.(play.id);
  }, [onClick, play.id]);

  // Get assignment summary for highlighted players
  const assignmentSummary = useMemo(() => {
    return highlightPlayerIds.map((pid) => {
      const player = formation.players.find((p) => p.id === pid);
      const assignment = play.assignments.find((a) => a.playerId === pid);
      if (!player) return null;

      let desc = 'No assignment';
      if (assignment?.route) {
        desc = assignment.route.name || assignment.route.type;
      } else if (assignment?.blocking) {
        desc = `${assignment.blocking.blockType} block`;
      } else if (assignment?.motion) {
        desc = `Motion ${assignment.motion.timing}`;
      } else if (assignment?.label) {
        desc = assignment.label;
      }

      return { label: player.label, description: desc };
    }).filter(Boolean);
  }, [highlightPlayerIds, formation.players, play.assignments]);

  return (
    <div
      className={cn(
        'group flex flex-col rounded-lg border border-zinc-200 bg-white',
        'overflow-hidden transition-all hover:border-zinc-300 hover:shadow-md cursor-pointer',
      )}
      onClick={handleClick}
      data-testid={`filtered-play-card-${play.id}`}
      role="button"
      tabIndex={0}
    >
      {/* Thumbnail with highlighted player */}
      <svg
        viewBox="0 0 800 500"
        className="h-32 w-full rounded-t bg-emerald-900"
        data-testid="play-thumbnail"
      >
        {/* Line of scrimmage */}
        <line
          x1={0} y1={248} x2={800} y2={248}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={2}
        />
        {/* All players */}
        {formation.players.map((p) => {
          const isHighlighted = highlightPlayerIds.includes(p.id);
          return (
            <g key={p.id}>
              <circle
                cx={p.location.x}
                cy={p.location.y}
                r={isHighlighted ? 14 : 10}
                fill={isHighlighted ? '#f59e0b' : '#3b82f6'}
                stroke="white"
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                data-testid={isHighlighted ? `highlighted-player-${p.id}` : undefined}
              />
              {isHighlighted && (
                <text
                  x={p.location.x}
                  y={p.location.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Draw routes for highlighted players */}
        {highlightPlayerIds.map((pid) => {
          const assignment = play.assignments.find((a) => a.playerId === pid);
          const player = formation.players.find((p) => p.id === pid);
          if (!assignment?.route || !player) return null;
          const points = assignment.route.points;
          if (points.length < 2) return null;

          const pathData = points
            .map((pt, i) => {
              const x = player.location.x + pt.x;
              const y = player.location.y + pt.y;
              return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            })
            .join(' ');

          return (
            <path
              key={`route-${pid}`}
              d={pathData}
              stroke="#f59e0b"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-testid={`route-line-${pid}`}
            />
          );
        })}
      </svg>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <h4 className="text-sm font-medium text-zinc-900 truncate">{play.name}</h4>
        <p className="text-xs text-zinc-500 truncate">
          {formation.name} · {play.personnel}
        </p>
        {assignmentSummary.length > 0 && (
          <div className="mt-1 space-y-0.5" data-testid="assignment-summary">
            {assignmentSummary.map((item, idx) => (
              <p key={idx} className="text-xs text-amber-700 font-medium">
                {item!.label}: {item!.description}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function PositionFilteredView({
  plays,
  formations,
  selectedPosition,
  onPlayClick,
  className,
}: PositionFilteredViewProps) {
  const [activeTab, setActiveTab] = useState<PositionGroup>(
    selectedPosition ?? 'QB',
  );

  const filteredResults = useMemo(
    () => getFilteredPlaysWithPlayers(plays, formations, activeTab),
    [plays, formations, activeTab],
  );

  const handleTabClick = useCallback((group: PositionGroup) => {
    setActiveTab(group);
  }, []);

  return (
    <div className={cn('flex flex-col', className)} data-testid="position-filtered-view">
      {/* Tab bar */}
      <div
        className="flex border-b border-zinc-200 bg-white"
        data-testid="position-tab-bar"
        role="tablist"
      >
        {TAB_ORDER.map((group) => (
          <button
            key={group}
            role="tab"
            aria-selected={activeTab === group}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === group
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
            )}
            onClick={() => handleTabClick(group)}
            data-testid={`position-tab-${group}`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between px-4 py-3" data-testid="results-header">
        <h3 className="text-sm font-medium text-zinc-700">
          {activeTab} Assignments
        </h3>
        <span className="text-xs text-zinc-400" data-testid="results-count">
          {filteredResults.length} {filteredResults.length === 1 ? 'play' : 'plays'}
        </span>
      </div>

      {/* Grid of play cards */}
      {filteredResults.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-4 px-4 pb-4 sm:grid-cols-3 lg:grid-cols-4"
          data-testid="filtered-play-grid"
        >
          {filteredResults.map(({ play, formation, playerIds }) => (
            <PlayCardFiltered
              key={play.id}
              play={play}
              formation={formation}
              highlightPlayerIds={playerIds}
              onClick={onPlayClick}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-testid="no-results"
        >
          <p className="text-sm text-zinc-500">
            No plays found with {activeTab} assignments
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Try selecting a different position group
          </p>
        </div>
      )}
    </div>
  );
}
