'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ROUTE_TREE,
  getRoutesForPosition,
  type RouteDefinition,
  type ReceiverPositionType,
} from '@/lib/routes';
import type { RouteType } from '@/types';

interface RouteLibraryProps {
  onSelectRoute: (route: RouteDefinition) => void;
  selectedRouteType?: RouteType;
  filterPosition?: ReceiverPositionType;
  className?: string;
}

const POSITION_FILTERS: { value: ReceiverPositionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'outside', label: 'WR' },
  { value: 'slot', label: 'Slot' },
  { value: 'te', label: 'TE' },
  { value: 'rb', label: 'RB' },
];

/**
 * Renders a small SVG preview of a route path.
 * Points are normalised into a 60x60 viewBox for consistent display.
 */
function RoutePreview({ route, selected }: { route: RouteDefinition; selected: boolean }) {
  // Compute bounding box so we can centre the path in the viewBox
  const xs = route.points.map((p) => p.x);
  const ys = route.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const pad = 8;
  const size = 60;
  const inner = size - pad * 2;

  const scale = Math.min(inner / rangeX, inner / rangeY);
  const offsetX = pad + (inner - rangeX * scale) / 2;
  const offsetY = pad + (inner - rangeY * scale) / 2;

  const scaled = route.points.map((p) => ({
    x: (p.x - minX) * scale + offsetX,
    y: (p.y - minY) * scale + offsetY,
  }));

  const pathD = scaled
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      data-testid={`route-preview-${route.type}`}
    >
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        rx={4}
        fill={selected ? '#1e3a5f' : '#1a2e1a'}
      />
      {/* Start dot */}
      <circle cx={scaled[0].x} cy={scaled[0].y} r={3} fill="#3b82f6" />
      {/* Route path */}
      <path
        d={pathD}
        fill="none"
        stroke={selected ? '#60a5fa' : '#ffffff'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow at end */}
      {scaled.length >= 2 && (
        <circle
          cx={scaled[scaled.length - 1].x}
          cy={scaled[scaled.length - 1].y}
          r={2.5}
          fill={selected ? '#60a5fa' : '#ffffff'}
        />
      )}
    </svg>
  );
}

export default function RouteLibrary({
  onSelectRoute,
  selectedRouteType,
  filterPosition,
  className,
}: RouteLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<ReceiverPositionType | 'all'>(
    filterPosition ?? 'all',
  );

  const filteredRoutes = useMemo(() => {
    if (activeFilter === 'all') {
      return ROUTE_TREE;
    }
    return getRoutesForPosition(activeFilter);
  }, [activeFilter]);

  return (
    <div className={cn('flex flex-col', className)} data-testid="route-library">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900">Route Tree</h3>
      </div>

      {/* Position filter tabs */}
      <div
        className="flex items-center gap-1 px-4 py-2 border-b border-zinc-100"
        data-testid="position-filters"
      >
        {POSITION_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              activeFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
            )}
            data-testid={`filter-${f.value}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Route grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredRoutes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-zinc-400"
            data-testid="no-routes"
          >
            <p className="text-sm">No routes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="route-grid">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRouteType === route.type;
              return (
                <button
                  key={route.id}
                  onClick={() => onSelectRoute(route)}
                  className={cn(
                    'flex flex-col items-center rounded-lg border p-2 transition-all hover:shadow-md',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-zinc-200 bg-white hover:border-zinc-300',
                  )}
                  data-testid={`route-card-${route.type}`}
                  title={route.description}
                >
                  <div className="mb-1 h-14 w-full">
                    <RoutePreview route={route} selected={isSelected} />
                  </div>
                  <span className="text-xs font-medium text-zinc-800 truncate w-full text-center">
                    {route.name}
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
