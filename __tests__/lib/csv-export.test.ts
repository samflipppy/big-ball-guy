import { describe, it, expect } from 'vitest';
import type { Play } from '@/types';
import {
  exportPlaysToCSV,
  exportTendenciesToCSV,
  type TendencyRecord,
} from '@/lib/csv-export';

// ============================================================
// Test data factories
// ============================================================

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'HB Dive',
    formationId: 'formation-1',
    assignments: [
      {
        playerId: 'x',
        route: {
          id: 'route-x',
          name: 'Streak',
          type: 'streak',
          points: [{ x: 80, y: 200, type: 'line' }],
        },
      },
      {
        playerId: 'rb',
        blocking: {
          id: 'block-rb',
          blockerId: 'rb',
          blockType: 'drive',
        },
      },
    ],
    tags: ['run', 'base'],
    personnel: '11',
    teamId: 'team-1',
    notes: 'Hit the A gap hard',
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-06-15T10:00:00Z',
    ...overrides,
  };
}

function makeTendency(overrides: Partial<TendencyRecord> = {}): TendencyRecord {
  return {
    situation: '1st & 10',
    personnel: '11',
    formation: 'Shotgun',
    playType: 'Run',
    direction: 'right',
    percentage: 65.5,
    sampleSize: 42,
    notes: 'Strong tendency to run right',
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe('csv-export', () => {
  describe('exportPlaysToCSV', () => {
    it('includes header row', () => {
      const csv = exportPlaysToCSV([]);

      expect(csv).toContain('name,formation,personnel,tags,routeCount,blockCount,notes,createdAt');
    });

    it('exports a single play correctly', () => {
      const csv = exportPlaysToCSV([makePlay()]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('HB Dive');
      expect(lines[1]).toContain('formation-1');
      expect(lines[1]).toContain('11');
    });

    it('exports multiple plays', () => {
      const plays = [
        makePlay({ id: 'p1', name: 'Play A' }),
        makePlay({ id: 'p2', name: 'Play B' }),
        makePlay({ id: 'p3', name: 'Play C' }),
      ];
      const csv = exportPlaysToCSV(plays);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(4); // header + 3 data rows
    });

    it('counts routes correctly', () => {
      const play = makePlay({
        assignments: [
          { playerId: 'x', route: { id: 'r1', name: 'Streak', type: 'streak', points: [] } },
          { playerId: 'z', route: { id: 'r2', name: 'Post', type: 'post', points: [] } },
          { playerId: 'rb', blocking: { id: 'b1', blockerId: 'rb', blockType: 'drive' } },
        ],
      });
      const csv = exportPlaysToCSV([play]);
      const dataLine = csv.split('\n')[1];

      // routeCount = 2, blockCount = 1
      expect(dataLine).toContain(',2,1,');
    });

    it('counts blocks correctly', () => {
      const play = makePlay({
        assignments: [
          { playerId: 'lt', blocking: { id: 'b1', blockerId: 'lt', blockType: 'drive' } },
          { playerId: 'lg', blocking: { id: 'b2', blockerId: 'lg', blockType: 'reach' } },
          { playerId: 'c', blocking: { id: 'b3', blockerId: 'c', blockType: 'zone' } },
        ],
      });
      const csv = exportPlaysToCSV([play]);
      const dataLine = csv.split('\n')[1];

      // routeCount = 0, blockCount = 3
      expect(dataLine).toContain(',0,3,');
    });

    it('joins tags with semicolons', () => {
      const play = makePlay({ tags: ['red-zone', 'favorite', '3rd-down'] });
      const csv = exportPlaysToCSV([play]);

      expect(csv).toContain('red-zone; favorite; 3rd-down');
    });

    it('handles play with no notes', () => {
      const play = makePlay({ notes: undefined });
      const csv = exportPlaysToCSV([play]);
      const lines = csv.split('\n');

      // Should have empty string for notes
      expect(lines[1]).toBeTruthy();
    });

    it('handles play with no assignments', () => {
      const play = makePlay({ assignments: [] });
      const csv = exportPlaysToCSV([play]);
      const dataLine = csv.split('\n')[1];

      // routeCount = 0, blockCount = 0
      expect(dataLine).toContain(',0,0,');
    });

    it('escapes fields with commas', () => {
      const play = makePlay({ name: 'Play, With Comma' });
      const csv = exportPlaysToCSV([play]);

      expect(csv).toContain('"Play, With Comma"');
    });

    it('escapes fields with double quotes', () => {
      const play = makePlay({ notes: 'Hit the "A" gap' });
      const csv = exportPlaysToCSV([play]);

      expect(csv).toContain('"Hit the ""A"" gap"');
    });

    it('handles empty plays array (header only)', () => {
      const csv = exportPlaysToCSV([]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('name,formation,personnel,tags,routeCount,blockCount,notes,createdAt');
    });

    it('includes createdAt timestamp', () => {
      const play = makePlay({ createdAt: '2025-06-15T10:00:00Z' });
      const csv = exportPlaysToCSV([play]);

      expect(csv).toContain('2025-06-15T10:00:00Z');
    });
  });

  describe('exportTendenciesToCSV', () => {
    it('includes header row', () => {
      const csv = exportTendenciesToCSV([]);

      expect(csv).toContain('situation,personnel,formation,playType,direction,percentage,sampleSize,notes');
    });

    it('exports a single tendency correctly', () => {
      const csv = exportTendenciesToCSV([makeTendency()]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('1st & 10');
      expect(lines[1]).toContain('Shotgun');
      expect(lines[1]).toContain('65.5');
      expect(lines[1]).toContain('42');
    });

    it('exports multiple tendencies', () => {
      const tendencies = [
        makeTendency({ situation: '1st & 10' }),
        makeTendency({ situation: '2nd & Short' }),
        makeTendency({ situation: '3rd & Long' }),
      ];
      const csv = exportTendenciesToCSV(tendencies);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(4);
    });

    it('handles tendency with no formation', () => {
      const tendency = makeTendency({ formation: undefined });
      const csv = exportTendenciesToCSV([tendency]);

      // Should still be a valid CSV line
      const lines = csv.split('\n');
      expect(lines).toHaveLength(2);
    });

    it('handles tendency with no direction', () => {
      const tendency = makeTendency({ direction: undefined });
      const csv = exportTendenciesToCSV([tendency]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
    });

    it('handles tendency with no notes', () => {
      const tendency = makeTendency({ notes: undefined });
      const csv = exportTendenciesToCSV([tendency]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
    });

    it('escapes fields with commas in tendency data', () => {
      const tendency = makeTendency({ notes: 'Run right, then cut back' });
      const csv = exportTendenciesToCSV([tendency]);

      expect(csv).toContain('"Run right, then cut back"');
    });

    it('preserves percentage precision', () => {
      const tendency = makeTendency({ percentage: 33.333 });
      const csv = exportTendenciesToCSV([tendency]);

      expect(csv).toContain('33.333');
    });
  });
});
