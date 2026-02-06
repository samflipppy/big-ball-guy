// ============================================================
// #345 — Performance Monitoring
// Captures navigation timing, component render durations,
// API call latencies, and Web Vitals.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageLoadMetrics {
  dnsLookup: number;
  tcpConnection: number;
  ttfb: number;
  contentDownload: number;
  domInteractive: number;
  domComplete: number;
  loadEvent: number;
  totalDuration: number;
}

export interface ComponentRenderMetric {
  componentName: string;
  duration: number;
  timestamp: number;
}

export interface ApiCallMetric {
  endpoint: string;
  duration: number;
  status: number;
  timestamp: number;
}

export interface WebVitals {
  cls: number | null;
  fid: number | null;
  lcp: number | null;
  ttfb: number | null;
  fcp: number | null;
}

export interface PerformanceReport {
  pageLoad: PageLoadMetrics | null;
  webVitals: WebVitals;
  componentRenders: ComponentRenderMetric[];
  apiCalls: ApiCallMetric[];
  summary: {
    avgRenderDuration: number;
    avgApiDuration: number;
    apiErrorRate: number;
    totalApiCalls: number;
    totalComponentRenders: number;
    slowestComponent: string | null;
    slowestApi: string | null;
  };
  generatedAt: number;
}

// ---------------------------------------------------------------------------
// Internal stores
// ---------------------------------------------------------------------------

const componentRenders: ComponentRenderMetric[] = [];
const apiCalls: ApiCallMetric[] = [];
let cachedPageLoad: PageLoadMetrics | null = null;

// ---------------------------------------------------------------------------
// measurePageLoad
// ---------------------------------------------------------------------------

export function measurePageLoad(): PageLoadMetrics | null {
  if (typeof window === 'undefined' || !window.performance) return null;

  const entries = performance.getEntriesByType('navigation');
  if (entries.length === 0) return null;

  const nav = entries[0] as PerformanceNavigationTiming;

  const metrics: PageLoadMetrics = {
    dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
    tcpConnection: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    contentDownload: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive - nav.startTime,
    domComplete: nav.domComplete - nav.startTime,
    loadEvent: nav.loadEventEnd - nav.loadEventStart,
    totalDuration: nav.loadEventEnd - nav.startTime,
  };

  cachedPageLoad = metrics;
  return metrics;
}

// ---------------------------------------------------------------------------
// measureComponentRender
// ---------------------------------------------------------------------------

export function measureComponentRender(
  componentName: string,
  duration: number,
): ComponentRenderMetric {
  const metric: ComponentRenderMetric = {
    componentName,
    duration,
    timestamp: Date.now(),
  };
  componentRenders.push(metric);
  return metric;
}

// ---------------------------------------------------------------------------
// measureApiCall
// ---------------------------------------------------------------------------

export function measureApiCall(
  endpoint: string,
  duration: number,
  status: number,
): ApiCallMetric {
  const metric: ApiCallMetric = {
    endpoint,
    duration,
    status,
    timestamp: Date.now(),
  };
  apiCalls.push(metric);
  return metric;
}

// ---------------------------------------------------------------------------
// getWebVitals
// ---------------------------------------------------------------------------

export function getWebVitals(): WebVitals {
  const vitals: WebVitals = {
    cls: null,
    fid: null,
    lcp: null,
    ttfb: null,
    fcp: null,
  };

  if (typeof window === 'undefined' || !window.performance) return vitals;

  // FCP
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
  if (fcpEntry) {
    vitals.fcp = fcpEntry.startTime;
  }

  // TTFB from navigation timing
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    const nav = navEntries[0] as PerformanceNavigationTiming;
    vitals.ttfb = nav.responseStart - nav.requestStart;
  }

  // LCP — from PerformanceObserver entries (if available via getEntriesByType)
  try {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }
  } catch {
    // Not all browsers support this entry type via getEntriesByType
  }

  // CLS — layout-shift entries
  try {
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');
    if (layoutShiftEntries.length > 0) {
      vitals.cls = layoutShiftEntries.reduce(
        (sum, entry) => sum + ((entry as unknown as { value: number }).value || 0),
        0,
      );
    }
  } catch {
    // Not all browsers support this
  }

  // FID — first-input entries
  try {
    const fidEntries = performance.getEntriesByType('first-input');
    if (fidEntries.length > 0) {
      const fidEntry = fidEntries[0] as PerformanceEventTiming;
      vitals.fid = fidEntry.processingStart - fidEntry.startTime;
    }
  } catch {
    // Not all browsers support this
  }

  return vitals;
}

// ---------------------------------------------------------------------------
// generateReport
// ---------------------------------------------------------------------------

export function generateReport(): PerformanceReport {
  const avgRenderDuration =
    componentRenders.length > 0
      ? componentRenders.reduce((s, r) => s + r.duration, 0) / componentRenders.length
      : 0;

  const avgApiDuration =
    apiCalls.length > 0
      ? apiCalls.reduce((s, a) => s + a.duration, 0) / apiCalls.length
      : 0;

  const errorApiCalls = apiCalls.filter((a) => a.status >= 400);
  const apiErrorRate = apiCalls.length > 0 ? errorApiCalls.length / apiCalls.length : 0;

  const slowestComponent =
    componentRenders.length > 0
      ? componentRenders.reduce((max, r) => (r.duration > max.duration ? r : max)).componentName
      : null;

  const slowestApi =
    apiCalls.length > 0
      ? apiCalls.reduce((max, a) => (a.duration > max.duration ? a : max)).endpoint
      : null;

  return {
    pageLoad: cachedPageLoad,
    webVitals: getWebVitals(),
    componentRenders: [...componentRenders],
    apiCalls: [...apiCalls],
    summary: {
      avgRenderDuration,
      avgApiDuration,
      apiErrorRate,
      totalApiCalls: apiCalls.length,
      totalComponentRenders: componentRenders.length,
      slowestComponent,
      slowestApi,
    },
    generatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// clearMetrics — utility for tests and resets
// ---------------------------------------------------------------------------

export function clearMetrics(): void {
  componentRenders.length = 0;
  apiCalls.length = 0;
  cachedPageLoad = null;
}
