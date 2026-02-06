'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Concept, Play } from '@/types';
import type { DefensiveFront } from '@/lib/defenses';

export interface ConceptFrontMatrixProps {
  concepts: Concept[];
  fronts: DefensiveFront[];
  plays?: Play[];
  onCellClick: (conceptId: string, frontId: string) => void;
  className?: string;
}

/**
 * Mini play preview rendered in an SVG for each matrix cell.
 *
 * Shows the concept's route arrows against the front's defensive player dots.
 * Essentially a tiny thumbnail of the matchup.
 */
function CellPreview({
  concept,
  front,
  hasPlay,
  hasNotes,
}: {
  concept: Concept;
  front: DefensiveFront;
  hasPlay: boolean;
  hasNotes: boolean;
}) {
  const viewBox = '0 0 120 80';
  const SCALE = 0.8;
  const losY = 42;

  // Map front players to scaled positions within the mini viewbox
  const scaledDefense = front.players.map((p) => ({
    x: (p.location.x / 800) * 120,
    y: (p.location.y / 500) * 80,
  }));

  return (
    <svg viewBox={viewBox} className="w-full h-full rounded" data-testid="cell-preview">
      {/* Background */}
      <rect x={0} y={0} width={120} height={80} rx={2} fill={hasPlay ? '#1e3a2e' : '#1a2e1a'} />

      {/* LOS */}
      <line
        x1={0} y1={losY} x2={120} y2={losY}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={0.5}
      />

      {/* Defensive player dots */}
      {scaledDefense.map((pos, i) => (
        <circle
          key={`def-${i}`}
          cx={pos.x}
          cy={pos.y}
          r={2.5}
          fill="#dc2626"
          opacity={0.7}
        />
      ))}

      {/* Concept routes */}
      {concept.routes.map((cr, idx) => {
        const playerX = 25 + idx * (70 / Math.max(concept.routes.length - 1, 1));
        const playerY = losY + 4;

        const pathPoints = cr.route.points.map((pt) => ({
          x: playerX + pt.x * SCALE,
          y: playerY + pt.y * SCALE,
        }));

        const d = pathPoints
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
          .join(' ');

        return (
          <g key={cr.route.id}>
            <path
              d={d}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={playerX} cy={playerY} r={2.5} fill="#3b82f6" />
          </g>
        );
      })}

      {/* Notes/result indicator */}
      {hasNotes && (
        <circle cx={112} cy={8} r={4} fill="#f59e0b" opacity={0.9} data-testid="notes-indicator" />
      )}
    </svg>
  );
}

export default function ConceptFrontMatrix({
  concepts,
  fronts,
  plays = [],
  onCellClick,
  className,
}: ConceptFrontMatrixProps) {
  const [conceptTagFilter, setConceptTagFilter] = useState<string>('all');
  const [frontFilter, setFrontFilter] = useState<string>('all');

  // Collect all unique concept tags
  const allConceptTags = useMemo(() => {
    const tags = new Set<string>();
    for (const c of concepts) {
      for (const tag of c.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }, [concepts]);

  // Filtered concepts and fronts
  const filteredConcepts = useMemo(() => {
    if (conceptTagFilter === 'all') return concepts;
    return concepts.filter((c) => c.tags.includes(conceptTagFilter));
  }, [concepts, conceptTagFilter]);

  const filteredFronts = useMemo(() => {
    if (frontFilter === 'all') return fronts;
    return fronts.filter((f) => f.id === frontFilter);
  }, [fronts, frontFilter]);

  // Build a lookup map for plays by conceptId+frontId
  const playLookup = useMemo(() => {
    const map = new Map<string, Play>();
    for (const play of plays) {
      if (play.conceptId && play.defensiveOverlay?.front) {
        const key = `${play.conceptId}::${play.defensiveOverlay.front}`;
        map.set(key, play);
      }
    }
    return map;
  }, [plays]);

  // Check if a cell has a play and/or notes
  function getCellInfo(conceptId: string, frontId: string) {
    // Try matching by front id or front name
    const front = fronts.find((f) => f.id === frontId);
    const keysToCheck = [
      `${conceptId}::${frontId}`,
      ...(front ? [`${conceptId}::${front.name}`] : []),
    ];

    for (const key of keysToCheck) {
      const play = playLookup.get(key);
      if (play) {
        return { hasPlay: true, hasNotes: !!play.notes };
      }
    }
    return { hasPlay: false, hasNotes: false };
  }

  return (
    <div className={cn('flex flex-col', className)} data-testid="concept-front-matrix">
      {/* Header & Filters */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900">Concept x Front Matrix</h3>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100 flex-wrap">
        <select
          value={conceptTagFilter}
          onChange={(e) => setConceptTagFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="concept-tag-filter"
          aria-label="Filter by concept tag"
        >
          <option value="all">All Concepts</option>
          {allConceptTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <select
          value={frontFilter}
          onChange={(e) => setFrontFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="front-filter"
          aria-label="Filter by front"
        >
          <option value="all">All Fronts</option>
          {fronts.map((front) => (
            <option key={front.id} value={front.id}>
              {front.name}
            </option>
          ))}
        </select>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4" data-testid="matrix-scroll-container">
        {filteredConcepts.length === 0 || filteredFronts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-zinc-400"
            data-testid="no-results"
          >
            <p className="text-sm">No matching concepts or fronts</p>
          </div>
        ) : (
          <table className="border-collapse" data-testid="matrix-table">
            <thead>
              <tr>
                {/* Top-left empty corner cell */}
                <th className="sticky left-0 z-10 bg-white px-2 py-1 text-xs font-medium text-zinc-500 border-b border-r border-zinc-200 min-w-[100px]">
                  Concept / Front
                </th>
                {filteredFronts.map((front) => (
                  <th
                    key={front.id}
                    className="px-2 py-1 text-xs font-medium text-zinc-700 border-b border-zinc-200 min-w-[110px] text-center"
                    data-testid={`front-header-${front.id}`}
                  >
                    {front.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredConcepts.map((concept) => (
                <tr key={concept.id} data-testid={`concept-row-${concept.id}`}>
                  {/* Row header: concept name */}
                  <td
                    className="sticky left-0 z-10 bg-white px-2 py-1 text-xs font-medium text-zinc-800 border-r border-b border-zinc-200 whitespace-nowrap"
                    data-testid={`concept-label-${concept.id}`}
                  >
                    {concept.name}
                    <div className="flex gap-0.5 mt-0.5">
                      {concept.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-100 px-1 py-0 text-[8px] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  {filteredFronts.map((front) => {
                    const { hasPlay, hasNotes } = getCellInfo(concept.id, front.id);
                    return (
                      <td
                        key={front.id}
                        className={cn(
                          'border-b border-zinc-100 p-1',
                          hasPlay && 'bg-blue-50',
                          hasNotes && 'ring-1 ring-inset ring-amber-300',
                        )}
                      >
                        <button
                          onClick={() => onCellClick(concept.id, front.id)}
                          className={cn(
                            'block w-full rounded transition-shadow hover:shadow-md hover:ring-1 hover:ring-blue-400',
                            hasPlay ? 'ring-1 ring-blue-300' : '',
                          )}
                          data-testid={`cell-${concept.id}-${front.id}`}
                          title={`${concept.name} vs ${front.name}`}
                        >
                          <CellPreview
                            concept={concept}
                            front={front}
                            hasPlay={hasPlay}
                            hasNotes={hasNotes}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
