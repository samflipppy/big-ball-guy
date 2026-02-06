import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncStatusBar } from '@/components/ui/SyncStatusBar';
import type { SyncStatus } from '@/types';

const makeStatus = (overrides: Partial<SyncStatus> = {}): SyncStatus => ({
  lastSaved: new Date().toISOString(),
  lastSynced: new Date().toISOString(),
  pendingChanges: 0,
  isOnline: true,
  isSyncing: false,
  ...overrides,
});

describe('SyncStatusBar', () => {
  it('shows "All changes saved" when synced and online', () => {
    render(<SyncStatusBar status={makeStatus()} />);
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
  });

  it('shows "Saving..." when isSyncing is true', () => {
    render(<SyncStatusBar status={makeStatus({ isSyncing: true })} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows "Offline" message when offline', () => {
    render(<SyncStatusBar status={makeStatus({ isOnline: false })} />);
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
  });

  it('shows "Sync error" when there are pending changes while online', () => {
    render(
      <SyncStatusBar
        status={makeStatus({ pendingChanges: 3, isOnline: true, isSyncing: false })}
      />,
    );
    expect(screen.getByText('Sync error')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<SyncStatusBar status={makeStatus()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<SyncStatusBar status={makeStatus()} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('shows a colored indicator dot', () => {
    const { container } = render(<SyncStatusBar status={makeStatus()} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('bg-green-500');
  });

  it('shows amber dot when syncing', () => {
    const { container } = render(<SyncStatusBar status={makeStatus({ isSyncing: true })} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain('bg-amber-500');
  });

  it('shows red dot on sync error', () => {
    const { container } = render(
      <SyncStatusBar status={makeStatus({ pendingChanges: 1 })} />,
    );
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain('bg-red-500');
  });

  it('shows time since last save', () => {
    render(<SyncStatusBar status={makeStatus()} />);
    // "just now" because lastSaved is Date.now()
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SyncStatusBar status={makeStatus()} className="my-custom" />);
    expect(screen.getByRole('status').className).toContain('my-custom');
  });
});
