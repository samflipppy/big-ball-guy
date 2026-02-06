import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '@/components/ui/CommandPalette';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the app store
const mockToggleDarkMode = vi.fn();
const mockSetCurrentMode = vi.fn();

vi.mock('@/stores/playStore', () => ({
  useAppStore: () => ({
    plays: [
      { id: 'play-1', name: 'HB Dive', formationId: 'f1', tags: ['run'], personnel: '11', teamId: 't1', createdAt: '', updatedAt: '', assignments: [] },
      { id: 'play-2', name: 'PA Boot', formationId: 'f2', tags: ['pass'], personnel: '12', teamId: 't1', createdAt: '', updatedAt: '', assignments: [] },
      { id: 'play-3', name: 'Mesh Concept', formationId: 'f1', tags: ['pass'], personnel: '11', teamId: 't1', createdAt: '', updatedAt: '', assignments: [] },
    ],
    formations: [
      { id: 'f1', name: 'Shotgun Spread', side: 'offense', players: [], personnel: '11', tags: [], isCustom: false, teamId: 't1', createdAt: '', updatedAt: '' },
      { id: 'f2', name: 'I-Formation', side: 'offense', players: [], personnel: '21', tags: [], isCustom: false, teamId: 't1', createdAt: '', updatedAt: '' },
    ],
    gameplans: [
      { id: 'gp1', name: 'Week 1 vs Tigers', opponent: 'Tigers', week: 1, season: '2025', sections: [], teamId: 't1', createdAt: '', updatedAt: '' },
    ],
    toggleDarkMode: mockToggleDarkMode,
    setCurrentMode: mockSetCurrentMode,
  }),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('does not render when closed', () => {
    render(<CommandPalette />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on Ctrl+K', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Search command palette')).toBeInTheDocument();
  });

  it('opens on Meta+K (Cmd+K)', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when clicking backdrop', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows placeholder text when input is empty and no recent searches', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByText(/Type to search across plays/)).toBeInTheDocument();
  });

  it('searches plays by name (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'dive');

    await waitFor(() => {
      expect(screen.getByText('HB Dive')).toBeInTheDocument();
    });
    expect(screen.queryByText('PA Boot')).not.toBeInTheDocument();
  });

  it('searches formations by name', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'shotgun');

    await waitFor(() => {
      expect(screen.getByText('Shotgun Spread')).toBeInTheDocument();
    });
  });

  it('searches game plans by name', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'tigers');

    await waitFor(() => {
      expect(screen.getByText('Week 1 vs Tigers')).toBeInTheDocument();
    });
  });

  it('searches actions by name', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'dark mode');

    await waitFor(() => {
      expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();
    });
  });

  it('shows category badges on results', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'dive');

    await waitFor(() => {
      expect(screen.getByText('Plays')).toBeInTheDocument();
    });
  });

  it('shows no results message for unmatched query', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'zzzznotfound');

    await waitFor(() => {
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });
  });

  it('navigates to play on Enter', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'HB Dive');

    await waitFor(() => {
      expect(screen.getByText('HB Dive')).toBeInTheDocument();
    });

    await user.keyboard('{Enter}');

    expect(pushMock).toHaveBeenCalledWith('/playbook/play-1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates to game plan on click', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'tigers');

    await waitFor(() => {
      expect(screen.getByText('Week 1 vs Tigers')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Week 1 vs Tigers'));

    expect(pushMock).toHaveBeenCalledWith('/gameplan/gp1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates to formation filter on select', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'I-Formation');

    await waitFor(() => {
      expect(screen.getByText('I-Formation')).toBeInTheDocument();
    });

    await user.keyboard('{Enter}');

    expect(pushMock).toHaveBeenCalledWith('/playbook?formation=f2');
  });

  it('executes toggle dark mode action', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    await user.type(input, 'dark mode');

    await waitFor(() => {
      expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();
    });

    await user.keyboard('{Enter}');
    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('navigates results with ArrowDown and ArrowUp', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');

    // Search for something with multiple results
    await user.type(input, 'a');

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(1);
    });

    // First item should be active by default
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // Arrow down
    await user.keyboard('{ArrowDown}');
    const updatedOptions = screen.getAllByRole('option');
    expect(updatedOptions[1]).toHaveAttribute('aria-selected', 'true');
    expect(updatedOptions[0]).toHaveAttribute('aria-selected', 'false');

    // Arrow up to go back
    await user.keyboard('{ArrowUp}');
    const finalOptions = screen.getAllByRole('option');
    expect(finalOptions[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('toggles open/closed with repeated Ctrl+K', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears query when closed and reopened', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByLabelText('Search command palette');
    await user.type(input, 'test query');
    expect(input).toHaveValue('test query');

    await user.keyboard('{Escape}');
    await user.keyboard('{Control>}k{/Control}');

    const newInput = screen.getByLabelText('Search command palette');
    expect(newInput).toHaveValue('');
  });
});
