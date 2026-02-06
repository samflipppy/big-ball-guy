import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

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

describe('OnboardingWizard', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders when onboarding has not been completed', () => {
    render(<OnboardingWizard />);
    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
  });

  it('does not render when onboarding is already complete', () => {
    localStorageMock.getItem.mockReturnValueOnce('true');
    render(<OnboardingWizard />);
    expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument();
  });

  it('shows the welcome step initially', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Welcome, Coach!')).toBeInTheDocument();
    expect(
      screen.getByText(/set up your playbook in 60 seconds/i),
    ).toBeInTheDocument();
  });

  it('renders progress dots for all 5 steps', () => {
    render(<OnboardingWizard />);
    const dots = screen.getByTestId('progress-dots');
    // 5 child divs (the dots)
    expect(dots.children.length).toBe(5);
  });

  it('navigates to the next step when clicking Get Started / Next', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    // Step 1 -> 2
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByText('Team Setup')).toBeInTheDocument();
  });

  it('navigates forward through steps and then back', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    // Step 1 -> 2
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByText('Team Setup')).toBeInTheDocument();

    // Step 2 -> 3
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByText('Offensive Identity')).toBeInTheDocument();

    // Step 3 -> 2 (back)
    await user.click(screen.getByTestId('back-button'));
    expect(screen.getByText('Team Setup')).toBeInTheDocument();
  });

  it('skips onboarding when skip button is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingWizard onComplete={onComplete} />);

    await user.click(screen.getByTestId('skip-button'));

    expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'playbook_onboarding_complete',
      'true',
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('allows user to fill in team setup fields', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    // Navigate to team setup
    await user.click(screen.getByTestId('next-button'));

    const nameInput = screen.getByTestId('team-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Eagles');
    expect(nameInput).toHaveValue('Eagles');

    const levelSelect = screen.getByTestId('team-level-select');
    await user.selectOptions(levelSelect, 'college');
    expect(levelSelect).toHaveValue('college');
  });

  it('shows formation family and personnel options on step 3', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    // Navigate to step 3
    await user.click(screen.getByTestId('next-button')); // to step 2
    await user.click(screen.getByTestId('next-button')); // to step 3

    expect(screen.getByText('Offensive Identity')).toBeInTheDocument();
    expect(screen.getByTestId('formation-family-options')).toBeInTheDocument();
    expect(screen.getByTestId('personnel-options')).toBeInTheDocument();

    // All formation families present
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('Pro Style')).toBeInTheDocument();
    expect(screen.getByText('Wing-T')).toBeInTheDocument();
    expect(screen.getByText('Option')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();

    // All personnel options present
    expect(screen.getByText('11 Personnel')).toBeInTheDocument();
    expect(screen.getByText('12 Personnel')).toBeInTheDocument();
    expect(screen.getByText('21 Personnel')).toBeInTheDocument();
    expect(screen.getByText('22 Personnel')).toBeInTheDocument();
  });

  it('generates a first play on step 4', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    // Navigate through to step 4
    await user.click(screen.getByTestId('next-button')); // step 1->2
    await user.click(screen.getByTestId('next-button')); // step 2->3
    await user.click(screen.getByTestId('next-button')); // step 3->4 (triggers play generation)

    expect(screen.getByText('This is your first play!')).toBeInTheDocument();
    expect(screen.getByTestId('play-preview')).toBeInTheDocument();
  });

  it('completes onboarding and sets localStorage flag on final step', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingWizard onComplete={onComplete} />);

    // Navigate through all steps
    await user.click(screen.getByTestId('next-button')); // 1->2
    await user.click(screen.getByTestId('next-button')); // 2->3
    await user.click(screen.getByTestId('next-button')); // 3->4
    await user.click(screen.getByTestId('next-button')); // 4->5

    // Step 5: Done
    expect(screen.getByText(/You're all set!/i)).toBeInTheDocument();
    expect(screen.getByTestId('cta-draw-play')).toBeInTheDocument();
    expect(screen.getByTestId('cta-browse-formations')).toBeInTheDocument();
    expect(screen.getByTestId('cta-import-plays')).toBeInTheDocument();

    // Click finish
    await user.click(screen.getByTestId('finish-button'));

    expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'playbook_onboarding_complete',
      'true',
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows skip button on every step', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    // Step 1
    expect(screen.getByTestId('skip-button')).toBeInTheDocument();

    // Step 2
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('skip-button')).toBeInTheDocument();

    // Step 3
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('skip-button')).toBeInTheDocument();

    // Step 4
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('skip-button')).toBeInTheDocument();

    // Step 5
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('skip-button')).toBeInTheDocument();
  });
});
