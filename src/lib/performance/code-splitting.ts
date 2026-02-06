/**
 * Bundle Size Optimization (#225)
 *
 * Helpers for dynamic-import-based code splitting, chunk preloading,
 * route-level split-point definitions, and load-priority assignment.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoadPriority = 'eager' | 'lazy' | 'prefetch';

export interface RouteChunk {
  route: string;
  chunkName: string;
  priority: LoadPriority;
}

export interface LazyComponentResult<T = unknown> {
  component: T | null;
  loading: boolean;
  error: Error | null;
  load: () => Promise<T>;
}

// ---------------------------------------------------------------------------
// Route chunk map
// ---------------------------------------------------------------------------

export const ROUTE_CHUNKS: RouteChunk[] = [
  { route: '/', chunkName: 'home', priority: 'eager' },
  { route: '/playbook', chunkName: 'playbook', priority: 'eager' },
  { route: '/sketch', chunkName: 'sketch', priority: 'eager' },
  { route: '/gameplan', chunkName: 'gameplan', priority: 'prefetch' },
  { route: '/practice', chunkName: 'practice', priority: 'prefetch' },
  { route: '/gameday', chunkName: 'gameday', priority: 'lazy' },
  { route: '/settings', chunkName: 'settings', priority: 'lazy' },
  { route: '/scouting', chunkName: 'scouting', priority: 'lazy' },
  { route: '/wristband', chunkName: 'wristband', priority: 'lazy' },
];

// ---------------------------------------------------------------------------
// Lazy component wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a dynamic `import()` call in a state container that tracks
 * loading / error state. This is framework-agnostic; React components
 * should use `React.lazy()` directly but this helper is useful for
 * non-React modules (workers, heavy libs, etc.).
 */
export function lazyComponent<T = unknown>(
  importFn: () => Promise<{ default: T }>,
): LazyComponentResult<T> {
  const state: LazyComponentResult<T> = {
    component: null,
    loading: false,
    error: null,
    load: async () => {
      state.loading = true;
      state.error = null;
      try {
        const mod = await importFn();
        state.component = mod.default;
        return mod.default;
      } catch (err) {
        state.error = err instanceof Error ? err : new Error(String(err));
        throw state.error;
      } finally {
        state.loading = false;
      }
    },
  };

  return state;
}

// ---------------------------------------------------------------------------
// Preload
// ---------------------------------------------------------------------------

/**
 * Eagerly trigger a dynamic import so the chunk is fetched & cached by
 * the browser before the user navigates to the route.  Returns the
 * module default export.
 */
export async function preloadComponent<T = unknown>(
  importFn: () => Promise<{ default: T }>,
): Promise<T> {
  const mod = await importFn();
  return mod.default;
}

// ---------------------------------------------------------------------------
// Chunk size (estimate from a simple manifest)
// ---------------------------------------------------------------------------

// A static lookup -- in a real build this would be generated from the
// Webpack / Turbopack stats file.
const CHUNK_SIZES: Record<string, number> = {
  home: 45_000,
  playbook: 120_000,
  sketch: 180_000,
  gameplan: 95_000,
  practice: 85_000,
  gameday: 110_000,
  settings: 35_000,
  scouting: 70_000,
  wristband: 55_000,
};

/**
 * Return the estimated byte size of a named chunk.
 * Returns 0 for unknown chunks.
 */
export function measureChunkSize(chunkName: string): number {
  return CHUNK_SIZES[chunkName] ?? 0;
}

// ---------------------------------------------------------------------------
// Load priority
// ---------------------------------------------------------------------------

/**
 * Given a route path, return the load priority defined in ROUTE_CHUNKS.
 * Defaults to `'lazy'` for unknown routes.
 */
export function getLoadPriority(route: string): LoadPriority {
  const chunk = ROUTE_CHUNKS.find((c) => c.route === route);
  return chunk?.priority ?? 'lazy';
}
