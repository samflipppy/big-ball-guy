import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemBuilder } from '@/components/onboarding/SystemBuilder';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 9),
});

describe('SystemBuilder', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders the system builder', () => {
    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.getByTestId('system-builder')).toBeInTheDocument();
  });

  it('shows the title "Build Your System"', () => {
    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.getByText('Build Your System')).toBeInTheDocument();
  });

  it('renders the progress bar with all 7 step labels', () => {
    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('step-label-0')).toHaveTextContent('Philosophy');
    expect(screen.getByTestId('step-label-1')).toHaveTextContent('Formations');
    expect(screen.getByTestId('step-label-2')).toHaveTextContent('Run Game');
    expect(screen.getByTestId('step-label-3')).toHaveTextContent('Pass Game');
    expect(screen.getByTestId('step-label-4')).toHaveTextContent('Protections');
    expect(screen.getByTestId('step-label-5')).toHaveTextContent('Automatics');
    expect(screen.getByTestId('step-label-6')).toHaveTextContent('Review');
  });

  // --- Step 1: Philosophy ---

  it('starts on the Philosophy step', () => {
    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.getByTestId('step-philosophy')).toBeInTheDocument();
    expect(screen.getByText('Offensive Philosophy')).toBeInTheDocument();
  });

  it('shows style options (run-heavy, balanced, pass-heavy)', () => {
    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.getByTestId('style-run-heavy')).toBeInTheDocument();
    expect(screen.getByTestId('style-balanced')).toBeInTheDocument();
    expect(screen.getByTestId('style-pass-heavy')).toBeInTheDocument();
  });

  it('shows tempo options (fast, moderate, slow)', () => {
    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.getByTestId('tempo-fast')).toBeInTheDocument();
    expect(screen.getByTestId('tempo-moderate')).toBeInTheDocument();
    expect(screen.getByTestId('tempo-slow')).toBeInTheDocument();
  });

  it('can select a philosophy style', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('style-run-heavy'));
    // The button should now have the selected class
    expect(screen.getByTestId('style-run-heavy').className).toContain('border-blue-500');
  });

  it('can select a tempo preference', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('tempo-fast'));
    expect(screen.getByTestId('tempo-fast').className).toContain('border-blue-500');
  });

  // --- Step 2: Formations ---

  it('navigates to Formations step when clicking Next', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('step-formations')).toBeInTheDocument();
    expect(screen.getByText('Base Formations')).toBeInTheDocument();
  });

  it('shows formation count', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('formation-count')).toHaveTextContent('0 of 4-6 selected');
  });

  it('can select formations', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('next-button'));
    await user.click(screen.getByTestId('formation-option-builtin-singleback'));
    expect(screen.getByTestId('formation-count')).toHaveTextContent('1 of 4-6 selected');
  });

  it('can deselect formations', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('next-button'));
    await user.click(screen.getByTestId('formation-option-builtin-singleback'));
    await user.click(screen.getByTestId('formation-option-builtin-singleback'));
    expect(screen.getByTestId('formation-count')).toHaveTextContent('0 of 4-6 selected');
  });

  it('disables Next button when fewer than 4 formations selected', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('next-button')); // to formations
    // Select only 2 formations
    await user.click(screen.getByTestId('formation-option-builtin-singleback'));
    await user.click(screen.getByTestId('formation-option-builtin-shotgun'));

    const nextBtn = screen.getByTestId('next-button');
    expect(nextBtn).toBeDisabled();
  });

  it('enables Next button when at least 4 formations selected', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('next-button')); // to formations
    await user.click(screen.getByTestId('formation-option-builtin-singleback'));
    await user.click(screen.getByTestId('formation-option-builtin-shotgun'));
    await user.click(screen.getByTestId('formation-option-builtin-pistol'));
    await user.click(screen.getByTestId('formation-option-builtin-iform'));

    const nextBtn = screen.getByTestId('next-button');
    expect(nextBtn).not.toBeDisabled();
  });

  // --- Navigation ---

  it('can navigate back from Formations to Philosophy', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('step-formations')).toBeInTheDocument();

    await user.click(screen.getByTestId('back-button'));
    expect(screen.getByTestId('step-philosophy')).toBeInTheDocument();
  });

  it('does not show Back button on first step', () => {
    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
  });

  // --- Reset ---

  it('resets to default state when clicking Reset', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    // Navigate to formations
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('step-formations')).toBeInTheDocument();

    // Reset
    await user.click(screen.getByTestId('reset-button'));
    expect(screen.getByTestId('step-philosophy')).toBeInTheDocument();
  });

  // --- localStorage persistence ---

  it('saves progress to localStorage', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('style-run-heavy'));

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const matchingCalls = localStorageMock.setItem.mock.calls.filter(
      (call: string[]) => call[0] === 'system_builder_progress',
    );
    expect(matchingCalls.length).toBeGreaterThan(0);
    // Use the last call (after the click updated the state)
    const lastCall = matchingCalls[matchingCalls.length - 1];
    const saved = JSON.parse(lastCall[1]);
    expect(saved.philosophy.style).toBe('run-heavy');
  });

  it('restores progress from localStorage on mount', () => {
    const savedState = {
      currentStep: 1,
      philosophy: { style: 'pass-heavy', tempo: 'fast' },
      selectedFormationIds: ['builtin-singleback'],
      runConceptsByFormation: {},
      passConceptsByFormation: {},
      selectedProtectionIds: [],
      hotRouteRules: [],
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));

    render(<SystemBuilder onComplete={vi.fn()} />);
    // Should start on step 1 (Formations)
    expect(screen.getByTestId('step-formations')).toBeInTheDocument();
  });

  it('clears localStorage after reset', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    await user.click(screen.getByTestId('reset-button'));
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('system_builder_progress');
  });

  // --- Full flow through to review ---

  it('navigates through all steps to the review', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    // Step 1: Philosophy
    await user.click(screen.getByTestId('style-balanced'));
    await user.click(screen.getByTestId('tempo-moderate'));
    await user.click(screen.getByTestId('next-button'));

    // Step 2: Formations - select 4
    await user.click(screen.getByTestId('formation-option-builtin-singleback'));
    await user.click(screen.getByTestId('formation-option-builtin-shotgun'));
    await user.click(screen.getByTestId('formation-option-builtin-pistol'));
    await user.click(screen.getByTestId('formation-option-builtin-iform'));
    await user.click(screen.getByTestId('next-button'));

    // Step 3: Run Game - select 3 concepts per formation
    expect(screen.getByTestId('step-run-game')).toBeInTheDocument();
    const formationIds = ['builtin-singleback', 'builtin-shotgun', 'builtin-pistol', 'builtin-iform'];
    const runSchemeIds = ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'];
    for (const fId of formationIds) {
      for (const sId of runSchemeIds) {
        await user.click(screen.getByTestId(`run-concept-${fId}-${sId}`));
      }
    }
    await user.click(screen.getByTestId('next-button'));

    // Step 4: Pass Game - select 3 concepts per formation
    expect(screen.getByTestId('step-pass-game')).toBeInTheDocument();
    const passConceptIds = ['concept-mesh', 'concept-smash', 'concept-flood'];
    for (const fId of formationIds) {
      for (const cId of passConceptIds) {
        await user.click(screen.getByTestId(`pass-concept-${fId}-${cId}`));
      }
    }
    await user.click(screen.getByTestId('next-button'));

    // Step 5: Protections - select at least 1
    expect(screen.getByTestId('step-protections')).toBeInTheDocument();
    await user.click(screen.getByTestId('protection-option-scheme-half-slide'));
    await user.click(screen.getByTestId('next-button'));

    // Step 6: Automatics
    expect(screen.getByTestId('step-automatics')).toBeInTheDocument();
    await user.click(screen.getByTestId('hot-route-hot-1'));
    await user.click(screen.getByTestId('next-button'));

    // Step 7: Review
    expect(screen.getByTestId('step-review')).toBeInTheDocument();
    expect(screen.getByText('System Review')).toBeInTheDocument();
    expect(screen.getByTestId('review-philosophy')).toBeInTheDocument();
    expect(screen.getByTestId('review-formations')).toBeInTheDocument();
    expect(screen.getByTestId('review-protections')).toBeInTheDocument();
    expect(screen.getByTestId('review-automatics')).toBeInTheDocument();
    expect(screen.getByTestId('review-total')).toBeInTheDocument();
  });

  // --- Step 5: Protections ---

  it('renders protection options on Step 5', async () => {
    const user = userEvent.setup();
    render(<SystemBuilder onComplete={vi.fn()} />);

    // Navigate to step 5 quickly (set valid state via localStorage)
    const savedState = {
      currentStep: 4,
      philosophy: { style: 'balanced', tempo: 'moderate' },
      selectedFormationIds: ['builtin-singleback', 'builtin-shotgun', 'builtin-pistol', 'builtin-iform'],
      runConceptsByFormation: {
        'builtin-singleback': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-shotgun': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-pistol': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-iform': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
      },
      passConceptsByFormation: {
        'builtin-singleback': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-shotgun': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-pistol': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-iform': ['concept-mesh', 'concept-smash', 'concept-flood'],
      },
      selectedProtectionIds: [],
      hotRouteRules: [],
    };
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));
    const { unmount } = render(<SystemBuilder onComplete={vi.fn()} />);

    expect(screen.getByTestId('step-protections')).toBeInTheDocument();
    expect(screen.getByTestId('protection-option-scheme-half-slide')).toBeInTheDocument();
    expect(screen.getByTestId('protection-option-scheme-full-slide')).toBeInTheDocument();
    expect(screen.getByTestId('protection-option-scheme-sprint-out')).toBeInTheDocument();
    unmount();
  });

  // --- Step 6: Automatics ---

  it('renders hot route options on Step 6', () => {
    const savedState = {
      currentStep: 5,
      philosophy: { style: 'balanced', tempo: 'moderate' },
      selectedFormationIds: ['builtin-singleback', 'builtin-shotgun', 'builtin-pistol', 'builtin-iform'],
      runConceptsByFormation: {
        'builtin-singleback': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-shotgun': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-pistol': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-iform': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
      },
      passConceptsByFormation: {
        'builtin-singleback': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-shotgun': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-pistol': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-iform': ['concept-mesh', 'concept-smash', 'concept-flood'],
      },
      selectedProtectionIds: ['scheme-half-slide'],
      hotRouteRules: [],
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));

    render(<SystemBuilder onComplete={vi.fn()} />);
    expect(screen.getByTestId('step-automatics')).toBeInTheDocument();
    expect(screen.getByTestId('hot-route-hot-1')).toBeInTheDocument();
    expect(screen.getByTestId('hot-route-hot-2')).toBeInTheDocument();
    expect(screen.getByTestId('hot-route-hot-3')).toBeInTheDocument();
  });

  // --- Completion ---

  it('calls onComplete with generated plays when clicking Build System', () => {
    const onComplete = vi.fn();
    const savedState = {
      currentStep: 6,
      philosophy: { style: 'balanced', tempo: 'moderate' },
      selectedFormationIds: ['builtin-singleback', 'builtin-shotgun', 'builtin-pistol', 'builtin-iform'],
      runConceptsByFormation: {
        'builtin-singleback': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-shotgun': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-pistol': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-iform': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
      },
      passConceptsByFormation: {
        'builtin-singleback': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-shotgun': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-pistol': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-iform': ['concept-mesh', 'concept-smash', 'concept-flood'],
      },
      selectedProtectionIds: ['scheme-half-slide'],
      hotRouteRules: [{ id: 'hot-1', trigger: 'Blitz from edge', route: 'Quick slant', description: 'Hot WR' }],
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));

    render(<SystemBuilder onComplete={onComplete} />);
    expect(screen.getByTestId('step-review')).toBeInTheDocument();

    // 4 formations x (3 run + 3 pass) = 24 plays
    expect(screen.getByTestId('review-total')).toHaveTextContent('24');

    screen.getByTestId('complete-button').click();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const plays = onComplete.mock.calls[0][0];
    expect(plays).toHaveLength(24);

    // Verify play structure
    const firstPlay = plays[0];
    expect(firstPlay.id).toBeDefined();
    expect(firstPlay.name).toBeDefined();
    expect(firstPlay.formationId).toBeDefined();
    expect(firstPlay.tags).toContain('system');
    expect(firstPlay.teamId).toBe('system');
  });

  it('clears localStorage after completing the wizard', () => {
    const savedState = {
      currentStep: 6,
      philosophy: { style: 'balanced', tempo: 'moderate' },
      selectedFormationIds: ['builtin-singleback', 'builtin-shotgun', 'builtin-pistol', 'builtin-iform'],
      runConceptsByFormation: {
        'builtin-singleback': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-shotgun': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-pistol': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-iform': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
      },
      passConceptsByFormation: {
        'builtin-singleback': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-shotgun': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-pistol': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-iform': ['concept-mesh', 'concept-smash', 'concept-flood'],
      },
      selectedProtectionIds: ['scheme-half-slide'],
      hotRouteRules: [],
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));

    render(<SystemBuilder onComplete={vi.fn()} />);
    screen.getByTestId('complete-button').click();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('system_builder_progress');
  });

  it('shows the complete button with play count on the review step', () => {
    const savedState = {
      currentStep: 6,
      philosophy: { style: 'balanced', tempo: 'moderate' },
      selectedFormationIds: ['builtin-singleback', 'builtin-shotgun', 'builtin-pistol', 'builtin-iform'],
      runConceptsByFormation: {
        'builtin-singleback': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-shotgun': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-pistol': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
        'builtin-iform': ['scheme-inside-zone', 'scheme-outside-zone', 'scheme-power'],
      },
      passConceptsByFormation: {
        'builtin-singleback': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-shotgun': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-pistol': ['concept-mesh', 'concept-smash', 'concept-flood'],
        'builtin-iform': ['concept-mesh', 'concept-smash', 'concept-flood'],
      },
      selectedProtectionIds: ['scheme-half-slide'],
      hotRouteRules: [],
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));

    render(<SystemBuilder onComplete={vi.fn()} />);
    const btn = screen.getByTestId('complete-button');
    expect(btn).toHaveTextContent('Build System (24 plays)');
  });
});
