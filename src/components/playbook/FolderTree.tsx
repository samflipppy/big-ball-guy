'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Folder } from '@/types';

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  folderPlayCounts: Record<string, number>;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onDropPlay?: (playId: string, folderId: string | null) => void;
  className?: string;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  folderId: string;
}

function FolderIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

export default function FolderTree({
  folders,
  selectedFolderId,
  folderPlayCounts,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDropPlay,
  className,
}: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | undefined>(undefined);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    function handleClick() {
      setContextMenu(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Focus inputs when opened
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (isCreating && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreating]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, folderId: string) => {
      e.preventDefault();
      setContextMenu({ show: true, x: e.clientX, y: e.clientY, folderId });
    },
    [],
  );

  const startRename = useCallback(
    (id: string) => {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        setRenamingId(id);
        setRenameValue(folder.name);
      }
      setContextMenu(null);
    },
    [folders],
  );

  const handleRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRenameFolder(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, onRenameFolder]);

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderParentId);
    }
    setIsCreating(false);
    setNewFolderName('');
    setNewFolderParentId(undefined);
  }, [newFolderName, newFolderParentId, onCreateFolder]);

  const startCreateSubfolder = useCallback((parentId: string) => {
    setIsCreating(true);
    setNewFolderParentId(parentId);
    setContextMenu(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      onDeleteFolder(id);
      setContextMenu(null);
    },
    [onDeleteFolder],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, folderId: string | null) => {
      e.preventDefault();
      const playId = e.dataTransfer.getData('text/play-id');
      if (playId && onDropPlay) {
        onDropPlay(playId, folderId);
      }
    },
    [onDropPlay],
  );

  // Build tree structure
  const rootFolders = folders.filter((f) => !f.parentId);
  const childFoldersMap: Record<string, Folder[]> = {};
  folders.forEach((f) => {
    if (f.parentId) {
      if (!childFoldersMap[f.parentId]) childFoldersMap[f.parentId] = [];
      childFoldersMap[f.parentId].push(f);
    }
  });

  const renderFolder = (folder: Folder, depth: number) => {
    const isExpanded = expandedIds.has(folder.id);
    const children = childFoldersMap[folder.id] || [];
    const hasChildren = children.length > 0;
    const count = folderPlayCounts[folder.id] ?? 0;

    return (
      <div key={folder.id} data-testid={`folder-${folder.id}`}>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors',
            selectedFolderId === folder.id
              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onSelectFolder(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, folder.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, folder.id)}
          data-testid={`folder-item-${folder.id}`}
        >
          {/* Expand/collapse */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
              className="flex h-4 w-4 items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              data-testid={`folder-toggle-${folder.id}`}
            >
              <svg
                className={cn('h-3 w-3 text-zinc-400 transition-transform', isExpanded && 'rotate-90')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="w-4" />
          )}

          <FolderIcon expanded={isExpanded} />

          {renamingId === folder.id ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setRenamingId(null);
                  setRenameValue('');
                }
              }}
              className="flex-1 rounded border border-blue-400 px-1 py-0 text-xs outline-none"
              data-testid={`folder-rename-input-${folder.id}`}
            />
          ) : (
            <span className="flex-1 truncate text-xs font-medium">{folder.name}</span>
          )}

          <span className="text-[10px] text-zinc-400">{count}</span>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {children
              .sort((a, b) => a.order - b.order)
              .map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalPlayCount = folderPlayCounts['__all__'] ?? 0;

  return (
    <div ref={containerRef} className={cn('flex flex-col', className)} data-testid="folder-tree">
      {/* All Plays */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors',
          selectedFolderId === null
            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
        )}
        onClick={() => onSelectFolder(null)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
        data-testid="folder-all-plays"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="flex-1 text-xs font-medium">All Plays</span>
        <span className="text-[10px] text-zinc-400">{totalPlayCount}</span>
      </div>

      {/* Folder list */}
      <div className="mt-1 flex-1 overflow-y-auto">
        {rootFolders
          .sort((a, b) => a.order - b.order)
          .map((folder) => renderFolder(folder, 0))}

        {/* New folder input */}
        {isCreating && (
          <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ paddingLeft: newFolderParentId ? '24px' : '8px' }}>
            <FolderIcon expanded={false} />
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleCreateFolder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFolderName('');
                }
              }}
              placeholder="Folder name"
              className="flex-1 rounded border border-blue-400 px-1 py-0 text-xs outline-none"
              data-testid="new-folder-input"
            />
          </div>
        )}
      </div>

      {/* New folder button */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 px-2 py-2">
        <button
          onClick={() => {
            setIsCreating(true);
            setNewFolderParentId(undefined);
          }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
          data-testid="new-folder-btn"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Folder
        </button>
      </div>

      {/* Context menu */}
      {contextMenu?.show && (
        <div
          className="fixed z-50 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          data-testid="folder-context-menu"
        >
          <button
            onClick={() => startRename(contextMenu.folderId)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            data-testid="context-rename"
          >
            Rename
          </button>
          <button
            onClick={() => startCreateSubfolder(contextMenu.folderId)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            data-testid="context-new-subfolder"
          >
            New Subfolder
          </button>
          <hr className="my-1 border-zinc-100" />
          <button
            onClick={() => handleDelete(contextMenu.folderId)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            data-testid="context-delete"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
