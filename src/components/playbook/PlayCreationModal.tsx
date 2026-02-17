'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PERSONNEL_GROUPS } from '@/lib/constants';
import FormationLibrary from './FormationLibrary';
import TagInput from './TagInput';
import type { Formation, Player } from '@/types';

interface PlayCreationModalProps {
  formations: Formation[];
  allTags: string[];
  onCreatePlay: (data: {
    name: string;
    formationId: string;
    personnel: string;
    tags: string[];
    notes?: string;
  }) => void;
  onCreateFormation?: (data: {
    name: string;
    personnel: string;
    players: Player[];
  }) => void;
  onQuickCreate: (formationId: string) => void;
  onClose: () => void;
  className?: string;
}

type Step = 1 | 2;

export default function PlayCreationModal({
  formations,
  allTags,
  onCreatePlay,
  onCreateFormation,
  onQuickCreate,
  onClose,
  className,
}: PlayCreationModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [playName, setPlayName] = useState('');
  const [personnel, setPersonnel] = useState('11');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');

  const handleFormationSelect = useCallback((formation: Formation) => {
    setSelectedFormation(formation);
    setPersonnel(formation.personnel);
  }, []);

  const handleQuickCreate = useCallback(() => {
    if (selectedFormation) {
      onQuickCreate(selectedFormation.id);
    }
  }, [selectedFormation, onQuickCreate]);

  const handleNext = useCallback(() => {
    if (!selectedFormation) return;
    setStep(2);
  }, [selectedFormation]);

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  const handleCreate = useCallback(() => {
    if (!playName.trim()) {
      setNameError('Play name is required');
      return;
    }
    if (!selectedFormation) return;

    onCreatePlay({
      name: playName.trim(),
      formationId: selectedFormation.id,
      personnel,
      tags,
      notes: notes.trim() || undefined,
    });
  }, [playName, selectedFormation, personnel, tags, notes, onCreatePlay]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="play-creation-modal">
      <div
        className={cn(
          'flex flex-col w-full max-w-2xl max-h-[90vh] rounded-xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create New Play</h2>
            <p className="text-sm text-zinc-500">
              {step === 1 ? 'Step 1: Choose a formation' : 'Step 2: Play details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300"
            data-testid="modal-close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              step >= 1 ? 'text-blue-600' : 'text-zinc-400',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-zinc-300 text-zinc-500',
              )}
            >
              1
            </span>
            Formation
          </div>
          <div className="h-px flex-1 bg-zinc-300" />
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              step >= 2 ? 'text-blue-600' : 'text-zinc-400',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-zinc-300 text-zinc-500',
              )}
            >
              2
            </span>
            Details
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <FormationLibrary
              formations={formations}
              selectedFormationId={selectedFormation?.id}
              onSelect={handleFormationSelect}
              onCreateFormation={onCreateFormation}
              className="h-full"
            />
          )}

          {step === 2 && (
            <div className="p-6 space-y-4">
              {/* Selected formation display */}
              {selectedFormation && (
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-200 dark:border-blue-800">
                  <svg
                    viewBox="0 0 800 500"
                    className="h-10 w-16 rounded bg-emerald-900"
                  >
                    <line x1={0} y1={248} x2={800} y2={248} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
                    {selectedFormation.players.map((p) => (
                      <circle
                        key={p.id}
                        cx={p.location.x}
                        cy={p.location.y}
                        r={10}
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth={1.5}
                      />
                    ))}
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{selectedFormation.name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{selectedFormation.personnel} personnel</p>
                  </div>
                </div>
              )}

              {/* Play name */}
              <div>
                <label htmlFor="play-name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Play Name
                </label>
                <input
                  id="play-name"
                  type="text"
                  value={playName}
                  onChange={(e) => {
                    setPlayName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g., HB Dive, PA Boot Right"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    nameError ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-600',
                    'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100',
                  )}
                  data-testid="play-name-input"
                />
                {nameError && (
                  <p className="mt-1 text-xs text-red-500" data-testid="play-name-error">
                    {nameError}
                  </p>
                )}
              </div>

              {/* Personnel */}
              <div>
                <label htmlFor="play-personnel" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Personnel
                </label>
                <select
                  id="play-personnel"
                  value={personnel}
                  onChange={(e) => setPersonnel(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="play-personnel-select"
                >
                  {PERSONNEL_GROUPS.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.code} - {g.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags</label>
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  suggestions={allTags}
                  placeholder="Add tags..."
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="play-notes" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Notes (optional)
                </label>
                <textarea
                  id="play-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Play description or coaching notes..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="play-notes-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <div>
            {step === 1 && selectedFormation && (
              <button
                onClick={handleQuickCreate}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                data-testid="quick-create-btn"
              >
                Quick Create
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-testid="modal-back"
              >
                Back
              </button>
            )}
            {step === 1 && (
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-testid="modal-cancel"
              >
                Cancel
              </button>
            )}
            {step === 1 && (
              <button
                onClick={handleNext}
                disabled={!selectedFormation}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white',
                  selectedFormation
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-zinc-300 cursor-not-allowed',
                )}
                data-testid="modal-next"
              >
                Next
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleCreate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                data-testid="modal-create"
              >
                Create Play
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
