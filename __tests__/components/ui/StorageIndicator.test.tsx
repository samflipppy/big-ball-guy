import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageIndicator } from '@/components/ui/StorageIndicator';

// ---------------------------------------------------------------------------
// Mock useStorageQuota
// ---------------------------------------------------------------------------

const mockQuotaReturn = vi.hoisted(() => ({
  usage: 500_000,
  quota: 1_000_000,
  percentUsed: 50,
  isWarning: false,
  isCritical: false,
}));

vi.mock('@/hooks/useStorageQuota', () => ({
  useStorageQuota: () => mockQuotaReturn,
}));

beforeEach(() => {
  mockQuotaReturn.usage = 500_000;
  mockQuotaReturn.quota = 1_000_000;
  mockQuotaReturn.percentUsed = 50;
  mockQuotaReturn.isWarning = false;
  mockQuotaReturn.isCritical = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StorageIndicator', () => {
  it('renders the indicator container', () => {
    render(<StorageIndicator />);
    expect(screen.getByTestId('storage-indicator')).toBeInTheDocument();
  });

  it('shows percent used', () => {
    render(<StorageIndicator />);
    expect(screen.getByTestId('storage-percent').textContent).toBe('50%');
  });

  it('shows "Storage" status text at normal usage', () => {
    render(<StorageIndicator />);
    expect(screen.getByTestId('storage-status-text').textContent).toBe('Storage');
  });

  it('shows warning text at 80%+', () => {
    mockQuotaReturn.percentUsed = 85;
    mockQuotaReturn.isWarning = true;
    render(<StorageIndicator />);
    expect(screen.getByTestId('storage-status-text').textContent).toContain('getting full');
  });

  it('shows critical text at 95%+', () => {
    mockQuotaReturn.percentUsed = 97;
    mockQuotaReturn.isWarning = true;
    mockQuotaReturn.isCritical = true;
    render(<StorageIndicator />);
    expect(screen.getByTestId('storage-status-text').textContent).toContain('almost full');
  });

  it('renders a progress bar', () => {
    render(<StorageIndicator />);
    const bar = screen.getByTestId('storage-bar');
    expect(bar).toHaveAttribute('role', 'progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
  });

  it('expands to show details when showDetails is true', () => {
    render(<StorageIndicator showDetails />);
    expect(screen.getByTestId('storage-details')).toBeInTheDocument();
    expect(screen.getByTestId('storage-usage-detail')).toBeInTheDocument();
  });

  it('does not show details by default', () => {
    render(<StorageIndicator />);
    expect(screen.queryByTestId('storage-details')).not.toBeInTheDocument();
  });

  it('toggles details on click', async () => {
    const user = userEvent.setup();
    render(<StorageIndicator />);

    expect(screen.queryByTestId('storage-details')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('storage-indicator-toggle'));

    expect(screen.getByTestId('storage-details')).toBeInTheDocument();
  });

  it('shows clear button when warning and onClearOldData provided', async () => {
    mockQuotaReturn.isWarning = true;
    const user = userEvent.setup();

    render(<StorageIndicator showDetails onClearOldData={vi.fn()} />);

    expect(screen.getByTestId('storage-clear-btn')).toBeInTheDocument();
  });

  it('does not show clear button at normal usage', () => {
    render(<StorageIndicator showDetails onClearOldData={vi.fn()} />);
    expect(screen.queryByTestId('storage-clear-btn')).not.toBeInTheDocument();
  });

  it('calls onClearOldData when clear button is clicked', async () => {
    mockQuotaReturn.isWarning = true;
    const onClear = vi.fn();
    const user = userEvent.setup();

    render(<StorageIndicator showDetails onClearOldData={onClear} />);

    await user.click(screen.getByTestId('storage-clear-btn'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<StorageIndicator className="test-class" />);
    expect(screen.getByTestId('storage-indicator').className).toContain('test-class');
  });
});
