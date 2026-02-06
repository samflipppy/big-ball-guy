import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Play } from '@/types';

// We mock idb at the setup.ts level. We also need to reset module state
// between tests so the versioning module gets a fresh DB promise.
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `ver-id-${++counter}`,
  };
});

function makeSamplePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Slant Route',
    formationId: 'formation-1',
    assignments: [],
    tags: ['pass'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('versioning', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  describe('createVersion', () => {
    it('should create a version snapshot of a play', async () => {
      const { createVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play = makeSamplePlay();
      const version = await createVersion(play);

      expect(version).toBeDefined();
      expect(version.id).toBeDefined();
      expect(version.playId).toBe('play-1');
      expect(version.snapshot.name).toBe('Slant Route');
      expect(version.createdAt).toBeDefined();
    });

    it('should create a deep copy of the play', async () => {
      const { createVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play = makeSamplePlay();
      const version = await createVersion(play);

      // Mutating the original play should not affect the snapshot
      play.name = 'Modified';
      expect(version.snapshot.name).toBe('Slant Route');
    });

    it('should auto-generate a label based on play content', async () => {
      const { createVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play = makeSamplePlay({
        assignments: [
          {
            playerId: 'wr-1',
            route: {
              id: 'r-1',
              name: 'Slant',
              type: 'slant',
              points: [{ x: 0, y: 0, type: 'line' }],
            },
          },
        ],
      });

      const version = await createVersion(play);
      expect(version.label).toContain('1 route');
    });

    it('should use custom label when provided', async () => {
      const { createVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play = makeSamplePlay();
      const version = await createVersion(play, 'Manual save');

      expect(version.label).toBe('Manual save');
    });
  });

  describe('getVersions', () => {
    it('should return all versions for a play sorted newest first', async () => {
      const { createVersion, getVersions, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      // Use a unique play ID to avoid cross-test contamination from shared mock store
      const play = makeSamplePlay({ id: 'play-getversions-sort' });

      // Create multiple versions with slight time differences
      const v1 = await createVersion(play, 'Version 1');
      const play2 = { ...play, name: 'Modified' };
      const v2 = await createVersion(play2, 'Version 2');

      const versions = await getVersions('play-getversions-sort');

      expect(versions).toHaveLength(2);
      // Newest first
      expect(versions[0].label).toBe('Version 2');
      expect(versions[1].label).toBe('Version 1');
    });

    it('should return empty array if no versions exist', async () => {
      const { getVersions, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const versions = await getVersions('play-nonexistent-unique');
      expect(versions).toEqual([]);
    });
  });

  describe('restoreVersion', () => {
    it('should restore a play to a previous version', async () => {
      const { createVersion, getVersions, restoreVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const original = makeSamplePlay({ name: 'Original' });
      const v1 = await createVersion(original, 'V1');

      const modified = { ...original, name: 'Modified' };
      await createVersion(modified, 'V2');

      const restored = await restoreVersion('play-1', v1.id);

      expect(restored.name).toBe('Original');
      expect(restored.id).toBe('play-1');
    });

    it('should create a new version when restoring', async () => {
      const { createVersion, getVersions, restoreVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      // Use a unique play ID to avoid cross-test contamination
      const play = makeSamplePlay({ id: 'play-restore-newver' });
      const v1 = await createVersion(play, 'V1');
      await createVersion({ ...play, name: 'V2 state' }, 'V2');

      await restoreVersion('play-restore-newver', v1.id);

      const versions = await getVersions('play-restore-newver');
      // Should now have 3 versions: v1, v2, and the restore
      expect(versions).toHaveLength(3);
      expect(versions[0].label).toContain('Restored');
    });

    it('should throw error when version not found', async () => {
      const { restoreVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      await expect(
        restoreVersion('play-1', 'nonexistent'),
      ).rejects.toThrow('Version nonexistent not found');
    });

    it('should throw error when version belongs to different play', async () => {
      const { createVersion, restoreVersion, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play = makeSamplePlay({ id: 'play-A' });
      const v = await createVersion(play);

      await expect(
        restoreVersion('play-B', v.id),
      ).rejects.toThrow(/does not belong to play/);
    });
  });

  describe('diffVersions', () => {
    it('should detect added routes', async () => {
      const { createVersion, diffVersions, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play1 = makeSamplePlay({ assignments: [] });
      const v1 = await createVersion(play1, 'No routes');

      const play2 = makeSamplePlay({
        assignments: [
          {
            playerId: 'wr-1',
            route: { id: 'r-1', name: 'Slant', type: 'slant', points: [] },
          },
        ],
      });
      const v2 = await createVersion(play2, 'With route');

      const diff = diffVersions(v1, v2);

      expect(diff.addedRoutes).toHaveLength(1);
      expect(diff.addedRoutes[0].playerId).toBe('wr-1');
      expect(diff.addedRoutes[0].route.type).toBe('slant');
      expect(diff.removedRoutes).toHaveLength(0);
    });

    it('should detect removed routes', async () => {
      const { createVersion, diffVersions, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play1 = makeSamplePlay({
        assignments: [
          {
            playerId: 'wr-1',
            route: { id: 'r-1', name: 'Slant', type: 'slant', points: [] },
          },
        ],
      });
      const v1 = await createVersion(play1, 'With route');

      const play2 = makeSamplePlay({ assignments: [] });
      const v2 = await createVersion(play2, 'No routes');

      const diff = diffVersions(v1, v2);

      expect(diff.removedRoutes).toHaveLength(1);
      expect(diff.removedRoutes[0].playerId).toBe('wr-1');
      expect(diff.addedRoutes).toHaveLength(0);
    });

    it('should detect changed blocking', async () => {
      const { createVersion, diffVersions, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play1 = makeSamplePlay({
        assignments: [
          {
            playerId: 'lt-1',
            blocking: { id: 'b-1', blockerId: 'lt-1', blockType: 'drive' },
          },
        ],
      });
      const v1 = await createVersion(play1, 'Drive block');

      const play2 = makeSamplePlay({
        assignments: [
          {
            playerId: 'lt-1',
            blocking: { id: 'b-1', blockerId: 'lt-1', blockType: 'pass-pro' },
          },
        ],
      });
      const v2 = await createVersion(play2, 'Pass pro');

      const diff = diffVersions(v1, v2);

      expect(diff.changedBlocking).toHaveLength(1);
      expect(diff.changedBlocking[0].from?.blockType).toBe('drive');
      expect(diff.changedBlocking[0].to?.blockType).toBe('pass-pro');
    });

    it('should detect metadata changes', async () => {
      const { createVersion, diffVersions, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play1 = makeSamplePlay({ name: 'Old Name', tags: ['pass'] });
      const v1 = await createVersion(play1, 'V1');

      const play2 = makeSamplePlay({ name: 'New Name', tags: ['pass', 'red-zone'] });
      const v2 = await createVersion(play2, 'V2');

      const diff = diffVersions(v1, v2);

      expect(diff.metadataChanges.length).toBeGreaterThanOrEqual(1);
      const nameChange = diff.metadataChanges.find((m) => m.field === 'name');
      expect(nameChange).toBeDefined();
      expect(nameChange!.from).toBe('Old Name');
      expect(nameChange!.to).toBe('New Name');

      const tagsChange = diff.metadataChanges.find((m) => m.field === 'tags');
      expect(tagsChange).toBeDefined();
    });

    it('should return empty diff for identical versions', async () => {
      const { createVersion, diffVersions, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();

      const play = makeSamplePlay();
      const v1 = await createVersion(play, 'V1');
      const v2 = await createVersion(play, 'V2');

      const diff = diffVersions(v1, v2);

      expect(diff.addedRoutes).toHaveLength(0);
      expect(diff.removedRoutes).toHaveLength(0);
      expect(diff.movedPlayers).toHaveLength(0);
      expect(diff.changedBlocking).toHaveLength(0);
      expect(diff.metadataChanges).toHaveLength(0);
    });
  });

  describe('autoVersion', () => {
    it('should create a version on first call', async () => {
      const { autoVersion, resetAutoVersionThrottle, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();
      resetAutoVersionThrottle();

      const play = makeSamplePlay();
      const version = await autoVersion(play);

      expect(version).not.toBeNull();
      expect(version!.playId).toBe('play-1');
    });

    it('should throttle subsequent calls within 30 seconds', async () => {
      const { autoVersion, resetAutoVersionThrottle, resetVersionsDB } = await import('@/lib/versioning');
      await resetVersionsDB();
      resetAutoVersionThrottle();

      const play = makeSamplePlay();
      const v1 = await autoVersion(play);
      expect(v1).not.toBeNull();

      // Second call should be throttled
      const v2 = await autoVersion(play);
      expect(v2).toBeNull();
    });
  });
});
