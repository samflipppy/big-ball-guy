import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopPlaysSelector } from '@/components/gameplan/TopPlaysSelector';
import type { Play, Formation } from '@/types';
import type { DefensiveFront } from '@/lib/defenses';

// --- Mock data ---

const mockFormations: Formation[] = [
  {
    id: 'f1',
    name: 'Singleback',
    side: 'offense',
    players: [],
    personnel: '11',
    tags: ['base'],
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
    tags: ['spread'],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockFronts: DefensiveFront[] = [
  {
    id: 'fr1',
    name: '4-3 Over',
    players: [],
    description: 'Standard 4-3 front',
  },
  {
    id: 'fr2',
    name: 'Nickel',
    players: [],
    description: 'Five DB package',
  },
];

const mockPlays: Play[] = [
  {
    id: 'p1',
    name: 'HB Dive',
    formationId: 'f1',
    assignments: [],
    tags: ['run', 'inside'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'p2',
    name: 'PA Boot',
    formationId: 'f1',
    assignments: [],
    tags: ['pass', 'play-action'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'p3',
    name: 'Power Right',
    formationId: 'f1',
    assignments: [],
    tags: ['run', 'power'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'p4',
    name: 'Mesh',
    formationId: 'f1',
    assignments: [],
    tags: ['pass', 'quick game', 'man-beater'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'p5',
    name: 'Flood',
    formationId: 'f1',
    assignments: [],
    tags: ['pass', 'cover-3-beater'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'p6',
    name: 'Four Verts',
    formationId: 'f1',
    assignments: [],
    tags: ['pass', 'deep', 'zone-beater'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'p7',
    name: 'Gun Mesh',
    formationId: 'f2',
    assignments: [],
    tags: ['pass', 'quick game'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const defaultProps = {
  formations: mockFormations,
  fronts: mockFronts,
  plays: mockPlays,
  onSave: vi.fn(),
};

describe('TopPlaysSelector', () => {
  it('renders the selector container', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('top-plays-selector')).toBeInTheDocument();
  });

  it('shows empty state when no formations provided', () => {
    render(<TopPlaysSelector formations={[]} fronts={mockFronts} plays={mockPlays} onSave={vi.fn()} />);
    expect(screen.getByTestId('top-plays-empty')).toBeInTheDocument();
  });

  it('shows empty state when no fronts provided', () => {
    render(<TopPlaysSelector formations={mockFormations} fronts={[]} plays={mockPlays} onSave={vi.fn()} />);
    expect(screen.getByTestId('top-plays-empty')).toBeInTheDocument();
  });

  it('renders the matrix table', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('top-plays-matrix')).toBeInTheDocument();
  });

  it('renders front headers', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('front-header-fr1')).toHaveTextContent('4-3 Over');
    expect(screen.getByTestId('front-header-fr2')).toHaveTextContent('Nickel');
  });

  it('renders formation rows', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('formation-row-f1')).toHaveTextContent('Singleback');
    expect(screen.getByTestId('formation-row-f2')).toHaveTextContent('Shotgun');
  });

  it('renders cells for each formation/front combination', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('cell-f1-fr1')).toBeInTheDocument();
    expect(screen.getByTestId('cell-f1-fr2')).toBeInTheDocument();
    expect(screen.getByTestId('cell-f2-fr1')).toBeInTheDocument();
    expect(screen.getByTestId('cell-f2-fr2')).toBeInTheDocument();
  });

  it('shows 0/5 count initially for each cell', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('cell-count-f1-fr1')).toHaveTextContent('0/5');
    expect(screen.getByTestId('cell-count-f2-fr2')).toHaveTextContent('0/5');
  });

  it('displays gap count for all cells', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    // 2 formations x 2 fronts = 4 gaps
    expect(screen.getByTestId('gap-count')).toHaveTextContent('4 gaps remaining');
  });

  it('shows auto-fill button on empty cells', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('auto-fill-f1-fr1')).toBeInTheDocument();
  });

  it('auto-fills a cell with suggested plays', async () => {
    const user = userEvent.setup();
    render(<TopPlaysSelector {...defaultProps} />);

    await user.click(screen.getByTestId('auto-fill-f1-fr1'));

    // Should have 5 plays (there are 6 plays for f1, picks top 5)
    expect(screen.getByTestId('cell-count-f1-fr1')).toHaveTextContent('5/5');
  });

  it('shows detail panel when clicking a cell', async () => {
    const user = userEvent.setup();
    render(<TopPlaysSelector {...defaultProps} />);

    await user.click(screen.getByTestId('cell-f1-fr1'));
    expect(screen.getByTestId('cell-detail-panel')).toBeInTheDocument();
    expect(screen.getByText('Singleback vs 4-3 Over')).toBeInTheDocument();
  });

  it('hides detail panel when clicking the same cell again', async () => {
    const user = userEvent.setup();
    render(<TopPlaysSelector {...defaultProps} />);

    await user.click(screen.getByTestId('cell-f1-fr1'));
    expect(screen.getByTestId('cell-detail-panel')).toBeInTheDocument();

    await user.click(screen.getByTestId('cell-f1-fr1'));
    expect(screen.queryByTestId('cell-detail-panel')).not.toBeInTheDocument();
  });

  it('shows available plays in the detail panel', async () => {
    const user = userEvent.setup();
    render(<TopPlaysSelector {...defaultProps} />);

    await user.click(screen.getByTestId('cell-f1-fr1'));
    // All 6 f1 plays should be listed as available
    expect(screen.getByTestId('available-play-p1')).toBeInTheDocument();
    expect(screen.getByTestId('available-play-p2')).toBeInTheDocument();
    expect(screen.getByTestId('available-play-p3')).toBeInTheDocument();
    expect(screen.getByTestId('available-play-p4')).toBeInTheDocument();
    expect(screen.getByTestId('available-play-p5')).toBeInTheDocument();
    expect(screen.getByTestId('available-play-p6')).toBeInTheDocument();
  });

  it('adds a play to a cell when clicking in the detail panel', async () => {
    const user = userEvent.setup();
    render(<TopPlaysSelector {...defaultProps} />);

    await user.click(screen.getByTestId('cell-f1-fr1'));
    await user.click(screen.getByTestId('available-play-p1'));

    expect(screen.getByTestId('cell-count-f1-fr1')).toHaveTextContent('1/5');
  });

  it('removes a play from a cell with the remove button', async () => {
    const user = userEvent.setup();
    render(<TopPlaysSelector {...defaultProps} />);

    // Auto-fill first
    await user.click(screen.getByTestId('auto-fill-f1-fr1'));
    expect(screen.getByTestId('cell-count-f1-fr1')).toHaveTextContent('5/5');

    // Remove first play
    await user.click(screen.getByTestId('remove-play-f1::fr1-0'));
    expect(screen.getByTestId('cell-count-f1-fr1')).toHaveTextContent('4/5');
  });

  it('calls onSave with selected plays', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TopPlaysSelector {...defaultProps} onSave={onSave} />);

    // Auto-fill and save
    await user.click(screen.getByTestId('auto-fill-f1-fr1'));
    await user.click(screen.getByTestId('save-top-plays'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const entries = onSave.mock.calls[0][0];
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].formationId).toBe('f1');
    expect(entries[0].frontId).toBe('fr1');
    expect(entries[0].playIds).toHaveLength(5);
  });

  it('has an export button', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByTestId('export-top-plays')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByText('Top 5 Plays Selector')).toBeInTheDocument();
  });

  it('shows dimensions info (formations x fronts)', () => {
    render(<TopPlaysSelector {...defaultProps} />);
    expect(screen.getByText(/2 formations/)).toBeInTheDocument();
    expect(screen.getByText(/2 fronts/)).toBeInTheDocument();
  });

  it('shows no-available-plays message for formations with no plays', async () => {
    const user = userEvent.setup();
    const emptyPlays: Play[] = [];
    render(
      <TopPlaysSelector
        formations={mockFormations}
        fronts={mockFronts}
        plays={emptyPlays}
        onSave={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('cell-f1-fr1'));
    expect(screen.getByTestId('no-available-plays')).toBeInTheDocument();
  });
});
