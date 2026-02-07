import { describe, it, expect } from 'vitest';
import {
  simulateLoad,
  analyzeResults,
  generateLoadReport,
  LOAD_TEST_PRESETS,
} from '@/lib/testing/load-testing';
import type { LoadTestConfig, LoadTestResult } from '@/lib/testing/load-testing';

// ---- Helpers ----

function makeConfig(overrides: Partial<LoadTestConfig> = {}): LoadTestConfig {
  return {
    concurrentUsers: 50,
    duration: 60,
    rampUpTime: 10,
    targetEndpoint: '/api/plays',
    requestsPerSecond: 25,
    ...overrides,
  };
}

function makeResult(overrides: Partial<LoadTestResult> = {}): LoadTestResult {
  return {
    totalRequests: 1500,
    successCount: 1490,
    failCount: 10,
    avgLatency: 120,
    p95Latency: 300,
    p99Latency: 480,
    maxLatency: 960,
    requestsPerSecond: 25,
    ...overrides,
  };
}

// ---- LOAD_TEST_PRESETS ----

describe('LOAD_TEST_PRESETS', () => {
  it('has smoke preset with 10 users', () => {
    expect(LOAD_TEST_PRESETS.smoke.concurrentUsers).toBe(10);
  });

  it('has normal preset with 50 users', () => {
    expect(LOAD_TEST_PRESETS.normal.concurrentUsers).toBe(50);
  });

  it('has stress preset with 200 users', () => {
    expect(LOAD_TEST_PRESETS.stress.concurrentUsers).toBe(200);
  });

  it('has spike preset with 500 users', () => {
    expect(LOAD_TEST_PRESETS.spike.concurrentUsers).toBe(500);
  });

  it('all presets have positive duration', () => {
    for (const preset of Object.values(LOAD_TEST_PRESETS)) {
      expect(preset.duration).toBeGreaterThan(0);
    }
  });

  it('all presets have a target endpoint', () => {
    for (const preset of Object.values(LOAD_TEST_PRESETS)) {
      expect(preset.targetEndpoint.length).toBeGreaterThan(0);
    }
  });

  it('all presets have positive requestsPerSecond', () => {
    for (const preset of Object.values(LOAD_TEST_PRESETS)) {
      expect(preset.requestsPerSecond).toBeGreaterThan(0);
    }
  });

  it('spike has short ramp-up time', () => {
    expect(LOAD_TEST_PRESETS.spike.rampUpTime).toBeLessThanOrEqual(10);
  });
});

// ---- simulateLoad ----

describe('simulateLoad()', () => {
  it('returns a result with all required fields', () => {
    const result = simulateLoad(makeConfig());
    expect(result.totalRequests).toBeGreaterThan(0);
    expect(result.successCount).toBeGreaterThan(0);
    expect(result.failCount).toBeGreaterThanOrEqual(0);
    expect(result.avgLatency).toBeGreaterThan(0);
    expect(result.p95Latency).toBeGreaterThan(0);
    expect(result.p99Latency).toBeGreaterThan(0);
    expect(result.maxLatency).toBeGreaterThan(0);
    expect(result.requestsPerSecond).toBeGreaterThan(0);
  });

  it('total requests = success + fail', () => {
    const result = simulateLoad(makeConfig());
    expect(result.successCount + result.failCount).toBe(result.totalRequests);
  });

  it('total requests equals RPS * duration', () => {
    const config = makeConfig({ requestsPerSecond: 10, duration: 30 });
    const result = simulateLoad(config);
    expect(result.totalRequests).toBe(300);
  });

  it('p95 >= avg latency', () => {
    const result = simulateLoad(makeConfig());
    expect(result.p95Latency).toBeGreaterThanOrEqual(result.avgLatency);
  });

  it('p99 >= p95 latency', () => {
    const result = simulateLoad(makeConfig());
    expect(result.p99Latency).toBeGreaterThanOrEqual(result.p95Latency);
  });

  it('max >= p99 latency', () => {
    const result = simulateLoad(makeConfig());
    expect(result.maxLatency).toBeGreaterThanOrEqual(result.p99Latency);
  });

  it('throws for zero concurrent users', () => {
    expect(() => simulateLoad(makeConfig({ concurrentUsers: 0 }))).toThrow(
      'Concurrent users must be positive',
    );
  });

  it('throws for negative duration', () => {
    expect(() => simulateLoad(makeConfig({ duration: -1 }))).toThrow(
      'Duration must be positive',
    );
  });

  it('throws for zero RPS', () => {
    expect(() => simulateLoad(makeConfig({ requestsPerSecond: 0 }))).toThrow(
      'Requests per second must be positive',
    );
  });

  it('throws for empty endpoint', () => {
    expect(() => simulateLoad(makeConfig({ targetEndpoint: '' }))).toThrow(
      'Target endpoint is required',
    );
  });

  it('higher concurrent users produce higher latency', () => {
    const low = simulateLoad(makeConfig({ concurrentUsers: 10 }));
    const high = simulateLoad(makeConfig({ concurrentUsers: 200 }));
    expect(high.avgLatency).toBeGreaterThan(low.avgLatency);
  });

  it('works with preset configs', () => {
    for (const preset of Object.values(LOAD_TEST_PRESETS)) {
      const result = simulateLoad(preset);
      expect(result.totalRequests).toBeGreaterThan(0);
    }
  });
});

// ---- analyzeResults ----

describe('analyzeResults()', () => {
  it('returns passing assessment for good results', () => {
    const result = makeResult({
      totalRequests: 1000,
      successCount: 999,
      failCount: 1,
      avgLatency: 100,
      p95Latency: 250,
      p99Latency: 500,
      maxLatency: 800,
    });
    const assessment = analyzeResults(result);
    expect(assessment.passed).toBe(true);
    expect(assessment.grade).toBe('A');
  });

  it('fails for high error rates', () => {
    const result = makeResult({
      totalRequests: 1000,
      successCount: 900,
      failCount: 100, // 10% error rate
    });
    const assessment = analyzeResults(result);
    expect(assessment.bottlenecks.length).toBeGreaterThan(0);
    expect(assessment.bottlenecks.some((b) => b.includes('error rate'))).toBe(true);
  });

  it('identifies high average latency as bottleneck', () => {
    const result = makeResult({ avgLatency: 800 });
    const assessment = analyzeResults(result);
    expect(assessment.bottlenecks.some((b) => b.includes('Average latency'))).toBe(true);
  });

  it('identifies high P95 latency as bottleneck', () => {
    const result = makeResult({ p95Latency: 1500 });
    const assessment = analyzeResults(result);
    expect(assessment.bottlenecks.some((b) => b.includes('P95'))).toBe(true);
  });

  it('identifies high P99 latency as bottleneck', () => {
    const result = makeResult({ p99Latency: 3000 });
    const assessment = analyzeResults(result);
    expect(assessment.bottlenecks.some((b) => b.includes('P99'))).toBe(true);
  });

  it('provides recommendations for issues', () => {
    const result = makeResult({
      totalRequests: 1000,
      failCount: 100,
      successCount: 900,
      avgLatency: 800,
    });
    const assessment = analyzeResults(result);
    expect(assessment.recommendations.length).toBeGreaterThan(0);
  });

  it('gives low grade for multiple issues', () => {
    const result = makeResult({
      totalRequests: 1000,
      failCount: 200,
      successCount: 800,
      avgLatency: 1000,
      p95Latency: 2500,
      p99Latency: 5000,
    });
    const assessment = analyzeResults(result);
    expect(['D', 'F']).toContain(assessment.grade);
    expect(assessment.passed).toBe(false);
  });

  it('handles zero total requests gracefully', () => {
    const result = makeResult({ totalRequests: 0, successCount: 0, failCount: 0 });
    const assessment = analyzeResults(result);
    expect(assessment).toBeDefined();
    expect(typeof assessment.passed).toBe('boolean');
  });
});

// ---- generateLoadReport ----

describe('generateLoadReport()', () => {
  it('returns a message for no results', () => {
    expect(generateLoadReport([])).toBe('No load test results available.');
  });

  it('includes report header', () => {
    const report = generateLoadReport([makeResult()]);
    expect(report).toContain('Load Test Report');
  });

  it('includes test run numbers', () => {
    const report = generateLoadReport([makeResult(), makeResult()]);
    expect(report).toContain('Test Run #1');
    expect(report).toContain('Test Run #2');
  });

  it('includes latency metrics', () => {
    const result = makeResult({ avgLatency: 150, p95Latency: 375, p99Latency: 600 });
    const report = generateLoadReport([result]);
    expect(report).toContain('150ms');
    expect(report).toContain('375ms');
    expect(report).toContain('600ms');
  });

  it('includes success and fail counts', () => {
    const result = makeResult({ successCount: 900, failCount: 100 });
    const report = generateLoadReport([result]);
    expect(report).toContain('900');
    expect(report).toContain('100');
  });

  it('includes grade', () => {
    const report = generateLoadReport([makeResult()]);
    expect(report).toMatch(/Grade: [A-F]/);
  });

  it('includes bottlenecks when present', () => {
    const result = makeResult({ avgLatency: 800 });
    const report = generateLoadReport([result]);
    expect(report).toContain('Bottleneck');
  });

  it('includes recommendations when present', () => {
    const result = makeResult({ avgLatency: 800 });
    const report = generateLoadReport([result]);
    expect(report).toContain('Recommendation');
  });

  it('includes RPS in report', () => {
    const result = makeResult({ requestsPerSecond: 42 });
    const report = generateLoadReport([result]);
    expect(report).toContain('42');
  });
});
