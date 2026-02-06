/**
 * Tablet-Optimized Layout Breakpoints
 *
 * Determines the optimal layout mode for different features
 * at various screen sizes, with specific rules for tablet usage.
 */

export type TabletLayoutMode = 'single-pane' | 'split-pane' | 'overlay';

export type ToolbarPosition = 'bottom' | 'side' | 'floating';

export type LayoutFeature = 'playbook' | 'canvas' | 'gameplan' | 'practice' | 'gameday' | 'settings';

export interface LayoutConfig {
  mode: TabletLayoutMode;
  toolbarPosition: ToolbarPosition;
  sidebarWidth: number;
  contentPadding: number;
}

/**
 * Determine the optimal layout mode based on viewport dimensions and feature context.
 *
 * Rules:
 * - Playbook browser: split-pane at >=768px, single-pane at <768px
 * - Canvas: always single-pane with toolbar overlay
 * - Game plan: split-pane at >=1024px, single-pane below
 * - Practice: split-pane at >=768px
 * - Game day: single-pane at <768px, split-pane otherwise
 * - Settings: always single-pane
 */
export function getOptimalLayout(
  width: number,
  height: number,
  feature: string,
): TabletLayoutMode {
  switch (feature) {
    case 'canvas':
    case 'sketch':
      // Canvas always uses single-pane with floating toolbar overlay
      return 'single-pane';

    case 'playbook':
      return width >= 768 ? 'split-pane' : 'single-pane';

    case 'gameplan':
      return width >= 1024 ? 'split-pane' : 'single-pane';

    case 'practice':
      return width >= 768 ? 'split-pane' : 'single-pane';

    case 'gameday':
      return width >= 768 ? 'split-pane' : 'single-pane';

    case 'settings':
      return 'single-pane';

    default:
      return width >= 768 ? 'split-pane' : 'single-pane';
  }
}

/**
 * Get the toolbar position based on the current breakpoint.
 *
 * - mobile (<768px): bottom
 * - tablet (768-1024px): floating (for canvas) or bottom
 * - desktop (>1024px): side
 */
export function getToolbarPosition(breakpoint: string): ToolbarPosition {
  switch (breakpoint) {
    case 'mobile':
      return 'bottom';
    case 'tablet':
      return 'floating';
    case 'desktop':
      return 'side';
    default:
      return 'bottom';
  }
}

/**
 * Get the full layout configuration for a given viewport and feature.
 */
export function getLayoutConfig(
  width: number,
  height: number,
  feature: string,
): LayoutConfig {
  const mode = getOptimalLayout(width, height, feature);
  const breakpoint = width < 768 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop';
  const toolbarPosition =
    feature === 'canvas' || feature === 'sketch'
      ? 'floating'
      : getToolbarPosition(breakpoint);

  let sidebarWidth: number;
  if (mode === 'single-pane') {
    sidebarWidth = 0;
  } else if (width >= 1024) {
    sidebarWidth = 320;
  } else {
    sidebarWidth = 280;
  }

  const contentPadding = width < 768 ? 8 : width <= 1024 ? 16 : 24;

  return {
    mode,
    toolbarPosition,
    sidebarWidth,
    contentPadding,
  };
}

/**
 * Check if the viewport is in a constrained tablet mode (e.g., iPad Split View).
 */
export function isConstrainedTablet(width: number): boolean {
  return width >= 320 && width < 768;
}

/**
 * Get the recommended canvas toolbar style for the given width.
 */
export function getCanvasToolbarStyle(width: number): 'compact' | 'standard' | 'expanded' {
  if (width < 768) return 'compact';
  if (width <= 1024) return 'standard';
  return 'expanded';
}
