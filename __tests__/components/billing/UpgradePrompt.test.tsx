import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';

describe('UpgradePrompt', () => {
  it('renders the usage text with correct values', () => {
    render(
      <UpgradePrompt feature="plays" currentUsage={5} limit={5} />,
    );
    expect(screen.getByTestId('usage-text')).toHaveTextContent(
      "You've used 5/5 plays. Upgrade to Pro for unlimited.",
    );
  });

  it('renders with different feature names and usage', () => {
    render(
      <UpgradePrompt feature="game plans" currentUsage={1} limit={1} />,
    );
    expect(screen.getByTestId('usage-text')).toHaveTextContent(
      "You've used 1/1 game plans. Upgrade to Pro for unlimited.",
    );
  });

  it('renders the upgrade button', () => {
    render(
      <UpgradePrompt feature="plays" currentUsage={5} limit={5} />,
    );
    expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
    expect(screen.getByTestId('upgrade-button')).toHaveTextContent('Upgrade');
  });

  it('calls onUpgrade when upgrade button is clicked', async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();
    render(
      <UpgradePrompt
        feature="plays"
        currentUsage={5}
        limit={5}
        onUpgrade={onUpgrade}
      />,
    );

    await user.click(screen.getByTestId('upgrade-button'));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('dismisses when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <UpgradePrompt
        feature="plays"
        currentUsage={5}
        limit={5}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();

    await user.click(screen.getByTestId('dismiss-button'));

    expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays hidden after dismissal', async () => {
    const user = userEvent.setup();
    render(
      <UpgradePrompt feature="plays" currentUsage={5} limit={5} />,
    );

    await user.click(screen.getByTestId('dismiss-button'));
    expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
  });

  it('renders the alert role for accessibility', () => {
    render(
      <UpgradePrompt feature="plays" currentUsage={3} limit={5} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <UpgradePrompt
        feature="plays"
        currentUsage={5}
        limit={5}
        className="my-custom-class"
      />,
    );
    expect(screen.getByTestId('upgrade-prompt').className).toContain(
      'my-custom-class',
    );
  });

  it('renders dismiss button with accessible label', () => {
    render(
      <UpgradePrompt feature="plays" currentUsage={5} limit={5} />,
    );
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });
});
