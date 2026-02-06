import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkOperations } from '@/components/playbook/BulkOperations';
import { useAppStore } from '@/stores/playStore';
import type { Play, Formation } from '@/types';

// Mock IndexedDB layer
vi.mock('@/lib/db/indexeddb', () => ({
  plays: {
    get: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  formations: {
    get: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `bulk-gen-${++counter}`,
  };
});

function makeSamplePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Slant Route',
    formationId: 'f-1',
    assignments: [],
    tags: ['pass'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSampleFormation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: 'f-1',
    name: 'Shotgun',
    side: 'offense',
    players: [],
    personnel: '11',
    tags: [],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('BulkOperations', () => {
  const defaultProps = {
    selectedPlayIds: ['play-1', 'play-2'],
    onComplete: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      plays: [
        makeSamplePlay({ id: 'play-1', name: 'Slant' }),
        makeSamplePlay({ id: 'play-2', name: 'Curl' }),
      ],
      formations: [
        makeSampleFormation({ id: 'f-1', name: 'Shotgun' }),
        makeSampleFormation({ id: 'f-2', name: 'I-Form' }),
      ],
    });
  });

  it('renders the toolbar with correct selection count', () => {
    render(<BulkOperations {...defaultProps} />);
    expect(screen.getByText('2 plays selected')).toBeInTheDocument();
  });

  it('renders singular "play" when one play selected', () => {
    render(<BulkOperations {...defaultProps} selectedPlayIds={['play-1']} />);
    expect(screen.getByText('1 play selected')).toBeInTheDocument();
  });

  it('renders nothing when no plays selected', () => {
    const { container } = render(<BulkOperations {...defaultProps} selectedPlayIds={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all operation buttons', () => {
    render(<BulkOperations {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Duplicate Selected' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate Across Formations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to Folder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Tag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Tag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Selected' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<BulkOperations {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows delete confirmation dialog when Delete Selected is clicked', async () => {
    const user = userEvent.setup();
    render(<BulkOperations {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Delete Selected' }));
    expect(screen.getByText('Delete Selected Plays')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete 2 plays/)).toBeInTheDocument();
  });

  it('executes duplicate and calls onComplete', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<BulkOperations {...defaultProps} onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: 'Duplicate Selected' }));

    // Wait for async operation
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('opens move dialog and requires folder ID', async () => {
    const user = userEvent.setup();
    render(<BulkOperations {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Move to Folder' }));

    // Dialog should be open
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Folder ID')).toBeInTheDocument();

    // Move button should be disabled without folder ID
    const moveBtn = within(dialog).getByRole('button', { name: /Move 2 Play/ });
    expect(moveBtn).toBeDisabled();
  });

  it('opens add tag dialog', async () => {
    const user = userEvent.setup();
    render(<BulkOperations {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Add Tag' }));
    expect(screen.getByPlaceholderText('Enter tag name')).toBeInTheDocument();
  });

  it('opens remove tag dialog', async () => {
    const user = userEvent.setup();
    render(<BulkOperations {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Remove Tag' }));
    expect(screen.getByPlaceholderText('Enter tag to remove')).toBeInTheDocument();
  });

  it('opens duplicate across formations dialog with formation list', async () => {
    const user = userEvent.setup();
    render(<BulkOperations {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Duplicate Across Formations' }));
    expect(screen.getByText(/Select target formations/)).toBeInTheDocument();
    expect(screen.getByText('Shotgun')).toBeInTheDocument();
    expect(screen.getByText('I-Form')).toBeInTheDocument();
  });

  it('renders the toolbar with role=toolbar', () => {
    render(<BulkOperations {...defaultProps} />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });
});
