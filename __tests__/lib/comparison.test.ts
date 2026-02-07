import { describe, it, expect } from 'vitest';
import {
  BIG_BALL_GUY,
  COMPETITORS,
  compareFeatures,
  generateComparisonTable,
  getUniqueAdvantages,
} from '@/lib/comparison';
import type { Competitor } from '@/lib/comparison';

describe('comparison', () => {
  describe('BIG_BALL_GUY', () => {
    it('has name Big Ball Guy', () => {
      expect(BIG_BALL_GUY.name).toBe('Big Ball Guy');
    });

    it('supports all major features', () => {
      expect(BIG_BALL_GUY.features['Play Designer']).toBe(true);
      expect(BIG_BALL_GUY.features['Real-time Collaboration']).toBe(true);
      expect(BIG_BALL_GUY.features['Offline Mode']).toBe(true);
      expect(BIG_BALL_GUY.features['Marketplace']).toBe(true);
    });

    it('targets all levels', () => {
      expect(BIG_BALL_GUY.targetAudience).toContain('Youth');
      expect(BIG_BALL_GUY.targetAudience).toContain('Pro');
    });
  });

  describe('COMPETITORS', () => {
    it('defines 4 competitors', () => {
      expect(Object.keys(COMPETITORS)).toHaveLength(4);
    });

    it('includes Pro Quick Draw', () => {
      expect(COMPETITORS['Pro Quick Draw']).toBeDefined();
      expect(COMPETITORS['Pro Quick Draw'].name).toBe('Pro Quick Draw');
    });

    it('includes Hudl, Just Play, FirstDown PlayBook', () => {
      expect(COMPETITORS['Hudl']).toBeDefined();
      expect(COMPETITORS['Just Play']).toBeDefined();
      expect(COMPETITORS['FirstDown PlayBook']).toBeDefined();
    });
  });

  describe('compareFeatures', () => {
    it('identifies advantages over Pro Quick Draw', () => {
      const result = compareFeatures(BIG_BALL_GUY, COMPETITORS['Pro Quick Draw']);
      expect(result.advantages.length).toBeGreaterThan(0);
      expect(result.advantages).toContain('Real-time Collaboration');
      expect(result.advantages).toContain('Offline Mode');
    });

    it('identifies neutral features (both have)', () => {
      const result = compareFeatures(BIG_BALL_GUY, COMPETITORS['Pro Quick Draw']);
      expect(result.neutral).toContain('Play Designer');
    });

    it('returns empty disadvantages when comparing against basic competitor', () => {
      const result = compareFeatures(BIG_BALL_GUY, COMPETITORS['FirstDown PlayBook']);
      expect(result.disadvantages).toHaveLength(0);
    });

    it('handles identical competitors (all neutral)', () => {
      const clone: Competitor = { ...BIG_BALL_GUY, name: 'Clone' };
      const result = compareFeatures(BIG_BALL_GUY, clone);
      expect(result.advantages).toHaveLength(0);
      expect(result.disadvantages).toHaveLength(0);
      expect(result.neutral.length).toBeGreaterThan(0);
    });

    it('correctly handles feature we lack but competitor has', () => {
      const superior: Competitor = {
        name: 'Super App',
        features: { 'Magic Feature': true, 'Play Designer': true },
        pricing: '$0',
        platforms: ['Web'],
        targetAudience: 'All',
      };
      const result = compareFeatures(BIG_BALL_GUY, superior);
      expect(result.disadvantages).toContain('Magic Feature');
    });
  });

  describe('generateComparisonTable', () => {
    it('generates a table with rows for each feature', () => {
      const table = generateComparisonTable([BIG_BALL_GUY, COMPETITORS['Pro Quick Draw']]);
      expect(table.length).toBeGreaterThan(0);
      const playDesigner = table.find((r) => r.feature === 'Play Designer');
      expect(playDesigner).toBeDefined();
      expect(playDesigner!.values['Big Ball Guy']).toBe(true);
      expect(playDesigner!.values['Pro Quick Draw']).toBe(true);
    });

    it('includes all competitors as columns', () => {
      const all = [BIG_BALL_GUY, ...Object.values(COMPETITORS)];
      const table = generateComparisonTable(all);
      const firstRow = table[0];
      expect(Object.keys(firstRow.values)).toContain('Big Ball Guy');
      expect(Object.keys(firstRow.values)).toContain('Hudl');
    });

    it('defaults to false for missing features', () => {
      const a: Competitor = {
        name: 'A',
        features: { 'Unique': true },
        pricing: '$0',
        platforms: [],
        targetAudience: 'All',
      };
      const b: Competitor = {
        name: 'B',
        features: { 'Other': true },
        pricing: '$0',
        platforms: [],
        targetAudience: 'All',
      };
      const table = generateComparisonTable([a, b]);
      const uniqueRow = table.find((r) => r.feature === 'Unique');
      expect(uniqueRow!.values['B']).toBe(false);
    });
  });

  describe('getUniqueAdvantages', () => {
    it('returns features only Big Ball Guy has', () => {
      const unique = getUniqueAdvantages();
      expect(unique.length).toBeGreaterThan(0);
      // Wristband Cards should be unique based on our competitor data
      expect(unique).toContain('Wristband Cards');
    });

    it('does not include features competitors also have', () => {
      const unique = getUniqueAdvantages();
      // Play Designer is shared, so it should not appear
      expect(unique).not.toContain('Play Designer');
    });

    it('returns an array of strings', () => {
      const unique = getUniqueAdvantages();
      for (const item of unique) {
        expect(typeof item).toBe('string');
      }
    });
  });
});
