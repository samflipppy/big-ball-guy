'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/playStore';
import { useHistoryStore } from '@/stores/playStore';
import { PlayDesignCanvas } from '@/components/canvas/PlayDesignCanvas';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';
import { generateId } from '@/lib/utils';
import { plays as playsDb } from '@/lib/db/indexeddb';
import type { Formation, Play, PlayerAssignment } from '@/types';

const DEFAULT_FORMATION = BUILT_IN_FORMATIONS[0]; // Singleback

export default function SketchPage() {
  const { addPlay } = useAppStore();
  const { clearHistory } = useHistoryStore();

  // Play state
  const [formation, setFormation] = useState<Formation>(DEFAULT_FORMATION);
  const [assignments, setAssignments] = useState<PlayerAssignment[]>([]);

  // Container sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Save modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [playName, setPlayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Build the current Play object
  const currentPlay: Play = useMemo(
    () => ({
      id: 'sketch-draft',
      name: 'Untitled Sketch',
      formationId: formation.id,
      assignments,
      tags: [],
      personnel: formation.personnel,
      teamId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [formation.id, formation.personnel, assignments],
  );

  // Measure container and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Handle formation change
  const handleFormationChange = useCallback(
    (formationId: string) => {
      const found = BUILT_IN_FORMATIONS.find((f) => f.id === formationId);
      if (found) {
        setFormation(found);
        setAssignments([]);
        clearHistory();
      }
    },
    [clearHistory],
  );

  // Handle New Play
  const handleNewPlay = useCallback(() => {
    setFormation(DEFAULT_FORMATION);
    setAssignments([]);
    clearHistory();
  }, [clearHistory]);

  // Handle Save to Playbook
  const handleSaveToPlaybook = useCallback(() => {
    setPlayName('');
    setSaveModalOpen(true);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    if (!playName.trim()) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const newPlay: Play = {
        id: generateId(),
        name: playName.trim(),
        formationId: formation.id,
        assignments,
        tags: [],
        personnel: formation.personnel,
        teamId: '',
        createdAt: now,
        updatedAt: now,
      };
      await playsDb.put(newPlay);
      addPlay(newPlay);
      setSaveModalOpen(false);
      // Reset after saving
      handleNewPlay();
    } catch {
      // Save error handled silently
    } finally {
      setIsSaving(false);
    }
  }, [playName, formation, assignments, addPlay, handleNewPlay]);

  // Assignments change handler
  const handleAssignmentsChange = useCallback(
    (newAssignments: PlayerAssignment[]) => {
      setAssignments(newAssignments);
    },
    [],
  );

  return (
    <div className="flex h-full flex-col" data-testid="sketch-page">
      {/* Top toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Quick Sketch
          </h1>

          {/* Formation selector */}
          <select
            value={formation.id}
            onChange={(e) => handleFormationChange(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            data-testid="formation-selector"
            aria-label="Select formation"
          >
            {BUILT_IN_FORMATIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleNewPlay} data-testid="new-play-btn">
            New Play
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveToPlaybook} data-testid="save-playbook-btn">
            Save to Playbook
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 bg-[#2d5a27] dark:bg-[#1a3d18]" data-testid="canvas-area">
        {/* Canvas container for measuring */}
        <div ref={containerRef} className="absolute inset-0">
          <PlayDesignCanvas
            play={currentPlay}
            formation={formation}
            width={dimensions.width}
            height={dimensions.height}
            onAssignmentsChange={handleAssignmentsChange}
          />
        </div>
      </div>

      {/* Save modal */}
      <Modal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} size="sm">
        <ModalHeader>Save to Playbook</ModalHeader>
        <ModalBody>
          <label
            htmlFor="play-name-input"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Play Name
          </label>
          <input
            id="play-name-input"
            type="text"
            value={playName}
            onChange={(e) => setPlayName(e.target.value)}
            placeholder="e.g. HB Dive, Four Verts..."
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            data-testid="play-name-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirmSave();
              }
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaveModalOpen(false)}
            data-testid="cancel-save-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmSave}
            disabled={!playName.trim()}
            loading={isSaving}
            data-testid="confirm-save-btn"
          >
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
