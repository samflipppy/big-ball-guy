import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logSecurityEvent,
  detectAnomalies,
  getSecurityLog,
  generateSecurityReport,
  clearEventLog,
  getEventLog,
  BRUTE_FORCE,
  UNUSUAL_EXPORT,
  NEW_DEVICE_LOGIN,
  DEFAULT_RULES,
} from '@/lib/security/audit-logger';
import type { SecurityEvent, AnomalyRule } from '@/lib/security/audit-logger';

describe('audit-logger', () => {
  beforeEach(() => {
    clearEventLog();
    vi.restoreAllMocks();
  });

  // --- logSecurityEvent ---

  describe('logSecurityEvent', () => {
    it('creates an event with auto-generated id and timestamp', () => {
      const event = logSecurityEvent({
        eventType: 'login_success',
        severity: 'info',
        details: 'User logged in',
        metadata: {},
      });

      expect(event.id).toMatch(/^evt_/);
      expect(event.timestamp).toBeTruthy();
      expect(event.eventType).toBe('login_success');
      expect(event.severity).toBe('info');
    });

    it('stores the event in the log', () => {
      logSecurityEvent({
        eventType: 'test',
        severity: 'info',
        details: 'Test event',
        metadata: {},
      });

      expect(getEventLog()).toHaveLength(1);
    });

    it('includes optional userId and ipAddress', () => {
      const event = logSecurityEvent({
        eventType: 'login_failed',
        severity: 'warning',
        userId: 'user-1',
        ipAddress: '192.168.1.1',
        details: 'Invalid password',
        metadata: {},
      });

      expect(event.userId).toBe('user-1');
      expect(event.ipAddress).toBe('192.168.1.1');
    });

    it('includes metadata', () => {
      const event = logSecurityEvent({
        eventType: 'data_export',
        severity: 'info',
        details: 'Data exported',
        metadata: { format: 'json', size: 1024 },
      });

      expect(event.metadata.format).toBe('json');
      expect(event.metadata.size).toBe(1024);
    });

    it('throws for missing eventType', () => {
      expect(() =>
        logSecurityEvent({
          eventType: '',
          severity: 'info',
          details: 'No type',
          metadata: {},
        }),
      ).toThrow('eventType is required');
    });

    it('throws for missing details', () => {
      expect(() =>
        logSecurityEvent({
          eventType: 'test',
          severity: 'info',
          details: '',
          metadata: {},
        }),
      ).toThrow('details is required');
    });

    it('generates unique IDs for each event', () => {
      const e1 = logSecurityEvent({
        eventType: 'test',
        severity: 'info',
        details: 'Event 1',
        metadata: {},
      });
      const e2 = logSecurityEvent({
        eventType: 'test',
        severity: 'info',
        details: 'Event 2',
        metadata: {},
      });
      expect(e1.id).not.toBe(e2.id);
    });
  });

  // --- detectAnomalies ---

  describe('detectAnomalies', () => {
    it('returns no anomalies for clean events', () => {
      const events: SecurityEvent[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          eventType: 'login_success',
          severity: 'info',
          userId: 'user-1',
          details: 'Login',
          metadata: { deviceId: 'device-1' },
        },
      ];

      const result = detectAnomalies(events);
      expect(result.detected).toBe(false);
      expect(result.anomalies).toHaveLength(0);
    });

    it('detects brute force (5+ failed logins in 5 minutes)', () => {
      const now = new Date();
      const events: SecurityEvent[] = [];
      for (let i = 0; i < 6; i++) {
        events.push({
          id: `evt-${i}`,
          timestamp: new Date(now.getTime() - i * 30_000).toISOString(), // within 5 min
          eventType: 'login_failed',
          severity: 'warning',
          userId: 'attacker',
          details: 'Failed login',
          metadata: {},
        });
      }

      const result = detectAnomalies(events, [BRUTE_FORCE]);
      expect(result.detected).toBe(true);
      expect(result.anomalies[0].rule).toBe('BRUTE_FORCE');
      expect(result.anomalies[0].severity).toBe('critical');
    });

    it('does not flag brute force for different users', () => {
      const now = new Date();
      const events: SecurityEvent[] = [];
      for (let i = 0; i < 6; i++) {
        events.push({
          id: `evt-${i}`,
          timestamp: new Date(now.getTime() - i * 30_000).toISOString(),
          eventType: 'login_failed',
          severity: 'warning',
          userId: `user-${i}`, // different users
          details: 'Failed login',
          metadata: {},
        });
      }

      const result = detectAnomalies(events, [BRUTE_FORCE]);
      expect(result.detected).toBe(false);
    });

    it('detects unusual export volume (10+ in 1 hour)', () => {
      const now = new Date();
      const events: SecurityEvent[] = [];
      for (let i = 0; i < 11; i++) {
        events.push({
          id: `evt-${i}`,
          timestamp: new Date(now.getTime() - i * 60_000).toISOString(), // within 1 hour
          eventType: 'data_export',
          severity: 'info',
          userId: 'exporter',
          details: 'Export',
          metadata: {},
        });
      }

      const result = detectAnomalies(events, [UNUSUAL_EXPORT]);
      expect(result.detected).toBe(true);
      expect(result.anomalies[0].rule).toBe('UNUSUAL_EXPORT');
    });

    it('detects new device login', () => {
      const events: SecurityEvent[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          eventType: 'login_success',
          severity: 'info',
          userId: 'user-1',
          details: 'Login from known device',
          metadata: { deviceId: 'device-A' },
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          eventType: 'login_success',
          severity: 'info',
          userId: 'user-1',
          details: 'Login from new device',
          metadata: { deviceId: 'device-B' },
        },
      ];

      const result = detectAnomalies(events, [NEW_DEVICE_LOGIN]);
      expect(result.detected).toBe(true);
      expect(result.anomalies[0].rule).toBe('NEW_DEVICE_LOGIN');
    });

    it('uses custom rules', () => {
      const customRule: AnomalyRule = {
        name: 'CUSTOM',
        condition: (events) => events.length > 2,
        severity: 'warning',
        message: 'Too many events',
      };

      const events: SecurityEvent[] = [
        { id: '1', timestamp: '', eventType: 'a', severity: 'info', details: 'x', metadata: {} },
        { id: '2', timestamp: '', eventType: 'b', severity: 'info', details: 'y', metadata: {} },
        { id: '3', timestamp: '', eventType: 'c', severity: 'info', details: 'z', metadata: {} },
      ];

      const result = detectAnomalies(events, [customRule]);
      expect(result.detected).toBe(true);
      expect(result.anomalies[0].rule).toBe('CUSTOM');
    });

    it('uses DEFAULT_RULES when none specified', () => {
      const result = detectAnomalies([]);
      expect(result.detected).toBe(false);
      expect(DEFAULT_RULES).toHaveLength(3);
    });
  });

  // --- getSecurityLog ---

  describe('getSecurityLog', () => {
    it('returns all events when no filters specified', () => {
      logSecurityEvent({ eventType: 'a', severity: 'info', details: 'x', metadata: {} });
      logSecurityEvent({ eventType: 'b', severity: 'warning', details: 'y', metadata: {} });

      const log = getSecurityLog();
      expect(log).toHaveLength(2);
    });

    it('filters by severity', () => {
      logSecurityEvent({ eventType: 'a', severity: 'info', details: 'x', metadata: {} });
      logSecurityEvent({ eventType: 'b', severity: 'critical', details: 'y', metadata: {} });

      const log = getSecurityLog({ severity: 'critical' });
      expect(log).toHaveLength(1);
      expect(log[0].severity).toBe('critical');
    });

    it('filters by eventType', () => {
      logSecurityEvent({ eventType: 'login', severity: 'info', details: 'x', metadata: {} });
      logSecurityEvent({ eventType: 'export', severity: 'info', details: 'y', metadata: {} });

      const log = getSecurityLog({ eventType: 'login' });
      expect(log).toHaveLength(1);
      expect(log[0].eventType).toBe('login');
    });

    it('filters by userId', () => {
      logSecurityEvent({ eventType: 'a', severity: 'info', userId: 'user-1', details: 'x', metadata: {} });
      logSecurityEvent({ eventType: 'b', severity: 'info', userId: 'user-2', details: 'y', metadata: {} });

      const log = getSecurityLog({ userId: 'user-1' });
      expect(log).toHaveLength(1);
      expect(log[0].userId).toBe('user-1');
    });

    it('filters by since date', () => {
      const oldEvent = logSecurityEvent({ eventType: 'old', severity: 'info', details: 'x', metadata: {} });
      // Manually set old timestamp
      const log1 = getEventLog();
      log1[0].timestamp = new Date(Date.now() - 86400000).toISOString();

      logSecurityEvent({ eventType: 'new', severity: 'info', details: 'y', metadata: {} });

      const since = new Date(Date.now() - 3600000); // 1 hour ago
      const log = getSecurityLog({ since });
      expect(log).toHaveLength(1);
      expect(log[0].eventType).toBe('new');
    });

    it('combines multiple filters', () => {
      logSecurityEvent({ eventType: 'login', severity: 'info', userId: 'user-1', details: 'x', metadata: {} });
      logSecurityEvent({ eventType: 'login', severity: 'critical', userId: 'user-1', details: 'y', metadata: {} });
      logSecurityEvent({ eventType: 'export', severity: 'critical', userId: 'user-1', details: 'z', metadata: {} });

      const log = getSecurityLog({ eventType: 'login', severity: 'critical' });
      expect(log).toHaveLength(1);
      expect(log[0].eventType).toBe('login');
      expect(log[0].severity).toBe('critical');
    });

    it('returns empty array when no events match', () => {
      logSecurityEvent({ eventType: 'test', severity: 'info', details: 'x', metadata: {} });
      const log = getSecurityLog({ severity: 'critical' });
      expect(log).toEqual([]);
    });
  });

  // --- generateSecurityReport ---

  describe('generateSecurityReport', () => {
    it('generates a report with correct structure', () => {
      logSecurityEvent({ eventType: 'login', severity: 'info', details: 'Login', metadata: {} });
      logSecurityEvent({ eventType: 'export', severity: 'warning', details: 'Export', metadata: {} });

      const report = generateSecurityReport(new Date(Date.now() - 86400000));
      expect(report.generatedAt).toBeTruthy();
      expect(report.since).toBeTruthy();
      expect(report.totalEvents).toBe(2);
      expect(report.bySeverity).toBeDefined();
      expect(report.byType).toBeDefined();
      expect(report.anomalies).toBeDefined();
      expect(report.recentCritical).toBeDefined();
    });

    it('counts events by severity', () => {
      logSecurityEvent({ eventType: 'a', severity: 'info', details: 'x', metadata: {} });
      logSecurityEvent({ eventType: 'b', severity: 'info', details: 'y', metadata: {} });
      logSecurityEvent({ eventType: 'c', severity: 'critical', details: 'z', metadata: {} });

      const report = generateSecurityReport(new Date(Date.now() - 86400000));
      expect(report.bySeverity.info).toBe(2);
      expect(report.bySeverity.critical).toBe(1);
      expect(report.bySeverity.warning).toBe(0);
    });

    it('counts events by type', () => {
      logSecurityEvent({ eventType: 'login', severity: 'info', details: 'x', metadata: {} });
      logSecurityEvent({ eventType: 'login', severity: 'info', details: 'y', metadata: {} });
      logSecurityEvent({ eventType: 'export', severity: 'info', details: 'z', metadata: {} });

      const report = generateSecurityReport(new Date(Date.now() - 86400000));
      expect(report.byType['login']).toBe(2);
      expect(report.byType['export']).toBe(1);
    });

    it('includes recent critical events', () => {
      logSecurityEvent({ eventType: 'breach', severity: 'critical', details: 'Breach!', metadata: {} });

      const report = generateSecurityReport(new Date(Date.now() - 86400000));
      expect(report.recentCritical).toHaveLength(1);
      expect(report.recentCritical[0].severity).toBe('critical');
    });

    it('only includes events since the specified date', () => {
      const evt = logSecurityEvent({ eventType: 'old', severity: 'info', details: 'Old', metadata: {} });
      getEventLog()[0].timestamp = new Date(Date.now() - 172800000).toISOString(); // 2 days ago

      logSecurityEvent({ eventType: 'new', severity: 'info', details: 'New', metadata: {} });

      const report = generateSecurityReport(new Date(Date.now() - 86400000)); // since 1 day ago
      expect(report.totalEvents).toBe(1);
    });

    it('runs anomaly detection on the report events', () => {
      const report = generateSecurityReport(new Date(Date.now() - 86400000));
      expect(report.anomalies).toBeDefined();
      expect(typeof report.anomalies.detected).toBe('boolean');
    });
  });

  // --- Pre-built rules ---

  describe('pre-built rules', () => {
    it('BRUTE_FORCE rule has correct properties', () => {
      expect(BRUTE_FORCE.name).toBe('BRUTE_FORCE');
      expect(BRUTE_FORCE.severity).toBe('critical');
      expect(typeof BRUTE_FORCE.condition).toBe('function');
    });

    it('UNUSUAL_EXPORT rule has correct properties', () => {
      expect(UNUSUAL_EXPORT.name).toBe('UNUSUAL_EXPORT');
      expect(UNUSUAL_EXPORT.severity).toBe('warning');
      expect(typeof UNUSUAL_EXPORT.condition).toBe('function');
    });

    it('NEW_DEVICE_LOGIN rule has correct properties', () => {
      expect(NEW_DEVICE_LOGIN.name).toBe('NEW_DEVICE_LOGIN');
      expect(NEW_DEVICE_LOGIN.severity).toBe('info');
      expect(typeof NEW_DEVICE_LOGIN.condition).toBe('function');
    });
  });
});
