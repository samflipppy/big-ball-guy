import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingTable } from '@/components/billing/PricingTable';

// Mock the stripe module to prevent actual API calls
vi.mock('@/lib/stripe', async () => {
  const actual = await vi.importActual('@/lib/stripe');
  return {
    ...actual,
    createCheckoutSession: vi.fn(),
  };
});

describe('PricingTable', () => {
  it('renders all three plan cards', () => {
    render(<PricingTable />);
    expect(screen.getByTestId('plan-card-free')).toBeInTheDocument();
    expect(screen.getByTestId('plan-card-pro')).toBeInTheDocument();
    expect(screen.getByTestId('plan-card-team')).toBeInTheDocument();
  });

  it('displays plan names', () => {
    render(<PricingTable />);
    expect(screen.getByTestId('plan-card-free')).toHaveTextContent('Free');
    expect(screen.getByTestId('plan-card-pro')).toHaveTextContent('Pro');
    expect(screen.getByTestId('plan-card-team')).toHaveTextContent('Team');
  });

  it('shows monthly prices by default', () => {
    render(<PricingTable />);
    expect(screen.getByTestId('plan-card-free')).toHaveTextContent('$0');
    expect(screen.getByTestId('plan-card-pro')).toHaveTextContent('$9.99');
    expect(screen.getByTestId('plan-card-team')).toHaveTextContent('$24.99');
  });

  it('shows annual prices when toggle is switched', async () => {
    const user = userEvent.setup();
    render(<PricingTable />);

    const toggle = screen.getByTestId('billing-toggle');
    await user.click(toggle);

    // Annual prices
    expect(screen.getByTestId('plan-card-pro')).toHaveTextContent('$8.33');
    expect(screen.getByTestId('plan-card-team')).toHaveTextContent('$20.83');
  });

  it('toggles back to monthly', async () => {
    const user = userEvent.setup();
    render(<PricingTable />);

    const toggle = screen.getByTestId('billing-toggle');

    // Switch to annual
    await user.click(toggle);
    expect(screen.getByTestId('plan-card-pro')).toHaveTextContent('$8.33');

    // Switch back to monthly
    await user.click(toggle);
    expect(screen.getByTestId('plan-card-pro')).toHaveTextContent('$9.99');
  });

  it('highlights the current plan', () => {
    render(<PricingTable currentPlan="pro" />);
    const proCard = screen.getByTestId('plan-card-pro');
    expect(proCard).toHaveTextContent('Current Plan');
  });

  it('shows "Current Plan" on the CTA for the current plan', () => {
    render(<PricingTable currentPlan="free" />);
    const freeCta = screen.getByTestId('plan-cta-free');
    expect(freeCta).toHaveTextContent('Current Plan');
    expect(freeCta).toBeDisabled();
  });

  it('shows "Upgrade" on CTAs for plans above current', () => {
    render(<PricingTable currentPlan="free" />);
    expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent('Upgrade');
    expect(screen.getByTestId('plan-cta-team')).toHaveTextContent('Upgrade');
  });

  it('shows "Most Popular" badge on Pro plan', () => {
    render(<PricingTable currentPlan="free" />);
    const proCard = screen.getByTestId('plan-card-pro');
    expect(proCard).toHaveTextContent('Most Popular');
  });

  it('renders the feature comparison table', () => {
    render(<PricingTable />);
    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
  });

  it('shows the "2 months free" badge on annual toggle', () => {
    render(<PricingTable />);
    expect(screen.getByText('2 months free')).toBeInTheDocument();
  });

  it('shows feature list for each plan', () => {
    render(<PricingTable />);
    const freeCard = screen.getByTestId('plan-card-free');
    expect(freeCard).toHaveTextContent('Up to 5 plays');
    expect(freeCard).toHaveTextContent('1 game plan');

    const proCard = screen.getByTestId('plan-card-pro');
    expect(proCard).toHaveTextContent('Unlimited plays');

    const teamCard = screen.getByTestId('plan-card-team');
    expect(teamCard).toHaveTextContent('Up to 10 coaches');
  });

  it('calls onSelectPlan when a plan CTA is clicked', async () => {
    const user = userEvent.setup();
    const onSelectPlan = vi.fn();
    render(<PricingTable currentPlan="free" onSelectPlan={onSelectPlan} />);

    await user.click(screen.getByTestId('plan-cta-pro'));
    expect(onSelectPlan).toHaveBeenCalledWith('pro');
  });

  it('renders comparison table with all feature rows', () => {
    render(<PricingTable />);
    const table = screen.getByTestId('comparison-table');
    // Check some feature labels
    expect(within(table).getByText('Plays')).toBeInTheDocument();
    expect(within(table).getByText('Game plans')).toBeInTheDocument();
    expect(within(table).getByText('PDF & image export')).toBeInTheDocument();
    expect(within(table).getByText('Real-time collaboration')).toBeInTheDocument();
    expect(within(table).getByText('Priority support')).toBeInTheDocument();
  });
});
