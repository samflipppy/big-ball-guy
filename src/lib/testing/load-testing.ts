// ---- Load Testing Helpers ----
// Utilities for simulating and analysing load test scenarios.

// ---- Types ----

export interface LoadTestConfig {
  concurrentUsers: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  targetEndpoint: string;
  requestsPerSecond: number;
}

export interface LoadTestResult {
  totalRequests: number;
  successCount: number;
  failCount: number;
  avgLatency: number; // ms
  p95Latency: number; // ms
  p99Latency: number; // ms
  maxLatency: number; // ms
  requestsPerSecond: number;
}

export type LoadTestPresetName = 'smoke' | 'normal' | 'stress' | 'spike';

export interface LoadTestAssessment {
  passed: boolean;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  bottlenecks: string[];
  recommendations: string[];
}

// ---- Constants ----

/**
 * Predefined load test configurations.
 */
export const LOAD_TEST_PRESETS: Record<LoadTestPresetName, LoadTestConfig> = {
  smoke: {
    concurrentUsers: 10,
    duration: 30,
    rampUpTime: 5,
    targetEndpoint: '/api/health',
    requestsPerSecond: 5,
  },
  normal: {
    concurrentUsers: 50,
    duration: 120,
    rampUpTime: 15,
    targetEndpoint: '/api/plays',
    requestsPerSecond: 25,
  },
  stress: {
    concurrentUsers: 200,
    duration: 300,
    rampUpTime: 30,
    targetEndpoint: '/api/plays',
    requestsPerSecond: 100,
  },
  spike: {
    concurrentUsers: 500,
    duration: 60,
    rampUpTime: 5,
    targetEndpoint: '/api/plays',
    requestsPerSecond: 250,
  },
};

// ---- Latency thresholds ----

const LATENCY_THRESHOLDS = {
  avgGood: 200, // ms
  avgAcceptable: 500,
  p95Good: 500,
  p95Acceptable: 1000,
  p99Good: 1000,
  p99Acceptable: 2000,
};

const ERROR_RATE_THRESHOLD = 0.01; // 1%

// ---- Load simulation ----

/**
 * Simulate a load test and return mock results.
 *
 * NOTE: This is a stub implementation. In production, this would
 * actually make HTTP requests to the target endpoint.
 * The simulation generates realistic-looking latency distributions.
 */
export function simulateLoad(config: LoadTestConfig): LoadTestResult {
  if (config.concurrentUsers <= 0) {
    throw new Error('Concurrent users must be positive');
  }
  if (config.duration <= 0) {
    throw new Error('Duration must be positive');
  }
  if (config.requestsPerSecond <= 0) {
    throw new Error('Requests per second must be positive');
  }
  if (!config.targetEndpoint || config.targetEndpoint.trim().length === 0) {
    throw new Error('Target endpoint is required');
  }

  // Calculate total requests based on duration and RPS
  const totalRequests = config.requestsPerSecond * config.duration;

  // Simulate a realistic error rate that increases with load
  const loadFactor = config.concurrentUsers / 100;
  const baseErrorRate = 0.001; // 0.1%
  const errorRate = Math.min(baseErrorRate * (1 + loadFactor * 0.5), 0.15);
  const failCount = Math.round(totalRequests * errorRate);
  const successCount = totalRequests - failCount;

  // Simulate latency that increases with concurrent users
  const baseLatency = 50; // ms
  const avgLatency = Math.round(baseLatency + config.concurrentUsers * 0.8);
  const p95Latency = Math.round(avgLatency * 2.5);
  const p99Latency = Math.round(avgLatency * 4);
  const maxLatency = Math.round(avgLatency * 8);

  // Actual RPS may be slightly less than target under heavy load
  const actualRps = Math.round(
    config.requestsPerSecond * Math.max(0.5, 1 - loadFactor * 0.05),
  );

  return {
    totalRequests,
    successCount,
    failCount,
    avgLatency,
    p95Latency,
    p99Latency,
    maxLatency,
    requestsPerSecond: actualRps,
  };
}

// ---- Result analysis ----

/**
 * Analyse load test results and produce a pass/fail assessment
 * with bottleneck identification.
 */
export function analyzeResults(result: LoadTestResult): LoadTestAssessment {
  const bottlenecks: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check error rate
  const errorRate = result.totalRequests > 0 ? result.failCount / result.totalRequests : 0;
  if (errorRate > ERROR_RATE_THRESHOLD) {
    bottlenecks.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
    recommendations.push('Investigate server errors and add retry logic');
    score -= 30;
  }

  // Check average latency
  if (result.avgLatency > LATENCY_THRESHOLDS.avgAcceptable) {
    bottlenecks.push(`Average latency too high: ${result.avgLatency}ms`);
    recommendations.push('Consider adding caching or optimizing database queries');
    score -= 25;
  } else if (result.avgLatency > LATENCY_THRESHOLDS.avgGood) {
    recommendations.push('Average latency could be improved with caching');
    score -= 10;
  }

  // Check P95 latency
  if (result.p95Latency > LATENCY_THRESHOLDS.p95Acceptable) {
    bottlenecks.push(`P95 latency too high: ${result.p95Latency}ms`);
    recommendations.push('Investigate slow queries and long-running operations');
    score -= 20;
  } else if (result.p95Latency > LATENCY_THRESHOLDS.p95Good) {
    score -= 10;
  }

  // Check P99 latency
  if (result.p99Latency > LATENCY_THRESHOLDS.p99Acceptable) {
    bottlenecks.push(`P99 latency too high: ${result.p99Latency}ms`);
    recommendations.push('Look for resource contention or memory leaks');
    score -= 15;
  }

  // Determine grade
  let grade: LoadTestAssessment['grade'];
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    passed: score >= 60,
    grade,
    bottlenecks,
    recommendations,
  };
}

// ---- Report generation ----

/**
 * Generate a formatted load test report from one or more result sets.
 */
export function generateLoadReport(results: LoadTestResult[]): string {
  if (results.length === 0) {
    return 'No load test results available.';
  }

  const lines: string[] = ['Load Test Report', '================', ''];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const assessment = analyzeResults(r);

    lines.push(`Test Run #${i + 1}`);
    lines.push(`  Total Requests: ${r.totalRequests}`);
    lines.push(`  Success: ${r.successCount} | Fail: ${r.failCount}`);
    lines.push(`  Avg Latency: ${r.avgLatency}ms`);
    lines.push(`  P95 Latency: ${r.p95Latency}ms`);
    lines.push(`  P99 Latency: ${r.p99Latency}ms`);
    lines.push(`  Max Latency: ${r.maxLatency}ms`);
    lines.push(`  RPS: ${r.requestsPerSecond}`);
    lines.push(`  Grade: ${assessment.grade} | Passed: ${assessment.passed}`);

    if (assessment.bottlenecks.length > 0) {
      lines.push(`  Bottlenecks:`);
      for (const b of assessment.bottlenecks) {
        lines.push(`    - ${b}`);
      }
    }

    if (assessment.recommendations.length > 0) {
      lines.push(`  Recommendations:`);
      for (const rec of assessment.recommendations) {
        lines.push(`    - ${rec}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
