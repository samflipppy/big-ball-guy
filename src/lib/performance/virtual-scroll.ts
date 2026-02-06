/**
 * Virtual Scroll / Lazy Loading for Playbook Grid (#221)
 *
 * Pure-function helpers that calculate which items should be rendered
 * inside a scrollable container so only visible rows exist in the DOM.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VisibleRange {
  start: number;
  end: number;
}

export interface VirtualScrollState {
  scrollTop: number;
  visibleRange: VisibleRange;
  buffer: number;
  containerHeight: number;
  totalItems: number;
  itemHeight: number;
}

// ---------------------------------------------------------------------------
// Core calculations
// ---------------------------------------------------------------------------

/**
 * Given the current scroll position, the fixed item height, the container
 * height, and the total number of items, return the index range
 * `{ start, end }` of the items that should be rendered.
 *
 * A small buffer (default 3 items) is added above and below so scrolling
 * doesn't flash empty space.
 */
export function calculateVisibleRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  buffer = 3,
): VisibleRange {
  if (totalItems === 0 || itemHeight <= 0 || containerHeight <= 0) {
    return { start: 0, end: 0 };
  }

  const rawStart = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const start = Math.max(0, rawStart - buffer);
  const end = Math.min(totalItems, rawStart + visibleCount + buffer);

  return { start, end };
}

/**
 * Returns an inline-style object that absolutely positions the item at
 * the correct vertical offset inside the scroll container.
 */
export function getItemStyle(
  index: number,
  itemHeight: number,
): { position: 'absolute'; top: number; height: number; width: string } {
  return {
    position: 'absolute' as const,
    top: index * itemHeight,
    height: itemHeight,
    width: '100%',
  };
}

/**
 * Total scrollable height of the container (items * itemHeight).
 */
export function calculateContainerHeight(
  totalItems: number,
  itemHeight: number,
): number {
  return totalItems * itemHeight;
}
