import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayPicker } from '@/components/gameplan/PlayPicker';
import type { Play, Formation } from '@/types';

const mockFormations: Formation[] = [
  {
    id: 'f1',
    name: 'Singleback',
    side: 'offense',
    players: [],
    personnel: '11',
    tags: [],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'f2',
    name: 'Shotgun',
    side: 'offense',
    players: [],
    personnel: '11',
    tags: [],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockPlays: Play[] = [
  {
    id: 'play-1',
    name: 'HB Dive',
    formationId: 'f1',
    assignments: [],
    tags: ['run', 'inside'],
    personnel: '11',
    category: 'run',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'play-2',
    name: 'PA Boot',
    formationId: 'f1',
    assignments: [],
    tags: ['pass', 'play-action'],
    personnel: '12',
    category: 'pass',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'play-3',
    name: 'Mesh Concept',
    formationId: 'f2',
    assignments: [],
    tags: ['pass', 'quick'],
    personnel: '11',
    category: 'pass',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const defaultProps = {
  plays: mockPlays,
  formations: mockFormations,
  recentPlayIds: ['play-1'],
  onSelect: vi.fn(),
  onClose: vi.fn(),
  excludePlayIds: [],
};

describe('PlayPicker', () => {
  it('renders the modal with title', () => {
    render(<PlayPicker {...defaultProps} />);
    expect(screen.getByText('Select Plays')).toBeInTheDocument();
  });

  it('renders all available plays', () => {
    render(<PlayPicker {...defaultProps} />);
    expect(screen.getByTestId('play-option-play-1')).toBeInTheDocument();
    expect(screen.getByTestId('play-option-play-2')).toBeInTheDocument();
    expect(screen.getByTestId('play-option-play-3')).toBeInTheDocument();
  });

  it('displays play count', () => {
    render(<PlayPicker {...defaultProps} />);
    expect(screen.getByText('3 plays available')).toBeInTheDocument();
  });

  it('filters plays by search text', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    const searchInput = screen.getByTestId('play-search-input');
    await user.type(searchInput, 'Mesh');

    expect(screen.getByTestId('play-option-play-3')).toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-2')).not.toBeInTheDocument();
  });

  it('filters plays by tag search', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    const searchInput = screen.getByTestId('play-search-input');
    await user.type(searchInput, 'play-action');

    expect(screen.getByTestId('play-option-play-2')).toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-1')).not.toBeInTheDocument();
  });

  it('filters plays by formation', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    const formationSelect = screen.getByTestId('filter-formation');
    await user.selectOptions(formationSelect, 'f2');

    expect(screen.getByTestId('play-option-play-3')).toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-2')).not.toBeInTheDocument();
  });

  it('filters plays by personnel', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    const personnelSelect = screen.getByTestId('filter-personnel');
    await user.selectOptions(personnelSelect, '12');

    expect(screen.getByTestId('play-option-play-2')).toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-1')).not.toBeInTheDocument();
  });

  it('filters plays by tag', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    const tagSelect = screen.getByTestId('filter-tag');
    await user.selectOptions(tagSelect, 'run');

    expect(screen.getByTestId('play-option-play-1')).toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-2')).not.toBeInTheDocument();
  });

  it('shows recent plays when toggled', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    await user.click(screen.getByTestId('recent-toggle'));

    expect(screen.getByTestId('play-option-play-1')).toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-3')).not.toBeInTheDocument();
  });

  it('allows multi-select and shows count', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    await user.click(screen.getByTestId('play-option-play-1'));
    await user.click(screen.getByTestId('play-option-play-2'));

    expect(screen.getByTestId('add-selected-btn')).toHaveTextContent('Add Selected (2)');
  });

  it('toggles selection on click', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    await user.click(screen.getByTestId('play-option-play-1'));
    expect(screen.getByTestId('add-selected-btn')).toHaveTextContent('Add Selected (1)');

    await user.click(screen.getByTestId('play-option-play-1'));
    expect(screen.queryByTestId('add-selected-btn')).not.toBeInTheDocument();
  });

  it('calls onSelect with selected play IDs', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    await user.click(screen.getByTestId('play-option-play-1'));
    await user.click(screen.getByTestId('play-option-play-3'));
    await user.click(screen.getByTestId('add-selected-btn'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith(
      expect.arrayContaining(['play-1', 'play-3']),
    );
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    await user.click(screen.getByTestId('close-picker-btn'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    await user.click(screen.getByTestId('cancel-btn'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('excludes specified play IDs', () => {
    render(<PlayPicker {...defaultProps} excludePlayIds={['play-1', 'play-2']} />);
    expect(screen.queryByTestId('play-option-play-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-option-play-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('play-option-play-3')).toBeInTheDocument();
  });

  it('shows no plays message when none match', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    const searchInput = screen.getByTestId('play-search-input');
    await user.type(searchInput, 'zzzzzzz');

    expect(screen.getByTestId('no-plays-message')).toBeInTheDocument();
  });

  it('shows formation and personnel info on play cards', () => {
    render(<PlayPicker {...defaultProps} />);
    expect(screen.getAllByText(/Singleback/).length).toBeGreaterThan(0);
  });

  it('closes when clicking overlay background', async () => {
    const user = userEvent.setup();
    render(<PlayPicker {...defaultProps} />);

    await user.click(screen.getByTestId('play-picker-overlay'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
