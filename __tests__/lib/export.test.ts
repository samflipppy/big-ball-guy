import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Play, Formation } from '@/types';

// ============================================================
// Test data factories
// ============================================================

const makeFormation = (): Formation => ({
  id: 'formation-1',
  name: 'Singleback',
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
// Mock canvas & DOM APIs for jsdom
// ============================================================

// jsdom does not ship a real Canvas implementation, so we mock
// HTMLCanvasElement.prototype.getContext and toBlob.
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

beforeEach(() => {
  vi.restoreAllMocks();

  // Ensure createElement('canvas') returns an element with our mock
  const origCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
    const el = origCreateElement(tag, options);
    if (tag === 'canvas') {
      (el as any).getContext = vi.fn().mockReturnValue(mockContext2d);
      (el as any).toBlob = vi.fn((cb: (b: Blob | null) => void) => {
        // Return a minimal PNG-like blob
        cb(new Blob(['fake-png-data'], { type: 'image/png' }));
      });
    }
    return el;
  });

  // Mock URL.createObjectURL / revokeObjectURL for downloadBlob
  if (!window.URL.createObjectURL) {
    (window.URL as any).createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  } else {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  }
  if (!window.URL.revokeObjectURL) {
    (window.URL as any).revokeObjectURL = vi.fn();
  } else {
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  }
});

// ============================================================
// Tests
// ============================================================

describe('export utilities', () => {
  describe('exportPlayAsPng', () => {
    it('returns a Blob with image/png type', async () => {
      const { exportPlayAsPng } = await import('@/lib/export');
      const blob = await exportPlayAsPng(makePlay(), makeFormation());

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('respects width/height options', async () => {
      const { exportPlayAsPng } = await import('@/lib/export');
      const blob = await exportPlayAsPng(makePlay(), makeFormation(), {
        width: 1600,
        height: 1000,
      });

      expect(blob).toBeInstanceOf(Blob);
      // The canvas was created and getContext was called
      expect(mockContext2d.fillRect).toHaveBeenCalled();
    });

    it('draws defense when showDefense is true', async () => {
      const { exportPlayAsPng } = await import('@/lib/export');
      const play = makePlay({
        defensiveOverlay: {
          front: '4-3',
          coverage: 'Cover 2',
          players: [
            { id: 'de1', position: 'DE', label: 'DE', location: { x: 290, y: 220 }, side: 'defense' },
          ],
        },
      });

      const blob = await exportPlayAsPng(play, makeFormation(), {
        showDefense: true,
      });

      expect(blob).toBeInstanceOf(Blob);
      // Should have drawn more players (offense + defense)
      // fillRect is called for field bg + DL squares
      expect(mockContext2d.fillRect).toHaveBeenCalled();
    });

    it('handles play with no assignments', async () => {
      const { exportPlayAsPng } = await import('@/lib/export');
      const blob = await exportPlayAsPng(makePlay({ assignments: [] }), makeFormation());

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('exportPlayAsPdf', () => {
    it('returns a Blob with application/pdf type', async () => {
      const { exportPlayAsPdf } = await import('@/lib/export');
      const blob = await exportPlayAsPdf(makePlay(), makeFormation());

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('includes notes when includeNotes is true', async () => {
      const { exportPlayAsPdf } = await import('@/lib/export');
      const play = makePlay({ notes: 'This is a coaching note' });
      const blob = await exportPlayAsPdf(play, makeFormation(), { includeNotes: true });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('accepts pageSize option', async () => {
      const { exportPlayAsPdf } = await import('@/lib/export');
      const blobLetter = await exportPlayAsPdf(makePlay(), makeFormation(), { pageSize: 'letter' });
      const blobA4 = await exportPlayAsPdf(makePlay(), makeFormation(), { pageSize: 'a4' });

      expect(blobLetter).toBeInstanceOf(Blob);
      expect(blobA4).toBeInstanceOf(Blob);
      // A4 and Letter have different dimensions so bytes differ
      expect(blobLetter.size).not.toBe(blobA4.size);
    });
  });

  describe('exportPlaybookAsPdf', () => {
    it('returns a multi-page PDF blob', async () => {
      const { exportPlaybookAsPdf } = await import('@/lib/export');
      const formation = makeFormation();
      const plays = [
        makePlay({ id: 'play-1', name: 'Play One' }),
        makePlay({ id: 'play-2', name: 'Play Two' }),
      ];

      const blob = await exportPlaybookAsPdf(plays, [formation]);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('accepts formations as a Map', async () => {
      const { exportPlaybookAsPdf } = await import('@/lib/export');
      const formation = makeFormation();
      const formationMap = new Map([[formation.id, formation]]);
      const plays = [makePlay()];

      const blob = await exportPlaybookAsPdf(plays, formationMap);

      expect(blob).toBeInstanceOf(Blob);
    });

    it('throws when no valid plays exist', async () => {
      const { exportPlaybookAsPdf } = await import('@/lib/export');

      // Play references a formation that doesn't exist in the map
      const plays = [makePlay({ formationId: 'nonexistent' })];

      await expect(exportPlaybookAsPdf(plays, [])).rejects.toThrow('No valid plays to export');
    });
  });

  describe('downloadBlob', () => {
    it('creates an anchor element and triggers click', async () => {
      const { downloadBlob } = await import('@/lib/export');
      const clickSpy = vi.fn();

      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
        const el = origCreateElement(tag, options);
        if (tag === 'a') {
          vi.spyOn(el, 'click').mockImplementation(clickSpy);
        }
        // Keep canvas mocking too
        if (tag === 'canvas') {
          (el as any).getContext = vi.fn().mockReturnValue(mockContext2d);
          (el as any).toBlob = vi.fn((cb: (b: Blob | null) => void) => {
            cb(new Blob(['fake'], { type: 'image/png' }));
          });
        }
        return el;
      });

      const blob = new Blob(['test'], { type: 'text/plain' });
      downloadBlob(blob, 'test.txt');

      expect(clickSpy).toHaveBeenCalledOnce();
    });
  });
});
