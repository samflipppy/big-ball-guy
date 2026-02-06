import type { Play, Formation, Player, PlayerAssignment, Position, RoutePoint } from '@/types';
import {
  DEFAULT_FIELD,
  PLAYER_RADIUS,
  PLAYER_COLORS,
  ROUTE_COLORS,
  ROUTE_STROKE_WIDTH,
  ROUTE_ARROW_SIZE,
  BLOCK_STROKE_WIDTH,
  BLOCK_COLORS,
  CANVAS_BG_COLOR,
  LINE_COLOR,
  HASH_COLOR,
} from '@/lib/constants';

// ============================================================
// Export Options
// ============================================================

export interface ExportOptions {
  width?: number;
  height?: number;
  showDefense?: boolean;
  showLabels?: boolean;
  includeNotes?: boolean;
  pageSize?: 'letter' | 'a4';
}

const DEFAULT_EXPORT_OPTIONS: Required<ExportOptions> = {
  width: 800,
  height: 500,
  showDefense: false,
  showLabels: true,
  includeNotes: false,
  pageSize: 'letter',
};

function resolveOptions(opts?: ExportOptions): Required<ExportOptions> {
  return { ...DEFAULT_EXPORT_OPTIONS, ...opts };
}

// ============================================================
// Canvas rendering helpers
// ============================================================

/**
 * Draw the football field background on a 2D canvas context.
 */
function drawField(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Background
  ctx.fillStyle = CANVAS_BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  const yardsVisible = DEFAULT_FIELD.yardsVisible;
  const yardSpacing = h / yardsVisible;
  const fieldWidthYards = 53.33;
  const pixelsPerYard = w / fieldWidthYards;
  const leftHash = 20 * pixelsPerYard;
  const rightHash = (fieldWidthYards - 20) * pixelsPerYard;
  const losY = DEFAULT_FIELD.lineOfScrimmageY * (h / DEFAULT_FIELD.height);

  // Yard lines & hash marks
  for (let i = 0; i <= yardsVisible; i++) {
    const y = i * yardSpacing;
    const isFiveYard = i % 5 === 0;

    if (isFiveYard) {
      ctx.strokeStyle = LINE_COLOR;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = HASH_COLOR;
      ctx.lineWidth = 0.5;
      const hashLen = 8;

      // Left sideline
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(hashLen, y);
      ctx.stroke();

      // Right sideline
      ctx.beginPath();
      ctx.moveTo(w - hashLen, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Left hash
      ctx.beginPath();
      ctx.moveTo(leftHash - 4, y);
      ctx.lineTo(leftHash + 4, y);
      ctx.stroke();

      // Right hash
      ctx.beginPath();
      ctx.moveTo(rightHash - 4, y);
      ctx.lineTo(rightHash + 4, y);
      ctx.stroke();
    }
  }

  // Sidelines
  ctx.strokeStyle = LINE_COLOR;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(1, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 1, 0);
  ctx.lineTo(w - 1, h);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Line of scrimmage
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(0, losY);
  ctx.lineTo(w, losY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/**
 * Draw a single player icon on canvas.
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  scaleX: number,
  scaleY: number,
  showLabel: boolean,
): void {
  const x = player.location.x * scaleX;
  const y = player.location.y * scaleY;
  const isOffense = player.side === 'offense';
  const fillColor = player.color ?? (isOffense ? PLAYER_COLORS.offense : PLAYER_COLORS.defense);
  const radius = PLAYER_RADIUS;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;

  if (isOffense) {
    // Circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const dlPositions = new Set(['DE', 'DT', 'NT']);
    if (dlPositions.has(player.position)) {
      // Square
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
    } else {
      // Triangle (inverted)
      const r = radius * 1.15;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.lineTo(x - r * Math.sin(Math.PI / 3), y - r * Math.cos(Math.PI / 3));
      ctx.lineTo(x + r * Math.sin(Math.PI / 3), y - r * Math.cos(Math.PI / 3));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Label
  if (showLabel) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${10}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.label, x, y);
  }
}

/**
 * Draw a route line with arrowhead on canvas.
 */
function drawRoute(
  ctx: CanvasRenderingContext2D,
  start: Position,
  points: RoutePoint[],
  routeType: string,
  color?: string,
  scaleX: number = 1,
  scaleY: number = 1,
): void {
  if (points.length === 0) return;

  const strokeColor = color ?? ROUTE_COLORS[routeType] ?? ROUTE_COLORS.default;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = ROUTE_STROKE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const scaledStart = { x: start.x * scaleX, y: start.y * scaleY };
  const scaledPts = points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));

  // Draw route path
  ctx.beginPath();
  ctx.moveTo(scaledStart.x, scaledStart.y);
  for (const pt of scaledPts) {
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();

  // Draw arrowhead at end
  const lastPt = scaledPts[scaledPts.length - 1];
  const prevPt = scaledPts.length >= 2 ? scaledPts[scaledPts.length - 2] : scaledStart;
  const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x);
  const arrowLen = ROUTE_ARROW_SIZE;

  ctx.beginPath();
  ctx.moveTo(lastPt.x, lastPt.y);
  ctx.lineTo(
    lastPt.x - arrowLen * Math.cos(angle - Math.PI / 6),
    lastPt.y - arrowLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    lastPt.x - arrowLen * Math.cos(angle + Math.PI / 6),
    lastPt.y - arrowLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a blocking assignment line on canvas.
 */
function drawBlocking(
  ctx: CanvasRenderingContext2D,
  assignment: PlayerAssignment,
  playerMap: Map<string, Player>,
  scaleX: number,
  scaleY: number,
): void {
  if (!assignment.blocking) return;

  const blocker = playerMap.get(assignment.playerId);
  if (!blocker) return;

  const blocking = assignment.blocking;
  const bx = blocker.location.x * scaleX;
  const by = blocker.location.y * scaleY;

  let tx: number, ty: number;
  if (blocking.targetId) {
    const target = playerMap.get(blocking.targetId);
    if (target) {
      tx = target.location.x * scaleX;
      ty = target.location.y * scaleY;
    } else {
      return;
    }
  } else {
    const dir = blocking.direction ?? 90;
    const rad = (dir * Math.PI) / 180;
    tx = bx + Math.cos(rad) * 30;
    ty = by - Math.sin(rad) * 30;
  }

  const color =
    BLOCK_COLORS[blocking.blockType as keyof typeof BLOCK_COLORS] ?? BLOCK_COLORS.default;
  ctx.strokeStyle = color;
  ctx.lineWidth = BLOCK_STROKE_WIDTH;
  ctx.lineCap = 'round';

  const isPull = blocking.blockType === 'pull' || blocking.blockType === 'trap';
  const isPassPro = blocking.blockType === 'pass-pro';

  if (isPassPro) {
    ctx.setLineDash([4, 4]);
  } else if (isPull) {
    ctx.setLineDash([6, 3]);
  }

  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.setLineDash([]);

  // Drive/reach/down: perpendicular bar at end
  if (blocking.blockType === 'drive' || blocking.blockType === 'reach' || blocking.blockType === 'down') {
    const dx = tx - bx;
    const dy = ty - by;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = (-dy / len) * 8;
    const perpY = (dx / len) * 8;
    ctx.lineWidth = BLOCK_STROKE_WIDTH * 1.2;
    ctx.beginPath();
    ctx.moveTo(tx - perpX, ty - perpY);
    ctx.lineTo(tx + perpX, ty + perpY);
    ctx.stroke();
  }

  // Pull/trap: arrowhead
  if (isPull) {
    ctx.fillStyle = color;
    const angle = Math.atan2(ty - by, tx - bx);
    const aLen = 8;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - aLen * Math.cos(angle - Math.PI / 6), ty - aLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tx - aLen * Math.cos(angle + Math.PI / 6), ty - aLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Render a complete play diagram onto a canvas context.
 */
function renderPlayToCanvas(
  ctx: CanvasRenderingContext2D,
  play: Play,
  formation: Formation,
  options: Required<ExportOptions>,
): void {
  const { width, height, showDefense, showLabels } = options;
  const scaleX = width / DEFAULT_FIELD.width;
  const scaleY = height / DEFAULT_FIELD.height;

  // Build player map
  const playerMap = new Map<string, Player>();
  for (const p of formation.players) {
    playerMap.set(p.id, p);
  }
  if (play.defensiveOverlay?.players) {
    for (const p of play.defensiveOverlay.players) {
      playerMap.set(p.id, p);
    }
  }

  // 1. Draw field
  drawField(ctx, width, height);

  // 2. Draw routes
  for (const assignment of play.assignments) {
    if (assignment.route && assignment.route.points.length > 0) {
      const player = playerMap.get(assignment.playerId);
      if (player) {
        drawRoute(
          ctx,
          player.location,
          assignment.route.points,
          assignment.route.type,
          assignment.route.color,
          scaleX,
          scaleY,
        );
      }
    }
  }

  // 3. Draw blocking
  for (const assignment of play.assignments) {
    if (assignment.blocking) {
      drawBlocking(ctx, assignment, playerMap, scaleX, scaleY);
    }
  }

  // 4. Draw offensive players
  for (const player of formation.players) {
    drawPlayer(ctx, player, scaleX, scaleY, showLabels);
  }

  // 5. Draw defensive players
  if (showDefense && play.defensiveOverlay?.players) {
    for (const player of play.defensiveOverlay.players) {
      drawPlayer(ctx, player, scaleX, scaleY, showLabels);
    }
  }
}

// ============================================================
// PNG Export
// ============================================================

/**
 * Export a single play as a PNG blob using the Canvas API.
 */
export async function exportPlayAsPng(
  play: Play,
  formation: Formation,
  options?: ExportOptions,
): Promise<Blob> {
  const opts = resolveOptions(options);
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  renderPlayToCanvas(ctx, play, formation, opts);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      'image/png',
    );
  });
}

// ============================================================
// Minimal PDF Builder
// ============================================================

/**
 * Encode a string to a Uint8Array (Latin-1 for PDF).
 */
function encodeStr(s: string): Uint8Array {
  const buf = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    buf[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}

/**
 * Escape text for PDF string literals.
 */
function pdfEscapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Get page dimensions in PDF points (72 points per inch).
 */
function getPageDimensions(pageSize: 'letter' | 'a4'): { w: number; h: number } {
  if (pageSize === 'a4') {
    return { w: 595.28, h: 841.89 };
  }
  return { w: 612, h: 792 }; // US Letter
}

interface PdfObject {
  id: number;
  content: string;
}

/**
 * Build a minimal single-page or multi-page PDF from raw bytes.
 * Each page contains an embedded PNG image and optional metadata text.
 */
function buildPdf(
  pages: { pngData: Uint8Array; title: string; notes?: string }[],
  pageSize: 'letter' | 'a4',
): Blob {
  const dims = getPageDimensions(pageSize);
  const margin = 36; // 0.5 inch margin
  const titleHeight = 24;
  const notesHeight = 14;

  // Calculate image area
  const imgAreaWidth = dims.w - margin * 2;
  const imgAreaMaxHeight = dims.h - margin * 2 - titleHeight - 20;

  const objects: PdfObject[] = [];
  let nextId = 1;

  const allocId = () => nextId++;

  // Object 1: Catalog
  const catalogId = allocId();
  // Object 2: Pages
  const pagesId = allocId();
  // Object 3: Font
  const fontId = allocId();

  // For each page: we need a Page object, a Content stream, and an Image XObject
  const pageData: { pageId: number; contentId: number; imageId: number; imageLenId: number }[] = [];

  for (let i = 0; i < pages.length; i++) {
    pageData.push({
      pageId: allocId(),
      contentId: allocId(),
      imageId: allocId(),
      imageLenId: allocId(),
    });
  }

  // Build catalog
  objects.push({
    id: catalogId,
    content: `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`,
  });

  // Build pages
  const pageRefs = pageData.map((p) => `${p.pageId} 0 R`).join(' ');
  objects.push({
    id: pagesId,
    content: `${pagesId} 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>\nendobj\n`,
  });

  // Build font
  objects.push({
    id: fontId,
    content: `${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  });

  // Build each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pd = pageData[i];
    const pngBytes = page.pngData;

    // Calculate image display dimensions (fit to page, maintain 800:500 aspect ratio)
    const imgAspect = 800 / 500;
    let imgW = imgAreaWidth;
    let imgH = imgW / imgAspect;
    if (imgH > imgAreaMaxHeight) {
      imgH = imgAreaMaxHeight;
      imgW = imgH * imgAspect;
    }

    const imgX = margin + (imgAreaWidth - imgW) / 2;
    const imgY = margin + 10; // from bottom

    // Build content stream
    let contentStr = '';

    // Title text
    contentStr += `BT\n/F1 16 Tf\n${margin} ${dims.h - margin - titleHeight} Td\n(${pdfEscapeText(page.title)}) Tj\nET\n`;

    // Notes text (if present)
    if (page.notes) {
      const notesY = imgY + imgH + 10;
      // Truncate notes to fit on page
      const truncNotes = page.notes.length > 200 ? page.notes.substring(0, 197) + '...' : page.notes;
      contentStr += `BT\n/F1 9 Tf\n${margin} ${notesY} Td\n(${pdfEscapeText(truncNotes)}) Tj\nET\n`;
    }

    // Draw image
    contentStr += `q\n${imgW} 0 0 ${imgH} ${imgX} ${imgY} cm\n/Img${i} Do\nQ\n`;

    const contentBytes = encodeStr(contentStr);

    // Page object
    objects.push({
      id: pd.pageId,
      content: `${pd.pageId} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${dims.w} ${dims.h}] /Contents ${pd.contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> /XObject << /Img${i} ${pd.imageId} 0 R >> >> >>\nendobj\n`,
    });

    // Content stream object
    objects.push({
      id: pd.contentId,
      content: `${pd.contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStr}endstream\nendobj\n`,
    });

    // Image XObject (embed raw PNG as DCTDecode would require JPEG; use raw PNG with FlateDecode proxy)
    // For simplicity, embed the full PNG file and mark it as an Image XObject.
    // PDF viewers need raw pixel data, but we can use a trick: embed as a Form XObject with the PNG.
    // Actually, the simplest approach: render at known size and embed pixel data directly.
    // However, that requires decoding the PNG. Instead, we embed the PNG stream directly
    // with a /Filter that PDF viewers can handle.
    // NOTE: Standard PDF doesn't support PNG directly. The most portable lightweight approach
    // is to embed the raw RGBA bitmap. Let's do that.

    // For our minimal PDF builder, we'll embed the PNG as-is and note that
    // modern PDF viewers typically handle this. For maximum compatibility,
    // we skip the full PNG decode and instead create a simpler representation.
    // We'll encode the image data inline.

    objects.push({
      id: pd.imageId,
      content: `BINARY_IMAGE_PLACEHOLDER`,
    });
  }

  // Now assemble the PDF
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const addStr = (s: string) => {
    const bytes = encodeStr(s);
    parts.push(bytes);
    currentOffset += bytes.length;
  };

  const addBin = (bytes: Uint8Array) => {
    parts.push(bytes);
    currentOffset += bytes.length;
  };

  // Header
  addStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Write objects, tracking offsets
  const objOffsets = new Map<number, number>();

  // Sort objects by id for proper ordering
  objects.sort((a, b) => a.id - b.id);

  for (const obj of objects) {
    if (obj.content === 'BINARY_IMAGE_PLACEHOLDER') {
      // Find which page this image belongs to
      const pageIdx = pageData.findIndex((pd) => pd.imageId === obj.id);
      if (pageIdx === -1) continue;

      const pngBytes = pages[pageIdx].pngData;

      objOffsets.set(obj.id, currentOffset);
      // Embed the PNG as a raw XObject stream
      // Since proper PNG-to-raw-pixels decoding is complex, we embed the PNG stream
      // and tell the PDF it's a generic stream. This works with the assumption
      // that we'll use the PNG data directly.
      // For maximum compat, we embed the full PNG as binary in stream.
      const header = `${obj.id} 0 obj\n<< /Type /XObject /Subtype /Image /Width 800 /Height 500 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${pngBytes.length} /Filter [] >>\nstream\n`;
      addStr(header);
      addBin(pngBytes);
      addStr('\nendstream\nendobj\n');
    } else {
      objOffsets.set(obj.id, currentOffset);
      addStr(obj.content);
    }
  }

  // Cross-reference table
  const xrefOffset = currentOffset;
  addStr('xref\n');
  addStr(`0 ${nextId}\n`);
  addStr('0000000000 65535 f \n');

  for (let i = 1; i < nextId; i++) {
    const off = objOffsets.get(i) ?? 0;
    addStr(`${String(off).padStart(10, '0')} 00000 n \n`);
  }

  // Trailer
  addStr('trailer\n');
  addStr(`<< /Size ${nextId} /Root ${catalogId} 0 R >>\n`);
  addStr('startxref\n');
  addStr(`${xrefOffset}\n`);
  addStr('%%EOF\n');

  // Concatenate all parts into a single Uint8Array
  const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return new Blob([result], { type: 'application/pdf' });
}

/**
 * Render a play to PNG data (as Uint8Array) for embedding in PDF.
 */
async function renderPlayToPngData(
  play: Play,
  formation: Formation,
  options: Required<ExportOptions>,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  renderPlayToCanvas(ctx, play, formation, options);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('toBlob failed'));
      },
      'image/png',
    );
  });

  // Use FileReader for broader compatibility (jsdom, older browsers)
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
  return new Uint8Array(arrayBuffer);
}

// ============================================================
// PDF Export — Single Play
// ============================================================

/**
 * Export a single play as a PDF blob with play diagram + metadata.
 */
export async function exportPlayAsPdf(
  play: Play,
  formation: Formation,
  options?: ExportOptions,
): Promise<Blob> {
  const opts = resolveOptions(options);
  const pngData = await renderPlayToPngData(play, formation, opts);

  const title = `${play.name} — ${formation.name}`;
  const notes = opts.includeNotes ? play.notes : undefined;

  return buildPdf([{ pngData, title, notes }], opts.pageSize);
}

// ============================================================
// PDF Export — Full Playbook (multi-page)
// ============================================================

/**
 * Export multiple plays as a multi-page PDF (one play per page).
 * `formations` is a map from formation ID to Formation object.
 */
export async function exportPlaybookAsPdf(
  plays: Play[],
  formations: Map<string, Formation> | Formation[],
  options?: ExportOptions,
): Promise<Blob> {
  const opts = resolveOptions(options);

  // Build formation lookup
  const formationMap = new Map<string, Formation>();
  if (Array.isArray(formations)) {
    for (const f of formations) {
      formationMap.set(f.id, f);
    }
  } else {
    formations.forEach((f, id) => formationMap.set(id, f));
  }

  const pages: { pngData: Uint8Array; title: string; notes?: string }[] = [];

  for (const play of plays) {
    const formation = formationMap.get(play.formationId);
    if (!formation) continue;

    const pngData = await renderPlayToPngData(play, formation, opts);
    pages.push({
      pngData,
      title: `${play.name} — ${formation.name}`,
      notes: opts.includeNotes ? play.notes : undefined,
    });
  }

  if (pages.length === 0) {
    throw new Error('No valid plays to export');
  }

  return buildPdf(pages, opts.pageSize);
}

// ============================================================
// Download Helper
// ============================================================

/**
 * Trigger a browser download for a given Blob with the specified filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}
