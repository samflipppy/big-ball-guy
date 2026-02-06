import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorTracker } from '@/lib/monitoring/error-tracker';

describe('ErrorTracker', () => {
  let tracker: ErrorTracker;

  beforeEach(() => {
    ErrorTracker.resetInstance();
    tracker = ErrorTracker.getInstance();
  });

  // -----------------------------------------------------------------------
  // Singleton
  // -----------------------------------------------------------------------

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const a = ErrorTracker.getInstance();
      const b = ErrorTracker.getInstance();
      expect(a).toBe(b);
    });

    it('creates a fresh instance after reset', () => {
      const a = ErrorTracker.getInstance();
      a.captureError(new Error('test'));

      ErrorTracker.resetInstance();
      const b = ErrorTracker.getInstance();
      expect(b.getRecentErrors()).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // captureError
  // -----------------------------------------------------------------------

  describe('captureError', () => {
    it('records an error with timestamp and id', () => {
      const err = new Error('Something failed');
      const captured = tracker.captureError(err);

      expect(captured.id).toBeTruthy();
      expect(captured.error).toBe(err);
      expect(captured.timestamp).toBeGreaterThan(0);
    });

    it('includes context when provided', () => {
      const context = { playId: 'play_123', action: 'save' };
      const captured = tracker.captureError(new Error('save failed'), context);

      expect(captured.context).toEqual(context);
    });

    it('attaches current user to captured error', () => {
      tracker.setUser('user_42', 'coach@team.com');
      const captured = tracker.captureError(new Error('with user'));

      expect(captured.user).toEqual({ userId: 'user_42', email: 'coach@team.com' });
    });

    it('attaches breadcrumbs to captured error', () => {
      tracker.addBreadcrumb('Opened playbook', 'navigation');
      tracker.addBreadcrumb('Clicked save', 'ui');
      const captured = tracker.captureError(new Error('after breadcrumbs'));

      expect(captured.breadcrumbs).toHaveLength(2);
      expect(captured.breadcrumbs[0].message).toBe('Opened playbook');
      expect(captured.breadcrumbs[1].message).toBe('Clicked save');
    });

    it('limits stored errors to 100', () => {
      for (let i = 0; i < 110; i++) {
        tracker.captureError(new Error(`error-${i}`));
      }
      expect(tracker.getRecentErrors(200)).toHaveLength(100);
    });
  });

  // -----------------------------------------------------------------------
  // captureMessage
  // -----------------------------------------------------------------------

  describe('captureMessage', () => {
    it('records a message with level', () => {
      const msg = tracker.captureMessage('deploy started', 'info');
      expect(msg.message).toBe('deploy started');
      expect(msg.level).toBe('info');
      expect(msg.id).toBeTruthy();
    });

    it('stores messages retrievable via getRecentMessages', () => {
      tracker.captureMessage('info msg', 'info');
      tracker.captureMessage('warn msg', 'warning');
      tracker.captureMessage('err msg', 'error');

      const recent = tracker.getRecentMessages(10);
      expect(recent).toHaveLength(3);
      expect(recent[2].level).toBe('error');
    });
  });

  // -----------------------------------------------------------------------
  // setUser / clearUser
  // -----------------------------------------------------------------------

  describe('user context', () => {
    it('sets and retrieves user info', () => {
      tracker.setUser('user_1', 'a@b.com');
      expect(tracker.getUser()).toEqual({ userId: 'user_1', email: 'a@b.com' });
    });

    it('clears user context', () => {
      tracker.setUser('user_1');
      tracker.clearUser();
      expect(tracker.getUser()).toBeNull();
    });

    it('does not attach user when none is set', () => {
      const captured = tracker.captureError(new Error('no user'));
      expect(captured.user).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // addBreadcrumb
  // -----------------------------------------------------------------------

  describe('addBreadcrumb', () => {
    it('adds breadcrumbs with category and data', () => {
      tracker.addBreadcrumb('Navigate to /plays', 'navigation', { url: '/plays' });
      const crumbs = tracker.getBreadcrumbs();

      expect(crumbs).toHaveLength(1);
      expect(crumbs[0].category).toBe('navigation');
      expect(crumbs[0].data).toEqual({ url: '/plays' });
    });

    it('limits breadcrumbs to 50', () => {
      for (let i = 0; i < 60; i++) {
        tracker.addBreadcrumb(`crumb-${i}`, 'test');
      }
      expect(tracker.getBreadcrumbs()).toHaveLength(50);
    });
  });

  // -----------------------------------------------------------------------
  // getRecentErrors
  // -----------------------------------------------------------------------

  describe('getRecentErrors', () => {
    it('returns the requested number of recent errors', () => {
      for (let i = 0; i < 5; i++) {
        tracker.captureError(new Error(`err-${i}`));
      }

      expect(tracker.getRecentErrors(3)).toHaveLength(3);
      expect(tracker.getRecentErrors()).toHaveLength(5); // default 10
    });

    it('returns all errors when count exceeds stored count', () => {
      tracker.captureError(new Error('only one'));
      expect(tracker.getRecentErrors(100)).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // clear
  // -----------------------------------------------------------------------

  describe('clear', () => {
    it('clears errors, messages, breadcrumbs, and user', () => {
      tracker.captureError(new Error('e'));
      tracker.captureMessage('m', 'info');
      tracker.addBreadcrumb('b', 'test');
      tracker.setUser('u');

      tracker.clear();

      expect(tracker.getRecentErrors()).toHaveLength(0);
      expect(tracker.getRecentMessages()).toHaveLength(0);
      expect(tracker.getBreadcrumbs()).toHaveLength(0);
      expect(tracker.getUser()).toBeNull();
    });
  });
});
