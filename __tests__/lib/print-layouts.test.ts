import { describe, it, expect } from 'vitest';
import {
  SinglePlayLayout,
  PlayGridLayout,
  CallSheetLayout,
  WristbandLayout,
  ScoutCardLayout,
  PRINT_LAYOUTS,
  PRINT_LAYOUT_LIST,
  getLayout,
  getPageDimensions,
  resolveOptions,
  PAGE_SIZES,
  type PlayWithFormation,
  type PrintLayoutId,
} from '@/lib/print-layouts';
import type { Play, Formation } from '@/types';

// ============================================================
// Helpers
// ============================================================

function makeFormation(id: string, name: string): Formation {
  return {
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
    teamId: 'team1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

function makePlay(id: string, name: string, formationId: string, opts?: Partial<Play>): Play {
  return {
    id,
    name,
    formationId,
    assignments: [],
    tags: ['run', 'inside'],
    notes: 'Test play notes',
    category: 'Run',
    personnel: '11',
    teamId: 'team1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...opts,
  };
}

function makePlaysWithFormations(count: number): PlayWithFormation[] {
  const formation = makeFormation('f1', 'Singleback');
  return Array.from({ length: count }, (_, i) => ({
    play: makePlay(`p${i}`, `Play ${i}`, 'f1'),
    formation,
  }));
}

// ============================================================
// resolveOptions
// ============================================================

describe('resolveOptions', () => {
  it('returns default options when called with no args', () => {
    const opts = resolveOptions();
    expect(opts.pageSize).toBe('letter');
    expect(opts.orientation).toBe('portrait');
    expect(opts.showDiagram).toBe(true);
    expect(opts.showNotes).toBe(true);
    expect(opts.showTags).toBe(true);
    expect(opts.showFormation).toBe(true);
    expect(opts.gridColumns).toBe(2);
    expect(opts.gridRows).toBe(2);
  });

  it('merges partial options with defaults', () => {
    const opts = resolveOptions({ pageSize: 'a4', orientation: 'landscape' });
    expect(opts.pageSize).toBe('a4');
    expect(opts.orientation).toBe('landscape');
    expect(opts.showDiagram).toBe(true); // default preserved
  });
});

// ============================================================
// getPageDimensions
// ============================================================

describe('getPageDimensions', () => {
  it('returns letter dimensions in portrait', () => {
    const opts = resolveOptions({ pageSize: 'letter', orientation: 'portrait' });
    const dims = getPageDimensions(opts);
    expect(dims.width).toBe(8.5);
    expect(dims.height).toBe(11);
  });

  it('returns letter dimensions in landscape (swapped)', () => {
    const opts = resolveOptions({ pageSize: 'letter', orientation: 'landscape' });
    const dims = getPageDimensions(opts);
    expect(dims.width).toBe(11);
    expect(dims.height).toBe(8.5);
  });

  it('returns A4 dimensions in portrait', () => {
    const opts = resolveOptions({ pageSize: 'a4', orientation: 'portrait' });
    const dims = getPageDimensions(opts);
    expect(dims.width).toBe(PAGE_SIZES.a4.width);
    expect(dims.height).toBe(PAGE_SIZES.a4.height);
  });

  it('returns custom dimensions', () => {
    const opts = resolveOptions({
      pageSize: 'custom',
      customWidth: 5,
      customHeight: 7,
      orientation: 'portrait',
    });
    const dims = getPageDimensions(opts);
    expect(dims.width).toBe(5);
    expect(dims.height).toBe(7);
  });

  it('swaps custom dimensions in landscape', () => {
    const opts = resolveOptions({
      pageSize: 'custom',
      customWidth: 5,
      customHeight: 7,
      orientation: 'landscape',
    });
    const dims = getPageDimensions(opts);
    expect(dims.width).toBe(7);
    expect(dims.height).toBe(5);
  });
});

// ============================================================
// Layout registry
// ============================================================

describe('Layout Registry', () => {
  it('PRINT_LAYOUTS contains all 5 layouts', () => {
    expect(Object.keys(PRINT_LAYOUTS)).toHaveLength(5);
    expect(PRINT_LAYOUTS['single-play']).toBeDefined();
    expect(PRINT_LAYOUTS['play-grid']).toBeDefined();
    expect(PRINT_LAYOUTS['call-sheet']).toBeDefined();
    expect(PRINT_LAYOUTS['wristband']).toBeDefined();
    expect(PRINT_LAYOUTS['scout-card']).toBeDefined();
  });

  it('PRINT_LAYOUT_LIST has 5 entries', () => {
    expect(PRINT_LAYOUT_LIST).toHaveLength(5);
  });

  it('getLayout returns the correct layout', () => {
    expect(getLayout('single-play')).toBe(SinglePlayLayout);
    expect(getLayout('play-grid')).toBe(PlayGridLayout);
    expect(getLayout('call-sheet')).toBe(CallSheetLayout);
    expect(getLayout('wristband')).toBe(WristbandLayout);
    expect(getLayout('scout-card')).toBe(ScoutCardLayout);
  });

  it('getLayout throws for unknown layout id', () => {
    expect(() => getLayout('nonexistent' as PrintLayoutId)).toThrow('Unknown print layout');
  });

  it('each layout has id, name, description, and renderPages', () => {
    for (const layout of PRINT_LAYOUT_LIST) {
      expect(typeof layout.id).toBe('string');
      expect(typeof layout.name).toBe('string');
      expect(typeof layout.description).toBe('string');
      expect(typeof layout.renderPages).toBe('function');
    }
  });
});

// ============================================================
// SinglePlayLayout
// ============================================================

describe('SinglePlayLayout', () => {
  it('renders one page per play', () => {
    const plays = makePlaysWithFormations(3);
    const pages = SinglePlayLayout.renderPages(plays);
    expect(pages).toHaveLength(3);
  });

  it('returns empty array for no plays', () => {
    const pages = SinglePlayLayout.renderPages([]);
    expect(pages).toHaveLength(0);
  });

  it('each page has a unique key and an HTMLElement', () => {
    const plays = makePlaysWithFormations(2);
    const pages = SinglePlayLayout.renderPages(plays);
    const keys = pages.map((p) => p.key);
    expect(new Set(keys).size).toBe(2);
    expect(pages[0].element).toBeInstanceOf(HTMLElement);
  });

  it('page contains play name', () => {
    const formation = makeFormation('f1', 'Shotgun');
    const play = makePlay('p1', 'HB Dive', 'f1');
    const pages = SinglePlayLayout.renderPages([{ play, formation }]);
    expect(pages[0].element.textContent).toContain('HB Dive');
  });

  it('page contains formation name when showFormation is true', () => {
    const formation = makeFormation('f1', 'Shotgun Trips');
    const play = makePlay('p1', 'HB Dive', 'f1');
    const pages = SinglePlayLayout.renderPages([{ play, formation }], { showFormation: true });
    expect(pages[0].element.textContent).toContain('Shotgun Trips');
  });

  it('page contains tags when showTags is true', () => {
    const formation = makeFormation('f1', 'Shotgun');
    const play = makePlay('p1', 'HB Dive', 'f1', { tags: ['run', 'inside'] });
    const pages = SinglePlayLayout.renderPages([{ play, formation }], { showTags: true });
    expect(pages[0].element.textContent).toContain('run');
    expect(pages[0].element.textContent).toContain('inside');
  });

  it('page contains notes when showNotes is true', () => {
    const formation = makeFormation('f1', 'Shotgun');
    const play = makePlay('p1', 'HB Dive', 'f1', { notes: 'Important coaching point' });
    const pages = SinglePlayLayout.renderPages([{ play, formation }], { showNotes: true });
    expect(pages[0].element.textContent).toContain('Important coaching point');
  });

  it('page contains a play diagram', () => {
    const plays = makePlaysWithFormations(1);
    const pages = SinglePlayLayout.renderPages(plays, { showDiagram: true });
    const diagram = pages[0].element.querySelector('.play-diagram');
    expect(diagram).not.toBeNull();
  });

  it('respects page size and orientation', () => {
    const plays = makePlaysWithFormations(1);
    const pages = SinglePlayLayout.renderPages(plays, {
      pageSize: 'a4',
      orientation: 'landscape',
    });
    const style = pages[0].element.style;
    // Landscape A4: width=11.69, height=8.27
    expect(style.width).toBe('11.69in');
    expect(style.height).toBe('8.27in');
  });
});

// ============================================================
// PlayGridLayout
// ============================================================

describe('PlayGridLayout', () => {
  it('renders plays in a 2x2 grid by default (4 per page)', () => {
    const plays = makePlaysWithFormations(5);
    const pages = PlayGridLayout.renderPages(plays);
    expect(pages).toHaveLength(2); // 4 on page 1, 1 on page 2
  });

  it('renders plays in a 3x3 grid (9 per page)', () => {
    const plays = makePlaysWithFormations(10);
    const pages = PlayGridLayout.renderPages(plays, { gridColumns: 3, gridRows: 3 });
    expect(pages).toHaveLength(2); // 9 + 1
  });

  it('returns empty array for no plays', () => {
    const pages = PlayGridLayout.renderPages([]);
    expect(pages).toHaveLength(0);
  });

  it('each page has a grid container', () => {
    const plays = makePlaysWithFormations(2);
    const pages = PlayGridLayout.renderPages(plays);
    const grid = pages[0].element.querySelector('.play-grid-container');
    expect(grid).not.toBeNull();
  });

  it('grid cells contain play names', () => {
    const formation = makeFormation('f1', 'Singleback');
    const plays: PlayWithFormation[] = [
      { play: makePlay('p1', 'Power Right', 'f1'), formation },
      { play: makePlay('p2', 'Counter Left', 'f1'), formation },
    ];
    const pages = PlayGridLayout.renderPages(plays);
    const text = pages[0].element.textContent;
    expect(text).toContain('Power Right');
    expect(text).toContain('Counter Left');
  });
});

// ============================================================
// CallSheetLayout
// ============================================================

describe('CallSheetLayout', () => {
  it('renders plays in sections with CALL SHEET header', () => {
    const plays = makePlaysWithFormations(4);
    const pages = CallSheetLayout.renderPages(plays);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0].element.textContent).toContain('CALL SHEET');
  });

  it('groups plays by category when available', () => {
    const formation = makeFormation('f1', 'Singleback');
    const plays: PlayWithFormation[] = [
      { play: makePlay('p1', 'Dive', 'f1', { category: 'Run' }), formation },
      { play: makePlay('p2', 'Slant', 'f1', { category: 'Pass' }), formation },
    ];
    const pages = CallSheetLayout.renderPages(plays);
    const text = pages[0].element.textContent!;
    expect(text).toContain('Run');
    expect(text).toContain('Pass');
  });

  it('uses section names when plays have no category', () => {
    const formation = makeFormation('f1', 'Singleback');
    const plays: PlayWithFormation[] = [
      { play: makePlay('p1', 'Dive', 'f1', { category: undefined }), formation },
    ];
    const pages = CallSheetLayout.renderPages(plays, {
      sectionNames: ['First Down'],
    });
    expect(pages[0].element.textContent).toContain('First Down');
  });

  it('returns empty array for no plays', () => {
    const pages = CallSheetLayout.renderPages([]);
    expect(pages).toHaveLength(0);
  });
});

// ============================================================
// WristbandLayout
// ============================================================

describe('WristbandLayout', () => {
  it('renders plays in a dense grid with dashed borders', () => {
    const plays = makePlaysWithFormations(4);
    const pages = WristbandLayout.renderPages(plays);
    expect(pages.length).toBeGreaterThan(0);
    const cells = pages[0].element.querySelectorAll('.wristband-cell');
    expect(cells.length).toBeGreaterThanOrEqual(4);
  });

  it('returns empty array for no plays', () => {
    const pages = WristbandLayout.renderPages([]);
    expect(pages).toHaveLength(0);
  });

  it('each cell contains play name and formation', () => {
    const formation = makeFormation('f1', 'Shotgun');
    const plays: PlayWithFormation[] = [
      { play: makePlay('p1', 'Mesh', 'f1'), formation },
    ];
    const pages = WristbandLayout.renderPages(plays);
    const text = pages[0].element.textContent;
    expect(text).toContain('Mesh');
    expect(text).toContain('Shotgun');
  });

  it('wristband grid has correct class', () => {
    const plays = makePlaysWithFormations(1);
    const pages = WristbandLayout.renderPages(plays);
    const grid = pages[0].element.querySelector('.wristband-grid');
    expect(grid).not.toBeNull();
  });
});

// ============================================================
// ScoutCardLayout
// ============================================================

describe('ScoutCardLayout', () => {
  it('renders SCOUT CARD header', () => {
    const plays = makePlaysWithFormations(1);
    const pages = ScoutCardLayout.renderPages(plays);
    expect(pages[0].element.textContent).toContain('SCOUT CARD');
  });

  it('renders 4 plays per page', () => {
    const plays = makePlaysWithFormations(5);
    const pages = ScoutCardLayout.renderPages(plays);
    expect(pages).toHaveLength(2); // 4 + 1
  });

  it('shows defensive overlay info when present', () => {
    const formation = makeFormation('f1', 'Singleback');
    const play = makePlay('p1', 'Counter', 'f1', {
      defensiveOverlay: {
        front: '4-3 Over',
        coverage: 'Cover 3',
        players: [],
      },
    });
    const pages = ScoutCardLayout.renderPages([{ play, formation }]);
    const text = pages[0].element.textContent;
    expect(text).toContain('4-3 Over');
    expect(text).toContain('Cover 3');
  });

  it('returns empty array for no plays', () => {
    const pages = ScoutCardLayout.renderPages([]);
    expect(pages).toHaveLength(0);
  });

  it('contains play diagram and info sections', () => {
    const plays = makePlaysWithFormations(1);
    const pages = ScoutCardLayout.renderPages(plays);
    const entry = pages[0].element.querySelector('.scout-card-entry');
    expect(entry).not.toBeNull();
    const diagram = entry?.querySelector('.play-diagram');
    expect(diagram).not.toBeNull();
  });
});
