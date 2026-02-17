'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ROUTE_CATEGORIES,
  BUILT_IN_ROUTES,
  type RouteDefinition,
  mirrorRoute,
} from '@/lib/route-tree';
import { getRouteCategoriesWithCustom, getCustomRoutes } from '@/lib/custom-routes';

interface RoutePickerProps {
  onSelectRoute: (route: RouteDefinition, mirrored: boolean) => void;
  onCancel: () => void;
  selectedRouteId?: string;
  /** If true, show mirrored version option */
  showMirror?: boolean;
  /** Team ID for loading custom routes */
  teamId?: string;
  className?: string;
}

/**
 * Visual route picker component
 * Shows routes organized by category with visual previews
 */
export function RoutePicker({
  onSelectRoute,
  onCancel,
  selectedRouteId,
  showMirror = true,
  teamId = 'default',
  className,
}: RoutePickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [hoveredRoute, setHoveredRoute] = useState<RouteDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mirrorEnabled, setMirrorEnabled] = useState(false);
  const [customRoutes, setCustomRoutes] = useState<RouteDefinition[]>([]);

  // Load custom routes on mount
  useEffect(() => {
    setCustomRoutes(getCustomRoutes(teamId));
  }, [teamId]);

  // Get all categories including custom routes
  const allCategories = useMemo(() => {
    return getRouteCategoriesWithCustom(teamId);
  }, [teamId, customRoutes]);

  // Filter routes by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;

    const q = searchQuery.toLowerCase();
    return allCategories.map((cat) => ({
      ...cat,
      routes: cat.routes.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.includes(q))
      ),
    })).filter((cat) => cat.routes.length > 0);
  }, [searchQuery, allCategories]);

  const handleRouteSelect = useCallback(
    (route: RouteDefinition) => {
      const finalRoute = mirrorEnabled ? mirrorRoute(route) : route;
      onSelectRoute(finalRoute, mirrorEnabled);
    },
    [onSelectRoute, mirrorEnabled]
  );

  // Mini route preview SVG
  const RoutePreview = ({ route, size = 50 }: { route: RouteDefinition; size?: number }) => {
    const scale = size / 50;
    const centerX = size / 2;
    const centerY = size - 10;

    // Build path from route points
    const pathPoints = route.points.map((p, i) => {
      const x = centerX + (mirrorEnabled ? -p.x : p.x) * 1.5;
      const y = centerY + p.y * 1.5;
      if (i === 0) return `M ${x} ${y}`;
      if (p.type === 'curve') return `Q ${x} ${y}`;
      return `L ${x} ${y}`;
    });

    // Create smooth path
    let pathD = '';
    route.points.forEach((p, i) => {
      const x = centerX + (mirrorEnabled ? -p.x : p.x) * 1.5;
      const y = centerY + p.y * 1.5;
      if (i === 0) {
        pathD = `M ${x} ${y}`;
      } else if (p.type === 'curve' && i < route.points.length - 1) {
        const next = route.points[i + 1];
        const nextX = centerX + (mirrorEnabled ? -next.x : next.x) * 1.5;
        const nextY = centerY + next.y * 1.5;
        pathD += ` Q ${x} ${y} ${nextX} ${nextY}`;
      } else if (p.type === 'break') {
        pathD += ` L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="bg-emerald-900 rounded"
      >
        {/* Player dot at start */}
        <circle cx={centerX} cy={centerY} r={4} fill="#3b82f6" stroke="white" strokeWidth={1} />
        {/* Route path */}
        <path
          d={pathD}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow at end */}
        {route.points.length > 1 && (
          <circle
            cx={centerX + (mirrorEnabled ? -route.points[route.points.length - 1].x : route.points[route.points.length - 1].x) * 1.5}
            cy={centerY + route.points[route.points.length - 1].y * 1.5}
            r={3}
            fill="#f59e0b"
          />
        )}
      </svg>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden',
        className
      )}
      style={{ width: 400, maxHeight: 500 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Select Route</h3>
          <a
            href="/playbook/routes"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit Route Tree
          </a>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
        <input
          type="text"
          placeholder="Search routes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Mirror toggle */}
      {showMirror && (
        <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={mirrorEnabled}
              onChange={(e) => setMirrorEnabled(e.target.checked)}
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            Mirror route (flip left/right)
          </label>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto">
        {filteredCategories.map((cat, idx) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(idx)}
            className={cn(
              'px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
              activeCategory === idx
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Routes grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2">
          {filteredCategories[activeCategory]?.routes.map((route) => (
            <button
              key={route.id}
              onClick={() => handleRouteSelect(route)}
              onMouseEnter={() => setHoveredRoute(route)}
              onMouseLeave={() => setHoveredRoute(null)}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg border transition-all relative',
                selectedRouteId === route.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
              )}
            >
              {/* Custom route badge */}
              {!route.isBuiltIn && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" title="Custom route" />
              )}
              <RoutePreview route={route} size={50} />
              <span className="mt-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 text-center">
                {route.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hovered route details */}
      {hoveredRoute && (
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
          <div className="flex items-start gap-3">
            <RoutePreview route={hoveredRoute} size={60} />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                {hoveredRoute.name}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {hoveredRoute.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {hoveredRoute.depth} yds
                </span>
                {hoveredRoute.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutePicker;
