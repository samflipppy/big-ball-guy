import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureTooltip } from '@/components/ui/FeatureTooltip';
import * as featureDiscovery from '@/lib/feature-discovery';

// Mock the feature discovery module
vi.mock('@/lib/feature-discovery', async () => {
  const actual = await vi.importActual('@/lib/feature-discovery');
  return {
    ...actual,
    isDiscovered: vi.fn().mockReturnValue(false),
    markDiscovered: vi.fn(),
  };
});

describe('FeatureTooltip', () => {
  const mockIsDiscovered = featureDiscovery.isDiscovered as ReturnType<typeof vi.fn>;
  const mockMarkDiscovered = featureDiscovery.markDiscovered as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDiscovered.mockReturnValue(false);
  });

  it('renders children', () => {
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );
    expect(screen.getByText('My Button')).toBeInTheDocument();
  });

  it('shows pulsing dot for undiscovered features', () => {
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );
    expect(screen.getByTestId('pulse-dot')).toBeInTheDocument();
  });

  it('does not show pulsing dot for discovered features', () => {
    mockIsDiscovered.mockReturnValue(true);
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );
    expect(screen.queryByTestId('pulse-dot')).not.toBeInTheDocument();
  });

  it('shows tooltip on dot click', async () => {
    const user = userEvent.setup();
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );

    await user.click(screen.getByTestId('pulse-dot'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Command Palette')).toBeInTheDocument();
  });

  it('displays feature description in tooltip', async () => {
    const user = userEvent.setup();
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );

    await user.click(screen.getByTestId('pulse-dot'));

    const feature = featureDiscovery.FEATURES.find((f) => f.id === 'command-palette');
    expect(screen.getByText(feature!.description)).toBeInTheDocument();
  });

  it('marks feature as discovered when "Got it" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );

    await user.click(screen.getByTestId('pulse-dot'));
    await user.click(screen.getByTestId('got-it-button'));

    expect(mockMarkDiscovered).toHaveBeenCalledWith('command-palette');
  });

  it('has an accessible label on the pulse dot button', () => {
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );
    const dotButton = screen.getByTestId('pulse-dot');
    expect(dotButton).toHaveAttribute('aria-label', 'Learn about Command Palette');
  });

  it('renders just children if featureId is not in FEATURES', () => {
    render(
      <FeatureTooltip featureId="nonexistent-feature">
        <button>My Button</button>
      </FeatureTooltip>,
    );
    expect(screen.getByText('My Button')).toBeInTheDocument();
    expect(screen.queryByTestId('pulse-dot')).not.toBeInTheDocument();
  });

  it('toggles tooltip visibility on dot click', async () => {
    const user = userEvent.setup();
    render(
      <FeatureTooltip featureId="command-palette">
        <button>My Button</button>
      </FeatureTooltip>,
    );

    // First click shows tooltip
    await user.click(screen.getByTestId('pulse-dot'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Second click hides tooltip
    await user.click(screen.getByTestId('pulse-dot'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
