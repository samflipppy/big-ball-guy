import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  measureComponentRender,
  measureApiCall,
  measurePageLoad,
  getWebVitals,
  generateReport,
  clearMetrics,
} from '@/lib/monitoring/performance-tracker';
import type {
  ComponentRenderMetric,
  ApiCallMetric,
  PerformanceReport,
} from '@/lib/monitoring/performance-tracker';

describe('Performance Tracker', () => {
  beforeEach(() => {
    clearMetrics();
  });

  // -----------------------------------------------------------------------
  // measureComponentRender
  // -----------------------------------------------------------------------

  describe('measureComponentRender', () => {
    it('records a component render with name and duration', () => {
      const metric: ComponentRenderMetric = measureComponentRender('PlayCard', 12.5);
      expect(metric.componentName).toBe('PlayCard');
      expect(metric.duration).toBe(12.5);
      expect(metric.timestamp).toBeGreaterThan(0);
    });

    it('stores multiple render metrics', () => {
      measureComponentRender('PlayCard', 10);
      measureComponentRender('FormationView', 25);
      measureComponentRender('PlayCard', 8);

      const report = generateReport();
      expect(report.componentRenders).toHaveLength(3);
    });
  });

  // -----------------------------------------------------------------------
  // measureApiCall
  // -----------------------------------------------------------------------

  describe('measureApiCall', () => {
    it('records an API call with endpoint, duration, and status', () => {
      const metric: ApiCallMetric = measureApiCall('/api/plays', 150, 200);
      expect(metric.endpoint).toBe('/api/plays');
      expect(metric.duration).toBe(150);
      expect(metric.status).toBe(200);
      expect(metric.timestamp).toBeGreaterThan(0);
    });

    it('stores multiple API call metrics', () => {
      measureApiCall('/api/plays', 100, 200);
      measureApiCall('/api/formations', 200, 200);
      measureApiCall('/api/plays', 500, 500);

      const report = generateReport();
      expect(report.apiCalls).toHaveLength(3);
    });
  });

  // -----------------------------------------------------------------------
  // measurePageLoad
  // -----------------------------------------------------------------------

  describe('measurePageLoad', () => {
    it('returns null if no navigation entries exist (jsdom)', () => {
      // jsdom does not populate navigation timing entries by default
      const result = measurePageLoad();
      // In jsdom the getEntriesByType('navigation') returns []
      expect(result).toBeNull();
    });

    it('captures timing when navigation entries are available', () => {
      // Stub the performance API
      const mockNav = {
        domainLookupStart: 0,
        domainLookupEnd: 10,
        connectStart: 10,
        connectEnd: 30,
        requestStart: 30,
        responseStart: 80,
        responseEnd: 120,
        domInteractive: 200,
        domComplete: 350,
        loadEventStart: 360,
        loadEventEnd: 380,
        startTime: 0,
      };
      vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) => {
        if (type === 'navigation') return [mockNav as unknown as PerformanceEntry];
        return [];
      });

      const result = measurePageLoad();
      expect(result).not.toBeNull();
      expect(result!.dnsLookup).toBe(10);
      expect(result!.tcpConnection).toBe(20);
      expect(result!.ttfb).toBe(50);
      expect(result!.contentDownload).toBe(40);
      expect(result!.domInteractive).toBe(200);
      expect(result!.domComplete).toBe(350);
      expect(result!.totalDuration).toBe(380);

      vi.restoreAllMocks();
    });
  });

  // -----------------------------------------------------------------------
  // getWebVitals
  // -----------------------------------------------------------------------

  describe('getWebVitals', () => {
    it('returns all vital keys', () => {
      const vitals = getWebVitals();
      expect(vitals).toHaveProperty('cls');
      expect(vitals).toHaveProperty('fid');
      expect(vitals).toHaveProperty('lcp');
      expect(vitals).toHaveProperty('ttfb');
      expect(vitals).toHaveProperty('fcp');
    });

    it('captures FCP when paint entries exist', () => {
      vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) => {
        if (type === 'paint') {
          return [
            { name: 'first-paint', startTime: 100 } as PerformanceEntry,
            { name: 'first-contentful-paint', startTime: 150 } as PerformanceEntry,
          ];
        }
        return [];
      });

      const vitals = getWebVitals();
      expect(vitals.fcp).toBe(150);

      vi.restoreAllMocks();
    });
  });

  // -----------------------------------------------------------------------
  // generateReport
  // -----------------------------------------------------------------------

  describe('generateReport', () => {
    it('returns a report with all sections', () => {
      const report: PerformanceReport = generateReport();

      expect(report).toHaveProperty('pageLoad');
      expect(report).toHaveProperty('webVitals');
      expect(report).toHaveProperty('componentRenders');
      expect(report).toHaveProperty('apiCalls');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('generatedAt');
    });

    it('computes average render duration correctly', () => {
      measureComponentRender('A', 10);
      measureComponentRender('B', 20);
      measureComponentRender('C', 30);

      const report = generateReport();
      expect(report.summary.avgRenderDuration).toBe(20);
    });

    it('computes average API duration correctly', () => {
      measureApiCall('/a', 100, 200);
      measureApiCall('/b', 300, 200);

      const report = generateReport();
      expect(report.summary.avgApiDuration).toBe(200);
    });

    it('computes API error rate', () => {
      measureApiCall('/ok1', 100, 200);
      measureApiCall('/ok2', 100, 201);
      measureApiCall('/err1', 100, 500);
      measureApiCall('/err2', 100, 404);

      const report = generateReport();
      expect(report.summary.apiErrorRate).toBe(0.5);
      expect(report.summary.totalApiCalls).toBe(4);
    });

    it('identifies the slowest component', () => {
      measureComponentRender('Fast', 5);
      measureComponentRender('Slow', 100);
      measureComponentRender('Medium', 50);

      const report = generateReport();
      expect(report.summary.slowestComponent).toBe('Slow');
    });

    it('identifies the slowest API endpoint', () => {
      measureApiCall('/fast', 50, 200);
      measureApiCall('/slow', 500, 200);

      const report = generateReport();
      expect(report.summary.slowestApi).toBe('/slow');
    });

    it('handles empty metrics gracefully', () => {
      const report = generateReport();
      expect(report.summary.avgRenderDuration).toBe(0);
      expect(report.summary.avgApiDuration).toBe(0);
      expect(report.summary.apiErrorRate).toBe(0);
      expect(report.summary.slowestComponent).toBeNull();
      expect(report.summary.slowestApi).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // clearMetrics
  // -----------------------------------------------------------------------

  describe('clearMetrics', () => {
    it('resets all stored metrics', () => {
      measureComponentRender('X', 10);
      measureApiCall('/y', 100, 200);

      clearMetrics();
      const report = generateReport();

      expect(report.componentRenders).toHaveLength(0);
      expect(report.apiCalls).toHaveLength(0);
      expect(report.summary.totalApiCalls).toBe(0);
      expect(report.summary.totalComponentRenders).toBe(0);
    });
  });
});
