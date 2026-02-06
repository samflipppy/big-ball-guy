'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';
import { BUILT_IN_CONCEPTS } from '@/lib/concepts';
import { BUILT_IN_BLOCKING_SCHEMES } from '@/lib/blocking-schemes';
import type { Play, Formation, Concept, BlockingScheme } from '@/types';

// --- Constants ---

const STORAGE_KEY = 'system_builder_progress';
const TOTAL_STEPS = 7;
const MIN_FORMATIONS = 4;
const MAX_FORMATIONS = 6;
const MIN_CONCEPTS = 3;
const MAX_CONCEPTS = 5;

// --- Types ---

export type PhilosophyStyle = 'run-heavy' | 'pass-heavy' | 'balanced';
export type TempoPreference = 'fast' | 'moderate' | 'slow';

export interface PhilosophyData {
  style: PhilosophyStyle;
  tempo: TempoPreference;
}

export interface SystemBuilderState {
  currentStep: number;
  philosophy: PhilosophyData;
  selectedFormationIds: string[];
  runConceptsByFormation: Record<string, string[]>;
  passConceptsByFormation: Record<string, string[]>;
  selectedProtectionIds: string[];
  hotRouteRules: HotRouteRule[];
}

export interface HotRouteRule {
  id: string;
  trigger: string;
  route: string;
  description: string;
}

export interface SystemBuilderProps {
  onComplete: (plays: Play[]) => void;
}

// --- Step labels ---

const STEP_LABELS = [
  'Philosophy',
  'Formations',
  'Run Game',
  'Pass Game',
  'Protections',
  'Automatics',
  'Review',
];

// --- Built-in hot route templates ---

const HOT_ROUTE_TEMPLATES: HotRouteRule[] = [
  { id: 'hot-1', trigger: 'Blitz from edge', route: 'Quick slant', description: 'Hot WR to slant vs edge pressure' },
  { id: 'hot-2', trigger: 'Zero coverage', route: 'Fade', description: 'Outside WR fades vs zero blitz' },
  { id: 'hot-3', trigger: 'Middle blitz', route: 'Flat', description: 'RB checks to flat vs middle blitz' },
  { id: 'hot-4', trigger: 'Overload blitz', route: 'Screen', description: 'Quick screen to overload side' },
  { id: 'hot-5', trigger: 'Safety blitz', route: 'Seam', description: 'TE runs seam vs single high safety blitz' },
];

// --- Default state ---

function defaultState(): SystemBuilderState {
  return {
    currentStep: 0,
    philosophy: { style: 'balanced', tempo: 'moderate' },
    selectedFormationIds: [],
    runConceptsByFormation: {},
    passConceptsByFormation: {},
    selectedProtectionIds: [],
    hotRouteRules: [],
  };
}

// --- Helpers ---

function loadSavedState(): SystemBuilderState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as SystemBuilderState;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveState(state: SystemBuilderState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Get run concepts from the built-in library.
 * Run concepts are blocking schemes with type 'run'.
 */
function getRunConcepts(): BlockingScheme[] {
  return BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'run');
}

/**
 * Get pass concepts from the built-in library.
 */
function getPassConcepts(): Concept[] {
  return BUILT_IN_CONCEPTS;
}

/**
 * Get pass protection schemes from the built-in library.
 */
function getProtectionSchemes(): BlockingScheme[] {
  return BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'pass');
}

/**
 * SystemBuilder: Extended wizard for building an entire offensive system
 * during the offseason. 7 steps from philosophy to complete system review.
 * Progress is saved between sessions via localStorage.
 */
export function SystemBuilder({ onComplete }: SystemBuilderProps) {
  const [state, setState] = useState<SystemBuilderState>(() => {
    return loadSavedState() ?? defaultState();
  });

  // Persist to localStorage on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const { currentStep, philosophy, selectedFormationIds, runConceptsByFormation, passConceptsByFormation, selectedProtectionIds, hotRouteRules } = state;

  // Derived data
  const selectedFormations = useMemo(
    () => BUILT_IN_FORMATIONS.filter((f) => selectedFormationIds.includes(f.id)),
    [selectedFormationIds],
  );

  const runConcepts = useMemo(() => getRunConcepts(), []);
  const passConcepts = useMemo(() => getPassConcepts(), []);
  const protectionSchemes = useMemo(() => getProtectionSchemes(), []);

  // Total play count for the review
  const totalPlayCount = useMemo(() => {
    let count = 0;
    for (const fId of selectedFormationIds) {
      const runs = runConceptsByFormation[fId]?.length ?? 0;
      const passes = passConceptsByFormation[fId]?.length ?? 0;
      count += runs + passes;
    }
    return count;
  }, [selectedFormationIds, runConceptsByFormation, passConceptsByFormation]);

  // --- Navigation ---

  const goNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS - 1),
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  // --- Step 1: Philosophy ---

  const setPhilosophy = useCallback((updates: Partial<PhilosophyData>) => {
    setState((prev) => ({
      ...prev,
      philosophy: { ...prev.philosophy, ...updates },
    }));
  }, []);

  // --- Step 2: Formations ---

  const toggleFormation = useCallback((formationId: string) => {
    setState((prev) => {
      const ids = prev.selectedFormationIds;
      if (ids.includes(formationId)) {
        return { ...prev, selectedFormationIds: ids.filter((id) => id !== formationId) };
      }
      if (ids.length >= MAX_FORMATIONS) return prev;
      return { ...prev, selectedFormationIds: [...ids, formationId] };
    });
  }, []);

  // --- Step 3 & 4: Run/Pass Concepts ---

  const toggleRunConcept = useCallback((formationId: string, conceptId: string) => {
    setState((prev) => {
      const current = prev.runConceptsByFormation[formationId] ?? [];
      let updated: string[];
      if (current.includes(conceptId)) {
        updated = current.filter((id) => id !== conceptId);
      } else {
        if (current.length >= MAX_CONCEPTS) return prev;
        updated = [...current, conceptId];
      }
      return {
        ...prev,
        runConceptsByFormation: { ...prev.runConceptsByFormation, [formationId]: updated },
      };
    });
  }, []);

  const togglePassConcept = useCallback((formationId: string, conceptId: string) => {
    setState((prev) => {
      const current = prev.passConceptsByFormation[formationId] ?? [];
      let updated: string[];
      if (current.includes(conceptId)) {
        updated = current.filter((id) => id !== conceptId);
      } else {
        if (current.length >= MAX_CONCEPTS) return prev;
        updated = [...current, conceptId];
      }
      return {
        ...prev,
        passConceptsByFormation: { ...prev.passConceptsByFormation, [formationId]: updated },
      };
    });
  }, []);

  // --- Step 5: Protections ---

  const toggleProtection = useCallback((schemeId: string) => {
    setState((prev) => {
      const ids = prev.selectedProtectionIds;
      if (ids.includes(schemeId)) {
        return { ...prev, selectedProtectionIds: ids.filter((id) => id !== schemeId) };
      }
      return { ...prev, selectedProtectionIds: [...ids, schemeId] };
    });
  }, []);

  // --- Step 6: Automatics ---

  const toggleHotRoute = useCallback((rule: HotRouteRule) => {
    setState((prev) => {
      const existing = prev.hotRouteRules.find((r) => r.id === rule.id);
      if (existing) {
        return { ...prev, hotRouteRules: prev.hotRouteRules.filter((r) => r.id !== rule.id) };
      }
      return { ...prev, hotRouteRules: [...prev.hotRouteRules, rule] };
    });
  }, []);

  // --- Step 7: Complete ---

  const handleComplete = useCallback(() => {
    const plays: Play[] = [];
    const teamId = 'system';
    const now = new Date().toISOString();

    for (const formationId of selectedFormationIds) {
      const formation = BUILT_IN_FORMATIONS.find((f) => f.id === formationId);
      if (!formation) continue;

      // Create run plays
      const runIds = runConceptsByFormation[formationId] ?? [];
      for (const schemeId of runIds) {
        const scheme = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.id === schemeId);
        if (!scheme) continue;
        plays.push({
          id: generateId(),
          name: `${formation.name} ${scheme.name}`,
          formationId,
          blockingSchemeId: schemeId,
          assignments: [],
          tags: ['run', 'system', ...scheme.tags],
          category: 'run',
          personnel: formation.personnel,
          teamId,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create pass plays
      const passIds = passConceptsByFormation[formationId] ?? [];
      for (const conceptId of passIds) {
        const concept = BUILT_IN_CONCEPTS.find((c) => c.id === conceptId);
        if (!concept) continue;
        plays.push({
          id: generateId(),
          name: `${formation.name} ${concept.name}`,
          formationId,
          conceptId,
          assignments: [],
          tags: ['pass', 'system', ...concept.tags],
          category: 'pass',
          personnel: formation.personnel,
          teamId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    clearSavedState();
    onComplete(plays);
  }, [selectedFormationIds, runConceptsByFormation, passConceptsByFormation, onComplete]);

  // --- Reset ---

  const handleReset = useCallback(() => {
    clearSavedState();
    setState(defaultState());
  }, []);

  // --- Validation per step ---

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return true; // Philosophy always valid
      case 1: return selectedFormationIds.length >= MIN_FORMATIONS;
      case 2: {
        // At least one run concept per formation
        return selectedFormationIds.every(
          (fId) => (runConceptsByFormation[fId]?.length ?? 0) >= MIN_CONCEPTS,
        );
      }
      case 3: {
        return selectedFormationIds.every(
          (fId) => (passConceptsByFormation[fId]?.length ?? 0) >= MIN_CONCEPTS,
        );
      }
      case 4: return selectedProtectionIds.length >= 1;
      case 5: return true; // Automatics are optional
      case 6: return true; // Review
      default: return false;
    }
  }, [currentStep, selectedFormationIds, runConceptsByFormation, passConceptsByFormation, selectedProtectionIds]);

  // --- Render ---

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto" data-testid="system-builder">
      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Build Your System
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            data-testid="reset-button"
          >
            Reset
          </button>
        </div>
        <div className="flex gap-1" data-testid="progress-bar">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  'h-1.5 w-full rounded-full transition-colors',
                  i <= currentStep ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  i === currentStep
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-400',
                )}
                data-testid={`step-label-${i}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]" data-testid="step-content">
        {/* Step 1: Philosophy */}
        {currentStep === 0 && (
          <div data-testid="step-philosophy">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Offensive Philosophy
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Define your team&apos;s offensive identity and tempo preference.
            </p>

            {/* Style */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Style
              </label>
              <div className="grid grid-cols-3 gap-3" data-testid="philosophy-style-options">
                {(['run-heavy', 'balanced', 'pass-heavy'] as PhilosophyStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setPhilosophy({ style })}
                    className={cn(
                      'rounded-lg border px-4 py-3 text-sm font-medium transition-colors capitalize',
                      philosophy.style === style
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                    )}
                    data-testid={`style-${style}`}
                  >
                    {style.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tempo */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Tempo
              </label>
              <div className="grid grid-cols-3 gap-3" data-testid="philosophy-tempo-options">
                {(['fast', 'moderate', 'slow'] as TempoPreference[]).map((tempo) => (
                  <button
                    key={tempo}
                    type="button"
                    onClick={() => setPhilosophy({ tempo })}
                    className={cn(
                      'rounded-lg border px-4 py-3 text-sm font-medium transition-colors capitalize',
                      philosophy.tempo === tempo
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                    )}
                    data-testid={`tempo-${tempo}`}
                  >
                    {tempo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Formations */}
        {currentStep === 1 && (
          <div data-testid="step-formations">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Base Formations
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              Pick {MIN_FORMATIONS}-{MAX_FORMATIONS} base formations from the library.
            </p>
            <p className="text-sm text-zinc-500 mb-4" data-testid="formation-count">
              {selectedFormationIds.length} of {MIN_FORMATIONS}-{MAX_FORMATIONS} selected
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUILT_IN_FORMATIONS.map((f) => {
                const isSelected = selectedFormationIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFormation(f.id)}
                    disabled={!isSelected && selectedFormationIds.length >= MAX_FORMATIONS}
                    className={cn(
                      'rounded-lg border px-4 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                        : 'border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                    data-testid={`formation-option-${f.id}`}
                  >
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        isSelected
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-zinc-700 dark:text-zinc-300',
                      )}
                    >
                      {f.name}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {f.personnel} personnel &middot; {f.tags.join(', ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Run Game */}
        {currentStep === 2 && (
          <div data-testid="step-run-game">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Run Game
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Select {MIN_CONCEPTS}-{MAX_CONCEPTS} core run concepts per formation.
            </p>

            <div className="space-y-6">
              {selectedFormations.map((f) => {
                const selected = runConceptsByFormation[f.id] ?? [];
                return (
                  <div key={f.id} data-testid={`run-formation-${f.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{f.name}</h4>
                      <span className="text-xs text-zinc-500" data-testid={`run-count-${f.id}`}>
                        {selected.length}/{MIN_CONCEPTS}-{MAX_CONCEPTS}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {runConcepts.map((scheme) => {
                        const isSelected = selected.includes(scheme.id);
                        return (
                          <button
                            key={scheme.id}
                            type="button"
                            onClick={() => toggleRunConcept(f.id, scheme.id)}
                            disabled={!isSelected && selected.length >= MAX_CONCEPTS}
                            className={cn(
                              'rounded-md border px-3 py-2 text-xs text-left transition-colors',
                              isSelected
                                ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950 dark:text-green-300'
                                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                            )}
                            data-testid={`run-concept-${f.id}-${scheme.id}`}
                          >
                            {scheme.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Pass Game */}
        {currentStep === 3 && (
          <div data-testid="step-pass-game">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Pass Game
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Select {MIN_CONCEPTS}-{MAX_CONCEPTS} core pass concepts per formation.
            </p>

            <div className="space-y-6">
              {selectedFormations.map((f) => {
                const selected = passConceptsByFormation[f.id] ?? [];
                return (
                  <div key={f.id} data-testid={`pass-formation-${f.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{f.name}</h4>
                      <span className="text-xs text-zinc-500" data-testid={`pass-count-${f.id}`}>
                        {selected.length}/{MIN_CONCEPTS}-{MAX_CONCEPTS}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {passConcepts.map((concept) => {
                        const isSelected = selected.includes(concept.id);
                        return (
                          <button
                            key={concept.id}
                            type="button"
                            onClick={() => togglePassConcept(f.id, concept.id)}
                            disabled={!isSelected && selected.length >= MAX_CONCEPTS}
                            className={cn(
                              'rounded-md border px-3 py-2 text-xs text-left transition-colors',
                              isSelected
                                ? 'border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-950 dark:text-purple-300'
                                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                            )}
                            data-testid={`pass-concept-${f.id}-${concept.id}`}
                          >
                            <span className="block font-medium">{concept.name}</span>
                            {concept.description && (
                              <span className="block text-[10px] text-zinc-400 truncate mt-0.5">
                                {concept.description}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Protections */}
        {currentStep === 4 && (
          <div data-testid="step-protections">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Pass Protections
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Pick your base pass protection schemes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {protectionSchemes.map((scheme) => {
                const isSelected = selectedProtectionIds.includes(scheme.id);
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => toggleProtection(scheme.id)}
                    className={cn(
                      'rounded-lg border px-4 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                        : 'border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800',
                    )}
                    data-testid={`protection-option-${scheme.id}`}
                  >
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        isSelected
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-zinc-700 dark:text-zinc-300',
                      )}
                    >
                      {scheme.name}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {scheme.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Automatics */}
        {currentStep === 5 && (
          <div data-testid="step-automatics">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Automatics &amp; Hot Routes
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Set up basic hot route rules for when the defense shows pressure.
            </p>

            <div className="space-y-2">
              {HOT_ROUTE_TEMPLATES.map((rule) => {
                const isSelected = hotRouteRules.some((r) => r.id === rule.id);
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => toggleHotRoute(rule)}
                    className={cn(
                      'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-950'
                        : 'border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800',
                    )}
                    data-testid={`hot-route-${rule.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected
                            ? 'text-orange-700 dark:text-orange-300'
                            : 'text-zinc-700 dark:text-zinc-300',
                        )}
                      >
                        {rule.trigger}
                      </span>
                      <span className="text-xs text-zinc-500">{rule.route}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {rule.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {currentStep === 6 && (
          <div data-testid="step-review">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              System Review
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Review your offensive system before creating all plays.
            </p>

            <div className="space-y-4">
              {/* Philosophy */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4" data-testid="review-philosophy">
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Philosophy</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                  {philosophy.style.replace('-', ' ')} &middot; {philosophy.tempo} tempo
                </p>
              </div>

              {/* Formations */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4" data-testid="review-formations">
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Formations ({selectedFormations.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedFormations.map((f) => (
                    <span key={f.id} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Run/Pass per formation */}
              {selectedFormations.map((f) => (
                <div
                  key={f.id}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4"
                  data-testid={`review-formation-${f.id}`}
                >
                  <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{f.name}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Run Concepts</p>
                      <div className="space-y-0.5">
                        {(runConceptsByFormation[f.id] ?? []).map((id) => {
                          const scheme = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.id === id);
                          return (
                            <p key={id} className="text-xs text-zinc-600 dark:text-zinc-400">
                              {scheme?.name ?? id}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">Pass Concepts</p>
                      <div className="space-y-0.5">
                        {(passConceptsByFormation[f.id] ?? []).map((id) => {
                          const concept = BUILT_IN_CONCEPTS.find((c) => c.id === id);
                          return (
                            <p key={id} className="text-xs text-zinc-600 dark:text-zinc-400">
                              {concept?.name ?? id}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Protections */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4" data-testid="review-protections">
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Protections ({selectedProtectionIds.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedProtectionIds.map((id) => {
                    const scheme = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.id === id);
                    return (
                      <span key={id} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {scheme?.name ?? id}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Hot Routes */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4" data-testid="review-automatics">
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hot Routes ({hotRouteRules.length})
                </h4>
                {hotRouteRules.length > 0 ? (
                  <div className="space-y-0.5">
                    {hotRouteRules.map((rule) => (
                      <p key={rule.id} className="text-xs text-zinc-600 dark:text-zinc-400">
                        {rule.trigger} &rarr; {rule.route}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No hot routes configured</p>
                )}
              </div>

              {/* Total */}
              <div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-4 bg-blue-50 dark:bg-blue-950" data-testid="review-total">
                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  Total Plays: {totalPlayCount}
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Completing this wizard will create {totalPlayCount} plays in your playbook.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 pt-4">
        <div>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              data-testid="back-button"
            >
              Back
            </button>
          )}
        </div>
        <div>
          {currentStep < TOTAL_STEPS - 1 && (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                canProceed
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-700',
              )}
              data-testid="next-button"
            >
              Next
            </button>
          )}
          {currentStep === TOTAL_STEPS - 1 && (
            <button
              type="button"
              onClick={handleComplete}
              className="px-6 py-2 text-sm font-bold bg-green-600 hover:bg-green-500 text-white rounded-lg"
              data-testid="complete-button"
            >
              Build System ({totalPlayCount} plays)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemBuilder;
