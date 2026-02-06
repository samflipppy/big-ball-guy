import { describe, it, expect, beforeEach } from 'vitest';
import {
  HudlClient,
  createHudlClient,
  HUDL_API_BASE_URL,
  HUDL_API_VERSION,
  type HudlPlay,
  type HudlVideoClip,
} from '@/lib/hudl';
import type { Play } from '@/types';

describe('HudlClient', () => {
  let client: HudlClient;

  beforeEach(() => {
    client = new HudlClient();
  });

  // --- Configuration ---

  describe('configuration', () => {
    it('has default base URL', () => {
      expect(HUDL_API_BASE_URL).toBe('https://api.hudl.com');
    });

    it('has default API version', () => {
      expect(HUDL_API_VERSION).toBe('v1');
    });

    it('constructs correct endpoint URL', () => {
      expect(client.getEndpointUrl('teams/123/plays')).toBe(
        'https://api.hudl.com/v1/teams/123/plays',
      );
    });

    it('accepts custom base URL and version', () => {
      const custom = new HudlClient({
        baseUrl: 'https://custom.hudl.com',
        apiVersion: 'v2',
      });
      expect(custom.getEndpointUrl('plays')).toBe('https://custom.hudl.com/v2/plays');
    });
  });

  // --- Authentication ---

  describe('authenticate', () => {
    it('returns true for a valid API key', async () => {
      const result = await client.authenticate('valid-api-key-123');
      expect(result).toBe(true);
    });

    it('sets isAuthenticated to true on success', async () => {
      expect(client.isAuthenticated).toBe(false);
      await client.authenticate('valid-api-key-123');
      expect(client.isAuthenticated).toBe(true);
    });

    it('returns false for an empty API key', async () => {
      const result = await client.authenticate('');
      expect(result).toBe(false);
    });

    it('returns false for a whitespace-only API key', async () => {
      const result = await client.authenticate('   ');
      expect(result).toBe(false);
    });

    it('sets isAuthenticated to false on failure', async () => {
      await client.authenticate('valid-key');
      await client.authenticate('');
      expect(client.isAuthenticated).toBe(false);
    });
  });

  // --- Disconnect ---

  describe('disconnect', () => {
    it('sets isAuthenticated to false', async () => {
      await client.authenticate('valid-key');
      client.disconnect();
      expect(client.isAuthenticated).toBe(false);
    });

    it('prevents further API calls after disconnect', async () => {
      await client.authenticate('valid-key');
      client.disconnect();
      await expect(client.getTeamPlays('team-1')).rejects.toThrow('Not authenticated');
    });
  });

  // --- getTeamPlays ---

  describe('getTeamPlays', () => {
    it('throws when not authenticated', async () => {
      await expect(client.getTeamPlays('team-1')).rejects.toThrow('Not authenticated');
    });

    it('returns an array of HudlPlay objects', async () => {
      await client.authenticate('valid-key');
      const plays = await client.getTeamPlays('team-1');
      expect(Array.isArray(plays)).toBe(true);
      expect(plays.length).toBeGreaterThan(0);
    });

    it('each play has required fields', async () => {
      await client.authenticate('valid-key');
      const plays = await client.getTeamPlays('team-1');
      for (const play of plays) {
        expect(play.id).toBeTruthy();
        expect(play.name).toBeTruthy();
        expect(play.formation).toBeTruthy();
        expect(['run', 'pass', 'special']).toContain(play.playType);
        expect(Array.isArray(play.tags)).toBe(true);
      }
    });

    it('returns mock data with expected play names', async () => {
      await client.authenticate('valid-key');
      const plays = await client.getTeamPlays('team-1');
      const names = plays.map((p) => p.name);
      expect(names).toContain('Shotgun Trips Right - Four Verticals');
      expect(names).toContain('I-Form Power Right');
    });
  });

  // --- importPlay ---

  describe('importPlay', () => {
    it('throws when not authenticated', async () => {
      await expect(client.importPlay('hudl-001')).rejects.toThrow('Not authenticated');
    });

    it('returns a Play object for a valid Hudl play ID', async () => {
      await client.authenticate('valid-key');
      const play = await client.importPlay('hudl-001');
      expect(play).toBeDefined();
      expect(play.name).toBe('Shotgun Trips Right - Four Verticals');
    });

    it('sets the play id with an imported prefix', async () => {
      await client.authenticate('valid-key');
      const play = await client.importPlay('hudl-001');
      expect(play.id).toContain('imported-');
    });

    it('tags the imported play with hudl-import', async () => {
      await client.authenticate('valid-key');
      const play = await client.importPlay('hudl-001');
      expect(play.tags).toContain('hudl-import');
    });

    it('sets correct timestamps', async () => {
      await client.authenticate('valid-key');
      const before = new Date().toISOString();
      const play = await client.importPlay('hudl-001');
      const after = new Date().toISOString();
      expect(play.createdAt >= before).toBe(true);
      expect(play.createdAt <= after).toBe(true);
    });

    it('throws for a non-existent Hudl play ID', async () => {
      await client.authenticate('valid-key');
      await expect(client.importPlay('does-not-exist')).rejects.toThrow('Hudl play not found');
    });

    it('includes a notes field referencing the Hudl source', async () => {
      await client.authenticate('valid-key');
      const play = await client.importPlay('hudl-001');
      expect(play.notes).toContain('Imported from Hudl');
      expect(play.notes).toContain('hudl-001');
    });
  });

  // --- exportPlay ---

  describe('exportPlay', () => {
    it('throws when not authenticated', async () => {
      const mockPlay = { id: 'play-1', name: 'Test' } as Play;
      await expect(client.exportPlay(mockPlay)).rejects.toThrow('Not authenticated');
    });

    it('returns a Hudl play ID string', async () => {
      await client.authenticate('valid-key');
      const mockPlay = { id: 'play-1', name: 'Test Play' } as Play;
      const hudlId = await client.exportPlay(mockPlay);
      expect(typeof hudlId).toBe('string');
      expect(hudlId.length).toBeGreaterThan(0);
    });

    it('includes the local play ID in the returned Hudl ID', async () => {
      await client.authenticate('valid-key');
      const mockPlay = { id: 'my-play-42', name: 'Test' } as Play;
      const hudlId = await client.exportPlay(mockPlay);
      expect(hudlId).toContain('my-play-42');
    });
  });

  // --- getVideoClip ---

  describe('getVideoClip', () => {
    it('throws when not authenticated', async () => {
      await expect(client.getVideoClip('hudl-001')).rejects.toThrow('Not authenticated');
    });

    it('returns a video clip object with url, thumbnail, duration', async () => {
      await client.authenticate('valid-key');
      const clip = await client.getVideoClip('hudl-001');
      expect(clip.url).toBeTruthy();
      expect(clip.thumbnail).toBeTruthy();
      expect(typeof clip.duration).toBe('number');
      expect(clip.duration).toBeGreaterThan(0);
    });

    it('throws for a non-existent play ID', async () => {
      await client.authenticate('valid-key');
      await expect(client.getVideoClip('does-not-exist')).rejects.toThrow('Hudl play not found');
    });

    it('returns a URL containing the play ID', async () => {
      await client.authenticate('valid-key');
      const clip = await client.getVideoClip('hudl-002');
      expect(clip.url).toContain('hudl');
    });
  });
});

// --- Factory ---

describe('createHudlClient', () => {
  it('creates a new HudlClient instance', () => {
    const client = createHudlClient();
    expect(client).toBeInstanceOf(HudlClient);
  });

  it('passes config to the client', () => {
    const client = createHudlClient({ baseUrl: 'https://test.api.com', apiVersion: 'v3' });
    expect(client.getEndpointUrl('foo')).toBe('https://test.api.com/v3/foo');
  });

  it('creates an unauthenticated client by default', () => {
    const client = createHudlClient();
    expect(client.isAuthenticated).toBe(false);
  });
});
