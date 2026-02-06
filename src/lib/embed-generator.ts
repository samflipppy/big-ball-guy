/**
 * Embed Play Diagram (#287)
 *
 * Generates embeddable HTML snippets, oEmbed responses, and iframe URLs
 * for sharing play diagrams on external sites.
 */

// ---- Types ----

export interface EmbedOptions {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  showControls?: boolean;
  autoPlay?: boolean;
}

export interface OEmbedResponse {
  type: 'rich';
  version: '1.0';
  title: string;
  provider_name: string;
  provider_url: string;
  html: string;
  width: number;
  height: number;
  thumbnail_url?: string;
}

// ---- Constants ----

const DEFAULT_EMBED_OPTIONS: Required<EmbedOptions> = {
  width: 640,
  height: 400,
  theme: 'light',
  showControls: true,
  autoPlay: false,
};

const PROVIDER_NAME = 'Playbook';
const PROVIDER_URL = 'https://app.playbook.com';

// ---- Helpers ----

function resolveOptions(opts?: EmbedOptions): Required<EmbedOptions> {
  return { ...DEFAULT_EMBED_OPTIONS, ...opts };
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || PROVIDER_URL;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---- Public API ----

/**
 * Generate an iframe source URL for embedding a play diagram.
 */
export function generateIframeUrl(playId: string, options?: EmbedOptions): string {
  if (!playId || playId.trim() === '') {
    throw new Error('Play ID is required');
  }

  const opts = resolveOptions(options);
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();

  params.set('theme', opts.theme);
  params.set('controls', opts.showControls ? '1' : '0');
  params.set('autoplay', opts.autoPlay ? '1' : '0');

  return `${baseUrl}/embed/play/${playId}?${params.toString()}`;
}

/**
 * Generate an HTML embed code snippet containing an iframe.
 */
export function generateEmbedCode(playId: string, options?: EmbedOptions): string {
  if (!playId || playId.trim() === '') {
    throw new Error('Play ID is required');
  }

  const opts = resolveOptions(options);
  const iframeUrl = generateIframeUrl(playId, opts);
  const escapedUrl = escapeHtml(iframeUrl);

  return [
    `<iframe`,
    `  src="${escapedUrl}"`,
    `  width="${opts.width}"`,
    `  height="${opts.height}"`,
    `  frameborder="0"`,
    `  allowfullscreen`,
    `  loading="lazy"`,
    `  style="border: 1px solid #e5e7eb; border-radius: 8px;"`,
    `  title="Play Diagram"`,
    `></iframe>`,
  ].join('\n');
}

/**
 * Generate an oEmbed JSON response for a given play.
 */
export function generateOEmbedResponse(
  playId: string,
  url: string,
  options?: EmbedOptions,
): OEmbedResponse {
  if (!playId || playId.trim() === '') {
    throw new Error('Play ID is required');
  }

  const opts = resolveOptions(options);
  const embedHtml = generateEmbedCode(playId, opts);
  const baseUrl = getBaseUrl();

  return {
    type: 'rich',
    version: '1.0',
    title: `Play Diagram - ${playId}`,
    provider_name: PROVIDER_NAME,
    provider_url: PROVIDER_URL,
    html: embedHtml,
    width: opts.width,
    height: opts.height,
    thumbnail_url: `${baseUrl}/api/plays/${playId}/thumbnail`,
  };
}
