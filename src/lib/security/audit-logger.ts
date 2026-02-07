/**
 * Security audit logging with anomaly detection.
 *
 * Records security events, detects suspicious patterns,
 * and generates security reports.
 */

// --- Types ---

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: EventSeverity;
  userId?: string;
  ipAddress?: string;
  details: string;
  metadata: Record<string, unknown>;
}

export interface AnomalyRule {
  name: string;
  condition: (events: SecurityEvent[]) => boolean;
  severity: EventSeverity;
  message: string;
}

export interface AnomalyResult {
  detected: boolean;
  anomalies: {
    rule: string;
    severity: EventSeverity;
    message: string;
  }[];
}

export interface SecurityReport {
  generatedAt: string;
  since: string;
  totalEvents: number;
  bySeverity: Record<EventSeverity, number>;
  byType: Record<string, number>;
  anomalies: AnomalyResult;
  recentCritical: SecurityEvent[];
}

export interface LogFilters {
  severity?: EventSeverity;
  eventType?: string;
  since?: Date;
  userId?: string;
}

// --- In-memory store ---

const eventLog: SecurityEvent[] = [];

/**
 * Get the event log (for testing).
 */
export function getEventLog(): SecurityEvent[] {
  return eventLog;
}

/**
 * Clear the event log (for testing).
 */
export function clearEventLog(): void {
  eventLog.length = 0;
}

// --- Helpers ---

function generateId(): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `evt_${result}`;
}

// --- Pre-built Anomaly Rules ---

/**
 * BRUTE_FORCE: 5 or more failed login attempts from the same user within 5 minutes.
 */
export const BRUTE_FORCE: AnomalyRule = {
  name: 'BRUTE_FORCE',
  condition: (events: SecurityEvent[]): boolean => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentFailedLogins = events.filter(
      (e) =>
        e.eventType === 'login_failed' &&
        e.timestamp >= fiveMinutesAgo,
    );

    // Group by userId
    const byUser = new Map<string, number>();
    for (const event of recentFailedLogins) {
      const userId = event.userId || event.ipAddress || 'unknown';
      byUser.set(userId, (byUser.get(userId) || 0) + 1);
    }

    for (const count of byUser.values()) {
      if (count >= 5) {
        return true;
      }
    }
    return false;
  },
  severity: 'critical',
  message: '5+ failed login attempts detected within 5 minutes',
};

/**
 * UNUSUAL_EXPORT: 10 or more exports from the same user within 1 hour.
 */
export const UNUSUAL_EXPORT: AnomalyRule = {
  name: 'UNUSUAL_EXPORT',
  condition: (events: SecurityEvent[]): boolean => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentExports = events.filter(
      (e) =>
        e.eventType === 'data_export' &&
        e.timestamp >= oneHourAgo,
    );

    const byUser = new Map<string, number>();
    for (const event of recentExports) {
      const userId = event.userId || 'unknown';
      byUser.set(userId, (byUser.get(userId) || 0) + 1);
    }

    for (const count of byUser.values()) {
      if (count >= 10) {
        return true;
      }
    }
    return false;
  },
  severity: 'warning',
  message: '10+ exports detected from a single user within 1 hour',
};

/**
 * NEW_DEVICE_LOGIN: Login from a device not seen before for a user.
 */
export const NEW_DEVICE_LOGIN: AnomalyRule = {
  name: 'NEW_DEVICE_LOGIN',
  condition: (events: SecurityEvent[]): boolean => {
    const logins = events.filter((e) => e.eventType === 'login_success');

    for (const login of logins) {
      const deviceId = login.metadata?.deviceId as string | undefined;
      if (!deviceId) continue;

      const userId = login.userId;
      if (!userId) continue;

      // Check if this device has been seen before for this user
      const previousLogins = events.filter(
        (e) =>
          e.eventType === 'login_success' &&
          e.userId === userId &&
          e.id !== login.id &&
          (e.metadata?.deviceId as string) !== deviceId,
      );

      // User has logged in before but never from this device
      if (previousLogins.length > 0) {
        const sameDeviceLogins = events.filter(
          (e) =>
            e.eventType === 'login_success' &&
            e.userId === userId &&
            e.id !== login.id &&
            (e.metadata?.deviceId as string) === deviceId,
        );
        if (sameDeviceLogins.length === 0) {
          return true;
        }
      }
    }

    return false;
  },
  severity: 'info',
  message: 'Login detected from a new device',
};

/** Default set of anomaly rules */
export const DEFAULT_RULES: AnomalyRule[] = [
  BRUTE_FORCE,
  UNUSUAL_EXPORT,
  NEW_DEVICE_LOGIN,
];

// --- Core Functions ---

/**
 * Log a security event.
 */
export function logSecurityEvent(
  event: Omit<SecurityEvent, 'id' | 'timestamp'>,
): SecurityEvent {
  if (!event.eventType) {
    throw new Error('eventType is required');
  }
  if (!event.details) {
    throw new Error('details is required');
  }

  const securityEvent: SecurityEvent = {
    ...event,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  eventLog.push(securityEvent);
  return securityEvent;
}

/**
 * Detect anomalies in the event log using the provided rules.
 */
export function detectAnomalies(
  events: SecurityEvent[],
  rules: AnomalyRule[] = DEFAULT_RULES,
): AnomalyResult {
  const anomalies: AnomalyResult['anomalies'] = [];

  for (const rule of rules) {
    if (rule.condition(events)) {
      anomalies.push({
        rule: rule.name,
        severity: rule.severity,
        message: rule.message,
      });
    }
  }

  return {
    detected: anomalies.length > 0,
    anomalies,
  };
}

/**
 * Retrieve filtered security events from the log.
 */
export function getSecurityLog(filters: LogFilters = {}): SecurityEvent[] {
  let filtered = [...eventLog];

  if (filters.severity) {
    filtered = filtered.filter((e) => e.severity === filters.severity);
  }

  if (filters.eventType) {
    filtered = filtered.filter((e) => e.eventType === filters.eventType);
  }

  if (filters.since) {
    const since = filters.since.toISOString();
    filtered = filtered.filter((e) => e.timestamp >= since);
  }

  if (filters.userId) {
    filtered = filtered.filter((e) => e.userId === filters.userId);
  }

  return filtered;
}

/**
 * Generate a summary security report for events since a given date.
 */
export function generateSecurityReport(since: Date): SecurityReport {
  const sinceISO = since.toISOString();
  const relevantEvents = eventLog.filter((e) => e.timestamp >= sinceISO);

  // Count by severity
  const bySeverity: Record<EventSeverity, number> = {
    info: 0,
    warning: 0,
    critical: 0,
  };
  for (const event of relevantEvents) {
    bySeverity[event.severity]++;
  }

  // Count by type
  const byType: Record<string, number> = {};
  for (const event of relevantEvents) {
    byType[event.eventType] = (byType[event.eventType] || 0) + 1;
  }

  // Recent critical events (last 10)
  const recentCritical = relevantEvents
    .filter((e) => e.severity === 'critical')
    .slice(-10);

  // Run anomaly detection
  const anomalies = detectAnomalies(relevantEvents);

  return {
    generatedAt: new Date().toISOString(),
    since: sinceISO,
    totalEvents: relevantEvents.length,
    bySeverity,
    byType,
    anomalies,
    recentCritical,
  };
}
