import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '@/app/(app)/settings/page';

// Mock the stripe module to prevent actual API calls
vi.mock('@/lib/stripe', async () => {
  const actual = await vi.importActual('@/lib/stripe');
  return {
    ...actual,
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
  };
});

describe('SettingsPage', () => {
  it('renders the settings page', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders section navigation with Team, Billing, Account', () => {
    render(<SettingsPage />);
    const nav = screen.getByTestId('section-nav');
    expect(nav).toHaveTextContent('Team');
    expect(nav).toHaveTextContent('Billing');
    expect(nav).toHaveTextContent('Account');
  });

  it('shows Team section by default', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('team-section')).toBeInTheDocument();
    expect(screen.getByText('Team Settings')).toBeInTheDocument();
  });

  it('renders team name input in team section', () => {
    render(<SettingsPage />);
    const nameInput = screen.getByLabelText('Team Name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('My Team');
  });

  it('renders level select in team section', () => {
    render(<SettingsPage />);
    const levelSelect = screen.getByLabelText('Level');
    expect(levelSelect).toBeInTheDocument();
  });

  it('renders color pickers in team section', () => {
    render(<SettingsPage />);
    expect(screen.getByLabelText('Primary Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary Color')).toBeInTheDocument();
  });

  it('renders Save Changes button in team section', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('switches to Billing section when clicking Billing tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Billing'));
    expect(screen.getByTestId('billing-section')).toBeInTheDocument();
    expect(screen.getByText('Billing & Plans')).toBeInTheDocument();
  });

  it('shows current plan in billing section', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Billing'));
    expect(screen.getByText('Current plan')).toBeInTheDocument();
    // The current plan label is in the billing info card (not the PricingTable)
    const billingSection = screen.getByTestId('billing-section');
    const planInfoCards = billingSection.querySelectorAll('p.text-lg');
    const planLabel = Array.from(planInfoCards).find((el) => el.textContent === 'Free');
    expect(planLabel).toBeInTheDocument();
  });

  it('shows PricingTable in billing section', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Billing'));
    expect(screen.getByTestId('pricing-table')).toBeInTheDocument();
  });

  it('shows Manage Billing button in billing section', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Billing'));
    expect(screen.getByText('Manage Billing')).toBeInTheDocument();
  });

  it('switches to Account section when clicking Account tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Account'));
    expect(screen.getByTestId('account-section')).toBeInTheDocument();
  });

  it('shows email in account section', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Account'));
    expect(screen.getByText('coach@example.com')).toBeInTheDocument();
  });

  it('shows Change Password button in account section', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Account'));
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('shows Log Out button in account section', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('Account'));
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('navigates between all three sections', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    // Team is visible by default
    expect(screen.getByTestId('team-section')).toBeInTheDocument();

    // Go to Billing
    await user.click(screen.getByText('Billing'));
    expect(screen.queryByTestId('team-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('billing-section')).toBeInTheDocument();

    // Go to Account
    await user.click(screen.getByText('Account'));
    expect(screen.queryByTestId('billing-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-section')).toBeInTheDocument();

    // Back to Team
    await user.click(screen.getByText('Team'));
    expect(screen.queryByTestId('account-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('team-section')).toBeInTheDocument();
  });
});
