import { describe, it, expect } from 'vitest';
import {
  captureSnapshot,
  compareSnapshots,
  calculateDiffPercentage,
  generateDiffReport,
  VISUAL_REGRESSION_THRESHOLD,
} from '@/lib/testing/visual-regression';
import type { Snapshot, SnapshotComparison } from '@/lib/testing/visual-regression';

// ---- Helpers ----

function makeElement(html: string, width = 200, height = 100): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  // jsdom doesn't compute layout, so we stub offsetWidth/offsetHeight
  Object.defineProperty(el, 'offsetWidth', { value: width });
  Object.defineProperty(el, 'offsetHeight', { value: height });
  return el;
}

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    name: 'TestComponent',
    timestamp: Date.now(),
    width: 200,
    height: 100,
    data: '<div>Hello World</div>',
    ...overrides,
  };
}

// ---- VISUAL_REGRESSION_THRESHOLD ----

describe('VISUAL_REGRESSION_THRESHOLD', () => {
  it('is 0.1%', () => {
    expect(VISUAL_REGRESSION_THRESHOLD).toBe(0.1);
  });
});

// ---- captureSnapshot ----

describe('captureSnapshot()', () => {
  it('captures a snapshot with the component name', () => {
    const el = makeElement('<span>Test</span>');
    const snapshot = captureSnapshot('MyComponent', el);
    expect(snapshot.name).toBe('MyComponent');
  });

  it('trims the component name', () => {
    const el = makeElement('<span>Test</span>');
    const snapshot = captureSnapshot('  Trimmed  ', el);
    expect(snapshot.name).toBe('Trimmed');
  });

  it('captures element dimensions', () => {
    const el = makeElement('<span>Test</span>', 300, 150);
    const snapshot = captureSnapshot('Test', el);
    // In jsdom, getBoundingClientRect returns 0s, so we fall back to offsetWidth/offsetHeight
    expect(snapshot.width).toBe(300);
    expect(snapshot.height).toBe(150);
  });

  it('captures the element HTML as data', () => {
    const el = makeElement('<span>Content</span>');
    const snapshot = captureSnapshot('Test', el);
    expect(snapshot.data).toContain('<span>Content</span>');
  });

  it('sets a timestamp', () => {
    const el = makeElement('<span>Test</span>');
    const before = Date.now();
    const snapshot = captureSnapshot('Test', el);
    expect(snapshot.timestamp).toBeGreaterThanOrEqual(before);
  });

  it('throws for empty component name', () => {
    const el = makeElement('<span>Test</span>');
    expect(() => captureSnapshot('', el)).toThrow('Component name is required');
  });

  it('throws for whitespace-only name', () => {
    const el = makeElement('<span>Test</span>');
    expect(() => captureSnapshot('   ', el)).toThrow('Component name is required');
  });

  it('throws for null element', () => {
    expect(() => captureSnapshot('Test', null as unknown as HTMLElement)).toThrow(
      'Element is required',
    );
  });
});

// ---- calculateDiffPercentage ----

describe('calculateDiffPercentage()', () => {
  it('returns 0 for identical strings', () => {
    expect(calculateDiffPercentage('abc', 'abc')).toBe(0);
  });

  it('returns 0 for two empty strings', () => {
    expect(calculateDiffPercentage('', '')).toBe(0);
  });

  it('returns 100 when one string is empty', () => {
    expect(calculateDiffPercentage('abc', '')).toBe(100);
    expect(calculateDiffPercentage('', 'abc')).toBe(100);
  });

  it('returns a value between 0 and 100', () => {
    const diff = calculateDiffPercentage('abcdef', 'abcxyz');
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(100);
  });

  it('returns 100 for completely different strings of same length', () => {
    expect(calculateDiffPercentage('aaa', 'bbb')).toBe(100);
  });

  it('handles different length strings', () => {
    const diff = calculateDiffPercentage('abc', 'abcdef');
    expect(diff).toBeGreaterThan(0);
  });
});

// ---- compareSnapshots ----

describe('compareSnapshots()', () => {
  it('passes when snapshots are identical', () => {
    const baseline = makeSnapshot({ data: '<div>Same</div>' });
    const current = makeSnapshot({ data: '<div>Same</div>' });
    const result = compareSnapshots(baseline, current);
    expect(result.passed).toBe(true);
    expect(result.diffPercentage).toBe(0);
  });

  it('fails when snapshots differ significantly', () => {
    const baseline = makeSnapshot({ data: '<div>Original content here</div>' });
    const current = makeSnapshot({ data: '<span>Completely different markup and text</span>' });
    const result = compareSnapshots(baseline, current);
    expect(result.passed).toBe(false);
    expect(result.diffPercentage).toBeGreaterThan(VISUAL_REGRESSION_THRESHOLD);
  });

  it('includes both baseline and current in result', () => {
    const baseline = makeSnapshot({ name: 'Baseline' });
    const current = makeSnapshot({ name: 'Current' });
    const result = compareSnapshots(baseline, current);
    expect(result.baseline.name).toBe('Baseline');
    expect(result.current.name).toBe('Current');
  });

  it('calculates diff percentage', () => {
    const baseline = makeSnapshot({ data: 'abc' });
    const current = makeSnapshot({ data: 'axc' });
    const result = compareSnapshots(baseline, current);
    expect(result.diffPercentage).toBeGreaterThan(0);
  });
});

// ---- generateDiffReport ----

describe('generateDiffReport()', () => {
  it('generates a report for passing comparisons', () => {
    const comparisons: SnapshotComparison[] = [
      {
        baseline: makeSnapshot(),
        current: makeSnapshot(),
        diffPercentage: 0,
        passed: true,
      },
    ];
    const report = generateDiffReport(comparisons);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.totalComparisons).toBe(1);
    expect(report.summary).toContain('passed');
  });

  it('generates a report for failing comparisons', () => {
    const comparisons: SnapshotComparison[] = [
      {
        baseline: makeSnapshot({ name: 'Button' }),
        current: makeSnapshot(),
        diffPercentage: 5.5,
        passed: false,
      },
    ];
    const report = generateDiffReport(comparisons);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(1);
    expect(report.summary).toContain('failed');
    expect(report.summary).toContain('Button');
  });

  it('handles empty comparisons list', () => {
    const report = generateDiffReport([]);
    expect(report.totalComparisons).toBe(0);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(0);
  });

  it('sets a timestamp', () => {
    const before = Date.now();
    const report = generateDiffReport([]);
    expect(report.timestamp).toBeGreaterThanOrEqual(before);
  });

  it('counts mixed pass/fail correctly', () => {
    const comparisons: SnapshotComparison[] = [
      { baseline: makeSnapshot(), current: makeSnapshot(), diffPercentage: 0, passed: true },
      { baseline: makeSnapshot(), current: makeSnapshot(), diffPercentage: 5, passed: false },
      { baseline: makeSnapshot(), current: makeSnapshot(), diffPercentage: 0, passed: true },
    ];
    const report = generateDiffReport(comparisons);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(1);
    expect(report.totalComparisons).toBe(3);
  });

  it('includes all comparisons in the report', () => {
    const comparisons: SnapshotComparison[] = [
      { baseline: makeSnapshot(), current: makeSnapshot(), diffPercentage: 0, passed: true },
      { baseline: makeSnapshot(), current: makeSnapshot(), diffPercentage: 0, passed: true },
    ];
    const report = generateDiffReport(comparisons);
    expect(report.comparisons).toHaveLength(2);
  });

  it('includes threshold in failure messages', () => {
    const comparisons: SnapshotComparison[] = [
      {
        baseline: makeSnapshot({ name: 'Header' }),
        current: makeSnapshot(),
        diffPercentage: 2.5,
        passed: false,
      },
    ];
    const report = generateDiffReport(comparisons);
    expect(report.summary).toContain(`${VISUAL_REGRESSION_THRESHOLD}%`);
  });
});
