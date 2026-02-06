import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordTendency,
  getTendencies,
  getTendencySummary,
  exportTendencies,
  importTendencies,
  clearTendencies,
  getTendencyCount,
} from '@/lib/tendency-tracker';

vi.mock('@/lib/utils', () => {
  let counter = 0;
  return {
    generateId: () => `tendency-${counter++}`,
    cn: (...args: string[]) => args.filter(Boolean).join(' '),
  };
});

// ============================================================
// Tests
// ============================================================

describe('tendency-tracker', () => {
  beforeEach(() => {
    clearTendencies();
  });

  describe('recordTendency', () => {
    it('adds a record and returns it with an id', () => {
      const result = recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      expect(result.id).toBeTruthy();
      expect(result.down).toBe(1);
      expect(result.distance).toBe('long');
      expect(result.fieldPosition).toBe('own-30');
      expect(result.playType).toBe('run');
      expect(result.formation).toBe('Shotgun');
    });

    it('increments the tendency count', () => {
      expect(getTendencyCount()).toBe(0);
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      expect(getTendencyCount()).toBe(1);
      recordTendency(2, 'short', 'mid', 'pass', 'I-Form');
      expect(getTendencyCount()).toBe(2);
    });

    it('stores a createdAt timestamp', () => {
      const result = recordTendency(3, 'medium', 'opp-40', 'pass', 'Spread');
      expect(result.createdAt).toBeTruthy();
      // Should be a valid ISO date
      expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
    });
  });

  describe('getTendencies', () => {
    it('returns all tendencies when no filter is given', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      recordTendency(2, 'short', 'mid', 'pass', 'I-Form');
      recordTendency(3, 'medium', 'opp-40', 'pass', 'Spread');

      const all = getTendencies();
      expect(all).toHaveLength(3);
    });

    it('filters by down', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      recordTendency(2, 'short', 'mid', 'pass', 'I-Form');
      recordTendency(1, 'medium', 'opp-40', 'pass', 'Spread');

      const firstDowns = getTendencies({ down: 1 });
      expect(firstDowns).toHaveLength(2);
      expect(firstDowns.every((t) => t.down === 1)).toBe(true);
    });

    it('filters by distance', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      recordTendency(1, 'short', 'mid', 'pass', 'I-Form');
      recordTendency(2, 'long', 'opp-40', 'pass', 'Spread');

      const longDist = getTendencies({ distance: 'long' });
      expect(longDist).toHaveLength(2);
    });

    it('filters by multiple criteria', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      recordTendency(1, 'long', 'own-30', 'pass', 'Shotgun');
      recordTendency(2, 'long', 'own-30', 'run', 'Shotgun');

      const filtered = getTendencies({ down: 1, playType: 'run' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].playType).toBe('run');
      expect(filtered[0].down).toBe(1);
    });

    it('returns empty array when no matches', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      const result = getTendencies({ down: 4 });
      expect(result).toHaveLength(0);
    });
  });

  describe('getTendencySummary', () => {
    it('returns breakdown of play types for a given down', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      recordTendency(1, 'long', 'mid', 'run', 'I-Form');
      recordTendency(1, 'short', 'opp-40', 'pass', 'Spread');
      recordTendency(1, 'short', 'opp-20', 'pass', 'Shotgun');

      const summary = getTendencySummary(1);
      expect(summary.down).toBe(1);
      expect(summary.total).toBe(4);
      expect(summary.entries).toHaveLength(2);

      const runEntry = summary.entries.find((e) => e.playType === 'run');
      const passEntry = summary.entries.find((e) => e.playType === 'pass');
      expect(runEntry).toBeDefined();
      expect(passEntry).toBeDefined();
      expect(runEntry!.count).toBe(2);
      expect(passEntry!.count).toBe(2);
      expect(runEntry!.percentage).toBe(50);
      expect(passEntry!.percentage).toBe(50);
    });

    it('returns empty entries with total 0 for a down with no records', () => {
      const summary = getTendencySummary(4);
      expect(summary.total).toBe(0);
      expect(summary.entries).toHaveLength(0);
    });

    it('sorts entries by count descending', () => {
      recordTendency(2, 'short', 'mid', 'pass', 'Spread');
      recordTendency(2, 'short', 'mid', 'pass', 'Spread');
      recordTendency(2, 'short', 'mid', 'pass', 'Spread');
      recordTendency(2, 'short', 'mid', 'run', 'I-Form');

      const summary = getTendencySummary(2);
      expect(summary.entries[0].playType).toBe('pass');
      expect(summary.entries[0].count).toBe(3);
      expect(summary.entries[1].playType).toBe('run');
      expect(summary.entries[1].count).toBe(1);
    });

    it('calculates percentages correctly with one decimal place', () => {
      recordTendency(3, 'medium', 'mid', 'run', 'Shotgun');
      recordTendency(3, 'medium', 'mid', 'pass', 'Shotgun');
      recordTendency(3, 'medium', 'mid', 'pass', 'Shotgun');

      const summary = getTendencySummary(3);
      const passEntry = summary.entries.find((e) => e.playType === 'pass');
      const runEntry = summary.entries.find((e) => e.playType === 'run');
      expect(passEntry!.percentage).toBeCloseTo(66.7, 0);
      expect(runEntry!.percentage).toBeCloseTo(33.3, 0);
    });
  });

  describe('exportTendencies', () => {
    it('returns a copy of all tendency records', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      recordTendency(2, 'short', 'mid', 'pass', 'I-Form');

      const exported = exportTendencies();
      expect(exported).toHaveLength(2);

      // Mutating the export should not affect the store
      exported.pop();
      expect(getTendencyCount()).toBe(2);
    });
  });

  describe('importTendencies', () => {
    it('replaces the current store with imported records', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');

      const records = [
        {
          id: 'imp-1',
          down: 3,
          distance: 'medium',
          fieldPosition: 'opp-20',
          playType: 'pass',
          formation: 'Empty',
          createdAt: '2024-06-01T00:00:00.000Z',
        },
      ];

      importTendencies(records);
      expect(getTendencyCount()).toBe(1);
      const all = getTendencies();
      expect(all[0].id).toBe('imp-1');
    });
  });

  describe('clearTendencies', () => {
    it('removes all records', () => {
      recordTendency(1, 'long', 'own-30', 'run', 'Shotgun');
      recordTendency(2, 'short', 'mid', 'pass', 'I-Form');
      expect(getTendencyCount()).toBe(2);

      clearTendencies();
      expect(getTendencyCount()).toBe(0);
      expect(getTendencies()).toHaveLength(0);
    });
  });
});
