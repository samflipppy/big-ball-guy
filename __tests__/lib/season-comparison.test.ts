import { describe, it, expect } from 'vitest';
import {
  compareSeasons,
  calculateGrowthMetrics,
  generateComparisonReport,
} from '@/lib/season-comparison';
import type { SeasonStats, SeasonDiff } from '@/lib/season-comparison';

// ---- Helpers ----

function makeSeason(overrides: Partial<SeasonStats> = {}): SeasonStats {
  return {
    seasonId: 'season-1',
    label: '2024',
    playCount: 50,
    formationCount: 7,
    conceptCount: 12,
    mostUsedFormation: 'Shotgun',
    mostUsedConcept: 'Mesh',
    tags: { run: 20, pass: 30 },
    ...overrides,
  };
}

// ---- compareSeasons ----

describe('compareSeasons()', () => {
  it('returns diffs for numeric metrics', () => {
    const s1 = makeSeason({ playCount: 50, formationCount: 7, conceptCount: 12 });
    const s2 = makeSeason({ playCount: 75, formationCount: 10, conceptCount: 15, seasonId: 's2', label: '2025' });
    const diffs = compareSeasons(s1, s2);

    const playDiff = diffs.find((d) => d.metric === 'Play Count');
    expect(playDiff).toBeDefined();
    expect(playDiff!.season1Value).toBe(50);
    expect(playDiff!.season2Value).toBe(75);
    expect(playDiff!.change).toBe(25);
    expect(playDiff!.changePercent).toBe(50);
  });

  it('handles zero values without division errors', () => {
    const s1 = makeSeason({ playCount: 0 });
    const s2 = makeSeason({ playCount: 10, seasonId: 's2' });
    const diffs = compareSeasons(s1, s2);
    const playDiff = diffs.find((d) => d.metric === 'Play Count');
    expect(playDiff!.changePercent).toBe(100);
  });

  it('returns 0% change when both values are zero', () => {
    const s1 = makeSeason({ playCount: 0 });
    const s2 = makeSeason({ playCount: 0, seasonId: 's2' });
    const diffs = compareSeasons(s1, s2);
    const playDiff = diffs.find((d) => d.metric === 'Play Count');
    expect(playDiff!.change).toBe(0);
    expect(playDiff!.changePercent).toBe(0);
  });

  it('tracks formation change', () => {
    const s1 = makeSeason({ mostUsedFormation: 'Shotgun' });
    const s2 = makeSeason({ mostUsedFormation: 'I-Form', seasonId: 's2' });
    const diffs = compareSeasons(s1, s2);
    const formDiff = diffs.find((d) => d.metric === 'Most Used Formation');
    expect(formDiff!.season1Value).toBe('Shotgun');
    expect(formDiff!.season2Value).toBe('I-Form');
    expect(formDiff!.change).toBe(1);
  });

  it('tracks no change when formation is the same', () => {
    const s1 = makeSeason({ mostUsedFormation: 'Shotgun' });
    const s2 = makeSeason({ mostUsedFormation: 'Shotgun', seasonId: 's2' });
    const diffs = compareSeasons(s1, s2);
    const formDiff = diffs.find((d) => d.metric === 'Most Used Formation');
    expect(formDiff!.change).toBe(0);
  });

  it('includes total tags comparison', () => {
    const s1 = makeSeason({ tags: { run: 10, pass: 20 } });
    const s2 = makeSeason({ tags: { run: 15, pass: 25 }, seasonId: 's2' });
    const diffs = compareSeasons(s1, s2);
    const tagDiff = diffs.find((d) => d.metric === 'Total Tags');
    expect(tagDiff!.season1Value).toBe(30);
    expect(tagDiff!.season2Value).toBe(40);
    expect(tagDiff!.change).toBe(10);
  });

  it('handles negative changes', () => {
    const s1 = makeSeason({ playCount: 100 });
    const s2 = makeSeason({ playCount: 80, seasonId: 's2' });
    const diffs = compareSeasons(s1, s2);
    const playDiff = diffs.find((d) => d.metric === 'Play Count');
    expect(playDiff!.change).toBe(-20);
    expect(playDiff!.changePercent).toBe(-20);
  });

  it('returns all expected metric types', () => {
    const diffs = compareSeasons(makeSeason(), makeSeason({ seasonId: 's2' }));
    const metrics = diffs.map((d) => d.metric);
    expect(metrics).toContain('Play Count');
    expect(metrics).toContain('Formation Count');
    expect(metrics).toContain('Concept Count');
    expect(metrics).toContain('Most Used Formation');
    expect(metrics).toContain('Most Used Concept');
    expect(metrics).toContain('Total Tags');
  });
});

// ---- calculateGrowthMetrics ----

describe('calculateGrowthMetrics()', () => {
  it('returns empty for less than 2 seasons', () => {
    expect(calculateGrowthMetrics([])).toHaveLength(0);
    expect(calculateGrowthMetrics([makeSeason()])).toHaveLength(0);
  });

  it('returns growth metrics for multiple seasons', () => {
    const seasons = [
      makeSeason({ playCount: 50, label: '2023' }),
      makeSeason({ playCount: 70, label: '2024' }),
      makeSeason({ playCount: 90, label: '2025' }),
    ];
    const metrics = calculateGrowthMetrics(seasons);
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('detects increasing trend', () => {
    const seasons = [
      makeSeason({ playCount: 50, label: '2023' }),
      makeSeason({ playCount: 70, label: '2024' }),
      makeSeason({ playCount: 90, label: '2025' }),
    ];
    const metrics = calculateGrowthMetrics(seasons);
    const playMetric = metrics.find((m) => m.metric === 'Play Count');
    expect(playMetric!.trend).toBe('increasing');
    expect(playMetric!.averageChange).toBe(20);
  });

  it('detects decreasing trend', () => {
    const seasons = [
      makeSeason({ playCount: 100, label: '2023' }),
      makeSeason({ playCount: 80, label: '2024' }),
      makeSeason({ playCount: 60, label: '2025' }),
    ];
    const metrics = calculateGrowthMetrics(seasons);
    const playMetric = metrics.find((m) => m.metric === 'Play Count');
    expect(playMetric!.trend).toBe('decreasing');
    expect(playMetric!.averageChange).toBe(-20);
  });

  it('detects stable trend when no change', () => {
    const seasons = [
      makeSeason({ playCount: 50, label: '2023' }),
      makeSeason({ playCount: 50, label: '2024' }),
      makeSeason({ playCount: 50, label: '2025' }),
    ];
    const metrics = calculateGrowthMetrics(seasons);
    const playMetric = metrics.find((m) => m.metric === 'Play Count');
    expect(playMetric!.trend).toBe('stable');
    expect(playMetric!.averageChange).toBe(0);
  });

  it('includes labels from all seasons', () => {
    const seasons = [
      makeSeason({ label: '2023' }),
      makeSeason({ label: '2024' }),
    ];
    const metrics = calculateGrowthMetrics(seasons);
    expect(metrics[0].labels).toEqual(['2023', '2024']);
  });

  it('includes values from all seasons', () => {
    const seasons = [
      makeSeason({ playCount: 50, label: '2023' }),
      makeSeason({ playCount: 75, label: '2024' }),
    ];
    const metrics = calculateGrowthMetrics(seasons);
    const playMetric = metrics.find((m) => m.metric === 'Play Count');
    expect(playMetric!.values).toEqual([50, 75]);
  });
});

// ---- generateComparisonReport ----

describe('generateComparisonReport()', () => {
  it('returns a message for empty diffs', () => {
    expect(generateComparisonReport([])).toBe('No comparison data available.');
  });

  it('includes the report header', () => {
    const diffs: SeasonDiff[] = [
      { metric: 'Play Count', season1Value: 50, season2Value: 75, change: 25, changePercent: 50 },
    ];
    const report = generateComparisonReport(diffs);
    expect(report).toContain('Season Comparison Report');
  });

  it('includes metric lines with values', () => {
    const diffs: SeasonDiff[] = [
      { metric: 'Play Count', season1Value: 50, season2Value: 75, change: 25, changePercent: 50 },
    ];
    const report = generateComparisonReport(diffs);
    expect(report).toContain('Play Count');
    expect(report).toContain('50');
    expect(report).toContain('75');
  });

  it('shows (+) for positive changes', () => {
    const diffs: SeasonDiff[] = [
      { metric: 'Play Count', season1Value: 50, season2Value: 75, change: 25, changePercent: 50 },
    ];
    const report = generateComparisonReport(diffs);
    expect(report).toContain('(+)');
  });

  it('shows (-) for negative changes', () => {
    const diffs: SeasonDiff[] = [
      { metric: 'Play Count', season1Value: 100, season2Value: 80, change: -20, changePercent: -20 },
    ];
    const report = generateComparisonReport(diffs);
    expect(report).toContain('(-)');
  });

  it('shows (=) for no change', () => {
    const diffs: SeasonDiff[] = [
      { metric: 'Play Count', season1Value: 50, season2Value: 50, change: 0, changePercent: 0 },
    ];
    const report = generateComparisonReport(diffs);
    expect(report).toContain('(=)');
  });

  it('shows percentage for numeric changes', () => {
    const diffs: SeasonDiff[] = [
      { metric: 'Play Count', season1Value: 50, season2Value: 75, change: 25, changePercent: 50 },
    ];
    const report = generateComparisonReport(diffs);
    expect(report).toContain('+50%');
  });
});
