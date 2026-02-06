'use client';

import { useCallback, useState } from 'react';
import { useAppStore } from '@/stores/playStore';
import { plays as playsDb, formations as formationsDb } from '@/lib/db/indexeddb';
import { generateId } from '@/lib/utils';
import type { Play, FormationId } from '@/types';

export interface BulkProgress {
  current: number;
  total: number;
  message: string;
}

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  error?: string;
}

export function useBulkOperations() {
  const {
    plays,
    formations,
    addPlay,
    updatePlay,
    removePlay,
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
  }, []);

  /**
   * Duplicate plays with new IDs, optionally into specific target formations.
   * If targetFormationIds is provided, each play is duplicated into each target formation.
   * Otherwise, each play is duplicated in its current formation.
   */
  const duplicatePlays = useCallback(
    async (
      playIds: string[],
      targetFormationIds?: FormationId[],
    ): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const sourcePlays = plays.filter((p) => playIds.includes(p.id));
        if (sourcePlays.length === 0) {
          setIsProcessing(false);
          return { success: false, processedCount: 0, error: 'No plays found' };
        }

        const targets = targetFormationIds ?? [undefined];
        const totalOps = sourcePlays.length * targets.length;
        let processed = 0;

        for (const play of sourcePlays) {
          for (const formationId of targets) {
            const now = new Date().toISOString();
            const newPlay: Play = {
              ...play,
              id: generateId(),
              name: formationId
                ? `${play.name} (${formations.find((f) => f.id === formationId)?.name ?? formationId})`
                : `${play.name} (Copy)`,
              formationId: formationId ?? play.formationId,
              createdAt: now,
              updatedAt: now,
            };

            await playsDb.put(newPlay);
            addPlay(newPlay);
            processed++;
            setProgress({
              current: processed,
              total: totalOps,
              message: `Duplicating play ${processed} of ${totalOps}`,
            });
          }
        }

        setIsProcessing(false);
        return { success: true, processedCount: processed };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Duplicate failed';
        setError(msg);
        setIsProcessing(false);
        return { success: false, processedCount: 0, error: msg };
      }
    },
    [plays, formations, addPlay],
  );

  /**
   * Duplicate selected plays across all other formations (or selected formations).
   * For each selected play, creates a copy in every formation that the play is not already in.
   */
  const duplicateAcrossFormations = useCallback(
    async (
      playIds: string[],
      targetFormationIds?: FormationId[],
    ): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const sourcePlays = plays.filter((p) => playIds.includes(p.id));
        if (sourcePlays.length === 0) {
          setIsProcessing(false);
          return { success: false, processedCount: 0, error: 'No plays found' };
        }

        const allFormationIds =
          targetFormationIds ?? formations.map((f) => f.id);

        // Calculate total operations first
        let totalOps = 0;
        for (const play of sourcePlays) {
          const otherFormations = allFormationIds.filter(
            (fId) => fId !== play.formationId,
          );
          totalOps += otherFormations.length;
        }

        let processed = 0;

        for (const play of sourcePlays) {
          const otherFormations = allFormationIds.filter(
            (fId) => fId !== play.formationId,
          );

          for (const formationId of otherFormations) {
            const now = new Date().toISOString();
            const formationName =
              formations.find((f) => f.id === formationId)?.name ?? formationId;
            const newPlay: Play = {
              ...play,
              id: generateId(),
              name: `${play.name} (${formationName})`,
              formationId,
              createdAt: now,
              updatedAt: now,
            };

            await playsDb.put(newPlay);
            addPlay(newPlay);
            processed++;
            setProgress({
              current: processed,
              total: totalOps,
              message: `Duplicating across formations: ${processed} of ${totalOps}`,
            });
          }
        }

        setIsProcessing(false);
        return { success: true, processedCount: processed };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Duplicate across formations failed';
        setError(msg);
        setIsProcessing(false);
        return { success: false, processedCount: 0, error: msg };
      }
    },
    [plays, formations, addPlay],
  );

  /**
   * Move plays to a folder.
   */
  const movePlaysToFolder = useCallback(
    async (
      playIds: string[],
      folderId: string,
    ): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const targetPlays = plays.filter((p) => playIds.includes(p.id));
        const total = targetPlays.length;
        let processed = 0;

        for (const play of targetPlays) {
          const updated: Play = {
            ...play,
            folderId,
            updatedAt: new Date().toISOString(),
          };
          await playsDb.put(updated);
          updatePlay(updated);
          processed++;
          setProgress({
            current: processed,
            total,
            message: `Moving play ${processed} of ${total}`,
          });
        }

        setIsProcessing(false);
        return { success: true, processedCount: processed };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Move failed';
        setError(msg);
        setIsProcessing(false);
        return { success: false, processedCount: 0, error: msg };
      }
    },
    [plays, updatePlay],
  );

  /**
   * Add a tag to multiple plays.
   */
  const addTagToPlays = useCallback(
    async (playIds: string[], tag: string): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const targetPlays = plays.filter((p) => playIds.includes(p.id));
        const total = targetPlays.length;
        let processed = 0;

        for (const play of targetPlays) {
          if (play.tags.includes(tag)) {
            processed++;
            setProgress({ current: processed, total, message: `Tagging play ${processed} of ${total}` });
            continue;
          }
          const updated: Play = {
            ...play,
            tags: [...play.tags, tag],
            updatedAt: new Date().toISOString(),
          };
          await playsDb.put(updated);
          updatePlay(updated);
          processed++;
          setProgress({
            current: processed,
            total,
            message: `Tagging play ${processed} of ${total}`,
          });
        }

        setIsProcessing(false);
        return { success: true, processedCount: processed };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tag add failed';
        setError(msg);
        setIsProcessing(false);
        return { success: false, processedCount: 0, error: msg };
      }
    },
    [plays, updatePlay],
  );

  /**
   * Remove a tag from multiple plays.
   */
  const removeTagFromPlays = useCallback(
    async (playIds: string[], tag: string): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const targetPlays = plays.filter((p) => playIds.includes(p.id));
        const total = targetPlays.length;
        let processed = 0;

        for (const play of targetPlays) {
          if (!play.tags.includes(tag)) {
            processed++;
            setProgress({ current: processed, total, message: `Removing tag ${processed} of ${total}` });
            continue;
          }
          const updated: Play = {
            ...play,
            tags: play.tags.filter((t) => t !== tag),
            updatedAt: new Date().toISOString(),
          };
          await playsDb.put(updated);
          updatePlay(updated);
          processed++;
          setProgress({
            current: processed,
            total,
            message: `Removing tag ${processed} of ${total}`,
          });
        }

        setIsProcessing(false);
        return { success: true, processedCount: processed };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tag remove failed';
        setError(msg);
        setIsProcessing(false);
        return { success: false, processedCount: 0, error: msg };
      }
    },
    [plays, updatePlay],
  );

  /**
   * Delete multiple plays. Caller is responsible for confirmation before calling.
   */
  const deletePlays = useCallback(
    async (playIds: string[]): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const total = playIds.length;
        let processed = 0;

        for (const id of playIds) {
          await playsDb.delete(id);
          removePlay(id);
          processed++;
          setProgress({
            current: processed,
            total,
            message: `Deleting play ${processed} of ${total}`,
          });
        }

        setIsProcessing(false);
        return { success: true, processedCount: processed };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Delete failed';
        setError(msg);
        setIsProcessing(false);
        return { success: false, processedCount: 0, error: msg };
      }
    },
    [removePlay],
  );

  /**
   * Generic execute wrapper for any bulk operation.
   */
  const execute = useCallback(
    async (
      operation: () => Promise<BulkOperationResult>,
    ): Promise<BulkOperationResult> => {
      resetState();
      return operation();
    },
    [resetState],
  );

  return {
    // Operations
    duplicatePlays,
    duplicateAcrossFormations,
    movePlaysToFolder,
    addTagToPlays,
    removeTagFromPlays,
    deletePlays,
    execute,

    // State
    isProcessing,
    progress,
    error,
    resetState,
  };
}
