import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentlyEdited, formatRelativeTime } from '@/components/ui/RecentlyEdited';
import * as session from '@/lib/session';

// ---- Helpers ----

function mockRecentItems(items: session.RecentItem[]) {
  vi.spyOn(session, 'getRecentlyEdited').mockReturnValue(items);
}

const NOW = 1700000000000;

function makeItems(): session.RecentItem[] {
  return [
    { id: 'p1', type: 'play', name: 'Hail Mary', timestamp: NOW - 120_000 },
    { id: 'gp1', type: 'gameplan', name: 'Week 5 vs Tigers', timestamp: NOW - 3600_000 },
    { id: 'pr1', type: 'practice', name: 'Tuesday Practice', timestamp: NOW - 86400_000 },
  ];
}

// ---- Tests ----

describe('RecentlyEdited', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  it('renders the trigger button', () => {
    mockRecentItems([]);
    render(<RecentlyEdited />);
    expect(screen.getByTestId('recently-edited-trigger')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
  });

  it('opens and shows items when clicked', async () => {
    const user = userEvent.setup();
    mockRecentItems(makeItems());
    render(<RecentlyEdited />);

    await user.click(screen.getByTestId('recently-edited-trigger'));

    expect(screen.getByTestId('recently-edited-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Hail Mary')).toBeInTheDocument();
    expect(screen.getByText('Week 5 vs Tigers')).toBeInTheDocument();
    expect(screen.getByText('Tuesday Practice')).toBeInTheDocument();
  });

  it('shows empty state when no items', async () => {
    const user = userEvent.setup();
    mockRecentItems([]);
    render(<RecentlyEdited />);

    await user.click(screen.getByTestId('recently-edited-trigger'));

    expect(screen.getByTestId('empty-recent')).toBeInTheDocument();
    expect(screen.getByText('No recently edited items')).toBeInTheDocument();
  });

  it('shows relative timestamps for items', async () => {
    const user = userEvent.setup();
    mockRecentItems(makeItems());
    render(<RecentlyEdited />);

    await user.click(screen.getByTestId('recently-edited-trigger'));

    // 120s ago → "2 min ago"
    expect(screen.getByText(/2 min ago/)).toBeInTheDocument();
    // 3600s ago → "1h ago"
    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
    // 86400s ago → "1d ago"
    expect(screen.getByText(/1d ago/)).toBeInTheDocument();
  });

  it('calls onNavigate when an item is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    mockRecentItems(makeItems());
    render(<RecentlyEdited onNavigate={onNavigate} />);

    await user.click(screen.getByTestId('recently-edited-trigger'));
    await user.click(screen.getByTestId('recent-item-p1'));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', type: 'play', name: 'Hail Mary' }),
    );
  });

  it('closes the dropdown after clicking an item', async () => {
    const user = userEvent.setup();
    mockRecentItems(makeItems());
    render(<RecentlyEdited />);

    await user.click(screen.getByTestId('recently-edited-trigger'));
    expect(screen.getByTestId('recently-edited-dropdown')).toBeInTheDocument();

    await user.click(screen.getByTestId('recent-item-p1'));
    expect(screen.queryByTestId('recently-edited-dropdown')).not.toBeInTheDocument();
  });

  it('shows "Clear Recent" button when items exist', async () => {
    const user = userEvent.setup();
    mockRecentItems(makeItems());
    render(<RecentlyEdited />);

    await user.click(screen.getByTestId('recently-edited-trigger'));
    expect(screen.getByTestId('clear-recent-button')).toBeInTheDocument();
  });

  it('does not show "Clear Recent" when empty', async () => {
    const user = userEvent.setup();
    mockRecentItems([]);
    render(<RecentlyEdited />);

    await user.click(screen.getByTestId('recently-edited-trigger'));
    expect(screen.queryByTestId('clear-recent-button')).not.toBeInTheDocument();
  });

  it('clears items and closes when Clear Recent is clicked', async () => {
    const user = userEvent.setup();
    const clearSpy = vi.spyOn(session, 'clearSessionState').mockImplementation(() => {});
    mockRecentItems(makeItems());

    render(<RecentlyEdited />);

    await user.click(screen.getByTestId('recently-edited-trigger'));
    await user.click(screen.getByTestId('clear-recent-button'));

    expect(clearSpy).toHaveBeenCalled();
    expect(screen.queryByTestId('recently-edited-dropdown')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockRecentItems([]);
    render(<RecentlyEdited className="my-class" />);
    expect(screen.getByTestId('recently-edited')).toHaveClass('my-class');
  });

  it('toggles dropdown open and closed', async () => {
    const user = userEvent.setup();
    mockRecentItems(makeItems());
    render(<RecentlyEdited />);

    const trigger = screen.getByTestId('recently-edited-trigger');

    // Open
    await user.click(trigger);
    expect(screen.getByTestId('recently-edited-dropdown')).toBeInTheDocument();

    // Close
    await user.click(trigger);
    expect(screen.queryByTestId('recently-edited-dropdown')).not.toBeInTheDocument();
  });
});

// ---- formatRelativeTime ----

describe('formatRelativeTime()', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  it('returns "just now" for < 60 seconds', () => {
    expect(formatRelativeTime(NOW - 30_000)).toBe('just now');
    expect(formatRelativeTime(NOW - 59_000)).toBe('just now');
  });

  it('returns minutes for < 60 minutes', () => {
    expect(formatRelativeTime(NOW - 60_000)).toBe('1 min ago');
    expect(formatRelativeTime(NOW - 120_000)).toBe('2 min ago');
    expect(formatRelativeTime(NOW - 59 * 60_000)).toBe('59 min ago');
  });

  it('returns hours for < 24 hours', () => {
    expect(formatRelativeTime(NOW - 3600_000)).toBe('1h ago');
    expect(formatRelativeTime(NOW - 23 * 3600_000)).toBe('23h ago');
  });

  it('returns days for < 7 days', () => {
    expect(formatRelativeTime(NOW - 86400_000)).toBe('1d ago');
    expect(formatRelativeTime(NOW - 6 * 86400_000)).toBe('6d ago');
  });

  it('returns weeks for >= 7 days', () => {
    expect(formatRelativeTime(NOW - 7 * 86400_000)).toBe('1w ago');
    expect(formatRelativeTime(NOW - 14 * 86400_000)).toBe('2w ago');
  });
});
