import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackEvent,
  getUsageStats,
  getActiveUsers,
  getFeatureUsage,
  generateUsageReport,
  getAllEvents,
  clearEvents,
} from '@/lib/analytics/usage-tracker';
import type { UsageEvent, UsageReport } from '@/lib/analytics/usage-tracker';

describe('usage-tracker', () => {
  beforeEach(() => {
    clearEvents();
  });

  describe('trackEvent', () => {
    it('records an event and returns it with an id and timestamp', () => {
      const result = trackEvent('play_created', { playId: 'p1' }, 'user-1', 'team-1');
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^evt_/);
      expect(result.event).toBe('play_created');
      expect(result.userId).toBe('user-1');
      expect(result.teamId).toBe('team-1');
      expect(result.metadata).toEqual({ playId: 'p1' });
      expect(result.timestamp).toBeDefined();
    });

    it('uses default userId and teamId when not provided', () => {
      const result = trackEvent('page_view');
      expect(result.userId).toBe('anonymous');
      expect(result.teamId).toBe('default');
    });

    it('stores events that can be retrieved via getAllEvents', () => {
      trackEvent('event_a', {}, 'u1', 't1');
      trackEvent('event_b', {}, 'u2', 't1');
      const all = getAllEvents();
      expect(all).toHaveLength(2);
      expect(all[0].event).toBe('event_a');
      expect(all[1].event).toBe('event_b');
    });

    it('creates unique IDs for each event', () => {
      const a = trackEvent('e1', {}, 'u1', 't1');
      const b = trackEvent('e2', {}, 'u1', 't1');
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('getUsageStats', () => {
    it('returns aggregated stats for a team in a period', () => {
      trackEvent('play_created', {}, 'user-1', 'team-1');
      trackEvent('play_created', {}, 'user-2', 'team-1');
      trackEvent('export', {}, 'user-1', 'team-1');
      const stats = getUsageStats('team-1', 'day');
      expect(stats.totalEvents).toBe(3);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.eventBreakdown['play_created']).toBe(2);
      expect(stats.eventBreakdown['export']).toBe(1);
    });

    it('returns zero stats for a team with no events', () => {
      const stats = getUsageStats('nonexistent', 'day');
      expect(stats.totalEvents).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
      expect(stats.eventBreakdown).toEqual({});
    });

    it('filters events by team', () => {
      trackEvent('play_created', {}, 'u1', 'team-A');
      trackEvent('play_created', {}, 'u1', 'team-B');
      const statsA = getUsageStats('team-A', 'day');
      expect(statsA.totalEvents).toBe(1);
    });
  });

  describe('getActiveUsers', () => {
    it('counts unique active users in the period', () => {
      trackEvent('play_created', {}, 'user-1', 'team-1');
      trackEvent('play_edited', {}, 'user-1', 'team-1');
      trackEvent('play_created', {}, 'user-2', 'team-1');
      expect(getActiveUsers('team-1', 'day')).toBe(2);
    });

    it('returns 0 for teams with no events', () => {
      expect(getActiveUsers('empty-team', 'week')).toBe(0);
    });
  });

  describe('getFeatureUsage', () => {
    it('returns feature usage sorted by count descending', () => {
      trackEvent('play_created', {}, 'u1', 'team-1');
      trackEvent('play_created', {}, 'u2', 'team-1');
      trackEvent('play_created', {}, 'u3', 'team-1');
      trackEvent('export', {}, 'u1', 'team-1');
      trackEvent('export', {}, 'u2', 'team-1');
      trackEvent('share', {}, 'u1', 'team-1');

      const usage = getFeatureUsage('team-1');
      expect(usage[0]).toEqual({ feature: 'play_created', count: 3 });
      expect(usage[1]).toEqual({ feature: 'export', count: 2 });
      expect(usage[2]).toEqual({ feature: 'share', count: 1 });
    });

    it('returns empty array for team with no events', () => {
      expect(getFeatureUsage('none')).toEqual([]);
    });
  });

  describe('generateUsageReport', () => {
    it('returns a full usage report with all fields', () => {
      trackEvent('play_created', {}, 'u1', 'team-1');
      trackEvent('export', {}, 'u2', 'team-1');

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const report: UsageReport = generateUsageReport('team-1', startDate, endDate);
      expect(report.totalEvents).toBe(2);
      expect(report.activeUsers).toBe(2);
      expect(report.topFeatures).toHaveLength(2);
      expect(report.peakHours.length).toBeGreaterThan(0);
    });

    it('returns empty report when no events match', () => {
      const report = generateUsageReport('team-1', '2020-01-01', '2020-01-02');
      expect(report.totalEvents).toBe(0);
      expect(report.activeUsers).toBe(0);
      expect(report.topFeatures).toEqual([]);
      expect(report.peakHours).toEqual([]);
    });

    it('peak hours are sorted by count descending', () => {
      // Add several events at different hours
      const base = new Date();
      for (let i = 0; i < 5; i++) {
        trackEvent('play_created', {}, 'u1', 'team-1');
      }
      const startDate = new Date(base.getFullYear(), 0, 1).toISOString();
      const endDate = new Date(base.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      const report = generateUsageReport('team-1', startDate, endDate);
      // All events at the same hour, should be exactly one peak hour entry
      expect(report.peakHours.length).toBe(1);
      expect(report.peakHours[0].count).toBe(5);
    });
  });

  describe('clearEvents', () => {
    it('removes all stored events', () => {
      trackEvent('a', {}, 'u1', 't1');
      trackEvent('b', {}, 'u2', 't2');
      expect(getAllEvents()).toHaveLength(2);
      clearEvents();
      expect(getAllEvents()).toHaveLength(0);
    });
  });

  describe('UsageEvent type shape', () => {
    it('has all required fields', () => {
      const evt: UsageEvent = {
        id: 'evt-1',
        userId: 'u1',
        teamId: 't1',
        event: 'test',
        metadata: { key: 'value' },
        timestamp: new Date().toISOString(),
      };
      expect(evt.id).toBe('evt-1');
      expect(evt.metadata).toEqual({ key: 'value' });
    });
  });
});
