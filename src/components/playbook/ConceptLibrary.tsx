'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BUILT_IN_CONCEPTS, getAllConceptTags } from '@/lib/concepts';
import type { Concept } from '@/types';

interface ConceptLibraryProps {
  onSelectConcept: (concept: Concept) => void;
  selectedConceptId?: string;
  className?: string;
}

/** Mini route diagram rendered in an SVG for each concept card */
function ConceptMiniDiagram({
  concept,
  className,
}: {
  concept: Concept;
  className?: string;
}) {
  // We render route arrows in a small viewbox.
  // Each route starts at a player dot and draws its path points.
  const viewBox = '0 0 120 80';
  const SCALE = 1.5;

  return (
    <svg
      viewBox={viewBox}
      className={cn('rounded bg-emerald-900', className)}
      data-testid={`concept-diagram-${concept.id}`}
    >
      {/* LOS */}
      <line
        x1={0} y1={40} x2={120} y2={40}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
      />
      {concept.routes.map((cr, idx) => {
        // Place each route's "player" dot evenly across the LOS
        const playerX = 25 + idx * (70 / Math.max(concept.routes.length - 1, 1));
        const playerY = 42;

        // Build path from route points
        const pathPoints = cr.route.points.map((pt) => ({
          x: playerX + pt.x * SCALE,
          y: playerY + pt.y * SCALE,
        }));

        const d = pathPoints
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
          .join(' ');

        const lastPt = pathPoints[pathPoints.length - 1];

        return (
          <g key={cr.route.id}>
            {/* Route line */}
            <path
              d={d}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Arrow tip */}
            {lastPt && (
              <circle cx={lastPt.x} cy={lastPt.y} r={2} fill="#3b82f6" />
            )}
            {/* Player dot */}
            <circle
              cx={playerX}
              cy={playerY}
              r={4}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={1}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function ConceptLibrary({
  onSelectConcept,
  selectedConceptId,
  className,
}: ConceptLibraryProps) {
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allTags = useMemo(() => getAllConceptTags(), []);

  const filteredConcepts = useMemo(() => {
    let result: Concept[] = BUILT_IN_CONCEPTS;

    if (tagFilter !== 'all') {
      result = result.filter((c) => c.tags.includes(tagFilter));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [tagFilter, searchQuery]);

  return (
    <div className={cn('flex flex-col', className)} data-testid="concept-library">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900">Concepts</h3>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100">
        <input
          type="text"
          placeholder="Search concepts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="concept-search"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="concept-tag-filter"
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredConcepts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-zinc-400"
            data-testid="no-concepts"
          >
            <p className="text-sm">No concepts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="concept-grid">
            {filteredConcepts.map((concept) => (
              <button
                key={concept.id}
                onClick={() => onSelectConcept(concept)}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-2 transition-all hover:shadow-md',
                  selectedConceptId === concept.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300',
                )}
                data-testid={`concept-card-${concept.id}`}
              >
                <ConceptMiniDiagram
                  concept={concept}
                  className="mb-2 h-16 w-full"
                />
                <span className="text-xs font-medium text-zinc-800 truncate w-full text-center">
                  {concept.name}
                </span>
                <span className="text-[10px] text-zinc-400 truncate w-full text-center">
                  {concept.description
                    ? concept.description.slice(0, 50) + (concept.description.length > 50 ? '...' : '')
                    : ''}
                </span>
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {concept.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
