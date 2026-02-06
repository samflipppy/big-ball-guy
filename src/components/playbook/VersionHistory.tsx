'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  getVersions,
  diffVersions,
  type PlayVersion,
  type PlayDiff,
} from '@/lib/versioning';
import type { PlayId } from '@/types';

export interface VersionHistoryProps {
  playId: PlayId;
  onRestore: (play: PlayVersion) => void;
  onClose: () => void;
}

export function VersionHistory({ playId, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<PlayVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [diff, setDiff] = useState<PlayDiff | null>(null);

  // Load versions
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getVersions(playId);
        if (!cancelled) {
          setVersions(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load versions');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [playId]);

  const handleRestore = useCallback(
    (version: PlayVersion) => {
      onRestore(version);
    },
    [onRestore],
  );

  const toggleCompareSelection = useCallback(
    (versionId: string) => {
      setSelectedVersions((prev) => {
        if (prev.includes(versionId)) {
          setDiff(null);
          return prev.filter((id) => id !== versionId);
        }
        if (prev.length >= 2) {
          // Replace the oldest selection
          return [prev[1], versionId];
        }
        return [...prev, versionId];
      });
    },
    [],
  );

  const handleCompare = useCallback(() => {
    if (selectedVersions.length !== 2) return;
    const v1 = versions.find((v) => v.id === selectedVersions[0]);
    const v2 = versions.find((v) => v.id === selectedVersions[1]);
    if (v1 && v2) {
      const result = diffVersions(v1, v2);
      setDiff(result);
    }
  }, [selectedVersions, versions]);

  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => !prev);
    setSelectedVersions([]);
    setDiff(null);
  }, []);

  const formatTimestamp = (isoStr: string): string => {
    const date = new Date(isoStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <aside
      role="complementary"
      aria-label="Version History"
      className={cn(
        'flex flex-col w-80 border-l border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
        'h-full overflow-hidden',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Version History
        </h3>
        <div className="flex gap-1">
          <Button
            variant={compareMode ? 'primary' : 'ghost'}
            size="sm"
            onClick={toggleCompareMode}
          >
            {compareMode ? 'Exit Compare' : 'Compare'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Compare toolbar */}
      {compareMode && (
        <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            Select 2 versions to compare
          </p>
          <Button
            size="sm"
            onClick={handleCompare}
            disabled={selectedVersions.length !== 2}
          >
            Compare Selected
          </Button>
        </div>
      )}

      {/* Diff view */}
      {diff && (
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700 max-h-60 overflow-y-auto">
          <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Diff Result
          </h4>
          <DiffView diff={diff} />
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-zinc-500">Loading versions...</span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Version timeline */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto" role="list" aria-label="Version timeline">
          {versions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No versions yet
              </p>
            </div>
          ) : (
            versions.map((version, index) => (
              <div
                key={version.id}
                role="listitem"
                className={cn(
                  'relative border-b border-zinc-100 px-4 py-3 dark:border-zinc-800',
                  'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                  compareMode &&
                    selectedVersions.includes(version.id) &&
                    'bg-blue-50 dark:bg-blue-900/20',
                )}
              >
                {/* Timeline dot */}
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 flex flex-col items-center">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        index === 0
                          ? 'bg-blue-600'
                          : 'bg-zinc-300 dark:bg-zinc-600',
                      )}
                    />
                    {index < versions.length - 1 && (
                      <div className="h-full w-px bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {version.label || 'Unlabeled version'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatTimestamp(version.createdAt)}
                    </p>

                    <div className="mt-2 flex gap-1">
                      {compareMode ? (
                        <Button
                          variant={selectedVersions.includes(version.id) ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => toggleCompareSelection(version.id)}
                        >
                          {selectedVersions.includes(version.id) ? 'Selected' : 'Select'}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRestore(version)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}

function DiffView({ diff }: { diff: PlayDiff }) {
  const hasChanges =
    diff.addedRoutes.length > 0 ||
    diff.removedRoutes.length > 0 ||
    diff.movedPlayers.length > 0 ||
    diff.changedBlocking.length > 0 ||
    diff.metadataChanges.length > 0;

  if (!hasChanges) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        No differences found
      </p>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      {diff.addedRoutes.length > 0 && (
        <div>
          <span className="font-medium text-green-700 dark:text-green-400">
            + {diff.addedRoutes.length} route{diff.addedRoutes.length !== 1 ? 's' : ''} added
          </span>
          <ul className="ml-3 mt-0.5">
            {diff.addedRoutes.map((r, i) => (
              <li key={i} className="text-zinc-600 dark:text-zinc-400">
                {r.playerId}: {r.route.name} ({r.route.type})
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.removedRoutes.length > 0 && (
        <div>
          <span className="font-medium text-red-700 dark:text-red-400">
            - {diff.removedRoutes.length} route{diff.removedRoutes.length !== 1 ? 's' : ''} removed
          </span>
          <ul className="ml-3 mt-0.5">
            {diff.removedRoutes.map((r, i) => (
              <li key={i} className="text-zinc-600 dark:text-zinc-400">
                {r.playerId}: {r.route.name} ({r.route.type})
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.changedBlocking.length > 0 && (
        <div>
          <span className="font-medium text-amber-700 dark:text-amber-400">
            ~ {diff.changedBlocking.length} blocking change{diff.changedBlocking.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {diff.movedPlayers.length > 0 && (
        <div>
          <span className="font-medium text-blue-700 dark:text-blue-400">
            ~ {diff.movedPlayers.length} player{diff.movedPlayers.length !== 1 ? 's' : ''} moved
          </span>
        </div>
      )}

      {diff.metadataChanges.length > 0 && (
        <div>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Metadata changes:
          </span>
          <ul className="ml-3 mt-0.5">
            {diff.metadataChanges.map((m, i) => (
              <li key={i} className="text-zinc-600 dark:text-zinc-400">
                {m.field}: {JSON.stringify(m.from)} → {JSON.stringify(m.to)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VersionHistory;
