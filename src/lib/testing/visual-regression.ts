// ---- Visual Regression Testing Helpers ----
// Utilities for capturing and comparing rendered component snapshots.

// ---- Types ----

export interface Snapshot {
  name: string;
  timestamp: number;
  width: number;
  height: number;
  data: string;
}

export interface SnapshotComparison {
  baseline: Snapshot;
  current: Snapshot;
  diffPercentage: number;
  passed: boolean;
}

export interface DiffReport {
  timestamp: number;
  totalComparisons: number;
  passed: number;
  failed: number;
  comparisons: SnapshotComparison[];
  summary: string;
}

// ---- Constants ----

/** Maximum allowed diff percentage before a comparison is considered failing. */
export const VISUAL_REGRESSION_THRESHOLD = 0.1; // 0.1%

// ---- Snapshot capture ----

/**
 * Capture a rendered snapshot of an HTML element.
 *
 * NOTE: In a real implementation, this would render the element to a canvas
 * and capture pixel data. This stub captures the element's outerHTML
 * and dimensions for comparison.
 */
export function captureSnapshot(
  componentName: string,
  element: HTMLElement,
): Snapshot {
  if (!componentName || componentName.trim().length === 0) {
    throw new Error('Component name is required');
  }

  if (!element) {
    throw new Error('Element is required');
  }

  const rect = element.getBoundingClientRect();

  return {
    name: componentName.trim(),
    timestamp: Date.now(),
    width: rect.width || element.offsetWidth || 0,
    height: rect.height || element.offsetHeight || 0,
    data: element.outerHTML || '',
  };
}

// ---- Snapshot comparison ----

/**
 * Compare two snapshots and produce a diff percentage.
 *
 * Uses a character-level comparison of the rendered data as a proxy
 * for pixel-level differences. In production, this would use actual
 * pixel comparison (e.g., via pixelmatch).
 */
export function compareSnapshots(
  baseline: Snapshot,
  current: Snapshot,
): SnapshotComparison {
  if (!baseline || !current) {
    throw new Error('Both baseline and current snapshots are required');
  }

  const diffPercentage = calculateDiffPercentage(baseline.data, current.data);
  const passed = diffPercentage <= VISUAL_REGRESSION_THRESHOLD;

  return {
    baseline,
    current,
    diffPercentage,
    passed,
  };
}

// ---- Diff calculation ----

/**
 * Calculate the percentage difference between two data strings.
 *
 * Uses Levenshtein-inspired character comparison as a proxy for pixel diffs.
 * Returns a value between 0 (identical) and 100 (completely different).
 */
export function calculateDiffPercentage(baseline: string, current: string): number {
  if (baseline === current) {
    return 0;
  }

  if (baseline.length === 0 && current.length === 0) {
    return 0;
  }

  if (baseline.length === 0 || current.length === 0) {
    return 100;
  }

  // Character-level comparison (fast approximation)
  const maxLen = Math.max(baseline.length, current.length);
  const minLen = Math.min(baseline.length, current.length);
  let differences = maxLen - minLen; // Extra chars are all different

  for (let i = 0; i < minLen; i++) {
    if (baseline[i] !== current[i]) {
      differences++;
    }
  }

  return Math.round((differences / maxLen) * 10000) / 100;
}

// ---- Report generation ----

/**
 * Generate a summary report from a list of snapshot comparisons.
 */
export function generateDiffReport(comparisons: SnapshotComparison[]): DiffReport {
  const passed = comparisons.filter((c) => c.passed).length;
  const failed = comparisons.filter((c) => !c.passed).length;

  const lines: string[] = [];
  if (failed === 0) {
    lines.push(`All ${comparisons.length} visual regression tests passed.`);
  } else {
    lines.push(`${failed} of ${comparisons.length} visual regression tests failed:`);
    for (const comp of comparisons.filter((c) => !c.passed)) {
      lines.push(
        `  - ${comp.baseline.name}: ${comp.diffPercentage.toFixed(2)}% diff (threshold: ${VISUAL_REGRESSION_THRESHOLD}%)`,
      );
    }
  }

  return {
    timestamp: Date.now(),
    totalComparisons: comparisons.length,
    passed,
    failed,
    comparisons,
    summary: lines.join('\n'),
  };
}
