// ---- Season-Over-Season Comparison ----
// Analyse and compare playbook usage statistics across multiple seasons.

// ---- Types ----

export interface SeasonStats {
  seasonId: string;
  label: string;
  playCount: number;
  formationCount: number;
  conceptCount: number;
  mostUsedFormation: string;
  mostUsedConcept: string;
  tags: Record<string, number>;
}

export interface SeasonDiff {
  metric: string;
  season1Value: number | string;
  season2Value: number | string;
  change: number;
  changePercent: number;
}

export interface GrowthMetric {
  metric: string;
  values: number[];
  labels: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
  averageChange: number;
}

// ---- Comparison ----

/**
 * Compare two seasons and return the differences for each metric.
 */
export function compareSeasons(season1: SeasonStats, season2: SeasonStats): SeasonDiff[] {
  const diffs: SeasonDiff[] = [];

  // Numeric metrics
  const numericMetrics: { metric: string; key: keyof SeasonStats }[] = [
    { metric: 'Play Count', key: 'playCount' },
    { metric: 'Formation Count', key: 'formationCount' },
    { metric: 'Concept Count', key: 'conceptCount' },
  ];

  for (const { metric, key } of numericMetrics) {
    const v1 = season1[key] as number;
    const v2 = season2[key] as number;
    const change = v2 - v1;
    const changePercent = v1 === 0 ? (v2 === 0 ? 0 : 100) : Math.round((change / v1) * 10000) / 100;

    diffs.push({ metric, season1Value: v1, season2Value: v2, change, changePercent });
  }

  // String metrics (most used formation / concept)
  diffs.push({
    metric: 'Most Used Formation',
    season1Value: season1.mostUsedFormation,
    season2Value: season2.mostUsedFormation,
    change: season1.mostUsedFormation === season2.mostUsedFormation ? 0 : 1,
    changePercent: 0,
  });

  diffs.push({
    metric: 'Most Used Concept',
    season1Value: season1.mostUsedConcept,
    season2Value: season2.mostUsedConcept,
    change: season1.mostUsedConcept === season2.mostUsedConcept ? 0 : 1,
    changePercent: 0,
  });

  // Tag count totals
  const totalTags1 = Object.values(season1.tags).reduce((a, b) => a + b, 0);
  const totalTags2 = Object.values(season2.tags).reduce((a, b) => a + b, 0);
  const tagChange = totalTags2 - totalTags1;
  const tagChangePercent =
    totalTags1 === 0 ? (totalTags2 === 0 ? 0 : 100) : Math.round((tagChange / totalTags1) * 10000) / 100;

  diffs.push({
    metric: 'Total Tags',
    season1Value: totalTags1,
    season2Value: totalTags2,
    change: tagChange,
    changePercent: tagChangePercent,
  });

  return diffs;
}

// ---- Growth metrics ----

/**
 * Calculate growth trends over multiple seasons.
 *
 * Returns one GrowthMetric per tracked statistic, showing the trend
 * direction and the average per-season change.
 */
export function calculateGrowthMetrics(seasons: SeasonStats[]): GrowthMetric[] {
  if (seasons.length < 2) {
    return [];
  }

  const labels = seasons.map((s) => s.label);

  function buildGrowthMetric(metric: string, extractor: (s: SeasonStats) => number): GrowthMetric {
    const values = seasons.map(extractor);
    const changes: number[] = [];

    for (let i = 1; i < values.length; i++) {
      changes.push(values[i] - values[i - 1]);
    }

    const averageChange =
      changes.length > 0
        ? Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 100) / 100
        : 0;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (averageChange > 0) {
      trend = 'increasing';
    } else if (averageChange < 0) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return { metric, values, labels, trend, averageChange };
  }

  return [
    buildGrowthMetric('Play Count', (s) => s.playCount),
    buildGrowthMetric('Formation Count', (s) => s.formationCount),
    buildGrowthMetric('Concept Count', (s) => s.conceptCount),
    buildGrowthMetric('Total Tags', (s) =>
      Object.values(s.tags).reduce((a, b) => a + b, 0),
    ),
  ];
}

// ---- Report generation ----

/**
 * Generate a human-readable comparison report from a list of SeasonDiffs.
 */
export function generateComparisonReport(diffs: SeasonDiff[]): string {
  if (diffs.length === 0) {
    return 'No comparison data available.';
  }

  const lines: string[] = ['Season Comparison Report', '=======================', ''];

  for (const diff of diffs) {
    const direction =
      diff.change > 0 ? '(+)' : diff.change < 0 ? '(-)' : '(=)';
    const percentStr =
      typeof diff.season1Value === 'number' && diff.changePercent !== 0
        ? ` (${diff.changePercent > 0 ? '+' : ''}${diff.changePercent}%)`
        : '';

    lines.push(
      `${diff.metric}: ${diff.season1Value} -> ${diff.season2Value} ${direction}${percentStr}`,
    );
  }

  return lines.join('\n');
}
