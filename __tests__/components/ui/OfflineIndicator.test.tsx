import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import type { SyncStatus } from '@/types';

const makeSyncStatus = (overrides: Partial<SyncStatus> = {}): SyncStatus => ({
  lastSaved: new Date().toISOString(),
  lastSynced: new Date().toISOString(),
  pendingChanges: 0,
  isOnline: true,
  isSyncing: false,
  ...overrides,
});

describe('OfflineIndicator', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
      writable: true,
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not render when online', () => {
    render(<OfflineIndicator />);

    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
  });

  it('shows offline message when going offline', () => {
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('offline-indicator-message').textContent).toContain(
      "You're offline",
    );
  });

  it('shows offline message when initially offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    render(<OfflineIndicator />);

    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('offline-indicator-message').textContent).toContain(
      "You're offline",
    );
  });

  it('shows pending sync count when offline with pending changes', () => {
    render(
      <OfflineIndicator syncStatus={makeSyncStatus({ pendingChanges: 3, isOnline: false })} />,
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('pending-count')).toBeInTheDocument();
    expect(screen.getByTestId('pending-count').textContent).toContain('3 changes pending sync');
  });

  it('shows singular "change" for 1 pending change', () => {
    render(
      <OfflineIndicator syncStatus={makeSyncStatus({ pendingChanges: 1, isOnline: false })} />,
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('pending-count').textContent).toContain('1 change pending sync');
  });

  it('does not show pending count when there are zero pending changes', () => {
    render(
      <OfflineIndicator syncStatus={makeSyncStatus({ pendingChanges: 0, isOnline: false })} />,
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.queryByTestId('pending-count')).not.toBeInTheDocument();
  });

  it('shows syncing message when coming back online', () => {
    render(
      <OfflineIndicator syncStatus={makeSyncStatus({ isSyncing: true, pendingChanges: 2 })} />,
    );

    // Go offline first
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Come back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByTestId('offline-indicator-message').textContent).toContain(
      'Back online',
    );
    expect(screen.getByTestId('offline-indicator-message').textContent).toContain(
      'syncing...',
    );
  });

  it('shows "All changes synced" after sync completes', () => {
    const { rerender } = render(
      <OfflineIndicator syncStatus={makeSyncStatus({ isSyncing: true, pendingChanges: 2 })} />,
    );

    // Go offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Come back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Sync completes
    rerender(
      <OfflineIndicator syncStatus={makeSyncStatus({ isSyncing: false, pendingChanges: 0 })} />,
    );

    expect(screen.getByTestId('offline-indicator-message').textContent).toContain(
      'All changes synced',
    );
  });

  it('auto-hides after showing "synced" message', () => {
    const { rerender } = render(
      <OfflineIndicator syncStatus={makeSyncStatus({ isSyncing: true, pendingChanges: 1 })} />,
    );

    // Go offline, then online
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Sync completes
    rerender(
      <OfflineIndicator syncStatus={makeSyncStatus({ isSyncing: false, pendingChanges: 0 })} />,
    );

    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();

    // Advance past the auto-hide timeout (3000ms)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
  });

  it('can be dismissed when offline', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss offline notification');
    await user.click(dismissBtn);

    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
  });

  it('re-appears on new offline event after being dismissed', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<OfflineIndicator />);

    // Go offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Dismiss
    const dismissBtn = screen.getByLabelText('Dismiss offline notification');
    await user.click(dismissBtn);
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();

    // Go online, then offline again
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Should re-appear
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('applies custom className', () => {
    render(<OfflineIndicator className="my-custom-class" />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('offline-indicator').className).toContain('my-custom-class');
  });
});
