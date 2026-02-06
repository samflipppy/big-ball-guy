'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { useAppStore } from '@/stores/playStore';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';
import { BUILT_IN_CONCEPTS, applyConceptToFormation } from '@/lib/concepts';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Play, Formation, Team } from '@/types';

const ONBOARDING_FLAG = 'playbook_onboarding_complete';
const TOTAL_STEPS = 5;

type TeamLevel = 'youth' | 'high_school' | 'college' | 'pro';
type FormationFamily = 'Spread' | 'Pro Style' | 'Wing-T' | 'Option' | 'Custom';
type Personnel = '11' | '12' | '21' | '22';

interface TeamSetupData {
  name: string;
  level: TeamLevel;
  primaryColor: string;
  secondaryColor: string;
}

interface OffensiveIdentityData {
  formationFamily: FormationFamily;
  personnel: Personnel;
}

const LEVEL_OPTIONS: { value: TeamLevel; label: string }[] = [
  { value: 'youth', label: 'Youth' },
  { value: 'high_school', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'pro', label: 'Pro' },
];

const FORMATION_FAMILIES: FormationFamily[] = [
  'Spread',
  'Pro Style',
  'Wing-T',
  'Option',
  'Custom',
];

const PERSONNEL_OPTIONS: { value: Personnel; label: string; description: string }[] = [
  { value: '11', label: '11 Personnel', description: '1 RB, 1 TE, 3 WR' },
  { value: '12', label: '12 Personnel', description: '1 RB, 2 TE, 2 WR' },
  { value: '21', label: '21 Personnel', description: '2 RB, 1 TE, 2 WR' },
  { value: '22', label: '22 Personnel', description: '2 RB, 2 TE, 1 WR' },
];

function getFormationForFamily(family: FormationFamily, personnel: Personnel): Formation {
  // Map family + personnel to the best matching built-in formation
  const matchMap: Record<string, string> = {
    'Spread-11': 'builtin-shotgun',
    'Spread-12': 'builtin-shotgun',
    'Spread-21': 'builtin-pistol',
    'Spread-22': 'builtin-iform',
    'Pro Style-11': 'builtin-singleback',
    'Pro Style-12': 'builtin-singleback',
    'Pro Style-21': 'builtin-iform',
    'Pro Style-22': 'builtin-iform',
    'Wing-T-11': 'builtin-singleback',
    'Wing-T-12': 'builtin-singleback',
    'Wing-T-21': 'builtin-iform',
    'Wing-T-22': 'builtin-iform',
    'Option-11': 'builtin-pistol',
    'Option-12': 'builtin-pistol',
    'Option-21': 'builtin-iform',
    'Option-22': 'builtin-iform',
    'Custom-11': 'builtin-shotgun',
    'Custom-12': 'builtin-singleback',
    'Custom-21': 'builtin-iform',
    'Custom-22': 'builtin-iform',
  };

  const formationId = matchMap[`${family}-${personnel}`] || 'builtin-shotgun';
  return BUILT_IN_FORMATIONS.find((f) => f.id === formationId) || BUILT_IN_FORMATIONS[0];
}

export interface OnboardingWizardProps {
  onComplete?: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [visible, setVisible] = useState(false);

  const [teamSetup, setTeamSetup] = useState<TeamSetupData>({
    name: '',
    level: 'high_school',
    primaryColor: '#1d4ed8',
    secondaryColor: '#ffffff',
  });

  const [offensiveIdentity, setOffensiveIdentity] = useState<OffensiveIdentityData>({
    formationFamily: 'Spread',
    personnel: '11',
  });

  const [firstPlay, setFirstPlay] = useState<Play | null>(null);

  const { addPlay, addFormation, setCurrentTeamId } = useAppStore();

  // Check localStorage on mount
  useEffect(() => {
    const isComplete = localStorage.getItem(ONBOARDING_FLAG);
    if (!isComplete) {
      setVisible(true);
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection('forward');
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const generateFirstPlay = useCallback(() => {
    const formation = getFormationForFamily(
      offensiveIdentity.formationFamily,
      offensiveIdentity.personnel,
    );
    const concept = BUILT_IN_CONCEPTS[0]; // Mesh concept
    const assignments = applyConceptToFormation(concept, formation);
    const teamId = generateId();

    const play: Play = {
      id: generateId(),
      name: `${formation.name} ${concept.name}`,
      formationId: formation.id,
      conceptId: concept.id,
      assignments,
      tags: ['first-play', 'onboarding'],
      personnel: offensiveIdentity.personnel,
      teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFirstPlay(play);
    return { play, formation, teamId };
  }, [offensiveIdentity]);

  const handleStepThreeNext = useCallback(() => {
    generateFirstPlay();
    goNext();
  }, [generateFirstPlay, goNext]);

  const handleComplete = useCallback(() => {
    const teamId = generateId();
    const team: Team = {
      id: teamId,
      name: teamSetup.name || 'My Team',
      level: teamSetup.level,
      primaryColor: teamSetup.primaryColor,
      secondaryColor: teamSetup.secondaryColor,
      createdAt: new Date().toISOString(),
    };

    const formation = getFormationForFamily(
      offensiveIdentity.formationFamily,
      offensiveIdentity.personnel,
    );
    const formationWithTeam: Formation = { ...formation, teamId, id: generateId() };
    addFormation(formationWithTeam);

    if (firstPlay) {
      const playWithTeam: Play = { ...firstPlay, teamId, formationId: formationWithTeam.id };
      addPlay(playWithTeam);
    }

    setCurrentTeamId(teamId);
    localStorage.setItem(ONBOARDING_FLAG, 'true');
    setVisible(false);
    onComplete?.();
  }, [teamSetup, offensiveIdentity, firstPlay, addPlay, addFormation, setCurrentTeamId, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(ONBOARDING_FLAG, 'true');
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  if (!visible) return null;

  const inputClasses =
    'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

  const labelClasses = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="onboarding-wizard">
      <div className="relative mx-4 w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 px-6 pt-6" data-testid="progress-dots">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-6 bg-blue-600'
                  : i < currentStep
                    ? 'bg-blue-400'
                    : 'bg-zinc-300 dark:bg-zinc-700',
              )}
              aria-label={`Step ${i + 1}${i === currentStep ? ' (current)' : ''}`}
            />
          ))}
        </div>

        {/* Skip button */}
        <div className="absolute right-4 top-4">
          <button
            onClick={handleSkip}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            data-testid="skip-button"
          >
            Skip
          </button>
        </div>

        {/* Step content */}
        <div className="min-h-[400px] px-6 py-6">
          {/* Step 1: Welcome */}
          <OnboardingStep active={currentStep === 0} direction={direction}>
            <div className="flex flex-col items-center text-center">
              {/* Coach illustration placeholder */}
              <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <svg
                  className="h-16 w-16 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Welcome, Coach!
              </h2>
              <p className="mb-4 text-lg text-zinc-600 dark:text-zinc-400">
                Let&apos;s set up your playbook in 60 seconds
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                We&apos;ll get your team set up, pick your offensive identity,
                and create your first play.
              </p>
            </div>
          </OnboardingStep>

          {/* Step 2: Team Setup */}
          <OnboardingStep active={currentStep === 1} direction={direction}>
            <div>
              <h2 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Team Setup
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                Tell us about your team
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="team-name" className={labelClasses}>
                    Team Name
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    value={teamSetup.name}
                    onChange={(e) => setTeamSetup((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Westfield Eagles"
                    className={inputClasses}
                    data-testid="team-name-input"
                  />
                </div>

                <div>
                  <label htmlFor="team-level" className={labelClasses}>
                    Level
                  </label>
                  <select
                    id="team-level"
                    value={teamSetup.level}
                    onChange={(e) =>
                      setTeamSetup((prev) => ({ ...prev, level: e.target.value as TeamLevel }))
                    }
                    className={inputClasses}
                    data-testid="team-level-select"
                  >
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="primary-color" className={labelClasses}>
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="primary-color"
                        type="color"
                        value={teamSetup.primaryColor}
                        onChange={(e) =>
                          setTeamSetup((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
                        data-testid="primary-color-input"
                      />
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {teamSetup.primaryColor}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="secondary-color" className={labelClasses}>
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="secondary-color"
                        type="color"
                        value={teamSetup.secondaryColor}
                        onChange={(e) =>
                          setTeamSetup((prev) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
                        data-testid="secondary-color-input"
                      />
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {teamSetup.secondaryColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </OnboardingStep>

          {/* Step 3: Offensive Identity */}
          <OnboardingStep active={currentStep === 2} direction={direction}>
            <div>
              <h2 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Offensive Identity
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                Pick your base formation family and personnel tendency
              </p>

              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>Base Formation Family</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="formation-family-options">
                    {FORMATION_FAMILIES.map((family) => (
                      <button
                        key={family}
                        type="button"
                        onClick={() =>
                          setOffensiveIdentity((prev) => ({ ...prev, formationFamily: family }))
                        }
                        className={cn(
                          'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                          offensiveIdentity.formationFamily === family
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750',
                        )}
                      >
                        {family}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Personnel Tendency</label>
                  <div className="grid grid-cols-2 gap-2" data-testid="personnel-options">
                    {PERSONNEL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setOffensiveIdentity((prev) => ({ ...prev, personnel: opt.value }))
                        }
                        className={cn(
                          'rounded-lg border px-4 py-3 text-left transition-colors',
                          offensiveIdentity.personnel === opt.value
                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                            : 'border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750',
                        )}
                      >
                        <span
                          className={cn(
                            'block text-sm font-medium',
                            offensiveIdentity.personnel === opt.value
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-zinc-700 dark:text-zinc-300',
                          )}
                        >
                          {opt.label}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </OnboardingStep>

          {/* Step 4: First Play */}
          <OnboardingStep active={currentStep === 3} direction={direction}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                <svg
                  className="h-12 w-12 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                This is your first play!
              </h2>
              {firstPlay && (
                <div className="mt-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {firstPlay.name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Formation:{' '}
                    {BUILT_IN_FORMATIONS.find((f) => f.id === firstPlay.formationId)?.name ||
                      'Custom'}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Personnel: {firstPlay.personnel}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Assignments: {firstPlay.assignments.length} routes
                  </p>
                  <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-sm text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-500" data-testid="play-preview">
                    Play diagram preview
                  </div>
                </div>
              )}
            </div>
          </OnboardingStep>

          {/* Step 5: Done */}
          <OnboardingStep active={currentStep === 4} direction={direction}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <svg
                  className="h-12 w-12 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                You&apos;re all set!
              </h2>
              <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                Here&apos;s what you can do next:
              </p>

              <div className="grid w-full gap-3">
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
                  data-testid="cta-draw-play"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Draw a play
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      Open the sketch pad and design your next play
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
                  data-testid="cta-browse-formations"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Browse formations
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      Explore built-in formations and create your own
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
                  data-testid="cta-import-plays"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Import plays
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      Upload existing playbooks or individual plays
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </OnboardingStep>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div>
            {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
              <Button variant="ghost" onClick={goBack} data-testid="back-button">
                Back
              </Button>
            )}
          </div>
          <div>
            {currentStep < 2 && (
              <Button onClick={goNext} data-testid="next-button">
                {currentStep === 0 ? 'Get Started' : 'Next'}
              </Button>
            )}
            {currentStep === 2 && (
              <Button onClick={handleStepThreeNext} data-testid="next-button">
                Next
              </Button>
            )}
            {currentStep === 3 && (
              <Button onClick={goNext} data-testid="next-button">
                Next
              </Button>
            )}
            {currentStep === TOTAL_STEPS - 1 && (
              <Button onClick={handleComplete} data-testid="finish-button">
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
