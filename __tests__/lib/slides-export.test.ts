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
  ],
  personnel: '11',
  tags: [],
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
      playerId: 'qb',
      route: {
        id: 'route-qb',
        name: 'Streak',
        type: 'streak',
        points: [{ x: 400, y: 200, type: 'line' }],
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
  tags: ['pass', 'deep'],
  personnel: '11',
  teamId: 'team-1',
  notes: 'Throw deep to X',
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
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext2d as any);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,FAKE');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================
// Tests
// ============================================================

describe('slides-export', () => {
  describe('buildDeck', () => {
    it('creates a deck with title, play, and summary slides', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const deck = buildDeck(plays, [formation]);

      expect(deck.title).toBe('Playbook');
      expect(deck.slides).toHaveLength(3); // title + 1 play + summary
      expect(deck.slides[0].type).toBe('title');
      expect(deck.slides[1].type).toBe('play');
      expect(deck.slides[2].type).toBe('summary');
    });

    it('creates a play slide for each valid play', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [
        makePlay({ id: 'p1', name: 'Play One' }),
        makePlay({ id: 'p2', name: 'Play Two' }),
        makePlay({ id: 'p3', name: 'Play Three' }),
      ];

      const deck = buildDeck(plays, [formation]);

      const playSlides = deck.slides.filter((s) => s.type === 'play');
      expect(playSlides).toHaveLength(3);
      expect(playSlides[0].title).toBe('Play One');
      expect(playSlides[1].title).toBe('Play Two');
      expect(playSlides[2].title).toBe('Play Three');
    });

    it('skips plays without matching formation', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [
        makePlay({ id: 'p1', name: 'Valid' }),
        makePlay({ id: 'p2', name: 'Invalid', formationId: 'nonexistent' }),
      ];

      const deck = buildDeck(plays, [formation]);
      const playSlides = deck.slides.filter((s) => s.type === 'play');
      expect(playSlides).toHaveLength(1);
      expect(playSlides[0].title).toBe('Valid');
    });

    it('includes formation and personnel in play content', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation('f1', 'Shotgun');
      const plays = [makePlay({ formationId: 'f1', personnel: '12' })];

      const deck = buildDeck(plays, [formation]);
      const playSlide = deck.slides.find((s) => s.type === 'play');

      expect(playSlide!.content).toContain('Formation: Shotgun');
      expect(playSlide!.content).toContain('Personnel: 12');
    });

    it('includes tags in play content', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay({ tags: ['red-zone', 'favorite'] })];

      const deck = buildDeck(plays, [formation]);
      const playSlide = deck.slides.find((s) => s.type === 'play');

      expect(playSlide!.content).toContain('Tags: red-zone, favorite');
    });

    it('includes route and block counts', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()]; // 1 route, 1 block

      const deck = buildDeck(plays, [formation]);
      const playSlide = deck.slides.find((s) => s.type === 'play');

      expect(playSlide!.content).toContain('Routes: 1, Blocks: 1');
    });

    it('includes notes when includeNotes is true (default)', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay({ notes: 'Coach note here' })];

      const deck = buildDeck(plays, [formation]);
      const playSlide = deck.slides.find((s) => s.type === 'play');

      expect(playSlide!.notes).toBe('Coach note here');
    });

    it('excludes notes when includeNotes is false', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay({ notes: 'Secret note' })];

      const deck = buildDeck(plays, [formation], { includeNotes: false });
      const playSlide = deck.slides.find((s) => s.type === 'play');

      expect(playSlide!.notes).toBeUndefined();
    });

    it('respects custom title', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const deck = buildDeck(plays, [formation], { title: 'Week 5 Playbook' });

      expect(deck.title).toBe('Week 5 Playbook');
      expect(deck.slides[0].title).toBe('Week 5 Playbook');
    });

    it('summary slide contains play count', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [
        makePlay({ id: 'p1' }),
        makePlay({ id: 'p2' }),
      ];

      const deck = buildDeck(plays, [formation]);
      const summary = deck.slides.find((s) => s.type === 'summary');

      expect(summary!.content).toContain('Total Plays: 2');
    });

    it('accepts formations as a Map', async () => {
      const { buildDeck } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const formationMap = new Map([[formation.id, formation]]);
      const plays = [makePlay()];

      const deck = buildDeck(plays, formationMap);

      expect(deck.slides.filter((s) => s.type === 'play')).toHaveLength(1);
    });
  });

  describe('exportToSlides', () => {
    it('exports as google-slides-json format', async () => {
      const { exportToSlides } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const json = exportToSlides(plays, [formation], 'google-slides-json');
      const parsed = JSON.parse(json);

      expect(parsed.format).toBe('google-slides-json');
      expect(parsed.slides).toHaveLength(3);
      expect(parsed.slides[0].slideType).toBe('title');
    });

    it('exports as pptx format', async () => {
      const { exportToSlides } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const json = exportToSlides(plays, [formation], 'pptx');
      const parsed = JSON.parse(json);

      expect(parsed.format).toBe('pptx');
      expect(parsed.slideCount).toBe(3);
      expect(parsed.slides[0].layout).toBe('titleSlide');
    });

    it('pptx play slides use titleAndContent layout', async () => {
      const { exportToSlides } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const json = exportToSlides(plays, [formation], 'pptx');
      const parsed = JSON.parse(json);

      const playSlide = parsed.slides.find((s: any) => s.layout === 'titleAndContent');
      expect(playSlide).toBeDefined();
      expect(playSlide.title).toBe('Four Verts');
    });

    it('pptx summary slide uses sectionHeader layout', async () => {
      const { exportToSlides } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const json = exportToSlides(plays, [formation], 'pptx');
      const parsed = JSON.parse(json);

      const summarySlide = parsed.slides.find((s: any) => s.layout === 'sectionHeader');
      expect(summarySlide).toBeDefined();
      expect(summarySlide.title).toBe('Summary');
    });

    it('google-slides includes speaker notes', async () => {
      const { exportToSlides } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay({ notes: 'Important note' })];

      const json = exportToSlides(plays, [formation], 'google-slides-json');
      const parsed = JSON.parse(json);

      const playSlide = parsed.slides.find((s: any) => s.slideType === 'play');
      expect(playSlide.speakerNotes).toBe('Important note');
    });

    it('returns valid JSON string', async () => {
      const { exportToSlides } = await import('@/lib/slides-export');
      const formation = makeFormation();
      const plays = [makePlay()];

      const json = exportToSlides(plays, [formation], 'pptx');

      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});
