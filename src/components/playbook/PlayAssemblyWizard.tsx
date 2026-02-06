'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';
import { applyConceptToFormation } from '@/lib/concepts';
import { useAppStore } from '@/stores/playStore';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import FormationLibrary from './FormationLibrary';
import ConceptLibrary from './ConceptLibrary';
import type { Formation, Concept, Play, PlayerAssignment } from '@/types';

type WizardStep = 1 | 2 | 3;

interface PlayAssemblyWizardProps {
  open: boolean;
  onClose: () => void;
  onCreatePlay?: (play: Play) => void;
}

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const steps = [
    { number: 1, label: 'Formation' },
    { number: 2, label: 'Concept' },
    { number: 3, label: 'Preview' },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2 py-3" data-testid="step-indicator">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
              currentStep === step.number
                ? 'bg-blue-600 text-white'
                : currentStep > step.number
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-200 text-zinc-500',
            )}
            data-testid={`step-${step.number}`}
          >
            {currentStep > step.number ? '\u2713' : step.number}
          </div>
          <span
            className={cn(
              'text-xs font-medium',
              currentStep === step.number
                ? 'text-zinc-900'
                : 'text-zinc-400',
            )}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'h-px w-8',
                currentStep > step.number ? 'bg-green-500' : 'bg-zinc-200',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** Mini preview of the play with formation dots and route lines */
function PlayPreview({
  formation,
  assignments,
}: {
  formation: Formation;
  assignments: PlayerAssignment[];
}) {
  const viewBox = '0 0 800 500';
  const assignmentMap = new Map(assignments.map((a) => [a.playerId, a]));

  return (
    <svg
      viewBox={viewBox}
      className="w-full rounded bg-emerald-900"
      style={{ maxHeight: 220 }}
      data-testid="play-preview"
    >
      {/* LOS */}
      <line
        x1={0} y1={248} x2={800} y2={248}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={2}
      />
      {formation.players.map((player) => {
        const assignment = assignmentMap.get(player.id);
        return (
          <g key={player.id}>
            {/* Route line */}
            {assignment?.route && (
              <path
                d={assignment.route.points
                  .map((pt, i) => {
                    const px = player.location.x + pt.x * 3;
                    const py = player.location.y + pt.y * 3;
                    return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            )}
            {/* Player dot */}
            <circle
              cx={player.location.x}
              cy={player.location.y}
              r={12}
              fill={assignment?.route ? '#2563eb' : '#6b7280'}
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={player.location.x}
              y={player.location.y + 4}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              fontWeight="bold"
            >
              {player.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PlayAssemblyWizard({
  open,
  onClose,
  onCreatePlay,
}: PlayAssemblyWizardProps) {
  const addPlay = useAppStore((s) => s.addPlay);
  const storeFormations = useAppStore((s) => s.formations);

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [playName, setPlayName] = useState('');
  const [playTags, setPlayTags] = useState('');

  // Compute assignments whenever formation + concept are both selected
  const assignments: PlayerAssignment[] = useMemo(() => {
    if (!selectedFormation || !selectedConcept) return [];
    return applyConceptToFormation(selectedConcept, selectedFormation);
  }, [selectedFormation, selectedConcept]);

  const resetWizard = useCallback(() => {
    setStep(1);
    setSelectedFormation(null);
    setSelectedConcept(null);
    setPlayName('');
    setPlayTags('');
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  const handleSelectFormation = useCallback((formation: Formation) => {
    setSelectedFormation(formation);
    setStep(2);
  }, []);

  const handleSelectConcept = useCallback((concept: Concept) => {
    setSelectedConcept(concept);
    setStep(3);
    // Auto-generate play name
    setPlayName((prev) => prev || `${selectedFormation?.name ?? ''} ${concept.name}`.trim());
  }, [selectedFormation]);

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1) as WizardStep);
  }, []);

  const handleNext = useCallback(() => {
    setStep((prev) => Math.min(3, prev + 1) as WizardStep);
  }, []);

  const handleCreatePlay = useCallback(() => {
    if (!selectedFormation || !selectedConcept) return;

    const now = new Date().toISOString();
    const tags = playTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const play: Play = {
      id: generateId(),
      name: playName || `${selectedFormation.name} ${selectedConcept.name}`,
      formationId: selectedFormation.id,
      conceptId: selectedConcept.id,
      assignments,
      tags,
      personnel: selectedFormation.personnel,
      teamId: selectedFormation.teamId || '',
      createdAt: now,
      updatedAt: now,
    };

    addPlay(play);
    if (onCreatePlay) {
      onCreatePlay(play);
    }
    handleClose();
  }, [
    selectedFormation,
    selectedConcept,
    playName,
    playTags,
    assignments,
    addPlay,
    onCreatePlay,
    handleClose,
  ]);

  const canGoNext = step === 1 ? !!selectedFormation : step === 2 ? !!selectedConcept : false;

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader>Create Play</ModalHeader>

      <div className="px-6">
        <StepIndicator currentStep={step} />
      </div>

      <ModalBody className="min-h-[350px]">
        {/* Step 1: Pick Formation */}
        {step === 1 && (
          <div data-testid="wizard-step-1">
            <FormationLibrary
              formations={storeFormations}
              selectedFormationId={selectedFormation?.id}
              onSelect={handleSelectFormation}
              className="max-h-[300px]"
            />
          </div>
        )}

        {/* Step 2: Pick Concept */}
        {step === 2 && (
          <div data-testid="wizard-step-2">
            <ConceptLibrary
              onSelectConcept={handleSelectConcept}
              selectedConceptId={selectedConcept?.id}
              className="max-h-[300px]"
            />
          </div>
        )}

        {/* Step 3: Preview + Name */}
        {step === 3 && selectedFormation && selectedConcept && (
          <div className="space-y-4" data-testid="wizard-step-3">
            <PlayPreview
              formation={selectedFormation}
              assignments={assignments}
            />

            <div>
              <label
                htmlFor="play-name"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Play Name
              </label>
              <input
                id="play-name"
                type="text"
                value={playName}
                onChange={(e) => setPlayName(e.target.value)}
                placeholder="e.g. Shotgun Mesh"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="play-name-input"
              />
            </div>

            <div>
              <label
                htmlFor="play-tags"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Tags (comma separated)
              </label>
              <input
                id="play-tags"
                type="text"
                value={playTags}
                onChange={(e) => setPlayTags(e.target.value)}
                placeholder="e.g. pass, quick game, 3rd down"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="play-tags-input"
              />
            </div>

            <div className="text-xs text-zinc-500">
              Formation: <strong>{selectedFormation.name}</strong> |
              Concept: <strong>{selectedConcept.name}</strong> |
              Routes assigned: <strong>{assignments.length}</strong>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step > 1 && (
          <button
            onClick={handleBack}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            data-testid="wizard-back-btn"
          >
            Back
          </button>
        )}

        <button
          onClick={handleClose}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          data-testid="wizard-cancel-btn"
        >
          Cancel
        </button>

        {step < 3 && (
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white',
              canGoNext
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-300 cursor-not-allowed',
            )}
            data-testid="wizard-next-btn"
          >
            Next
          </button>
        )}

        {step === 3 && (
          <button
            onClick={handleCreatePlay}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            data-testid="wizard-create-btn"
          >
            Create Play
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
