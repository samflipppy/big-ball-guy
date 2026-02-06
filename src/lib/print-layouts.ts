import type { Play, Formation } from '@/types';

// ============================================================
// Page Size & Orientation
// ============================================================

export type PageSizeId = 'letter' | 'a4' | 'custom';
export type Orientation = 'portrait' | 'landscape';

export interface PageSize {
  id: PageSizeId;
  name: string;
  /** Width in inches */
  width: number;
  /** Height in inches */
  height: number;
}

export const PAGE_SIZES: Record<PageSizeId, PageSize> = {
  letter: { id: 'letter', name: 'US Letter', width: 8.5, height: 11 },
  a4: { id: 'a4', name: 'A4', width: 8.27, height: 11.69 },
  custom: { id: 'custom', name: 'Custom', width: 8.5, height: 11 },
};

export interface PrintOptions {
  pageSize: PageSizeId;
  orientation: Orientation;
  customWidth?: number;
  customHeight?: number;
  showDiagram?: boolean;
  showNotes?: boolean;
  showTags?: boolean;
  showFormation?: boolean;
  showDefense?: boolean;
  gridColumns?: number;
  gridRows?: number;
  sectionNames?: string[];
}

const DEFAULT_OPTIONS: Required<PrintOptions> = {
  pageSize: 'letter',
  orientation: 'portrait',
  customWidth: 8.5,
  customHeight: 11,
  showDiagram: true,
  showNotes: true,
  showTags: true,
  showFormation: true,
  showDefense: false,
  gridColumns: 2,
  gridRows: 2,
  sectionNames: [],
};

export function resolveOptions(opts?: Partial<PrintOptions>): Required<PrintOptions> {
  return { ...DEFAULT_OPTIONS, ...opts };
}

/**
 * Return page dimensions in inches respecting orientation.
 */
export function getPageDimensions(options: Required<PrintOptions>): { width: number; height: number } {
  const size =
    options.pageSize === 'custom'
      ? { width: options.customWidth, height: options.customHeight }
      : PAGE_SIZES[options.pageSize];

  if (options.orientation === 'landscape') {
    return { width: size.height, height: size.width };
  }
  return { width: size.width, height: size.height };
}

// ============================================================
// Layout type
// ============================================================

export type PrintLayoutId = 'single-play' | 'play-grid' | 'call-sheet' | 'wristband' | 'scout-card';

export interface PlayWithFormation {
  play: Play;
  formation: Formation;
}

export interface PrintPage {
  /** Unique key for React rendering */
  key: string;
  /** HTML element that represents one printed page */
  element: HTMLElement;
}

export interface PrintLayout {
  id: PrintLayoutId;
  name: string;
  description: string;
  renderPages(plays: PlayWithFormation[], options?: Partial<PrintOptions>): PrintPage[];
}

// ============================================================
// Helper: create a page container
// ============================================================

function createPageContainer(dims: { width: number; height: number }, pageKey: string): HTMLDivElement {
  const page = document.createElement('div');
  page.className = 'print-page';
  page.setAttribute('data-page-key', pageKey);
  page.style.width = `${dims.width}in`;
  page.style.height = `${dims.height}in`;
  page.style.padding = '0.5in';
  page.style.boxSizing = 'border-box';
  page.style.position = 'relative';
  page.style.overflow = 'hidden';
  page.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  page.style.backgroundColor = '#ffffff';
  page.style.color = '#111827';
  page.style.pageBreakAfter = 'always';
  return page;
}

// ============================================================
// Helper: render a play diagram placeholder
// ============================================================

function createPlayDiagram(play: Play, formation: Formation, width: string, height: string): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'play-diagram';
  container.style.width = width;
  container.style.height = height;
  container.style.backgroundColor = '#2d5a27';
  container.style.borderRadius = '4px';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.border = '1px solid #d1d5db';

  // Render players as positioned dots
  const fieldWidth = 800;
  const fieldHeight = 500;

  for (const player of formation.players) {
    const dot = document.createElement('div');
    const pctX = (player.location.x / fieldWidth) * 100;
    const pctY = (player.location.y / fieldHeight) * 100;
    dot.style.position = 'absolute';
    dot.style.left = `${pctX}%`;
    dot.style.top = `${pctY}%`;
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '50%';
    dot.style.backgroundColor = player.side === 'offense' ? '#3b82f6' : '#ef4444';
    dot.style.transform = 'translate(-50%, -50%)';
    dot.title = player.label;
    container.appendChild(dot);
  }

  return container;
}

// ============================================================
// Helper: create metadata elements
// ============================================================

function createPlayTitle(name: string): HTMLDivElement {
  const title = document.createElement('div');
  title.className = 'play-title';
  title.textContent = name;
  title.style.fontSize = '16px';
  title.style.fontWeight = '700';
  title.style.marginBottom = '4px';
  title.style.color = '#111827';
  return title;
}

function createFormationLabel(formationName: string): HTMLDivElement {
  const label = document.createElement('div');
  label.className = 'play-formation';
  label.textContent = `Formation: ${formationName}`;
  label.style.fontSize = '12px';
  label.style.color = '#6b7280';
  label.style.marginBottom = '4px';
  return label;
}

function createTagsRow(tags: string[]): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'play-tags';
  row.style.display = 'flex';
  row.style.gap = '4px';
  row.style.flexWrap = 'wrap';
  row.style.marginBottom = '4px';

  for (const tag of tags) {
    const chip = document.createElement('span');
    chip.textContent = tag;
    chip.style.fontSize = '10px';
    chip.style.padding = '1px 6px';
    chip.style.borderRadius = '9999px';
    chip.style.backgroundColor = '#e5e7eb';
    chip.style.color = '#374151';
    row.appendChild(chip);
  }

  return row;
}

function createNotesBlock(notes: string): HTMLDivElement {
  const block = document.createElement('div');
  block.className = 'play-notes';
  block.textContent = notes;
  block.style.fontSize = '11px';
  block.style.color = '#4b5563';
  block.style.marginTop = '6px';
  block.style.lineHeight = '1.4';
  return block;
}

// ============================================================
// SinglePlay Layout — one play per page
// ============================================================

export const SinglePlayLayout: PrintLayout = {
  id: 'single-play',
  name: 'Single Play',
  description: 'One play per page with diagram, name, tags, notes, and formation',

  renderPages(plays, opts) {
    const options = resolveOptions(opts);
    const dims = getPageDimensions(options);
    const pages: PrintPage[] = [];

    for (let i = 0; i < plays.length; i++) {
      const { play, formation } = plays[i];
      const pageKey = `single-play-${i}`;
      const page = createPageContainer(dims, pageKey);

      // Title
      page.appendChild(createPlayTitle(play.name));

      // Formation
      if (options.showFormation) {
        page.appendChild(createFormationLabel(formation.name));
      }

      // Tags
      if (options.showTags && play.tags.length > 0) {
        page.appendChild(createTagsRow(play.tags));
      }

      // Diagram
      if (options.showDiagram) {
        const diagramHeight = `${(dims.height - 1) * 0.6}in`;
        const diagramWidth = '100%';
        const diagram = createPlayDiagram(play, formation, diagramWidth, diagramHeight);
        diagram.style.marginTop = '8px';
        page.appendChild(diagram);
      }

      // Notes
      if (options.showNotes && play.notes) {
        page.appendChild(createNotesBlock(play.notes));
      }

      pages.push({ key: pageKey, element: page });
    }

    return pages;
  },
};

// ============================================================
// PlayGrid Layout — 2x2 or 3x3 grid per page
// ============================================================

export const PlayGridLayout: PrintLayout = {
  id: 'play-grid',
  name: 'Play Grid',
  description: '2x2 or 3x3 grid of plays per page',

  renderPages(plays, opts) {
    const options = resolveOptions(opts);
    const dims = getPageDimensions(options);
    const cols = options.gridColumns;
    const rows = options.gridRows;
    const perPage = cols * rows;
    const pages: PrintPage[] = [];

    for (let pageIdx = 0; pageIdx < plays.length; pageIdx += perPage) {
      const pageKey = `play-grid-${pageIdx}`;
      const page = createPageContainer(dims, pageKey);

      const grid = document.createElement('div');
      grid.className = 'play-grid-container';
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      grid.style.gap = '8px';
      grid.style.width = '100%';
      grid.style.height = '100%';

      const slice = plays.slice(pageIdx, pageIdx + perPage);
      for (const { play, formation } of slice) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.border = '1px solid #e5e7eb';
        cell.style.borderRadius = '4px';
        cell.style.padding = '4px';
        cell.style.overflow = 'hidden';
        cell.style.display = 'flex';
        cell.style.flexDirection = 'column';

        // Play name
        const name = document.createElement('div');
        name.textContent = play.name;
        name.style.fontSize = '11px';
        name.style.fontWeight = '600';
        name.style.marginBottom = '2px';
        name.style.whiteSpace = 'nowrap';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        cell.appendChild(name);

        // Mini diagram
        if (options.showDiagram) {
          const diagram = createPlayDiagram(play, formation, '100%', '0');
          diagram.style.flex = '1';
          diagram.style.minHeight = '40px';
          cell.appendChild(diagram);
        }

        grid.appendChild(cell);
      }

      page.appendChild(grid);
      pages.push({ key: pageKey, element: page });
    }

    return pages;
  },
};

// ============================================================
// CallSheet Layout — formatted call sheet with sections
// ============================================================

export const CallSheetLayout: PrintLayout = {
  id: 'call-sheet',
  name: 'Call Sheet',
  description: 'Formatted call sheet with sections and play thumbnails',

  renderPages(plays, opts) {
    const options = resolveOptions(opts);
    const dims = getPageDimensions(options);
    const pages: PrintPage[] = [];
    const sectionNames = options.sectionNames.length > 0
      ? options.sectionNames
      : ['Run', 'Pass', 'Screen/Quick', 'Red Zone', 'Short Yardage'];

    // Group plays by category or evenly into sections
    const sections: { name: string; plays: PlayWithFormation[] }[] = [];

    if (plays.some(({ play }) => play.category)) {
      // Group by category
      const grouped = new Map<string, PlayWithFormation[]>();
      for (const pwf of plays) {
        const cat = pwf.play.category || 'Uncategorized';
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(pwf);
      }
      for (const [name, groupPlays] of grouped) {
        sections.push({ name, plays: groupPlays });
      }
    } else {
      // Distribute plays evenly across section names
      const chunkSize = Math.ceil(plays.length / sectionNames.length);
      for (let i = 0; i < sectionNames.length; i++) {
        const chunk = plays.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunk.length > 0) {
          sections.push({ name: sectionNames[i], plays: chunk });
        }
      }
    }

    // Build pages (fit as many sections as we can per page)
    let currentPageSections: typeof sections = [];
    let currentItemCount = 0;
    const maxItemsPerPage = 16;

    const flushPage = () => {
      if (currentPageSections.length === 0) return;
      const pageKey = `call-sheet-${pages.length}`;
      const page = createPageContainer(dims, pageKey);

      // Title
      const header = document.createElement('div');
      header.textContent = 'CALL SHEET';
      header.style.fontSize = '18px';
      header.style.fontWeight = '800';
      header.style.textAlign = 'center';
      header.style.marginBottom = '8px';
      header.style.textTransform = 'uppercase';
      header.style.letterSpacing = '2px';
      page.appendChild(header);

      for (const section of currentPageSections) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'call-sheet-section';
        sectionDiv.style.marginBottom = '8px';

        // Section header
        const sHead = document.createElement('div');
        sHead.textContent = section.name;
        sHead.style.fontSize = '13px';
        sHead.style.fontWeight = '700';
        sHead.style.padding = '2px 6px';
        sHead.style.backgroundColor = '#1e3a5f';
        sHead.style.color = '#ffffff';
        sHead.style.borderRadius = '2px';
        sHead.style.marginBottom = '4px';
        sectionDiv.appendChild(sHead);

        // Play grid within section
        const sGrid = document.createElement('div');
        sGrid.style.display = 'grid';
        sGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        sGrid.style.gap = '4px';

        for (const { play, formation } of section.plays) {
          const cell = document.createElement('div');
          cell.style.border = '1px solid #d1d5db';
          cell.style.borderRadius = '2px';
          cell.style.padding = '2px';
          cell.style.textAlign = 'center';

          // Thumbnail
          if (options.showDiagram) {
            const thumb = createPlayDiagram(play, formation, '100%', '40px');
            cell.appendChild(thumb);
          }

          const label = document.createElement('div');
          label.textContent = play.name;
          label.style.fontSize = '8px';
          label.style.fontWeight = '600';
          label.style.overflow = 'hidden';
          label.style.textOverflow = 'ellipsis';
          label.style.whiteSpace = 'nowrap';
          cell.appendChild(label);

          sGrid.appendChild(cell);
        }

        sectionDiv.appendChild(sGrid);
        page.appendChild(sectionDiv);
      }

      pages.push({ key: pageKey, element: page });
      currentPageSections = [];
      currentItemCount = 0;
    };

    for (const section of sections) {
      if (currentItemCount + section.plays.length > maxItemsPerPage && currentItemCount > 0) {
        flushPage();
      }
      currentPageSections.push(section);
      currentItemCount += section.plays.length;
    }
    flushPage();

    return pages;
  },
};

// ============================================================
// Wristband Layout — cut-line wristband layout
// ============================================================

export const WristbandLayout: PrintLayout = {
  id: 'wristband',
  name: 'Wristband',
  description: 'Cut-line wristband layout for game day',

  renderPages(plays, opts) {
    const options = resolveOptions(opts);
    const dims = getPageDimensions(options);
    const cols = Math.min(options.gridColumns, 5);
    const rows = Math.min(options.gridRows * 2, 10);
    const perPage = cols * rows;
    const pages: PrintPage[] = [];

    for (let pageIdx = 0; pageIdx < plays.length; pageIdx += perPage) {
      const pageKey = `wristband-${pageIdx}`;
      const page = createPageContainer(dims, pageKey);
      page.style.padding = '0.25in';

      const grid = document.createElement('div');
      grid.className = 'wristband-grid';
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      grid.style.gap = '0';
      grid.style.width = '100%';
      grid.style.height = '100%';

      const slice = plays.slice(pageIdx, pageIdx + perPage);
      for (const { play, formation } of slice) {
        const cell = document.createElement('div');
        cell.className = 'wristband-cell';
        cell.style.border = '1px dashed #9ca3af';
        cell.style.padding = '2px';
        cell.style.display = 'flex';
        cell.style.flexDirection = 'column';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.overflow = 'hidden';

        // Play name
        const name = document.createElement('div');
        name.textContent = play.name;
        name.style.fontSize = '7px';
        name.style.fontWeight = '700';
        name.style.textAlign = 'center';
        name.style.lineHeight = '1';
        name.style.marginBottom = '1px';
        cell.appendChild(name);

        // Tiny diagram
        if (options.showDiagram) {
          const diagram = createPlayDiagram(play, formation, '100%', '30px');
          cell.appendChild(diagram);
        }

        // Formation abbreviation
        const formAbbrev = document.createElement('div');
        formAbbrev.textContent = formation.name;
        formAbbrev.style.fontSize = '6px';
        formAbbrev.style.color = '#6b7280';
        formAbbrev.style.textAlign = 'center';
        formAbbrev.style.lineHeight = '1';
        cell.appendChild(formAbbrev);

        grid.appendChild(cell);
      }

      page.appendChild(grid);
      pages.push({ key: pageKey, element: page });
    }

    return pages;
  },
};

// ============================================================
// ScoutCard Layout — opponent tendency card with play diagrams
// ============================================================

export const ScoutCardLayout: PrintLayout = {
  id: 'scout-card',
  name: 'Scout Card',
  description: 'Opponent tendency card with play diagrams',

  renderPages(plays, opts) {
    const options = resolveOptions(opts);
    const dims = getPageDimensions(options);
    const pages: PrintPage[] = [];
    const playsPerPage = 4;

    for (let pageIdx = 0; pageIdx < plays.length; pageIdx += playsPerPage) {
      const pageKey = `scout-card-${pageIdx}`;
      const page = createPageContainer(dims, pageKey);

      // Header
      const header = document.createElement('div');
      header.textContent = 'SCOUT CARD';
      header.style.fontSize = '16px';
      header.style.fontWeight = '800';
      header.style.textAlign = 'center';
      header.style.marginBottom = '8px';
      header.style.textTransform = 'uppercase';
      header.style.letterSpacing = '2px';
      header.style.borderBottom = '2px solid #dc2626';
      header.style.paddingBottom = '4px';
      page.appendChild(header);

      const slice = plays.slice(pageIdx, pageIdx + playsPerPage);
      for (const { play, formation } of slice) {
        const card = document.createElement('div');
        card.className = 'scout-card-entry';
        card.style.display = 'flex';
        card.style.gap = '12px';
        card.style.marginBottom = '12px';
        card.style.border = '1px solid #e5e7eb';
        card.style.borderRadius = '4px';
        card.style.padding = '8px';

        // Left: diagram
        if (options.showDiagram) {
          const diagramContainer = document.createElement('div');
          diagramContainer.style.flexShrink = '0';
          diagramContainer.style.width = '45%';
          const diagram = createPlayDiagram(play, formation, '100%', '120px');
          diagramContainer.appendChild(diagram);
          card.appendChild(diagramContainer);
        }

        // Right: info
        const info = document.createElement('div');
        info.style.flex = '1';
        info.style.display = 'flex';
        info.style.flexDirection = 'column';
        info.style.gap = '4px';

        const cardTitle = createPlayTitle(play.name);
        cardTitle.style.fontSize = '14px';
        info.appendChild(cardTitle);

        if (options.showFormation) {
          info.appendChild(createFormationLabel(formation.name));
        }

        if (play.defensiveOverlay) {
          const defInfo = document.createElement('div');
          defInfo.style.fontSize = '11px';
          defInfo.style.color = '#dc2626';
          defInfo.textContent = `Front: ${play.defensiveOverlay.front} | Coverage: ${play.defensiveOverlay.coverage}`;
          info.appendChild(defInfo);
        }

        if (options.showTags && play.tags.length > 0) {
          info.appendChild(createTagsRow(play.tags));
        }

        if (options.showNotes && play.notes) {
          const notes = createNotesBlock(play.notes);
          notes.style.fontSize = '10px';
          info.appendChild(notes);
        }

        card.appendChild(info);
        page.appendChild(card);
      }

      pages.push({ key: pageKey, element: page });
    }

    return pages;
  },
};

// ============================================================
// Registry
// ============================================================

export const PRINT_LAYOUTS: Record<PrintLayoutId, PrintLayout> = {
  'single-play': SinglePlayLayout,
  'play-grid': PlayGridLayout,
  'call-sheet': CallSheetLayout,
  wristband: WristbandLayout,
  'scout-card': ScoutCardLayout,
};

export const PRINT_LAYOUT_LIST: PrintLayout[] = Object.values(PRINT_LAYOUTS);

export function getLayout(id: PrintLayoutId): PrintLayout {
  const layout = PRINT_LAYOUTS[id];
  if (!layout) {
    throw new Error(`Unknown print layout: ${id}`);
  }
  return layout;
}
