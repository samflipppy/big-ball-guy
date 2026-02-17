/**
 * Custom Routes Storage & Management
 *
 * Allows coaches to create, store, and manage their own custom route trees.
 * Custom routes are stored in localStorage and can be synced with the backend.
 */

import type { RoutePoint, RouteType } from '@/types';
import { BUILT_IN_ROUTES, type RouteDefinition, type RouteCategory } from './route-tree';

const STORAGE_KEY = 'custom-routes';

// ----------------------------------------------------------------------------
// Custom Route Storage
// ----------------------------------------------------------------------------

/**
 * Get all custom routes from storage
 */
export function getCustomRoutes(teamId: string = 'default'): RouteDefinition[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${teamId}`);
    if (!stored) return [];
    return JSON.parse(stored) as RouteDefinition[];
  } catch (err) {
    console.error('Failed to load custom routes:', err);
    return [];
  }
}

/**
 * Save custom routes to storage
 */
export function saveCustomRoutes(routes: RouteDefinition[], teamId: string = 'default'): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`${STORAGE_KEY}-${teamId}`, JSON.stringify(routes));
  } catch (err) {
    console.error('Failed to save custom routes:', err);
  }
}

/**
 * Add a new custom route
 */
export function addCustomRoute(route: RouteDefinition, teamId: string = 'default'): void {
  const routes = getCustomRoutes(teamId);
  routes.push({
    ...route,
    isBuiltIn: false,
    teamId,
  });
  saveCustomRoutes(routes, teamId);
}

/**
 * Update an existing custom route
 */
export function updateCustomRoute(routeId: string, updates: Partial<RouteDefinition>, teamId: string = 'default'): void {
  const routes = getCustomRoutes(teamId);
  const index = routes.findIndex((r) => r.id === routeId);
  if (index >= 0) {
    routes[index] = { ...routes[index], ...updates };
    saveCustomRoutes(routes, teamId);
  }
}

/**
 * Delete a custom route
 */
export function deleteCustomRoute(routeId: string, teamId: string = 'default'): void {
  const routes = getCustomRoutes(teamId);
  const filtered = routes.filter((r) => r.id !== routeId);
  saveCustomRoutes(filtered, teamId);
}

// ----------------------------------------------------------------------------
// Combined Route Library (Built-in + Custom)
// ----------------------------------------------------------------------------

/**
 * Get all routes (built-in + custom)
 */
export function getAllRoutes(teamId: string = 'default'): RouteDefinition[] {
  const customRoutes = getCustomRoutes(teamId);
  return [...BUILT_IN_ROUTES, ...customRoutes];
}

/**
 * Get route by ID (checks both built-in and custom)
 */
export function getRouteByIdGlobal(routeId: string, teamId: string = 'default'): RouteDefinition | undefined {
  const allRoutes = getAllRoutes(teamId);
  return allRoutes.find((r) => r.id === routeId);
}

/**
 * Get route categories including custom routes
 */
export function getRouteCategoriesWithCustom(teamId: string = 'default'): RouteCategory[] {
  const customRoutes = getCustomRoutes(teamId);

  // Group custom routes by depth
  const quickCustom = customRoutes.filter((r) => Math.abs(r.depth) <= 5);
  const intermediateCustom = customRoutes.filter((r) => Math.abs(r.depth) > 5 && Math.abs(r.depth) <= 15);
  const deepCustom = customRoutes.filter((r) => Math.abs(r.depth) > 15);

  // Built-in categories
  const categories: RouteCategory[] = [
    {
      name: 'Quick (0-5 yds)',
      routes: BUILT_IN_ROUTES.filter((r) => Math.abs(r.depth) <= 5),
    },
    {
      name: 'Intermediate (6-15 yds)',
      routes: BUILT_IN_ROUTES.filter((r) => Math.abs(r.depth) > 5 && Math.abs(r.depth) <= 15),
    },
    {
      name: 'Deep (15+ yds)',
      routes: BUILT_IN_ROUTES.filter((r) => Math.abs(r.depth) > 15),
    },
  ];

  // Add custom routes category if there are any
  if (customRoutes.length > 0) {
    categories.push({
      name: 'Custom Routes',
      routes: customRoutes,
    });
  }

  return categories;
}

// ----------------------------------------------------------------------------
// Route Creation Helpers
// ----------------------------------------------------------------------------

/**
 * Create a route from canvas points
 * Converts absolute canvas coordinates to relative route points
 */
export function createRouteFromCanvasPoints(
  canvasPoints: { x: number; y: number }[],
  startX: number,
  startY: number,
  yardsPerPixel: number,
  name: string,
  type: RouteType = 'custom'
): Omit<RouteDefinition, 'id' | 'teamId'> {
  // Convert canvas points to relative route points
  const routePoints: RoutePoint[] = canvasPoints.map((p, idx) => ({
    x: (p.x - startX) * yardsPerPixel,
    y: (p.y - startY) * yardsPerPixel,
    type: idx === 0 ? 'line' : (idx === canvasPoints.length - 1 ? 'line' : 'curve'),
  }));

  // Calculate depth (max Y distance upfield)
  const depth = Math.abs(Math.min(...routePoints.map((p) => p.y)));

  // Calculate direction based on final point
  const lastPoint = routePoints[routePoints.length - 1];
  let direction: -1 | 0 | 1 = 0;
  if (lastPoint) {
    if (lastPoint.x < -3) direction = -1;
    else if (lastPoint.x > 3) direction = 1;
  }

  return {
    name,
    type,
    depth,
    direction,
    points: routePoints,
    description: `Custom ${name} route`,
    tags: ['custom'],
    isBuiltIn: false,
  };
}

/**
 * Generate a unique route ID
 */
export function generateRouteId(): string {
  return `route-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
