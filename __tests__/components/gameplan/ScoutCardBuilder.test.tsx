import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoutCardBuilder } from '@/components/gameplan/ScoutCardBuilder';
import type { TendencyEntry, Play, Formation } from '@/types';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: (() => {
    let counter = 0;
    return () => `uuid-${++counter}`;
  })(),
});

const mockFormations: Formation[] = [
  {
    id: 'f1',
    name: 'Singleback',
    side: 'offense',
    players: [
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
    ],
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
    id: 'p1',
    name: 'HB Dive',
    formationId: 'f1',
    assignments: [],
    tags: ['run'],
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
    tags: ['pass'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const makeTendency = (overrides: Partial<TendencyEntry> = {}): TendencyEntry => ({
  id: 't-1',
  opponentId: 'opp-1',
  situation: '1st & 10',
  personnel: '11',
  playType: 'run',
  percentage: 55,
  sampleSize: 20,
  teamId: 'team-1',
  createdAt: '2025-01-01',
  ...overrides,
});

describe('ScoutCardBuilder', () => {
  it('renders the scout card builder container', () => {
    render(
      <ScoutCardBuilder
        tendencies={[makeTendency()]}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scout-card-builder')).toBeInTheDocument();
  });

  it('renders empty state when no tendencies produce cards', () => {
    render(
      <ScoutCardBuilder
        tendencies={[]}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('empty-scout-cards')).toHaveTextContent('No scout cards generated');
  });

  it('displays the generated card count', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 55 }),
      makeTendency({ id: 't2', playType: 'pass', percentage: 30 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('card-count')).toHaveTextContent('(2 cards)');
  });

  it('renders grouped view by default', () => {
    const tendencies = [
      makeTendency({ id: 't1', situation: '1st & 10', playType: 'run', percentage: 55 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('grouped-view')).toBeInTheDocument();
  });

  it('switches to frequency view', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 55 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('view-frequency'));
    expect(screen.getByTestId('frequency-view')).toBeInTheDocument();
  });

  it('switches back to grouped view', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 55 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('view-frequency'));
    fireEvent.click(screen.getByTestId('view-grouped'));
    expect(screen.getByTestId('grouped-view')).toBeInTheDocument();
  });

  it('renders situation group headers in grouped view', () => {
    const tendencies = [
      makeTendency({ id: 't1', situation: '1st & 10', playType: 'run', percentage: 55 }),
      makeTendency({ id: 't2', situation: 'Red Zone', playType: 'pass', percentage: 40 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('situation-group-1st & 10')).toBeInTheDocument();
    expect(screen.getByTestId('situation-group-Red Zone')).toBeInTheDocument();
  });

  it('renders scout card with situation label', () => {
    const tendencies = [
      makeTendency({ id: 't1', situation: '3rd & Long', playType: 'pass', percentage: 70 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scout-card-situation')).toHaveTextContent('3rd & Long');
  });

  it('renders scout card with frequency percentage', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 63 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scout-card-frequency')).toHaveTextContent('63%');
  });

  it('renders scout card with notes', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 50, notes: 'Often runs strong side' }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scout-card-notes')).toHaveTextContent('Often runs strong side');
  });

  it('renders play diagram placeholder', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 50 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scout-card-diagram')).toBeInTheDocument();
  });

  it('calls onSave with cards when Save is clicked', () => {
    const onSave = vi.fn();
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 55 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByTestId('save-scout-cards'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ frequency: 55, playName: 'HB Dive' }),
      ]),
    );
  });

  it('cards are draggable', () => {
    const tendencies = [
      makeTendency({ id: 't1', playType: 'run', percentage: 55 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    // All scout cards should have draggable attribute
    const cards = screen.getAllByText('HB Dive');
    // Find the card element (parent with draggable)
    const draggableCard = cards[0].closest('[draggable]');
    expect(draggableCard).toHaveAttribute('draggable', 'true');
  });

  it('handles multiple tendencies with same situation in grouped view', () => {
    const tendencies = [
      makeTendency({ id: 't1', situation: '1st & 10', playType: 'run', percentage: 55 }),
      makeTendency({ id: 't2', situation: '1st & 10', playType: 'pass', percentage: 30 }),
    ];
    render(
      <ScoutCardBuilder
        tendencies={tendencies}
        plays={mockPlays}
        formations={mockFormations}
        onSave={vi.fn()}
      />,
    );
    // Should have one group with two cards
    const group = screen.getByTestId('situation-group-1st & 10');
    expect(group).toBeInTheDocument();
  });
});
