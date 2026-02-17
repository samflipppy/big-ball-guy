'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PERSONNEL_GROUPS } from '@/lib/constants';
import { DEFENSIVE_FRONTS_LIBRARY } from '@/lib/defenses';
import FormationLibrary from './FormationLibrary';
import TagInput from './TagInput';
import RunPlayBuilder from './RunPlayBuilder';
import DefensivePlayBuilder from './DefensivePlayBuilder';
import type { Formation, Player, PlayerAssignment, DefensiveOverlay } from '@/types';

interface PlayCreationModalProps {
  formations: Formation[];
  allTags: string[];
  onCreatePlay: (data: {
    name: string;
    formationId: string;
    personnel: string;
    tags: string[];
    notes?: string;
    category?: string;
    assignments?: PlayerAssignment[];
    blockingSchemeId?: string;
    defensiveOverlay?: DefensiveOverlay;
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

type PlaySide = 'offense' | 'defense';
type PlayType = 'pass' | 'run';
type Step = 0 | 1 | 2 | 3;

export default function PlayCreationModal({
  formations,
  allTags,
  onCreatePlay,
  onCreateFormation,
  onQuickCreate,
  onClose,
  className,
}: PlayCreationModalProps) {
  // Step 0: Choose offense/defense
  // Step 1: Choose formation (offense) or front (defense)
  // Step 2: Play type specific (run builder / pass routes / defense coverage)
  // Step 3: Details
  const [step, setStep] = useState<Step>(0);
  const [playSide, setPlaySide] = useState<PlaySide>('offense');
  const [playType, setPlayType] = useState<PlayType>('pass');
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [playName, setPlayName] = useState('');
  const [personnel, setPersonnel] = useState('11');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [assignments, setAssignments] = useState<PlayerAssignment[]>([]);
  const [blockingSchemeId, setBlockingSchemeId] = useState<string | undefined>();
  const [defensiveOverlay, setDefensiveOverlay] = useState<DefensiveOverlay | undefined>();

  const handlePlaySideSelect = useCallback((side: PlaySide) => {
    setPlaySide(side);
    setStep(1);
    // Reset selections
    setSelectedFormation(null);
    setAssignments([]);
    setBlockingSchemeId(undefined);
    setDefensiveOverlay(undefined);
  }, []);

  const handlePlayTypeSelect = useCallback((type: PlayType) => {
    setPlayType(type);
  }, []);

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
    if (step === 0) return; // Should not happen
    if (step === 1) {
      if (playSide === 'offense') {
        if (!selectedFormation) return;
        // For pass plays, go straight to details. For run plays, show run builder.
        if (playType === 'run') {
          setStep(2);
        } else {
          setStep(3);
        }
      } else {
        // Defense - go to defensive builder
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  }, [step, playSide, playType, selectedFormation]);

  const handleBack = useCallback(() => {
    if (step === 3) {
      if (playSide === 'offense' && playType === 'run') {
        setStep(2);
      } else if (playSide === 'defense') {
        setStep(2);
      } else {
        setStep(1);
      }
    } else if (step === 2) {
      setStep(1);
    } else if (step === 1) {
      setStep(0);
    }
  }, [step, playSide, playType]);

  const handleApplyRunScheme = useCallback(
    (newAssignments: PlayerAssignment[], schemeId: string) => {
      setAssignments(newAssignments);
      setBlockingSchemeId(schemeId);
      setStep(3);
    },
    []
  );

  const handleApplyDefense = useCallback((defense: DefensiveOverlay) => {
    setDefensiveOverlay(defense);
    setStep(3);
  }, []);

  const handleCreate = useCallback(() => {
    if (!playName.trim()) {
      setNameError('Play name is required');
      return;
    }

    if (playSide === 'offense') {
      if (!selectedFormation) return;
      onCreatePlay({
        name: playName.trim(),
        formationId: selectedFormation.id,
        personnel,
        tags,
        notes: notes.trim() || undefined,
        category: playType,
        assignments,
        blockingSchemeId,
      });
    } else {
      // Defensive play - use first defensive front as a pseudo-formation
      const firstFront = DEFENSIVE_FRONTS_LIBRARY[0];
      onCreatePlay({
        name: playName.trim(),
        formationId: `defense-${defensiveOverlay?.front || firstFront.name}`,
        personnel: 'DEF',
        tags: [...tags, 'defense'],
        notes: notes.trim() || undefined,
        category: 'defense',
        defensiveOverlay,
      });
    }
  }, [
    playName,
    playSide,
    selectedFormation,
    personnel,
    tags,
    notes,
    playType,
    assignments,
    blockingSchemeId,
    defensiveOverlay,
    onCreatePlay,
  ]);

  const stepLabels = playSide === 'offense'
    ? playType === 'run'
      ? ['Side', 'Formation', 'Blocking', 'Details']
      : ['Side', 'Formation', 'Details']
    : ['Side', 'Front', 'Coverage', 'Details'];

  const totalSteps = stepLabels.length;
  const accentColor = playSide === 'offense' ? 'blue' : 'red';

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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {step === 0 ? 'Create New Play' : playSide === 'offense' ? 'Offensive Play' : 'Defensive Play'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {step === 0 && 'Choose offense or defense'}
              {step === 1 && (playSide === 'offense' ? 'Choose a formation' : 'Choose a defensive front')}
              {step === 2 && (playSide === 'offense' ? 'Configure blocking scheme' : 'Choose coverage & blitz')}
              {step === 3 && 'Play details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            data-testid="modal-close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps indicator - only show after step 0 */}
        {step > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            {stepLabels.map((label, idx) => (
              <React.Fragment key={label}>
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium',
                    step >= idx ? `text-${accentColor}-600` : 'text-zinc-400'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      step >= idx
                        ? `bg-${accentColor}-600 text-white`
                        : 'bg-zinc-300 text-zinc-500'
                    )}
                    style={{
                      backgroundColor: step >= idx ? (playSide === 'offense' ? '#2563eb' : '#dc2626') : undefined,
                      color: step >= idx ? 'white' : undefined,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {idx < stepLabels.length - 1 && <div className="h-px flex-1 bg-zinc-300" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 0: Choose Offense or Defense */}
          {step === 0 && (
            <div className="p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                What type of play do you want to create?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePlaySideSelect('offense')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-zinc-800 group"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Offense</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Pass plays, run plays, RPOs</span>
                </button>
                <button
                  onClick={() => handlePlaySideSelect('defense')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-red-500 dark:hover:border-red-500 transition-colors bg-white dark:bg-zinc-800 group"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Defense</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Fronts, coverages, blitzes</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Formation (offense) or Front selection handled in defense builder */}
          {step === 1 && playSide === 'offense' && (
            <div>
              {/* Play type toggle */}
              <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Play Type:</span>
                  <div className="flex rounded-lg bg-zinc-200 dark:bg-zinc-700 p-0.5">
                    <button
                      onClick={() => handlePlayTypeSelect('pass')}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                        playType === 'pass'
                          ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400'
                      )}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => handlePlayTypeSelect('run')}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                        playType === 'run'
                          ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400'
                      )}
                    >
                      Run
                    </button>
                  </div>
                </div>
              </div>
              <FormationLibrary
                formations={formations}
                selectedFormationId={selectedFormation?.id}
                onSelect={handleFormationSelect}
                onCreateFormation={onCreateFormation}
                className="h-full"
              />
            </div>
          )}

          {/* Step 1 for defense - go straight to defensive builder */}
          {step === 1 && playSide === 'defense' && (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              <p>Click Next to configure your defensive play.</p>
            </div>
          )}

          {/* Step 2: Run play builder (offense) or Defense builder */}
          {step === 2 && playSide === 'offense' && playType === 'run' && selectedFormation && (
            <RunPlayBuilder
              formation={selectedFormation}
              onApplyScheme={handleApplyRunScheme}
              className="h-full"
            />
          )}

          {step === 2 && playSide === 'defense' && (
            <DefensivePlayBuilder
              onApplyDefense={handleApplyDefense}
              className="h-full"
            />
          )}

          {/* Step 3 (or Step 2 for pass plays): Details */}
          {step === 3 && (
            <div className="p-6 space-y-4">
              {/* Selected formation display (offense) */}
              {playSide === 'offense' && selectedFormation && (
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
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
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {selectedFormation.personnel} personnel • {playType === 'run' ? 'Run' : 'Pass'}
                      {blockingSchemeId && ` • ${assignments.length} blocking assignments`}
                    </p>
                  </div>
                </div>
              )}

              {/* Selected defense display */}
              {playSide === 'defense' && defensiveOverlay && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                  <div className="w-16 h-10 rounded bg-emerald-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{defensiveOverlay.front}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {defensiveOverlay.coverage}
                      {defensiveOverlay.blitz && ` • ${defensiveOverlay.blitz}`}
                    </p>
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
                    'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
                    nameError ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-600',
                    'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="play-notes-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <div>
            {/* Quick create for offensive pass plays */}
            {step === 1 && playSide === 'offense' && selectedFormation && playType === 'pass' && (
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
            {/* Cancel button for step 0 */}
            {step === 0 && (
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-testid="modal-cancel"
              >
                Cancel
              </button>
            )}

            {/* Back button for steps > 0 */}
            {step > 0 && (
              <button
                onClick={handleBack}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-testid="modal-back"
              >
                Back
              </button>
            )}

            {/* Next button for step 1 (offense with formation selected, or defense) */}
            {step === 1 && (
              <button
                onClick={handleNext}
                disabled={playSide === 'offense' && !selectedFormation}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white',
                  (playSide === 'defense' || selectedFormation)
                    ? playSide === 'offense' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                    : 'bg-zinc-300 cursor-not-allowed'
                )}
                data-testid="modal-next"
              >
                Next
              </button>
            )}

            {/* Note: Step 2 has its own Apply button in RunPlayBuilder and DefensivePlayBuilder */}
            {/* Cancel for step 2 */}
            {step === 2 && (
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            )}

            {/* Create button for step 3 (final details) */}
            {step === 3 && (
              <button
                onClick={handleCreate}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white',
                  playSide === 'offense' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                )}
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
