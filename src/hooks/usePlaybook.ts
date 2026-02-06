'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/playStore';
import {
  plays as playsDb,
  formations as formationsDb,
  folders as foldersDb,
} from '@/lib/db/indexeddb';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';
import { generateId } from '@/lib/utils';
import type { Play, Formation, Folder } from '@/types';

export type SortField = 'name' | 'createdAt' | 'updatedAt' | 'formation';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface PlaybookFilters {
  searchQuery: string;
  formationId: string | null;
  tags: string[];
  personnel: string | null;
  folderId: string | null;
}

export interface PlaybookSort {
  field: SortField;
  direction: SortDirection;
}

const DEFAULT_FILTERS: PlaybookFilters = {
  searchQuery: '',
  formationId: null,
  tags: [],
  personnel: null,
  folderId: null,
};

const DEFAULT_SORT: PlaybookSort = {
  field: 'updatedAt',
  direction: 'desc',
};

export function usePlaybook() {
  const {
    plays,
    formations,
    currentTeamId,
    setPlays,
    addPlay,
    updatePlay,
    removePlay,
    setFormations,
    addFormation,
  } = useAppStore();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [filters, setFilters] = useState<PlaybookFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<PlaybookSort>(DEFAULT_SORT);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPlayIds, setSelectedPlayIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const teamId = currentTeamId ?? undefined;
        const [dbPlays, dbFormations, dbFolders] = await Promise.all([
          playsDb.getAll(teamId),
          formationsDb.getAll(teamId),
          foldersDb.getAll(teamId),
        ]);

        setPlays(dbPlays);
        // Merge built-in formations with custom ones
        const customFormations = dbFormations.filter((f) => f.isCustom);
        const allFormations = [...BUILT_IN_FORMATIONS, ...customFormations];
        setFormations(allFormations);
        setFolders(dbFolders);
      } catch {
        // silently handle — data loads from cache next time
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentTeamId, setPlays, setFormations]);

  // Get all unique tags across plays
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    plays.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [plays]);

  // Filtered and sorted plays
  const filteredPlays = useMemo(() => {
    let result = [...plays];

    // Search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q)),
      );
    }

    // Formation filter
    if (filters.formationId) {
      result = result.filter((p) => p.formationId === filters.formationId);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags.every((tag) => p.tags.includes(tag)),
      );
    }

    // Personnel filter
    if (filters.personnel) {
      result = result.filter((p) => p.personnel === filters.personnel);
    }

    // Folder filter
    if (filters.folderId) {
      result = result.filter((p) => p.folderId === filters.folderId);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'formation':
          cmp = a.formationId.localeCompare(b.formationId);
          break;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [plays, filters, sort]);

  // CRUD: Create play
  const createPlay = useCallback(
    async (data: Omit<Play, 'id' | 'createdAt' | 'updatedAt'>): Promise<Play> => {
      const now = new Date().toISOString();
      const play: Play = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      await playsDb.put(play);
      addPlay(play);
      return play;
    },
    [addPlay],
  );

  // CRUD: Update play
  const savePlay = useCallback(
    async (play: Play): Promise<void> => {
      const updated = { ...play, updatedAt: new Date().toISOString() };
      await playsDb.put(updated);
      updatePlay(updated);
    },
    [updatePlay],
  );

  // CRUD: Delete play
  const deletePlay = useCallback(
    async (id: string): Promise<void> => {
      await playsDb.delete(id);
      removePlay(id);
      setSelectedPlayIds((prev) => prev.filter((pid) => pid !== id));
    },
    [removePlay],
  );

  // CRUD: Duplicate play
  const duplicatePlay = useCallback(
    async (id: string): Promise<Play | undefined> => {
      const original = plays.find((p) => p.id === id);
      if (!original) return undefined;
      const now = new Date().toISOString();
      const copy: Play = {
        ...original,
        id: generateId(),
        name: `${original.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };
      await playsDb.put(copy);
      addPlay(copy);
      return copy;
    },
    [plays, addPlay],
  );

  // Bulk operations
  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      await Promise.all(ids.map((id) => playsDb.delete(id)));
      ids.forEach((id) => removePlay(id));
      setSelectedPlayIds([]);
    },
    [removePlay],
  );

  const bulkTag = useCallback(
    async (ids: string[], tag: string): Promise<void> => {
      const updatedPlays = plays
        .filter((p) => ids.includes(p.id))
        .map((p) => ({
          ...p,
          tags: p.tags.includes(tag) ? p.tags : [...p.tags, tag],
          updatedAt: new Date().toISOString(),
        }));
      await Promise.all(updatedPlays.map((p) => playsDb.put(p)));
      updatedPlays.forEach((p) => updatePlay(p));
    },
    [plays, updatePlay],
  );

  const bulkMove = useCallback(
    async (ids: string[], folderId: string | undefined): Promise<void> => {
      const updatedPlays = plays
        .filter((p) => ids.includes(p.id))
        .map((p) => ({
          ...p,
          folderId,
          updatedAt: new Date().toISOString(),
        }));
      await Promise.all(updatedPlays.map((p) => playsDb.put(p)));
      updatedPlays.forEach((p) => updatePlay(p));
    },
    [plays, updatePlay],
  );

  // Formation CRUD
  const createFormation = useCallback(
    async (data: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Formation> => {
      const now = new Date().toISOString();
      const formation: Formation = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      await formationsDb.put(formation);
      addFormation(formation);
      return formation;
    },
    [addFormation],
  );

  // Folder CRUD
  const createFolder = useCallback(
    async (name: string, parentId?: string): Promise<Folder> => {
      const folder: Folder = {
        id: generateId(),
        name,
        parentId,
        order: folders.length,
        teamId: currentTeamId ?? '',
        createdAt: new Date().toISOString(),
      };
      await foldersDb.put(folder);
      setFolders((prev) => [...prev, folder]);
      return folder;
    },
    [folders.length, currentTeamId],
  );

  const deleteFolder = useCallback(
    async (id: string): Promise<void> => {
      await foldersDb.delete(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      // Move plays in this folder to unorganized
      const playsInFolder = plays.filter((p) => p.folderId === id);
      await Promise.all(
        playsInFolder.map((p) => {
          const updated = { ...p, folderId: undefined, updatedAt: new Date().toISOString() };
          updatePlay(updated);
          return playsDb.put(updated);
        }),
      );
    },
    [plays, updatePlay],
  );

  const renameFolder = useCallback(
    async (id: string, name: string): Promise<void> => {
      const folder = folders.find((f) => f.id === id);
      if (!folder) return;
      const updated = { ...folder, name };
      await foldersDb.put(updated);
      setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
    },
    [folders],
  );

  // Selection
  const toggleSelectPlay = useCallback((id: string) => {
    setSelectedPlayIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPlayIds([]);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPlayIds(filteredPlays.map((p) => p.id));
  }, [filteredPlays]);

  // Get formation by ID (supports built-in + custom)
  const getFormation = useCallback(
    (id: string): Formation | undefined => {
      return formations.find((f) => f.id === id);
    },
    [formations],
  );

  // Folder play counts
  const folderPlayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    plays.forEach((p) => {
      const key = p.folderId ?? '__all__';
      counts[key] = (counts[key] || 0) + 1;
    });
    counts['__all__'] = plays.length;
    return counts;
  }, [plays]);

  return {
    // Data
    plays: filteredPlays,
    allPlays: plays,
    formations,
    folders,
    allTags,
    isLoading,

    // Filters & Sort
    filters,
    setFilters,
    sort,
    setSort,
    viewMode,
    setViewMode,

    // Selection
    selectedPlayIds,
    toggleSelectPlay,
    clearSelection,
    selectAll,

    // Play CRUD
    createPlay,
    savePlay,
    deletePlay,
    duplicatePlay,

    // Bulk
    bulkDelete,
    bulkTag,
    bulkMove,

    // Formation CRUD
    createFormation,
    getFormation,

    // Folder CRUD
    createFolder,
    deleteFolder,
    renameFolder,
    folderPlayCounts,
  };
}
