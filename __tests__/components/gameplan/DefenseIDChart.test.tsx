import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DefenseIDChart,
  type DefenseEntry,
  type ThreatLevel,
} from '@/components/gameplan/DefenseIDChart';
import type { Play } from '@/types';

const makeDefense = (overrides: Partial<DefenseEntry> = {}): DefenseEntry => ({
  id: 'd-1',
  name: 'Cover 3 Sky',
  front: '4-3 Over',
  coverage: 'Cover 3',
  threatLevel: 'zone',
  keyIdentifiers: ['SS walks up to flat', 'CB plays deep third'],
  description: 'Standard Cover 3 with strong safety rolling down.',
  audibleTo: 'Mesh Concept',
  notes: 'Watch for slot blitz',
  ...overrides,
});

const mockPlays: Play[] = [
  {
    id: 'p1',
    name: 'Mesh Concept',
    formationId: 'f1',
    assignments: [],
    tags: ['pass'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

describe('DefenseIDChart', () => {
  it('renders the chart container', () => {
    render(<DefenseIDChart defenses={[makeDefense()]} />);
    expect(screen.getByTestId('defense-id-chart')).toBeInTheDocument();
  });

  it('renders empty state when no defenses are provided', () => {
    render(<DefenseIDChart defenses={[]} />);
    expect(screen.getByTestId('empty-chart')).toHaveTextContent('No defensive looks added yet');
  });

  it('renders the table with headers', () => {
    render(<DefenseIDChart defenses={[makeDefense()]} />);
    const table = screen.getByTestId('defense-id-table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('Front / Coverage')).toBeInTheDocument();
    expect(screen.getByText('Key Identifiers')).toBeInTheDocument();
    expect(screen.getByText('Diagram')).toBeInTheDocument();
    expect(screen.getByText('Audible To')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders a defense row', () => {
    render(<DefenseIDChart defenses={[makeDefense()]} />);
    expect(screen.getByTestId('defense-row-d-1')).toBeInTheDocument();
  });

  it('displays the defense name', () => {
    render(<DefenseIDChart defenses={[makeDefense({ name: 'Zone Blitz' })]} />);
    expect(screen.getByText('Zone Blitz')).toBeInTheDocument();
  });

  it('displays the front and coverage', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ front: '3-4', coverage: 'Cover 2 Man' })]}
      />,
    );
    expect(screen.getByText('3-4')).toBeInTheDocument();
    expect(screen.getByText('Cover 2 Man')).toBeInTheDocument();
  });

  it('displays key identifiers', () => {
    render(
      <DefenseIDChart
        defenses={[
          makeDefense({
            keyIdentifiers: ['SS in box', 'Single high safety', 'Press corners'],
          }),
        ]}
      />,
    );
    expect(screen.getByText('SS in box')).toBeInTheDocument();
    expect(screen.getByText('Single high safety')).toBeInTheDocument();
    expect(screen.getByText('Press corners')).toBeInTheDocument();
  });

  it('displays the audible suggestion', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ audibleTo: 'HB Dive' })]}
      />,
    );
    expect(screen.getByTestId('audible-d-1')).toHaveTextContent('HB Dive');
  });

  it('shows placeholder when no audible is set', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ audibleTo: undefined })]}
      />,
    );
    expect(screen.queryByTestId('audible-d-1')).not.toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('displays defense notes', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ notes: 'Overload blitz from weak side' })]}
      />,
    );
    expect(screen.getByTestId('defense-notes-d-1')).toHaveTextContent('Overload blitz from weak side');
  });

  it('displays diagram placeholder', () => {
    render(<DefenseIDChart defenses={[makeDefense()]} />);
    expect(screen.getByTestId('defense-diagram-d-1')).toBeInTheDocument();
  });

  // Threat level color coding
  it('shows blitz threat badge for blitz level', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ id: 'b1', threatLevel: 'blitz' })]}
      />,
    );
    expect(screen.getByTestId('threat-badge-b1')).toHaveTextContent('Blitz');
  });

  it('shows zone threat badge for zone level', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ id: 'z1', threatLevel: 'zone' })]}
      />,
    );
    expect(screen.getByTestId('threat-badge-z1')).toHaveTextContent('Zone');
  });

  it('shows man threat badge for man level', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ id: 'm1', threatLevel: 'man' })]}
      />,
    );
    expect(screen.getByTestId('threat-badge-m1')).toHaveTextContent('Man');
  });

  // Legend
  it('renders the threat level legend', () => {
    render(<DefenseIDChart defenses={[makeDefense()]} />);
    expect(screen.getByTestId('threat-legend')).toBeInTheDocument();
    expect(screen.getByTestId('legend-blitz')).toBeInTheDocument();
    expect(screen.getByTestId('legend-zone')).toBeInTheDocument();
    expect(screen.getByTestId('legend-man')).toBeInTheDocument();
  });

  // Multiple defenses
  it('renders multiple defense rows', () => {
    const defenses = [
      makeDefense({ id: 'd1', name: 'Cover 3', threatLevel: 'zone' }),
      makeDefense({ id: 'd2', name: 'Cover 0', threatLevel: 'blitz' }),
      makeDefense({ id: 'd3', name: 'Cover 1 Man', threatLevel: 'man' }),
    ];
    render(<DefenseIDChart defenses={defenses} />);
    expect(screen.getByTestId('defense-row-d1')).toBeInTheDocument();
    expect(screen.getByTestId('defense-row-d2')).toBeInTheDocument();
    expect(screen.getByTestId('defense-row-d3')).toBeInTheDocument();
  });

  // Edit callback
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    const defense = makeDefense({ id: 'd1' });
    render(<DefenseIDChart defenses={[defense]} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId('edit-defense-d1'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(defense);
  });

  it('does not render edit button when onEdit is not provided', () => {
    render(<DefenseIDChart defenses={[makeDefense({ id: 'd1' })]} />);
    expect(screen.queryByTestId('edit-defense-d1')).not.toBeInTheDocument();
  });

  it('accepts optional plays prop', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense()]}
        plays={mockPlays}
      />,
    );
    expect(screen.getByTestId('defense-id-chart')).toBeInTheDocument();
  });

  it('renders identifiers list', () => {
    render(
      <DefenseIDChart
        defenses={[makeDefense({ id: 'd1', keyIdentifiers: ['A', 'B'] })]}
      />,
    );
    const list = screen.getByTestId('identifiers-d1');
    expect(list.querySelectorAll('li')).toHaveLength(2);
  });
});
