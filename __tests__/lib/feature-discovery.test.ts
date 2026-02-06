import { describe, it, expect, beforeEach } from 'vitest';
import {
  markDiscovered,
  isDiscovered,
  getUndiscovered,
  resetDiscovery,
  FEATURES,
} from '@/lib/feature-discovery';

describe('feature-discovery', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    resetDiscovery();
  });

  describe('FEATURES', () => {
    it('contains at least 5 features', () => {
      expect(FEATURES.length).toBeGreaterThanOrEqual(5);
    });

    it('each feature has required fields', () => {
      for (const feature of FEATURES) {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('title');
        expect(feature).toHaveProperty('description');
        expect(feature).toHaveProperty('triggerCondition');
        expect(typeof feature.id).toBe('string');
        expect(typeof feature.title).toBe('string');
        expect(typeof feature.description).toBe('string');
        expect(feature.id.length).toBeGreaterThan(0);
      }
    });

    it('all feature IDs are unique', () => {
      const ids = FEATURES.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('markDiscovered', () => {
    it('marks a feature as discovered', () => {
      expect(isDiscovered('command-palette')).toBe(false);
      markDiscovered('command-palette');
      expect(isDiscovered('command-palette')).toBe(true);
    });

    it('can mark multiple features', () => {
      markDiscovered('command-palette');
      markDiscovered('route-drawing');
      expect(isDiscovered('command-palette')).toBe(true);
      expect(isDiscovered('route-drawing')).toBe(true);
    });

    it('is idempotent - marking twice does not cause issues', () => {
      markDiscovered('command-palette');
      markDiscovered('command-palette');
      expect(isDiscovered('command-palette')).toBe(true);
    });
  });

  describe('isDiscovered', () => {
    it('returns false for features that have not been marked', () => {
      expect(isDiscovered('non-existent-feature')).toBe(false);
    });

    it('returns true after marking', () => {
      markDiscovered('dark-mode');
      expect(isDiscovered('dark-mode')).toBe(true);
    });

    it('persists via localStorage', () => {
      markDiscovered('export-pdf');
      // Re-read from localStorage directly
      const stored = JSON.parse(localStorage.getItem('feature-discovery') || '[]');
      expect(stored).toContain('export-pdf');
    });
  });

  describe('getUndiscovered', () => {
    it('returns all feature IDs when none are discovered', () => {
      const undiscovered = getUndiscovered();
      expect(undiscovered.length).toBe(FEATURES.length);
    });

    it('returns fewer features after marking some as discovered', () => {
      markDiscovered('command-palette');
      markDiscovered('route-drawing');
      const undiscovered = getUndiscovered();
      expect(undiscovered.length).toBe(FEATURES.length - 2);
      expect(undiscovered).not.toContain('command-palette');
      expect(undiscovered).not.toContain('route-drawing');
    });

    it('returns empty array when all features are discovered', () => {
      for (const feature of FEATURES) {
        markDiscovered(feature.id);
      }
      expect(getUndiscovered()).toEqual([]);
    });
  });

  describe('resetDiscovery', () => {
    it('clears all discovered features', () => {
      markDiscovered('command-palette');
      markDiscovered('route-drawing');
      expect(isDiscovered('command-palette')).toBe(true);

      resetDiscovery();

      expect(isDiscovered('command-palette')).toBe(false);
      expect(isDiscovered('route-drawing')).toBe(false);
      expect(getUndiscovered().length).toBe(FEATURES.length);
    });
  });
});
