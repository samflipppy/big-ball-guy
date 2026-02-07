// ---- Viewer Mode ----
// Provides read-only access for parents, boosters, and other non-coaching viewers.

// ---- Types ----

export interface ViewerConfig {
  allowedSections: string[];
  watermark: boolean;
  expiresAt?: string;
  teamName: string;
}

export interface ViewerToken {
  teamId: string;
  config: ViewerConfig;
  createdAt: string;
  token: string;
}

// ---- Constants ----

export const VIEWER_SECTIONS = [
  'roster',
  'schedule',
  'depth-chart',
  'highlights',
] as const;

export type ViewerSection = (typeof VIEWER_SECTIONS)[number];

// Token prefix to identify viewer links
const VIEWER_TOKEN_PREFIX = 'bbg-viewer-';

// Store for issued tokens (in-memory stub; production would use a database)
const tokenStore = new Map<string, ViewerToken>();

// Session state (in-memory stub; production would use cookies/session)
let currentViewerToken: string | null = null;

// ---- Link generation ----

/**
 * Generate a read-only viewer link for a team.
 *
 * Returns a URL containing an encoded viewer token that grants access
 * to the configured sections.
 */
export function createViewerLink(teamId: string, config: ViewerConfig): string {
  if (!teamId || teamId.trim().length === 0) {
    throw new Error('Team ID is required');
  }

  if (!config.teamName || config.teamName.trim().length === 0) {
    throw new Error('Team name is required');
  }

  if (config.allowedSections.length === 0) {
    throw new Error('At least one section must be allowed');
  }

  // Validate sections
  for (const section of config.allowedSections) {
    if (!(VIEWER_SECTIONS as readonly string[]).includes(section)) {
      throw new Error(`Invalid section: ${section}`);
    }
  }

  // Generate a deterministic-ish token (stub; production would use crypto)
  const token = `${VIEWER_TOKEN_PREFIX}${teamId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const viewerToken: ViewerToken = {
    teamId,
    config,
    createdAt: new Date().toISOString(),
    token,
  };

  tokenStore.set(token, viewerToken);

  return `/viewer?token=${encodeURIComponent(token)}`;
}

// ---- Validation ----

/**
 * Check whether a viewer token is valid and not expired.
 */
export function validateViewerAccess(token: string): boolean {
  if (!token || token.trim().length === 0) {
    return false;
  }

  const viewerToken = tokenStore.get(token);
  if (!viewerToken) {
    return false;
  }

  // Check expiration
  if (viewerToken.config.expiresAt) {
    const expiresAt = new Date(viewerToken.config.expiresAt).getTime();
    if (Date.now() > expiresAt) {
      return false;
    }
  }

  return true;
}

// ---- Content filtering ----

/**
 * Filter content items to only include those matching the allowed viewer sections.
 *
 * Each content item is expected to have a `section` property (or similar)
 * that identifies which section it belongs to.
 */
export function filterContentForViewer<T extends { section: string }>(
  content: T[],
  allowedSections: string[],
): T[] {
  if (!content || content.length === 0) {
    return [];
  }

  return content.filter((item) => allowedSections.includes(item.section));
}

// ---- Session management ----

/**
 * Check if the current session is in viewer (read-only) mode.
 */
export function isViewerMode(): boolean {
  return currentViewerToken !== null;
}

/**
 * Enter viewer mode with the given token.
 * Returns true if the token was valid and viewer mode was activated.
 */
export function enterViewerMode(token: string): boolean {
  if (validateViewerAccess(token)) {
    currentViewerToken = token;
    return true;
  }
  return false;
}

/**
 * Exit viewer mode.
 */
export function exitViewerMode(): void {
  currentViewerToken = null;
}

/**
 * Get the current viewer token configuration, if in viewer mode.
 */
export function getViewerConfig(): ViewerConfig | null {
  if (!currentViewerToken) return null;
  const vt = tokenStore.get(currentViewerToken);
  return vt?.config ?? null;
}

// ---- Test helpers ----

/**
 * Reset the token store and session state. Used for test isolation.
 */
export function _resetViewerState(): void {
  tokenStore.clear();
  currentViewerToken = null;
}
