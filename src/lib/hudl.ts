import type { Play, PlayId, TeamId, FormationId } from '@/types';

// ============================================================
// Hudl API Integration — Placeholder client for future real API
// ============================================================

// --- Configuration ---

export const HUDL_API_BASE_URL = 'https://api.hudl.com';
export const HUDL_API_VERSION = 'v1';

// --- Types ---

export interface HudlPlay {
  id: string;
  name: string;
  formation: string;
  playType: 'run' | 'pass' | 'special';
  videoUrl?: string;
  tags: string[];
}

export interface HudlVideoClip {
  url: string;
  thumbnail: string;
  duration: number;
}

export interface HudlClientConfig {
  baseUrl?: string;
  apiVersion?: string;
}

// --- Mock data ---

const MOCK_HUDL_PLAYS: HudlPlay[] = [
  {
    id: 'hudl-001',
    name: 'Shotgun Trips Right - Four Verticals',
    formation: 'Shotgun Trips',
    playType: 'pass',
    videoUrl: 'https://www.hudl.com/video/mock/001',
    tags: ['passing', 'deep', 'trips'],
  },
  {
    id: 'hudl-002',
    name: 'I-Form Power Right',
    formation: 'I-Form',
    playType: 'run',
    videoUrl: 'https://www.hudl.com/video/mock/002',
    tags: ['run', 'power', 'i-form'],
  },
  {
    id: 'hudl-003',
    name: 'Singleback Mesh Concept',
    formation: 'Singleback',
    playType: 'pass',
    videoUrl: 'https://www.hudl.com/video/mock/003',
    tags: ['passing', 'quick game', 'crossing'],
  },
  {
    id: 'hudl-004',
    name: 'Shotgun Empty - Slant Flat',
    formation: 'Spread',
    playType: 'pass',
    tags: ['passing', 'quick game', 'spread'],
  },
  {
    id: 'hudl-005',
    name: 'Pistol Zone Read',
    formation: 'Pistol',
    playType: 'run',
    videoUrl: 'https://www.hudl.com/video/mock/005',
    tags: ['run', 'option', 'zone'],
  },
];

// --- HudlClient ---

export class HudlClient {
  private apiKey: string | null = null;
  private baseUrl: string;
  private apiVersion: string;
  private _isAuthenticated = false;

  constructor(config: HudlClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? HUDL_API_BASE_URL;
    this.apiVersion = config.apiVersion ?? HUDL_API_VERSION;
  }

  /**
   * Get the full API endpoint URL for a given path.
   */
  getEndpointUrl(path: string): string {
    return `${this.baseUrl}/${this.apiVersion}/${path}`;
  }

  /**
   * Whether the client is currently authenticated.
   */
  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  /**
   * Authenticate with the Hudl API using an API key.
   * Currently validates that the key is non-empty and returns mock success.
   */
  async authenticate(apiKey: string): Promise<boolean> {
    // Simulate network delay
    await delay(300);

    if (!apiKey || apiKey.trim().length === 0) {
      this._isAuthenticated = false;
      this.apiKey = null;
      return false;
    }

    // In a real implementation, this would validate the key against the Hudl API.
    this.apiKey = apiKey;
    this._isAuthenticated = true;
    return true;
  }

  /**
   * Disconnect from the Hudl API and clear credentials.
   */
  disconnect(): void {
    this.apiKey = null;
    this._isAuthenticated = false;
  }

  /**
   * Get all plays for a team from Hudl.
   * Currently returns mock data.
   */
  async getTeamPlays(teamId: string): Promise<HudlPlay[]> {
    this.requireAuth();
    await delay(500);

    // In a real implementation, this would call:
    // GET ${baseUrl}/${apiVersion}/teams/${teamId}/plays
    return [...MOCK_HUDL_PLAYS];
  }

  /**
   * Import a specific play from Hudl into the local playbook format.
   */
  async importPlay(hudlPlayId: string): Promise<Play> {
    this.requireAuth();
    await delay(400);

    const hudlPlay = MOCK_HUDL_PLAYS.find((p) => p.id === hudlPlayId);
    if (!hudlPlay) {
      throw new Error(`Hudl play not found: ${hudlPlayId}`);
    }

    // Convert HudlPlay to local Play format (mock conversion)
    const now = new Date().toISOString();
    const play: Play = {
      id: `imported-${hudlPlay.id}` as PlayId,
      name: hudlPlay.name,
      formationId: `builtin-${hudlPlay.formation.toLowerCase().replace(/\s+/g, '-')}` as FormationId,
      assignments: [],
      tags: [...hudlPlay.tags, 'hudl-import'],
      notes: `Imported from Hudl (${hudlPlay.id})`,
      personnel: '11',
      teamId: '' as TeamId,
      createdAt: now,
      updatedAt: now,
    };

    return play;
  }

  /**
   * Export a local play to Hudl.
   * Returns the Hudl play ID.
   */
  async exportPlay(play: Play): Promise<string> {
    this.requireAuth();
    await delay(400);

    // In a real implementation, this would POST the play to:
    // POST ${baseUrl}/${apiVersion}/plays
    // and return the newly-created Hudl play ID.
    return `hudl-export-${play.id}`;
  }

  /**
   * Get a video clip for a given Hudl play.
   */
  async getVideoClip(playId: string): Promise<HudlVideoClip> {
    this.requireAuth();
    await delay(300);

    const hudlPlay = MOCK_HUDL_PLAYS.find((p) => p.id === playId);
    if (!hudlPlay) {
      throw new Error(`Hudl play not found: ${playId}`);
    }

    return {
      url: hudlPlay.videoUrl ?? `https://www.hudl.com/video/mock/${playId}`,
      thumbnail: `https://www.hudl.com/thumbnails/mock/${playId}.jpg`,
      duration: 8.5,
    };
  }

  /**
   * Ensure the client is authenticated before making API calls.
   */
  private requireAuth(): void {
    if (!this._isAuthenticated || !this.apiKey) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
  }
}

// --- Helpers ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a new HudlClient instance with optional config.
 */
export function createHudlClient(config?: HudlClientConfig): HudlClient {
  return new HudlClient(config);
}
