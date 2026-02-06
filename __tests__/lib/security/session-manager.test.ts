import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SessionManager,
  type DeviceInfo,
} from '@/lib/security/session-manager';

describe('session-manager', () => {
  let manager: SessionManager;
  const testDevice: DeviceInfo = {
    userAgent: 'Mozilla/5.0 Test Browser',
    platform: 'MacOS',
    language: 'en-US',
  };

  beforeEach(() => {
    manager = new SessionManager(60_000); // 1 minute sessions for testing
    manager.clearAllSessions();
    vi.restoreAllMocks();
  });

  // --- createSession ---

  describe('createSession', () => {
    it('creates a session with the correct userId', () => {
      const session = manager.createSession('user-1', testDevice, '192.168.1.1');
      expect(session.userId).toBe('user-1');
    });

    it('creates a session with a unique ID', () => {
      const s1 = manager.createSession('user-1', testDevice);
      const s2 = manager.createSession('user-1', testDevice);
      expect(s1.id).not.toBe(s2.id);
    });

    it('stores device info', () => {
      const session = manager.createSession('user-1', testDevice);
      expect(session.deviceInfo.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(session.deviceInfo.platform).toBe('MacOS');
    });

    it('stores IP address', () => {
      const session = manager.createSession('user-1', testDevice, '10.0.0.1');
      expect(session.ipAddress).toBe('10.0.0.1');
    });

    it('defaults IP address to 0.0.0.0', () => {
      const session = manager.createSession('user-1', testDevice);
      expect(session.ipAddress).toBe('0.0.0.0');
    });

    it('sets createdAt and expiresAt timestamps', () => {
      const before = Date.now();
      const session = manager.createSession('user-1', testDevice);
      expect(session.createdAt).toBeGreaterThanOrEqual(before);
      expect(session.expiresAt).toBeGreaterThan(session.createdAt);
    });

    it('throws if userId is empty', () => {
      expect(() => manager.createSession('', testDevice)).toThrow('userId is required');
    });

    it('throws if deviceInfo is missing userAgent', () => {
      expect(() => manager.createSession('user-1', { userAgent: '' })).toThrow(
        'deviceInfo with userAgent is required',
      );
    });

    it('starts not revoked', () => {
      const session = manager.createSession('user-1', testDevice);
      expect(session.revoked).toBe(false);
    });
  });

  // --- validateSession ---

  describe('validateSession', () => {
    it('validates a freshly created session', () => {
      const session = manager.createSession('user-1', testDevice);
      const result = manager.validateSession(session.id);
      expect(result.valid).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session!.userId).toBe('user-1');
    });

    it('returns invalid for non-existent session ID', () => {
      const result = manager.validateSession('non-existent');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('returns invalid for empty session ID', () => {
      const result = manager.validateSession('');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('required');
    });

    it('returns invalid for expired session', () => {
      vi.useFakeTimers();
      const session = manager.createSession('user-1', testDevice);

      vi.advanceTimersByTime(120_000); // 2 minutes, past 1 minute expiry

      const result = manager.validateSession(session.id);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');

      vi.useRealTimers();
    });

    it('returns invalid for revoked session', () => {
      const session = manager.createSession('user-1', testDevice);
      manager.revokeSession(session.id);
      const result = manager.validateSession(session.id);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('revoked');
    });

    it('updates lastActiveAt on successful validation', () => {
      vi.useFakeTimers();
      const session = manager.createSession('user-1', testDevice);
      const originalLastActive = session.lastActiveAt;

      vi.advanceTimersByTime(5000);

      const result = manager.validateSession(session.id);
      expect(result.valid).toBe(true);
      expect(result.session!.lastActiveAt).toBeGreaterThan(originalLastActive);

      vi.useRealTimers();
    });
  });

  // --- getActiveSessions ---

  describe('getActiveSessions', () => {
    it('returns all active sessions for a user', () => {
      manager.createSession('user-1', testDevice, '1.1.1.1');
      manager.createSession('user-1', { userAgent: 'Chrome', platform: 'Windows' }, '2.2.2.2');
      manager.createSession('user-2', testDevice); // different user

      const sessions = manager.getActiveSessions('user-1');
      expect(sessions).toHaveLength(2);
    });

    it('excludes revoked sessions', () => {
      const s1 = manager.createSession('user-1', testDevice);
      manager.createSession('user-1', { userAgent: 'Firefox' });
      manager.revokeSession(s1.id);

      const sessions = manager.getActiveSessions('user-1');
      expect(sessions).toHaveLength(1);
    });

    it('excludes expired sessions', () => {
      vi.useFakeTimers();
      manager.createSession('user-1', testDevice);

      vi.advanceTimersByTime(120_000); // expire first session

      manager.createSession('user-1', { userAgent: 'New Browser' });

      const sessions = manager.getActiveSessions('user-1');
      expect(sessions).toHaveLength(1);

      vi.useRealTimers();
    });

    it('returns empty array for user with no sessions', () => {
      const sessions = manager.getActiveSessions('nobody');
      expect(sessions).toEqual([]);
    });

    it('sorts by most recently active first', () => {
      vi.useFakeTimers();
      const s1 = manager.createSession('user-1', testDevice);

      vi.advanceTimersByTime(1000);
      const s2 = manager.createSession('user-1', { userAgent: 'Chrome' });

      const sessions = manager.getActiveSessions('user-1');
      expect(sessions[0].id).toBe(s2.id);
      expect(sessions[1].id).toBe(s1.id);

      vi.useRealTimers();
    });
  });

  // --- revokeSession ---

  describe('revokeSession', () => {
    it('revokes an existing session', () => {
      const session = manager.createSession('user-1', testDevice);
      const result = manager.revokeSession(session.id);
      expect(result).toBe(true);
    });

    it('returns false for non-existent session', () => {
      expect(manager.revokeSession('fake-id')).toBe(false);
    });

    it('prevents future validation of the revoked session', () => {
      const session = manager.createSession('user-1', testDevice);
      manager.revokeSession(session.id);
      const result = manager.validateSession(session.id);
      expect(result.valid).toBe(false);
    });
  });

  // --- revokeAllSessions ---

  describe('revokeAllSessions', () => {
    it('revokes all sessions for a user', () => {
      manager.createSession('user-1', testDevice);
      manager.createSession('user-1', { userAgent: 'Chrome' });
      manager.createSession('user-2', testDevice); // different user

      const count = manager.revokeAllSessions('user-1');
      expect(count).toBe(2);
      expect(manager.getActiveSessions('user-1')).toHaveLength(0);
      expect(manager.getActiveSessions('user-2')).toHaveLength(1);
    });

    it('excludes a specific session when except is provided', () => {
      const keep = manager.createSession('user-1', testDevice);
      manager.createSession('user-1', { userAgent: 'Chrome' });
      manager.createSession('user-1', { userAgent: 'Firefox' });

      const count = manager.revokeAllSessions('user-1', keep.id);
      expect(count).toBe(2);
      expect(manager.getActiveSessions('user-1')).toHaveLength(1);
      expect(manager.getActiveSessions('user-1')[0].id).toBe(keep.id);
    });

    it('returns 0 when user has no sessions', () => {
      const count = manager.revokeAllSessions('nobody');
      expect(count).toBe(0);
    });

    it('does not re-revoke already revoked sessions', () => {
      const s1 = manager.createSession('user-1', testDevice);
      manager.createSession('user-1', { userAgent: 'Chrome' });
      manager.revokeSession(s1.id); // revoke one first

      const count = manager.revokeAllSessions('user-1');
      expect(count).toBe(1); // only the non-revoked one
    });
  });

  // --- extendSession ---

  describe('extendSession', () => {
    it('extends the session expiry', () => {
      const session = manager.createSession('user-1', testDevice);
      const originalExpiry = session.expiresAt;

      vi.useFakeTimers();
      vi.advanceTimersByTime(30_000); // 30 seconds

      const extended = manager.extendSession(session.id);
      expect(extended).toBe(true);

      const result = manager.validateSession(session.id);
      expect(result.valid).toBe(true);
      expect(result.session!.expiresAt).toBeGreaterThan(originalExpiry);

      vi.useRealTimers();
    });

    it('returns false for non-existent session', () => {
      expect(manager.extendSession('nope')).toBe(false);
    });

    it('returns false for revoked session', () => {
      const session = manager.createSession('user-1', testDevice);
      manager.revokeSession(session.id);
      expect(manager.extendSession(session.id)).toBe(false);
    });
  });

  // --- getSessionDuration ---

  describe('getSessionDuration', () => {
    it('returns configured session duration', () => {
      expect(manager.getSessionDuration()).toBe(60_000);
    });

    it('defaults to 24 hours when not specified', () => {
      const defaultManager = new SessionManager();
      expect(defaultManager.getSessionDuration()).toBe(24 * 60 * 60 * 1000);
    });
  });
});
