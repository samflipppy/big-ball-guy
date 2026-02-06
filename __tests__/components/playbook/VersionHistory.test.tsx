import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VersionHistory } from '@/components/playbook/VersionHistory';
import type { PlayVersion, PlayDiff } from '@/lib/versioning';
import type { Play } from '@/types';

// Mock the versioning module
const mockGetVersions = vi.fn();
const mockDiffVersions = vi.fn();

vi.mock('@/lib/versioning', () => ({
  getVersions: (...args: unknown[]) => mockGetVersions(...args),
  diffVersions: (...args: unknown[]) => mockDiffVersions(...args),
}));

function makeSamplePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Slant Route',
    formationId: 'formation-1',
    assignments: [],
    tags: ['pass'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSampleVersion(overrides: Partial<PlayVersion> = {}): PlayVersion {
  return {
    id: 'ver-1',
    playId: 'play-1',
    snapshot: makeSamplePlay(),
    createdAt: '2025-06-15T10:30:00.000Z',
    label: 'Slant Route - 1 route',
    ...overrides,
  };
}

describe('VersionHistory', () => {
  const defaultProps = {
    playId: 'play-1',
    onRestore: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVersions.mockResolvedValue([]);
  });

  it('renders the version history panel with title', async () => {
    mockGetVersions.mockResolvedValue([]);
    render(<VersionHistory {...defaultProps} />);

    expect(screen.getByText('Version History')).toBeInTheDocument();
  });

  it('renders close button and calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockGetVersions.mockResolvedValue([]);
    render(<VersionHistory {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state initially', () => {
    mockGetVersions.mockReturnValue(new Promise(() => {})); // never resolves
    render(<VersionHistory {...defaultProps} />);

    expect(screen.getByText('Loading versions...')).toBeInTheDocument();
  });

  it('shows "No versions yet" when there are no versions', async () => {
    mockGetVersions.mockResolvedValue([]);
    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      expect(screen.getByText('No versions yet')).toBeInTheDocument();
    });
  });

  it('renders version timeline with labels and timestamps', async () => {
    const versions: PlayVersion[] = [
      makeSampleVersion({
        id: 'v-2',
        label: 'Added slant route',
        createdAt: '2025-06-15T14:30:00.000Z',
      }),
      makeSampleVersion({
        id: 'v-1',
        label: 'Initial version',
        createdAt: '2025-06-15T10:00:00.000Z',
      }),
    ];
    mockGetVersions.mockResolvedValue(versions);

    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      expect(screen.getByText('Added slant route')).toBeInTheDocument();
      expect(screen.getByText('Initial version')).toBeInTheDocument();
    });
  });

  it('renders restore buttons for each version', async () => {
    const versions: PlayVersion[] = [
      makeSampleVersion({ id: 'v-1', label: 'Version 1' }),
      makeSampleVersion({ id: 'v-2', label: 'Version 2' }),
    ];
    mockGetVersions.mockResolvedValue(versions);

    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      const restoreButtons = screen.getAllByRole('button', { name: 'Restore' });
      expect(restoreButtons).toHaveLength(2);
    });
  });

  it('calls onRestore when restore button is clicked', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const version = makeSampleVersion({ id: 'v-1', label: 'Version 1' });
    mockGetVersions.mockResolvedValue([version]);

    render(<VersionHistory {...defaultProps} onRestore={onRestore} />);

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(onRestore).toHaveBeenCalledWith(version);
  });

  it('renders compare button', async () => {
    mockGetVersions.mockResolvedValue([]);
    render(<VersionHistory {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Compare' })).toBeInTheDocument();
  });

  it('enters compare mode when Compare button is clicked', async () => {
    const user = userEvent.setup();
    const versions: PlayVersion[] = [
      makeSampleVersion({ id: 'v-1', label: 'Version 1' }),
      makeSampleVersion({ id: 'v-2', label: 'Version 2' }),
    ];
    mockGetVersions.mockResolvedValue(versions);

    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Compare' }));

    // Should show "Select 2 versions to compare" prompt
    expect(screen.getByText('Select 2 versions to compare')).toBeInTheDocument();

    // Restore buttons should be replaced with Select buttons
    const selectButtons = screen.getAllByRole('button', { name: 'Select' });
    expect(selectButtons).toHaveLength(2);
  });

  it('allows selecting versions for comparison', async () => {
    const user = userEvent.setup();
    const versions: PlayVersion[] = [
      makeSampleVersion({ id: 'v-1', label: 'Version 1' }),
      makeSampleVersion({ id: 'v-2', label: 'Version 2' }),
    ];
    mockGetVersions.mockResolvedValue(versions);

    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    // Enter compare mode
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    // Select both versions
    const selectButtons = screen.getAllByRole('button', { name: 'Select' });
    await user.click(selectButtons[0]);
    await user.click(selectButtons[1]);

    // Compare Selected button should be enabled
    const compareSelected = screen.getByRole('button', { name: 'Compare Selected' });
    expect(compareSelected).not.toBeDisabled();
  });

  it('shows diff result when comparing two versions', async () => {
    const user = userEvent.setup();
    const versions: PlayVersion[] = [
      makeSampleVersion({ id: 'v-1', label: 'Version 1' }),
      makeSampleVersion({ id: 'v-2', label: 'Version 2' }),
    ];
    mockGetVersions.mockResolvedValue(versions);

    const mockDiff: PlayDiff = {
      addedRoutes: [
        {
          playerId: 'wr-1',
          route: { id: 'r-1', name: 'Slant', type: 'slant', points: [] },
        },
      ],
      removedRoutes: [],
      movedPlayers: [],
      changedBlocking: [],
      metadataChanges: [{ field: 'name', from: 'Old', to: 'New' }],
    };
    mockDiffVersions.mockReturnValue(mockDiff);

    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    // Enter compare mode
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    // Select both versions
    const selectButtons = screen.getAllByRole('button', { name: 'Select' });
    await user.click(selectButtons[0]);
    await user.click(selectButtons[1]);

    // Click compare
    await user.click(screen.getByRole('button', { name: 'Compare Selected' }));

    // Should show diff result
    expect(screen.getByText('Diff Result')).toBeInTheDocument();
    expect(screen.getByText(/1 route added/)).toBeInTheDocument();
    expect(screen.getByText('Metadata changes:')).toBeInTheDocument();
  });

  it('exits compare mode and clears diff', async () => {
    const user = userEvent.setup();
    const versions: PlayVersion[] = [
      makeSampleVersion({ id: 'v-1', label: 'Version 1' }),
    ];
    mockGetVersions.mockResolvedValue(versions);

    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    // Enter compare mode
    await user.click(screen.getByRole('button', { name: 'Compare' }));
    expect(screen.getByText('Select 2 versions to compare')).toBeInTheDocument();

    // Exit compare mode
    await user.click(screen.getByRole('button', { name: 'Exit Compare' }));
    expect(screen.queryByText('Select 2 versions to compare')).not.toBeInTheDocument();

    // Should show Restore buttons again
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
  });

  it('renders the panel as aside with complementary role', () => {
    mockGetVersions.mockResolvedValue([]);
    render(<VersionHistory {...defaultProps} />);

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders version timeline list', async () => {
    mockGetVersions.mockResolvedValue([
      makeSampleVersion({ id: 'v-1', label: 'Version 1' }),
    ]);

    render(<VersionHistory {...defaultProps} />);

    await vi.waitFor(() => {
      expect(screen.getByRole('list', { name: 'Version timeline' })).toBeInTheDocument();
    });
  });
});
