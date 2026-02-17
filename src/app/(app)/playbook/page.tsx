'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePlaybook } from '@/hooks/usePlaybook';
import { PERSONNEL_GROUPS } from '@/lib/constants';
import FolderTree from '@/components/playbook/FolderTree';
import PlayGrid from '@/components/playbook/PlayGrid';
import PlayCreationModal from '@/components/playbook/PlayCreationModal';
import TagInput from '@/components/playbook/TagInput';
import type { Player } from '@/types';

export default function PlaybookPage() {
  const router = useRouter();
  const {
    plays,
    formations,
    folders,
    allTags,
    isLoading,
    filters,
    setFilters,
    sort,
    setSort,
    viewMode,
    setViewMode,
    selectedPlayIds,
    toggleSelectPlay,
    clearSelection,
    selectAll,
    createPlay,
    deletePlay,
    duplicatePlay,
    bulkDelete,
    bulkTag,
    bulkMove,
    createFormation,
    createFolder,
    deleteFolder,
    renameFolder,
    folderPlayCounts,
  } = usePlaybook();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkTagInput, setShowBulkTagInput] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState<string[]>([]);

  const handleClickPlay = useCallback(
    (id: string) => {
      router.push(`/playbook/${id}`);
    },
    [router],
  );

  const handleEditPlay = useCallback(
    (id: string) => {
      router.push(`/playbook/${id}`);
    },
    [router],
  );

  const handleDeletePlay = useCallback(
    async (id: string) => {
      await deletePlay(id);
    },
    [deletePlay],
  );

  const handleDuplicatePlay = useCallback(
    async (id: string) => {
      await duplicatePlay(id);
    },
    [duplicatePlay],
  );

  const handleCreatePlay = useCallback(
    async (data: {
      name: string;
      formationId: string;
      personnel: string;
      tags: string[];
      notes?: string;
    }) => {
      const play = await createPlay({
        ...data,
        assignments: [],
        teamId: '',
      });
      setShowCreateModal(false);
      router.push(`/playbook/${play.id}`);
    },
    [createPlay, router],
  );

  const handleQuickCreate = useCallback(
    async (formationId: string) => {
      const formation = formations.find((f) => f.id === formationId);
      const play = await createPlay({
        name: `New Play ${Date.now().toString(36)}`,
        formationId,
        personnel: formation?.personnel ?? '11',
        tags: [],
        assignments: [],
        teamId: '',
      });
      setShowCreateModal(false);
      router.push(`/playbook/${play.id}`);
    },
    [createPlay, formations, router],
  );

  const handleCreateFormation = useCallback(
    async (data: { name: string; personnel: string; players: Player[] }) => {
      await createFormation({
        ...data,
        side: 'offense',
        tags: [],
        isCustom: true,
        teamId: '',
      });
    },
    [createFormation],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedPlayIds.length === 0) return;
    await bulkDelete(selectedPlayIds);
  }, [selectedPlayIds, bulkDelete]);

  const handleBulkTag = useCallback(async () => {
    if (selectedPlayIds.length === 0 || bulkTagValue.length === 0) return;
    for (const tag of bulkTagValue) {
      await bulkTag(selectedPlayIds, tag);
    }
    setBulkTagValue([]);
    setShowBulkTagInput(false);
    clearSelection();
  }, [selectedPlayIds, bulkTagValue, bulkTag, clearSelection]);

  const handleBulkMove = useCallback(
    async (folderId: string | undefined) => {
      if (selectedPlayIds.length === 0) return;
      await bulkMove(selectedPlayIds, folderId);
      clearSelection();
    },
    [selectedPlayIds, bulkMove, clearSelection],
  );

  const handleDropPlay = useCallback(
    (playId: string, folderId: string | null) => {
      bulkMove([playId], folderId ?? undefined);
    },
    [bulkMove],
  );

  const handleSelectFolder = useCallback(
    (folderId: string | null) => {
      setFilters((prev) => ({ ...prev, folderId }));
    },
    [setFilters],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" data-testid="playbook-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading playbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-900" data-testid="playbook-page">
      {/* Top toolbar */}
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Playbook</h1>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search plays..."
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-300 py-1.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            data-testid="search-input"
          />
        </div>

        {/* Filter by personnel */}
        <select
          value={filters.personnel ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              personnel: e.target.value || null,
            }))
          }
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          data-testid="personnel-filter"
          aria-label="Filter by personnel"
        >
          <option value="">All Personnel</option>
          {PERSONNEL_GROUPS.map((g) => (
            <option key={g.code} value={g.code}>
              {g.code}
            </option>
          ))}
        </select>

        {/* Filter by formation */}
        <select
          value={filters.formationId ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              formationId: e.target.value || null,
            }))
          }
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          data-testid="formation-filter"
          aria-label="Filter by formation"
        >
          <option value="">All Formations</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk actions bar */}
      {selectedPlayIds.length > 0 && (
        <div className="flex items-center gap-3 border-b border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-2" data-testid="bulk-actions">
          <span className="text-sm font-medium text-blue-700">
            {selectedPlayIds.length} selected
          </span>
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 hover:underline"
            data-testid="select-all-btn"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="text-xs text-blue-600 hover:underline"
            data-testid="clear-selection-btn"
          >
            Clear
          </button>

          <div className="ml-auto flex items-center gap-2">
            {showBulkTagInput ? (
              <div className="flex items-center gap-2">
                <TagInput
                  tags={bulkTagValue}
                  onChange={setBulkTagValue}
                  suggestions={allTags}
                  placeholder="Tag..."
                  className="w-48"
                />
                <button
                  onClick={handleBulkTag}
                  className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  data-testid="apply-bulk-tag"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowBulkTagInput(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowBulkTagInput(true)}
                className="rounded bg-white dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                data-testid="bulk-tag-btn"
              >
                Tag
              </button>
            )}

            {/* Move dropdown */}
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') return;
                handleBulkMove(val === '__none__' ? undefined : val);
                e.target.value = '';
              }}
              className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-zinc-300 px-3 py-1 text-xs"
              data-testid="bulk-move-select"
              defaultValue=""
              aria-label="Move to folder"
            >
              <option value="" disabled>
                Move to...
              </option>
              <option value="__none__">No Folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleBulkDelete}
              className="rounded bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
              data-testid="bulk-delete-btn"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Folder Tree */}
        <aside className="w-60 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 overflow-y-auto">
          <FolderTree
            folders={folders}
            selectedFolderId={filters.folderId}
            folderPlayCounts={folderPlayCounts}
            onSelectFolder={handleSelectFolder}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onDropPlay={handleDropPlay}
            className="h-full"
          />
        </aside>

        {/* Play Grid */}
        <main className="flex-1 overflow-hidden">
          <PlayGrid
            plays={plays}
            formations={formations}
            viewMode={viewMode}
            selectedPlayIds={selectedPlayIds}
            sortField={sort.field}
            sortDirection={sort.direction}
            onViewModeChange={setViewMode}
            onSortChange={(field, direction) => setSort({ field, direction })}
            onSelectPlay={toggleSelectPlay}
            onClickPlay={handleClickPlay}
            onEditPlay={handleEditPlay}
            onDuplicatePlay={handleDuplicatePlay}
            onDeletePlay={handleDeletePlay}
            className="h-full"
          />
        </main>
      </div>

      {/* FAB — New Play */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        title="New Play"
        data-testid="new-play-fab"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Create Play Modal */}
      {showCreateModal && (
        <PlayCreationModal
          formations={formations}
          allTags={allTags}
          onCreatePlay={handleCreatePlay}
          onCreateFormation={handleCreateFormation}
          onQuickCreate={handleQuickCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
