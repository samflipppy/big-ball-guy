'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BUILT_IN_BLOCKING_SCHEMES } from '@/lib/blocking-schemes';
import type { BlockingScheme, BlockingRule } from '@/types';

interface BlockingSchemeLibraryProps {
  onSelectScheme: (scheme: BlockingScheme) => void;
  selectedSchemeId?: string;
  className?: string;
}

/** Mini-diagram showing blocking arrows for each OL position in a scheme. */
function BlockingMiniDiagram({
  scheme,
  className,
}: {
  scheme: BlockingScheme;
  className?: string;
}) {
  const viewBox = '0 0 140 80';

  // OL positions mapped to x coordinates on the mini field
  const positionX: Record<string, number> = {
    LT: 25,
    LG: 45,
    C: 70,
    RG: 95,
    RT: 115,
    FB: 70,
    RB: 85,
    TE: 125,
  };

  const losY = 50;

  // Build arrows from rules
  const arrows = scheme.rules.map((rule, idx) => {
    const x = positionX[rule.position] ?? 70;
    const y = rule.position === 'FB' || rule.position === 'RB' ? losY + 14 : losY;

    // Determine arrow direction and length based on block type
    const { dx, dy } = getArrowVector(rule);

    return { x, y, dx, dy, rule, idx };
  });

  return (
    <svg
      viewBox={viewBox}
      className={cn('rounded bg-emerald-900', className)}
      data-testid={`scheme-diagram-${scheme.id}`}
    >
      {/* LOS */}
      <line
        x1={0} y1={losY} x2={140} y2={losY}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
      />

      {arrows.map(({ x, y, dx, dy, rule: r, idx }) => (
        <g key={`${r.position}-${idx}`}>
          {/* Arrow line */}
          <line
            x1={x}
            y1={y}
            x2={x + dx}
            y2={y + dy}
            stroke={getBlockColor(r.blockType)}
            strokeWidth={1.8}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${scheme.id})`}
          />
          {/* Player dot */}
          <circle
            cx={x}
            cy={y}
            r={4}
            fill="#2563eb"
            stroke="white"
            strokeWidth={0.8}
          />
        </g>
      ))}

      {/* Arrow marker definition */}
      <defs>
        <marker
          id={`arrowhead-${scheme.id}`}
          markerWidth="5"
          markerHeight="4"
          refX="4"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 5 2, 0 4" fill="#f59e0b" />
        </marker>
      </defs>
    </svg>
  );
}

function getArrowVector(rule: BlockingRule): { dx: number; dy: number } {
  const len = 16;
  switch (rule.blockType) {
    case 'zone':
      return { dx: rule.position === 'LT' || rule.position === 'LG' ? -4 : 4, dy: -len };
    case 'reach':
      return { dx: rule.position === 'LT' || rule.position === 'LG' ? -8 : 8, dy: -len * 0.7 };
    case 'pull':
      return { dx: rule.position === 'RG' || rule.position === 'RT' ? -20 : 20, dy: -len * 0.6 };
    case 'trap':
      return { dx: rule.position === 'LG' ? 15 : -15, dy: -len * 0.6 };
    case 'down':
      return { dx: rule.position === 'LT' || rule.position === 'LG' ? 6 : -6, dy: -len };
    case 'double':
      return { dx: 0, dy: -len };
    case 'drive':
      return { dx: 0, dy: -len };
    case 'pass-pro':
      return { dx: 0, dy: -len * 0.5 };
    case 'man':
      return { dx: 0, dy: -len };
    default:
      return { dx: 0, dy: -len };
  }
}

function getBlockColor(blockType: string): string {
  switch (blockType) {
    case 'zone': return '#3b82f6';
    case 'reach': return '#16a34a';
    case 'pull': return '#f59e0b';
    case 'trap': return '#dc2626';
    case 'down': return '#8b5cf6';
    case 'double': return '#0891b2';
    case 'drive': return '#2563eb';
    case 'pass-pro': return '#6b7280';
    case 'man': return '#2563eb';
    default: return '#2563eb';
  }
}

export default function BlockingSchemeLibrary({
  onSelectScheme,
  selectedSchemeId,
  className,
}: BlockingSchemeLibraryProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'run' | 'pass'>('all');

  const filteredSchemes = useMemo(() => {
    if (typeFilter === 'all') return BUILT_IN_BLOCKING_SCHEMES;
    return BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === typeFilter);
  }, [typeFilter]);

  return (
    <div className={cn('flex flex-col', className)} data-testid="blocking-scheme-library">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900">Blocking Schemes</h3>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'run' | 'pass')}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="scheme-type-filter"
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          <option value="run">Run</option>
          <option value="pass">Pass</option>
        </select>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredSchemes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-zinc-400"
            data-testid="no-schemes"
          >
            <p className="text-sm">No schemes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="scheme-grid">
            {filteredSchemes.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => onSelectScheme(scheme)}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-2 transition-all hover:shadow-md',
                  selectedSchemeId === scheme.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300',
                )}
                data-testid={`scheme-card-${scheme.id}`}
              >
                <BlockingMiniDiagram
                  scheme={scheme}
                  className="mb-2 h-16 w-full"
                />
                <span className="text-xs font-medium text-zinc-800 truncate w-full text-center">
                  {scheme.name}
                </span>
                <span
                  className={cn(
                    'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                    scheme.type === 'run'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700',
                  )}
                  data-testid={`scheme-badge-${scheme.id}`}
                >
                  {scheme.type === 'run' ? 'Run' : 'Pass'}
                </span>
                <span className="mt-1 text-[10px] text-zinc-400 truncate w-full text-center">
                  {scheme.description.slice(0, 60) + (scheme.description.length > 60 ? '...' : '')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
