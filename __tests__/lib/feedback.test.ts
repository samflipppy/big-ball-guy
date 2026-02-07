import { describe, it, expect, beforeEach } from 'vitest';
import {
  submitFeedback,
  getFeedbackEntries,
  getAverageRating,
  clearFeedback,
} from '@/lib/feedback';
import type { FeedbackEntry } from '@/lib/feedback';

describe('feedback', () => {
  beforeEach(() => {
    clearFeedback();
  });

  describe('submitFeedback', () => {
    it('creates a feedback entry with id and timestamp', () => {
      const entry = submitFeedback({
        userId: 'u1',
        type: 'bug',
        rating: 4,
        message: 'Found a bug',
        page: '/playbook',
      });
      expect(entry.id).toMatch(/^fb_/);
      expect(entry.timestamp).toBeDefined();
      expect(entry.type).toBe('bug');
      expect(entry.rating).toBe(4);
      expect(entry.message).toBe('Found a bug');
    });

    it('throws when message is empty', () => {
      expect(() =>
        submitFeedback({
          userId: 'u1',
          type: 'general',
          rating: 3,
          message: '',
          page: '/home',
        }),
      ).toThrow('Feedback message is required');
    });

    it('throws when rating is out of range', () => {
      expect(() =>
        submitFeedback({
          userId: 'u1',
          type: 'general',
          rating: 0 as 1,
          message: 'test',
          page: '/home',
        }),
      ).toThrow('Rating must be between 1 and 5');
    });

    it('stores optional screenshot field', () => {
      const entry = submitFeedback({
        userId: 'u1',
        type: 'bug',
        rating: 2,
        message: 'Visual issue',
        screenshot: 'data:image/png;base64,abc',
        page: '/canvas',
      });
      expect(entry.screenshot).toBe('data:image/png;base64,abc');
    });
  });

  describe('getFeedbackEntries', () => {
    it('returns all entries when no filters provided', () => {
      submitFeedback({ userId: 'u1', type: 'bug', rating: 3, message: 'Bug 1', page: '/' });
      submitFeedback({ userId: 'u2', type: 'feature', rating: 5, message: 'Idea', page: '/' });
      const entries = getFeedbackEntries();
      expect(entries).toHaveLength(2);
    });

    it('filters by type', () => {
      submitFeedback({ userId: 'u1', type: 'bug', rating: 3, message: 'Bug 1', page: '/' });
      submitFeedback({ userId: 'u2', type: 'feature', rating: 5, message: 'Idea', page: '/' });
      const bugs = getFeedbackEntries({ type: 'bug' });
      expect(bugs).toHaveLength(1);
      expect(bugs[0].type).toBe('bug');
    });

    it('filters by minimum rating', () => {
      submitFeedback({ userId: 'u1', type: 'general', rating: 2, message: 'Low', page: '/' });
      submitFeedback({ userId: 'u2', type: 'general', rating: 4, message: 'High', page: '/' });
      submitFeedback({ userId: 'u3', type: 'general', rating: 5, message: 'Best', page: '/' });
      const highRated = getFeedbackEntries({ rating: 4 });
      expect(highRated).toHaveLength(2);
    });

    it('returns entries sorted by timestamp descending', () => {
      submitFeedback({ userId: 'u1', type: 'general', rating: 3, message: 'First', page: '/' });
      submitFeedback({ userId: 'u2', type: 'general', rating: 4, message: 'Second', page: '/' });
      const entries = getFeedbackEntries();
      // Most recent first
      expect(
        new Date(entries[0].timestamp).getTime(),
      ).toBeGreaterThanOrEqual(new Date(entries[1].timestamp).getTime());
    });

    it('returns empty array when no entries match', () => {
      submitFeedback({ userId: 'u1', type: 'bug', rating: 3, message: 'Bug', page: '/' });
      const features = getFeedbackEntries({ type: 'feature' });
      expect(features).toHaveLength(0);
    });
  });

  describe('getAverageRating', () => {
    it('computes average rating', () => {
      submitFeedback({ userId: 'u1', type: 'general', rating: 4, message: 'A', page: '/' });
      submitFeedback({ userId: 'u2', type: 'general', rating: 2, message: 'B', page: '/' });
      expect(getAverageRating()).toBe(3);
    });

    it('returns 0 when there are no entries', () => {
      expect(getAverageRating()).toBe(0);
    });
  });

  describe('FeedbackEntry type shape', () => {
    it('has all required fields', () => {
      const entry: FeedbackEntry = {
        id: 'fb-1',
        userId: 'u1',
        type: 'feature',
        rating: 5,
        message: 'Great app',
        page: '/home',
        timestamp: new Date().toISOString(),
      };
      expect(entry.type).toBe('feature');
      expect(entry.screenshot).toBeUndefined();
    });
  });
});
