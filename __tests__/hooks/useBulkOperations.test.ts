import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { useAppStore } from '@/stores/playStore';
import type { Play, Formation } from '@/types';

// Mock IndexedDB layer
const mockPut = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockGetAll = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/db/indexeddb', () => ({
  plays: {
    get: vi.fn(),
    getAll: (...args: unknown[]) => mockGetAll(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  formations: {
    get: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `gen-id-${++counter}`,
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

function makeSampleFormation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: 'formation-1',
    name: 'Shotgun',
    side: 'offense',
    players: [],
    personnel: '11',
    tags: [],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useBulkOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      plays: [
        makeSamplePlay({ id: 'play-1', name: 'Slant', formationId: 'f-1', tags: ['pass', 'quick'] }),
        makeSamplePlay({ id: 'play-2', name: 'Curl', formationId: 'f-1', tags: ['pass'] }),
        makeSamplePlay({ id: 'play-3', name: 'Power', formationId: 'f-2', tags: ['run'] }),
      ],
      formations: [
        makeSampleFormation({ id: 'f-1', name: 'Shotgun' }),
        makeSampleFormation({ id: 'f-2', name: 'I-Form' }),
        makeSampleFormation({ id: 'f-3', name: 'Pistol' }),
      ],
    });
  });

  describe('duplicatePlays', () => {
    it('should duplicate plays with new IDs', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.duplicatePlays>>;
      await act(async () => {
        opResult = await result.current.duplicatePlays(['play-1']);
      });

      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(1);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Slant (Copy)',
          formationId: 'f-1',
        }),
      );
    });

    it('should duplicate plays into target formations', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.duplicatePlays>>;
      await act(async () => {
        opResult = await result.current.duplicatePlays(['play-1'], ['f-2', 'f-3']);
      });

      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(2);
      expect(mockPut).toHaveBeenCalledTimes(2);
      // First call for f-2
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Slant (I-Form)',
          formationId: 'f-2',
        }),
      );
      // Second call for f-3
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Slant (Pistol)',
          formationId: 'f-3',
        }),
      );
    });

    it('should return error when no plays found', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.duplicatePlays>>;
      await act(async () => {
        opResult = await result.current.duplicatePlays(['nonexistent']);
      });

      expect(opResult!.success).toBe(false);
      expect(opResult!.error).toBe('No plays found');
    });
  });

  describe('duplicateAcrossFormations', () => {
    it('should duplicate play into all other formations', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.duplicateAcrossFormations>>;
      await act(async () => {
        opResult = await result.current.duplicateAcrossFormations(['play-1']);
      });

      // play-1 is in f-1, so it should duplicate into f-2 and f-3
      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(2);
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({ formationId: 'f-2' }),
      );
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({ formationId: 'f-3' }),
      );
    });

    it('should duplicate into only selected formations', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.duplicateAcrossFormations>>;
      await act(async () => {
        opResult = await result.current.duplicateAcrossFormations(['play-1'], ['f-1', 'f-3']);
      });

      // play-1 is already in f-1, so it should only duplicate into f-3
      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(1);
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({ formationId: 'f-3' }),
      );
    });
  });

  describe('movePlaysToFolder', () => {
    it('should move plays to specified folder', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.movePlaysToFolder>>;
      await act(async () => {
        opResult = await result.current.movePlaysToFolder(['play-1', 'play-2'], 'folder-a');
      });

      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(2);
      expect(mockPut).toHaveBeenCalledTimes(2);
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'play-1', folderId: 'folder-a' }),
      );
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'play-2', folderId: 'folder-a' }),
      );
    });
  });

  describe('addTagToPlays', () => {
    it('should add a tag to plays', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.addTagToPlays>>;
      await act(async () => {
        opResult = await result.current.addTagToPlays(['play-1', 'play-3'], 'red-zone');
      });

      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(2);
      // play-1 should have the tag added
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'play-1',
          tags: expect.arrayContaining(['red-zone']),
        }),
      );
    });

    it('should skip plays that already have the tag', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.addTagToPlays>>;
      await act(async () => {
        opResult = await result.current.addTagToPlays(['play-1'], 'pass');
      });

      // play-1 already has 'pass' tag, so put should not be called
      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(1);
      expect(mockPut).not.toHaveBeenCalled();
    });
  });

  describe('removeTagFromPlays', () => {
    it('should remove a tag from plays', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.removeTagFromPlays>>;
      await act(async () => {
        opResult = await result.current.removeTagFromPlays(['play-1'], 'quick');
      });

      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(1);
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'play-1',
          tags: ['pass'], // 'quick' removed
        }),
      );
    });

    it('should skip plays that do not have the tag', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.removeTagFromPlays>>;
      await act(async () => {
        opResult = await result.current.removeTagFromPlays(['play-3'], 'pass');
      });

      // play-3 does not have 'pass' tag
      expect(opResult!.success).toBe(true);
      expect(mockPut).not.toHaveBeenCalled();
    });
  });

  describe('deletePlays', () => {
    it('should delete plays', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.deletePlays>>;
      await act(async () => {
        opResult = await result.current.deletePlays(['play-1', 'play-2']);
      });

      expect(opResult!.success).toBe(true);
      expect(opResult!.processedCount).toBe(2);
      expect(mockDelete).toHaveBeenCalledWith('play-1');
      expect(mockDelete).toHaveBeenCalledWith('play-2');
    });

    it('should update progress during operation', async () => {
      const { result } = renderHook(() => useBulkOperations());

      await act(async () => {
        await result.current.deletePlays(['play-1']);
      });

      // After completion, isProcessing should be false
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('execute', () => {
    it('should reset state before executing', async () => {
      const { result } = renderHook(() => useBulkOperations());

      let opResult: Awaited<ReturnType<typeof result.current.deletePlays>>;
      await act(async () => {
        opResult = await result.current.execute(() =>
          result.current.deletePlays(['play-1']),
        );
      });

      expect(opResult!.success).toBe(true);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
