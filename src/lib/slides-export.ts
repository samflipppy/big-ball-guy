import type { Play, Formation } from '@/types';

// ============================================================
// Types
// ============================================================

export type SlideType = 'title' | 'play' | 'summary';
export type SlideFormat = 'pptx' | 'google-slides-json';

export interface Slide {
  type: SlideType;
  title: string;
  content: string;
  imageData?: string;
  notes?: string;
}

export interface SlideDeck {
  title: string;
  slides: Slide[];
}

export interface SlideExportOptions {
  title?: string;
  includeNotes?: boolean;
  includeDefense?: boolean;
}

const DEFAULT_OPTIONS: Required<SlideExportOptions> = {
  title: 'Playbook',
  includeNotes: true,
  includeDefense: false,
};

function resolveOptions(opts?: SlideExportOptions): Required<SlideExportOptions> {
  return { ...DEFAULT_OPTIONS, ...opts };
}

// ============================================================
// Canvas rendering for thumbnails (simplified base64 output)
// ============================================================

function renderPlayToBase64(
  play: Play,
  formation: Formation,
  width: number,
  height: number,
): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Field
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, width, height);

    // Players
    const scaleX = width / 800;
    const scaleY = height / 500;
    for (const player of formation.players) {
      const px = player.location.x * scaleX;
      const py = player.location.y * scaleY;
      ctx.fillStyle = player.side === 'offense' ? '#2563eb' : '#dc2626';
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

// ============================================================
// Build Slide Deck
// ============================================================

function buildSlideDeck(
  plays: Play[],
  formationMap: Map<string, Formation>,
  options: Required<SlideExportOptions>,
): SlideDeck {
  const slides: Slide[] = [];

  // Title slide
  slides.push({
    type: 'title',
    title: options.title,
    content: `${plays.length} plays`,
    notes: `Generated playbook with ${plays.length} plays`,
  });

  // Play slides
  for (const play of plays) {
    const formation = formationMap.get(play.formationId);
    if (!formation) continue;

    const imageData = renderPlayToBase64(play, formation, 800, 500);

    const contentParts: string[] = [];
    contentParts.push(`Formation: ${formation.name}`);
    contentParts.push(`Personnel: ${play.personnel}`);
    if (play.tags.length > 0) {
      contentParts.push(`Tags: ${play.tags.join(', ')}`);
    }
    if (play.hash) {
      contentParts.push(`Hash: ${play.hash}`);
    }

    const routeCount = play.assignments.filter((a) => a.route).length;
    const blockCount = play.assignments.filter((a) => a.blocking).length;
    contentParts.push(`Routes: ${routeCount}, Blocks: ${blockCount}`);

    if (options.includeDefense && play.defensiveOverlay) {
      contentParts.push(`Defense: ${play.defensiveOverlay.front} / ${play.defensiveOverlay.coverage}`);
    }

    slides.push({
      type: 'play',
      title: play.name,
      content: contentParts.join('\n'),
      imageData: imageData || undefined,
      notes: options.includeNotes ? play.notes : undefined,
    });
  }

  // Summary slide
  const formations = new Set(
    plays.map((p) => formationMap.get(p.formationId)?.name).filter(Boolean),
  );
  const categories = new Set(plays.map((p) => p.category).filter(Boolean));

  const summaryParts: string[] = [];
  summaryParts.push(`Total Plays: ${plays.length}`);
  summaryParts.push(`Formations: ${formations.size}`);
  if (categories.size > 0) {
    summaryParts.push(`Categories: ${[...categories].join(', ')}`);
  }

  slides.push({
    type: 'summary',
    title: 'Summary',
    content: summaryParts.join('\n'),
  });

  return {
    title: options.title,
    slides,
  };
}

// ============================================================
// Format-specific serialization
// ============================================================

function toGoogleSlidesJson(deck: SlideDeck): string {
  return JSON.stringify({
    format: 'google-slides-json',
    title: deck.title,
    slides: deck.slides.map((slide) => ({
      objectId: `slide_${slide.type}_${Math.random().toString(36).substring(2, 8)}`,
      slideType: slide.type,
      title: slide.title,
      body: slide.content,
      image: slide.imageData ?? null,
      speakerNotes: slide.notes ?? null,
    })),
  });
}

function toPptxJson(deck: SlideDeck): string {
  return JSON.stringify({
    format: 'pptx',
    title: deck.title,
    slideCount: deck.slides.length,
    slides: deck.slides.map((slide, index) => ({
      index,
      layout: slide.type === 'title' ? 'titleSlide' : slide.type === 'summary' ? 'sectionHeader' : 'titleAndContent',
      title: slide.title,
      content: slide.content,
      image: slide.imageData ?? null,
      notes: slide.notes ?? null,
    })),
  });
}

// ============================================================
// Public API
// ============================================================

/**
 * Export plays as a slide deck structure.
 * Returns a JSON string in the specified format.
 *
 * - 'google-slides-json': Google Slides compatible JSON
 * - 'pptx': PowerPoint-style JSON (for downstream PPTX generation)
 */
export function exportToSlides(
  plays: Play[],
  formations: Map<string, Formation> | Formation[],
  format: SlideFormat,
  options?: SlideExportOptions,
): string {
  const opts = resolveOptions(options);

  // Build formation map
  const formationMap = new Map<string, Formation>();
  if (Array.isArray(formations)) {
    for (const f of formations) formationMap.set(f.id, f);
  } else {
    formations.forEach((f, id) => formationMap.set(id, f));
  }

  const deck = buildSlideDeck(plays, formationMap, opts);

  if (format === 'google-slides-json') {
    return toGoogleSlidesJson(deck);
  }
  return toPptxJson(deck);
}

/**
 * Build a SlideDeck object (useful for testing or further processing).
 */
export function buildDeck(
  plays: Play[],
  formations: Map<string, Formation> | Formation[],
  options?: SlideExportOptions,
): SlideDeck {
  const opts = resolveOptions(options);

  const formationMap = new Map<string, Formation>();
  if (Array.isArray(formations)) {
    for (const f of formations) formationMap.set(f.id, f);
  } else {
    formations.forEach((f, id) => formationMap.set(id, f));
  }

  return buildSlideDeck(plays, formationMap, opts);
}
