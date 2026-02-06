/**
 * Session management with device fingerprinting.
 *
 * Manages user sessions with support for multiple devices,
 * session expiration, and bulk revocation.
 */

import type { UserId } from '@/types';

// --- Types ---

export interface DeviceInfo {
  userAgent: string;
  platform?: string;
  language?: string;
}

export interface Session {
  id: string;
  userId: UserId;
  deviceInfo: DeviceInfo;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  ipAddress: string;
  revoked: boolean;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: Session;
  reason?: string;
}

// --- Constants ---

const DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_ID_LENGTH = 48;

// --- Session store ---

const sessionStore = new Map<string, Session>();

// --- Helpers ---

function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(SESSION_ID_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// --- Session Manager Class ---

export class SessionManager {
  private sessionDurationMs: number;

  constructor(sessionDurationMs: number = DEFAULT_SESSION_DURATION_MS) {
    this.sessionDurationMs = sessionDurationMs;
  }

  /**
   * Create a new session for a user with device information.
   */
  createSession(
    userId: UserId,
    deviceInfo: DeviceInfo,
    ipAddress: string = '0.0.0.0',
  ): Session {
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!deviceInfo || !deviceInfo.userAgent) {
      throw new Error('deviceInfo with userAgent is required');
    }

    const now = Date.now();
    const session: Session = {
      id: generateSessionId(),
      userId,
      deviceInfo,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + this.sessionDurationMs,
      ipAddress,
      revoked: false,
    };

    sessionStore.set(session.id, session);
    return session;
  }

  /**
   * Validate a session by ID. Checks existence, expiration, and revocation.
   * Updates lastActiveAt on successful validation.
   */
  validateSession(sessionId: string): SessionValidationResult {
    if (!sessionId) {
      return { valid: false, reason: 'Session ID is required' };
    }

    const session = sessionStore.get(sessionId);

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (session.revoked) {
      return { valid: false, reason: 'Session has been revoked' };
    }

    const now = Date.now();
    if (now > session.expiresAt) {
      return { valid: false, reason: 'Session has expired' };
    }

    // Update last active timestamp
    session.lastActiveAt = now;

    return { valid: true, session: { ...session } };
  }

  /**
   * Get all active (non-revoked, non-expired) sessions for a user.
   */
  getActiveSessions(userId: UserId): Session[] {
    const now = Date.now();
    const sessions: Session[] = [];

    for (const session of sessionStore.values()) {
      if (
        session.userId === userId &&
        !session.revoked &&
        session.expiresAt > now
      ) {
        sessions.push({ ...session });
      }
    }

    // Sort by most recently active
    sessions.sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    return sessions;
  }

  /**
   * Revoke a specific session by ID.
   */
  revokeSession(sessionId: string): boolean {
    const session = sessionStore.get(sessionId);
    if (!session) {
      return false;
    }

    session.revoked = true;
    return true;
  }

  /**
   * Revoke all sessions for a user, optionally excluding a specific session
   * (e.g., the current session).
   */
  revokeAllSessions(userId: UserId, except?: string): number {
    let count = 0;

    for (const session of sessionStore.values()) {
      if (session.userId === userId && !session.revoked) {
        if (except && session.id === except) {
          continue;
        }
        session.revoked = true;
        count++;
      }
    }

    return count;
  }

  /**
   * Extend a session's expiration time.
   */
  extendSession(sessionId: string, additionalMs?: number): boolean {
    const session = sessionStore.get(sessionId);
    if (!session || session.revoked) {
      return false;
    }

    const extension = additionalMs || this.sessionDurationMs;
    session.expiresAt = Date.now() + extension;
    return true;
  }

  /**
   * Get the configured session duration in milliseconds.
   */
  getSessionDuration(): number {
    return this.sessionDurationMs;
  }

  /**
   * Clear all sessions from the store (for testing).
   */
  clearAllSessions(): void {
    sessionStore.clear();
  }
}
