import type { Play, Formation } from '@/types';

// ============================================================
// Batch Export Options
// ============================================================

export type SortBy = 'name' | 'formation' | 'category' | 'createdAt' | 'personnel';

export interface BatchExportOptions {
  title?: string;
  subtitle?: string;
  playsPerPage?: 1 | 2 | 4;
  includeNotes?: boolean;
  includeFormationName?: boolean;
  sortBy?: SortBy;
  pageSize?: 'letter' | 'a4';
}

const DEFAULT_BATCH_OPTIONS: Required<BatchExportOptions> = {
  title: 'Playbook',
  subtitle: '',
  playsPerPage: 1,
  includeNotes: false,
  includeFormationName: true,
  sortBy: 'name',
  pageSize: 'letter',
};

function resolveBatchOptions(opts?: BatchExportOptions): Required<BatchExportOptions> {
  return { ...DEFAULT_BATCH_OPTIONS, ...opts };
}

// ============================================================
// TOC Structure
// ============================================================

export interface TOCEntry {
  playId: string;
  playName: string;
  formationName?: string;
  category?: string;
  pageNumber: number;
}

export interface TableOfContents {
  title: string;
  entries: TOCEntry[];
  totalPages: number;
}

// ============================================================
// Sorting
// ============================================================

function sortPlays(
  plays: Play[],
  formationMap: Map<string, Formation>,
  sortBy: SortBy,
): Play[] {
  const sorted = [...plays];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'formation': {
        const fa = formationMap.get(a.formationId)?.name ?? '';
        const fb = formationMap.get(b.formationId)?.name ?? '';
        return fa.localeCompare(fb);
      }
      case 'category':
        return (a.category ?? '').localeCompare(b.category ?? '');
      case 'createdAt':
        return a.createdAt.localeCompare(b.createdAt);
      case 'personnel':
        return a.personnel.localeCompare(b.personnel);
      default:
        return 0;
    }
  });
  return sorted;
}

// ============================================================
// PDF helpers (minimal inline builder, same approach as export.ts)
// ============================================================

function encodeStr(s: string): Uint8Array {
  const buf = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    buf[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}

function pdfEscapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function getPageDimensions(pageSize: 'letter' | 'a4'): { w: number; h: number } {
  if (pageSize === 'a4') {
    return { w: 595.28, h: 841.89 };
  }
  return { w: 612, h: 792 };
}

interface PdfPage {
  pngDataList: Uint8Array[];
  titles: string[];
  notes: string[];
  playsPerPage: 1 | 2 | 4;
}

function renderPlayToCanvas(
  canvas: HTMLCanvasElement,
  _play: Play,
  formation: Formation,
  width: number,
  height: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Draw field background
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, width, height);

  // Draw players
  for (const player of formation.players) {
    const scaleX = width / 800;
    const scaleY = height / 500;
    const px = player.location.x * scaleX;
    const py = player.location.y * scaleY;

    ctx.fillStyle = player.side === 'offense' ? '#2563eb' : '#dc2626';
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.label, px, py);
  }
}

async function renderPlayToPngData(
  play: Play,
  formation: Formation,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  renderPlayToCanvas(canvas, play, formation, width, height);

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

/**
 * Build a multi-page PDF from pages of play images.
 */
function buildBatchPdf(
  titlePage: { title: string; subtitle: string },
  tocEntries: TOCEntry[],
  pages: PdfPage[],
  pageSize: 'letter' | 'a4',
): Blob {
  const dims = getPageDimensions(pageSize);
  const margin = 36;

  const parts: Uint8Array[] = [];
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

  // Count total PDF pages: 1 title + 1 TOC + content pages
  const totalPdfPages = 1 + 1 + pages.length;

  let nextId = 1;
  const allocId = () => nextId++;

  const catalogId = allocId();
  const pagesObjId = allocId();
  const fontId = allocId();

  // Allocate page+content IDs for each PDF page
  const pageIds: { pageId: number; contentId: number; imageIds: number[] }[] = [];

  // Title page
  pageIds.push({ pageId: allocId(), contentId: allocId(), imageIds: [] });
  // TOC page
  pageIds.push({ pageId: allocId(), contentId: allocId(), imageIds: [] });
  // Content pages
  for (const pg of pages) {
    const imgIds: number[] = [];
    for (let i = 0; i < pg.pngDataList.length; i++) {
      imgIds.push(allocId());
    }
    pageIds.push({ pageId: allocId(), contentId: allocId(), imageIds: imgIds });
  }

  // Header
  addStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  const objOffsets = new Map<number, number>();

  // Catalog
  objOffsets.set(catalogId, currentOffset);
  addStr(`${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesObjId} 0 R >>\nendobj\n`);

  // Pages
  const pageRefs = pageIds.map((p) => `${p.pageId} 0 R`).join(' ');
  objOffsets.set(pagesObjId, currentOffset);
  addStr(`${pagesObjId} 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${totalPdfPages} >>\nendobj\n`);

  // Font
  objOffsets.set(fontId, currentOffset);
  addStr(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  // --- Title page ---
  {
    const pd = pageIds[0];
    let content = '';
    const titleY = dims.h - margin - 200;
    content += `BT\n/F1 28 Tf\n${margin} ${titleY} Td\n(${pdfEscapeText(titlePage.title)}) Tj\nET\n`;
    if (titlePage.subtitle) {
      content += `BT\n/F1 16 Tf\n${margin} ${titleY - 40} Td\n(${pdfEscapeText(titlePage.subtitle)}) Tj\nET\n`;
    }
    const contentBytes = encodeStr(content);

    objOffsets.set(pd.pageId, currentOffset);
    addStr(`${pd.pageId} 0 obj\n<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${dims.w} ${dims.h}] /Contents ${pd.contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj\n`);

    objOffsets.set(pd.contentId, currentOffset);
    addStr(`${pd.contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}endstream\nendobj\n`);
  }

  // --- TOC page ---
  {
    const pd = pageIds[1];
    let content = '';
    content += `BT\n/F1 18 Tf\n${margin} ${dims.h - margin - 24} Td\n(Table of Contents) Tj\nET\n`;

    let tocY = dims.h - margin - 60;
    for (const entry of tocEntries) {
      if (tocY < margin) break;
      const line = `${entry.playName}${entry.formationName ? ' - ' + entry.formationName : ''} ............ ${entry.pageNumber}`;
      content += `BT\n/F1 10 Tf\n${margin} ${tocY} Td\n(${pdfEscapeText(line)}) Tj\nET\n`;
      tocY -= 16;
    }
    const contentBytes = encodeStr(content);

    objOffsets.set(pd.pageId, currentOffset);
    addStr(`${pd.pageId} 0 obj\n<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${dims.w} ${dims.h}] /Contents ${pd.contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj\n`);

    objOffsets.set(pd.contentId, currentOffset);
    addStr(`${pd.contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}endstream\nendobj\n`);
  }

  // --- Content pages ---
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const pg = pages[pIdx];
    const pd = pageIds[2 + pIdx];

    // Write image XObjects first
    for (let imgIdx = 0; imgIdx < pg.pngDataList.length; imgIdx++) {
      const imgId = pd.imageIds[imgIdx];
      const pngBytes = pg.pngDataList[imgIdx];
      objOffsets.set(imgId, currentOffset);
      const header = `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width 800 /Height 500 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${pngBytes.length} /Filter [] >>\nstream\n`;
      addStr(header);
      addBin(pngBytes);
      addStr('\nendstream\nendobj\n');
    }

    // Content stream
    let content = '';
    const ppp = pg.playsPerPage;
    const imgAreaW = dims.w - margin * 2;
    const imgAspect = 800 / 500;

    if (ppp === 1) {
      const titleText = pg.titles[0] ?? '';
      content += `BT\n/F1 14 Tf\n${margin} ${dims.h - margin - 20} Td\n(${pdfEscapeText(titleText)}) Tj\nET\n`;
      const imgH = Math.min((dims.h - margin * 2 - 60), imgAreaW / imgAspect);
      const imgW = imgH * imgAspect;
      const imgX = margin + (imgAreaW - imgW) / 2;
      const imgY = margin + 20;
      if (pd.imageIds[0] !== undefined) {
        content += `q\n${imgW} 0 0 ${imgH} ${imgX} ${imgY} cm\n/Img0 Do\nQ\n`;
      }
      if (pg.notes[0]) {
        const notesY = imgY + imgH + 10;
        const truncated = pg.notes[0].length > 150 ? pg.notes[0].substring(0, 147) + '...' : pg.notes[0];
        content += `BT\n/F1 8 Tf\n${margin} ${notesY} Td\n(${pdfEscapeText(truncated)}) Tj\nET\n`;
      }
    } else if (ppp === 2) {
      const halfH = (dims.h - margin * 2 - 40) / 2;
      for (let i = 0; i < Math.min(2, pg.titles.length); i++) {
        const yOffset = dims.h - margin - i * (halfH + 20);
        content += `BT\n/F1 11 Tf\n${margin} ${yOffset - 14} Td\n(${pdfEscapeText(pg.titles[i] ?? '')}) Tj\nET\n`;
        const imgH = Math.min(halfH - 30, imgAreaW / imgAspect);
        const imgW = imgH * imgAspect;
        const imgX = margin + (imgAreaW - imgW) / 2;
        const imgY = yOffset - imgH - 20;
        if (pd.imageIds[i] !== undefined) {
          content += `q\n${imgW} 0 0 ${imgH} ${imgX} ${imgY} cm\n/Img${i} Do\nQ\n`;
        }
      }
    } else {
      // 4 per page: 2x2 grid
      const cellW = (imgAreaW - 10) / 2;
      const cellH = (dims.h - margin * 2 - 40) / 2;
      for (let i = 0; i < Math.min(4, pg.titles.length); i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = margin + col * (cellW + 10);
        const cy = dims.h - margin - row * (cellH + 20);

        content += `BT\n/F1 9 Tf\n${cx} ${cy - 12} Td\n(${pdfEscapeText(pg.titles[i] ?? '')}) Tj\nET\n`;
        const imgH = Math.min(cellH - 20, cellW / imgAspect);
        const imgW = imgH * imgAspect;
        const imgX = cx + (cellW - imgW) / 2;
        const imgY = cy - imgH - 16;
        if (pd.imageIds[i] !== undefined) {
          content += `q\n${imgW} 0 0 ${imgH} ${imgX} ${imgY} cm\n/Img${i} Do\nQ\n`;
        }
      }
    }

    const contentBytes = encodeStr(content);

    // Build XObject references
    const xobjRefs = pd.imageIds.map((id, idx) => `/Img${idx} ${id} 0 R`).join(' ');

    objOffsets.set(pd.pageId, currentOffset);
    addStr(`${pd.pageId} 0 obj\n<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${dims.w} ${dims.h}] /Contents ${pd.contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> /XObject << ${xobjRefs} >> >> >>\nendobj\n`);

    objOffsets.set(pd.contentId, currentOffset);
    addStr(`${pd.contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}endstream\nendobj\n`);
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

  addStr('trailer\n');
  addStr(`<< /Size ${nextId} /Root ${catalogId} 0 R >>\n`);
  addStr('startxref\n');
  addStr(`${xrefOffset}\n`);
  addStr('%%EOF\n');

  const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return new Blob([result], { type: 'application/pdf' });
}

// ============================================================
// Public API
// ============================================================

/**
 * Generate a table of contents structure from a list of plays.
 */
export function generateTableOfContents(
  plays: Play[],
  formations?: Map<string, Formation> | Formation[],
  options?: BatchExportOptions,
): TableOfContents {
  const opts = resolveBatchOptions(options);
  const ppp = opts.playsPerPage;

  // Build formation map
  const formationMap = new Map<string, Formation>();
  if (formations) {
    if (Array.isArray(formations)) {
      for (const f of formations) formationMap.set(f.id, f);
    } else {
      formations.forEach((f, id) => formationMap.set(id, f));
    }
  }

  const sorted = sortPlays(plays, formationMap, opts.sortBy);

  // Page 1 = title, page 2 = TOC, content starts at page 3
  const entries: TOCEntry[] = [];
  let pageNum = 3;

  for (let i = 0; i < sorted.length; i++) {
    const play = sorted[i];
    const formation = formationMap.get(play.formationId);
    entries.push({
      playId: play.id,
      playName: play.name,
      formationName: formation?.name,
      category: play.category,
      pageNumber: pageNum,
    });

    // Advance page number based on playsPerPage
    if ((i + 1) % ppp === 0) {
      pageNum++;
    }
  }

  const totalContentPages = Math.ceil(sorted.length / ppp);

  return {
    title: opts.title,
    entries,
    totalPages: 2 + totalContentPages, // title + TOC + content
  };
}

/**
 * Batch export all plays as a multi-page PDF playbook.
 * Returns a Blob of type application/pdf.
 */
export async function batchExportPDF(
  plays: Play[],
  formations: Map<string, Formation> | Formation[],
  options?: BatchExportOptions,
): Promise<Blob> {
  const opts = resolveBatchOptions(options);
  const ppp = opts.playsPerPage;

  // Build formation map
  const formationMap = new Map<string, Formation>();
  if (Array.isArray(formations)) {
    for (const f of formations) formationMap.set(f.id, f);
  } else {
    formations.forEach((f, id) => formationMap.set(id, f));
  }

  // Sort plays
  const sorted = sortPlays(plays, formationMap, opts.sortBy);

  // Filter to plays with valid formations
  const validPlays = sorted.filter((p) => formationMap.has(p.formationId));
  if (validPlays.length === 0) {
    throw new Error('No valid plays to export');
  }

  // Generate TOC
  const toc = generateTableOfContents(validPlays, formationMap, options);

  // Render play images and group into pages
  const imgWidth = 800;
  const imgHeight = 500;
  const pdfPages: PdfPage[] = [];

  for (let i = 0; i < validPlays.length; i += ppp) {
    const chunk = validPlays.slice(i, i + ppp);
    const pngDataList: Uint8Array[] = [];
    const titles: string[] = [];
    const notes: string[] = [];

    for (const play of chunk) {
      const formation = formationMap.get(play.formationId)!;
      const pngData = await renderPlayToPngData(play, formation, imgWidth, imgHeight);
      pngDataList.push(pngData);

      let title = play.name;
      if (opts.includeFormationName && formation) {
        title += ` - ${formation.name}`;
      }
      titles.push(title);
      notes.push(opts.includeNotes && play.notes ? play.notes : '');
    }

    pdfPages.push({ pngDataList, titles, notes, playsPerPage: ppp });
  }

  return buildBatchPdf(
    { title: opts.title, subtitle: opts.subtitle },
    toc.entries,
    pdfPages,
    opts.pageSize,
  );
}
