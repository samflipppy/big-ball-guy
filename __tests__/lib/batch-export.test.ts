import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Play, Formation } from '@/types';

// ============================================================
// Test data factories
// ============================================================

const makeFormation = (id = 'formation-1', name = 'Singleback'): Formation => ({
  id,
  name,
  side: 'offense',
  players: [
    { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
    { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
    { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 245 }, side: 'offense' },
  ],
  personnel: '11',
  tags: ['spread'],
  isCustom: false,
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
});

const makePlay = (overrides: Partial<Play> = {}): Play => ({
  id: 'play-1',
  name: 'Four Verts',
  formationId: 'formation-1',
  assignments: [
    {
      playerId: 'x',
      route: {
        id: 'route-x',
        name: 'Streak',
        type: 'streak',
        points: [
          { x: 80, y: 200, type: 'line' },
          { x: 80, y: 150, type: 'line' },
        ],
      },
    },
    {
      playerId: 'rb',
      blocking: {
        id: 'block-rb',
        blockerId: 'rb',
        blockType: 'pass-pro',
      },
    },
  ],
  tags: ['pass'],
  personnel: '11',
  teamId: 'team-1',
  notes: 'Hit the X on a deep ball',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

// ============================================================
// Canvas mocks
// ============================================================

const mockContext2d = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  globalAlpha: 1,
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  setLineDash: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
};

function makeFakePngBlob(): Blob {
  const data = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return new Blob([data], { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext2d as any);

  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
  ) {
    cb(makeFakePngBlob());
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================
// Tests
// ============================================================

describe('batch-export', () => {
  describe('generateTableOfContents', () => {
    it('generates TOC entries for each play', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const plays = [
        makePlay({ id: 'p1', name: 'Alpha' }),
        makePlay({ id: 'p2', name: 'Bravo' }),
        makePlay({ id: 'p3', name: 'Charlie' }),
      ];
      const toc = generateTableOfContents(plays);

      expect(toc.entries).toHaveLength(3);
      expect(toc.title).toBe('Playbook');
    });

    it('sorts entries by name by default', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const plays = [
        makePlay({ id: 'p1', name: 'Zulu' }),
        makePlay({ id: 'p2', name: 'Alpha' }),
        makePlay({ id: 'p3', name: 'Mike' }),
      ];
      const toc = generateTableOfContents(plays);

      expect(toc.entries[0].playName).toBe('Alpha');
      expect(toc.entries[1].playName).toBe('Mike');
      expect(toc.entries[2].playName).toBe('Zulu');
    });

    it('includes formation names when formations are provided', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const plays = [makePlay()];
      const toc = generateTableOfContents(plays, [formation]);

      expect(toc.entries[0].formationName).toBe('Singleback');
    });

    it('assigns correct page numbers with 1 play per page', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const plays = [
        makePlay({ id: 'p1', name: 'A' }),
        makePlay({ id: 'p2', name: 'B' }),
      ];
      const toc = generateTableOfContents(plays, undefined, { playsPerPage: 1 });

      // Title = page 1, TOC = page 2, first play = page 3, second = page 4
      expect(toc.entries[0].pageNumber).toBe(3);
      expect(toc.entries[1].pageNumber).toBe(4);
      expect(toc.totalPages).toBe(4);
    });

    it('assigns correct page numbers with 2 plays per page', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const plays = [
        makePlay({ id: 'p1', name: 'A' }),
        makePlay({ id: 'p2', name: 'B' }),
        makePlay({ id: 'p3', name: 'C' }),
      ];
      const toc = generateTableOfContents(plays, undefined, { playsPerPage: 2 });

      // 3 plays, 2 per page => 2 content pages, total = 4
      expect(toc.totalPages).toBe(4);
    });

    it('respects custom title option', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const plays = [makePlay()];
      const toc = generateTableOfContents(plays, undefined, { title: 'My Custom Playbook' });

      expect(toc.title).toBe('My Custom Playbook');
    });

    it('sorts by category when specified', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const plays = [
        makePlay({ id: 'p1', name: 'Play A', category: 'Run' }),
        makePlay({ id: 'p2', name: 'Play B', category: 'Pass' }),
        makePlay({ id: 'p3', name: 'Play C', category: 'Screen' }),
      ];
      const toc = generateTableOfContents(plays, undefined, { sortBy: 'category' });

      expect(toc.entries[0].category).toBe('Pass');
      expect(toc.entries[1].category).toBe('Run');
      expect(toc.entries[2].category).toBe('Screen');
    });

    it('handles empty plays array', async () => {
      const { generateTableOfContents } = await import('@/lib/batch-export');
      const toc = generateTableOfContents([]);

      expect(toc.entries).toHaveLength(0);
      expect(toc.totalPages).toBe(2); // title + TOC with 0 content
    });
  });

  describe('batchExportPDF', () => {
    it('returns a Blob with application/pdf type', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const blob = await batchExportPDF(plays, [formation]);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('handles multiple plays', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const plays = [
        makePlay({ id: 'p1', name: 'Play One' }),
        makePlay({ id: 'p2', name: 'Play Two' }),
        makePlay({ id: 'p3', name: 'Play Three' }),
      ];

      const blob = await batchExportPDF(plays, [formation]);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('throws when no valid plays exist', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const plays = [makePlay({ formationId: 'nonexistent' })];

      await expect(batchExportPDF(plays, [])).rejects.toThrow('No valid plays to export');
    });

    it('accepts formations as a Map', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const formationMap = new Map([[formation.id, formation]]);
      const plays = [makePlay()];

      const blob = await batchExportPDF(plays, formationMap);

      expect(blob).toBeInstanceOf(Blob);
    });

    it('respects playsPerPage option of 2', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const plays = [
        makePlay({ id: 'p1', name: 'Play 1' }),
        makePlay({ id: 'p2', name: 'Play 2' }),
        makePlay({ id: 'p3', name: 'Play 3' }),
      ];

      const blob = await batchExportPDF(plays, [formation], { playsPerPage: 2 });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('respects playsPerPage option of 4', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const plays = Array.from({ length: 5 }, (_, i) =>
        makePlay({ id: `p${i}`, name: `Play ${i}` }),
      );

      const blob = await batchExportPDF(plays, [formation], { playsPerPage: 4 });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('includes notes when includeNotes is true', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const plays = [makePlay({ notes: 'Important coaching note' })];

      const blob = await batchExportPDF(plays, [formation], { includeNotes: true });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('produces different output for A4 vs letter', async () => {
      const { batchExportPDF } = await import('@/lib/batch-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const letterBlob = await batchExportPDF(plays, [formation], { pageSize: 'letter' });
      const a4Blob = await batchExportPDF(plays, [formation], { pageSize: 'a4' });

      expect(letterBlob.size).not.toBe(a4Blob.size);
    });
  });
});
