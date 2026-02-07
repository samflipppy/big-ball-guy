/**
 * Usage Analytics Dashboard (#313)
 *
 * Tracks user events, generates aggregated stats, active user counts,
 * feature usage breakdowns, and full usage reports.
 */

// ---- Types ----

export interface UsageEvent {
  id: string;
  userId: string;
  teamId: string;
  event: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface UsageReport {
  totalEvents: number;
  activeUsers: number;
  topFeatures: { feature: string; count: number }[];
  peakHours: { hour: number; count: number }[];
}

export type UsagePeriod = 'day' | 'week' | 'month';

// ---- In-memory store (replaced by IndexedDB/Supabase in production) ----

let events: UsageEvent[] = [];

/** Generate a unique ID. */
function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---- Helpers ----

function getPeriodStart(period: UsagePeriod): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day;
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

function filterByTeamAndPeriod(
  teamId: string,
  period: UsagePeriod,
): UsageEvent[] {
  const start = getPeriodStart(period);
  return events.filter(
    (e) => e.teamId === teamId && new Date(e.timestamp) >= start,
  );
}

// ---- Public API ----

/**
 * Record a usage event.
 */
export function trackEvent(
  event: string,
  metadata: Record<string, unknown> = {},
  userId = 'anonymous',
  teamId = 'default',
): UsageEvent {
  const entry: UsageEvent = {
    id: generateId(),
    userId,
    teamId,
    event,
    metadata,
    timestamp: new Date().toISOString(),
  };
  events.push(entry);
  return entry;
}

/**
 * Get aggregated usage stats for a team within a period.
 */
export function getUsageStats(
  teamId: string,
  period: UsagePeriod,
): { totalEvents: number; uniqueUsers: number; eventBreakdown: Record<string, number> } {
  const filtered = filterByTeamAndPeriod(teamId, period);
  const uniqueUsers = new Set(filtered.map((e) => e.userId)).size;
  const eventBreakdown: Record<string, number> = {};
  for (const e of filtered) {
    eventBreakdown[e.event] = (eventBreakdown[e.event] || 0) + 1;
  }
  return { totalEvents: filtered.length, uniqueUsers, eventBreakdown };
}

/**
 * Get the count of unique active users for a team within a period.
 */
export function getActiveUsers(teamId: string, period: UsagePeriod): number {
  const filtered = filterByTeamAndPeriod(teamId, period);
  return new Set(filtered.map((e) => e.userId)).size;
}

/**
 * Get a feature usage breakdown for a team (all-time).
 */
export function getFeatureUsage(
  teamId: string,
): { feature: string; count: number }[] {
  const teamEvents = events.filter((e) => e.teamId === teamId);
  const counts: Record<string, number> = {};
  for (const e of teamEvents) {
    counts[e.event] = (counts[e.event] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate a full usage report for a team between two dates.
 */
export function generateUsageReport(
  teamId: string,
  startDate: string,
  endDate: string,
): UsageReport {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const filtered = events.filter((e) => {
    const ts = new Date(e.timestamp);
    return e.teamId === teamId && ts >= start && ts <= end;
  });

  const totalEvents = filtered.length;
  const activeUsers = new Set(filtered.map((e) => e.userId)).size;

  // Top features
  const featureCounts: Record<string, number> = {};
  for (const e of filtered) {
    featureCounts[e.event] = (featureCounts[e.event] || 0) + 1;
  }
  const topFeatures = Object.entries(featureCounts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);

  // Peak hours
  const hourCounts: Record<number, number> = {};
  for (const e of filtered) {
    const hour = new Date(e.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: Number(hour), count }))
    .sort((a, b) => b.count - a.count);

  return { totalEvents, activeUsers, topFeatures, peakHours };
}

/**
 * Get all events (for testing or export purposes).
 */
export function getAllEvents(): UsageEvent[] {
  return [...events];
}

/**
 * Clear all events (for testing).
 */
export function clearEvents(): void {
  events = [];
}
