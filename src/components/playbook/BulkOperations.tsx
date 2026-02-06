'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useBulkOperations, type BulkProgress } from '@/hooks/useBulkOperations';
import { useAppStore } from '@/stores/playStore';
import { cn } from '@/lib/utils';

export type BulkAction =
  | 'duplicate'
  | 'duplicate-across'
  | 'move'
  | 'add-tag'
  | 'remove-tag'
  | 'delete';

export interface BulkOperationsProps {
  selectedPlayIds: string[];
  onComplete: () => void;
  onCancel: () => void;
}

export function BulkOperations({
  selectedPlayIds,
  onComplete,
  onCancel,
}: BulkOperationsProps) {
  const { formations } = useAppStore();
  const bulk = useBulkOperations();

  // Dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showRemoveTagDialog, setShowRemoveTagDialog] = useState(false);
  const [showDuplicateAcrossDialog, setShowDuplicateAcrossDialog] = useState(false);

  // Form state
  const [targetFolderId, setTargetFolderId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [removeTagInput, setRemoveTagInput] = useState('');
  const [selectedFormationIds, setSelectedFormationIds] = useState<string[]>([]);

  const count = selectedPlayIds.length;

  const handleDuplicate = useCallback(async () => {
    const result = await bulk.duplicatePlays(selectedPlayIds);
    if (result.success) {
      onComplete();
    }
  }, [bulk, selectedPlayIds, onComplete]);

  const handleDelete = useCallback(async () => {
    const result = await bulk.deletePlays(selectedPlayIds);
    setShowDeleteConfirm(false);
    if (result.success) {
      onComplete();
    }
  }, [bulk, selectedPlayIds, onComplete]);

  const handleMove = useCallback(async () => {
    if (!targetFolderId) return;
    const result = await bulk.movePlaysToFolder(selectedPlayIds, targetFolderId);
    setShowMoveDialog(false);
    setTargetFolderId('');
    if (result.success) {
      onComplete();
    }
  }, [bulk, selectedPlayIds, targetFolderId, onComplete]);

  const handleAddTag = useCallback(async () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const result = await bulk.addTagToPlays(selectedPlayIds, tag);
    setShowTagDialog(false);
    setTagInput('');
    if (result.success) {
      onComplete();
    }
  }, [bulk, selectedPlayIds, tagInput, onComplete]);

  const handleRemoveTag = useCallback(async () => {
    const tag = removeTagInput.trim();
    if (!tag) return;
    const result = await bulk.removeTagFromPlays(selectedPlayIds, tag);
    setShowRemoveTagDialog(false);
    setRemoveTagInput('');
    if (result.success) {
      onComplete();
    }
  }, [bulk, selectedPlayIds, removeTagInput, onComplete]);

  const handleDuplicateAcross = useCallback(async () => {
    const targets = selectedFormationIds.length > 0 ? selectedFormationIds : undefined;
    const result = await bulk.duplicateAcrossFormations(selectedPlayIds, targets);
    setShowDuplicateAcrossDialog(false);
    setSelectedFormationIds([]);
    if (result.success) {
      onComplete();
    }
  }, [bulk, selectedPlayIds, selectedFormationIds, onComplete]);

  const toggleFormation = useCallback((formationId: string) => {
    setSelectedFormationIds((prev) =>
      prev.includes(formationId)
        ? prev.filter((id) => id !== formationId)
        : [...prev, formationId],
    );
  }, []);

  if (count === 0) return null;

  return (
    <>
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Bulk operations"
        className={cn(
          'flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 shadow-sm',
          'dark:border-zinc-700 dark:bg-zinc-900',
        )}
      >
        <span className="mr-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {count} play{count !== 1 ? 's' : ''} selected
        </span>

        <Button variant="secondary" size="sm" onClick={handleDuplicate} disabled={bulk.isProcessing}>
          Duplicate Selected
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDuplicateAcrossDialog(true)}
          disabled={bulk.isProcessing}
        >
          Duplicate Across Formations
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowMoveDialog(true)}
          disabled={bulk.isProcessing}
        >
          Move to Folder
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowTagDialog(true)}
          disabled={bulk.isProcessing}
        >
          Add Tag
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowRemoveTagDialog(true)}
          disabled={bulk.isProcessing}
        >
          Remove Tag
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={bulk.isProcessing}
        >
          Delete Selected
        </Button>

        <Button variant="ghost" size="sm" onClick={onCancel} disabled={bulk.isProcessing}>
          Cancel
        </Button>

        {/* Progress indicator */}
        {bulk.isProcessing && bulk.progress && (
          <ProgressBar progress={bulk.progress} />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Selected Plays"
        message={`Are you sure you want to delete ${count} play${count !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={bulk.isProcessing}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Move to Folder Dialog */}
      <Modal open={showMoveDialog} onClose={() => setShowMoveDialog(false)} size="sm">
        <ModalHeader>Move to Folder</ModalHeader>
        <ModalBody>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Folder ID
          </label>
          <input
            type="text"
            value={targetFolderId}
            onChange={(e) => setTargetFolderId(e.target.value)}
            placeholder="Enter folder ID"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowMoveDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!targetFolderId.trim()} loading={bulk.isProcessing}>
            Move {count} Play{count !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Tag Dialog */}
      <Modal open={showTagDialog} onClose={() => setShowTagDialog(false)} size="sm">
        <ModalHeader>Add Tag</ModalHeader>
        <ModalBody>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tag name
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter tag name"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowTagDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddTag} disabled={!tagInput.trim()} loading={bulk.isProcessing}>
            Add Tag
          </Button>
        </ModalFooter>
      </Modal>

      {/* Remove Tag Dialog */}
      <Modal open={showRemoveTagDialog} onClose={() => setShowRemoveTagDialog(false)} size="sm">
        <ModalHeader>Remove Tag</ModalHeader>
        <ModalBody>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tag name
          </label>
          <input
            type="text"
            value={removeTagInput}
            onChange={(e) => setRemoveTagInput(e.target.value)}
            placeholder="Enter tag to remove"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowRemoveTagDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleRemoveTag} disabled={!removeTagInput.trim()} loading={bulk.isProcessing}>
            Remove Tag
          </Button>
        </ModalFooter>
      </Modal>

      {/* Duplicate Across Formations Dialog */}
      <Modal
        open={showDuplicateAcrossDialog}
        onClose={() => setShowDuplicateAcrossDialog(false)}
        size="md"
      >
        <ModalHeader>Duplicate Across Formations</ModalHeader>
        <ModalBody>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            Select target formations. Leave all unchecked to duplicate into every formation.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-1" role="listbox" aria-label="Formations">
            {formations.map((formation) => (
              <label
                key={formation.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFormationIds.includes(formation.id)}
                  onChange={() => toggleFormation(formation.id)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  {formation.name}
                </span>
              </label>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDuplicateAcrossDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleDuplicateAcross} loading={bulk.isProcessing}>
            Duplicate to {selectedFormationIds.length || 'All'} Formation{selectedFormationIds.length !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function ProgressBar({ progress }: { progress: BulkProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="ml-auto flex items-center gap-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-2 w-32 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{progress.message}</span>
    </div>
  );
}

export default BulkOperations;
