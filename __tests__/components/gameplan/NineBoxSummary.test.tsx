import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NineBoxSummary } from '@/components/gameplan/NineBoxSummary';
import type { TendencyEntry } from '@/types';

const baseTendency: Omit<TendencyEntry, 'id' | 'playType' | 'direction' | 'sampleSize' | 'notes' | 'formation'> = {
  opponentId: 'opp-1',
  situation: '1st & 10',
  personnel: '11',
  percentage: 0,
  teamId: 'team-1',
  createdAt: '2025-01-01',
};

function makeTendency(
  overrides: Partial<TendencyEntry> & Pick<TendencyEntry, 'id' | 'playType' | 'sampleSize'>,
): TendencyEntry {
  return { ...baseTendency, percentage: 0, ...overrides } as TendencyEntry;
}

const mockTendencies: TendencyEntry[] = [
  makeTendency({ id: 't1', playType: 'run', direction: 'left', sampleSize: 10, notes: 'Power Left' }),
  makeTendency({ id: 't2', playType: 'run', direction: 'middle', sampleSize: 15, notes: 'Inside Zone' }),
  makeTendency({ id: 't3', playType: 'run', direction: 'right', sampleSize: 5, formation: 'I-Form' }),
  makeTendency({ id: 't4', playType: 'short pass', direction: 'left', sampleSize: 8, notes: 'Slant' }),
  makeTendency({ id: 't5', playType: 'short pass', direction: 'middle', sampleSize: 12, notes: 'Mesh' }),
  makeTendency({ id: 't6', playType: 'short pass', direction: 'right', sampleSize: 6, notes: 'Out Route' }),
  makeTendency({ id: 't7', playType: 'deep pass', direction: 'left', sampleSize: 4, notes: 'Post' }),
  makeTendency({ id: 't8', playType: 'deep pass', direction: 'middle', sampleSize: 7, notes: 'Seam' }),
  makeTendency({ id: 't9', playType: 'deep pass', direction: 'right', sampleSize: 3, notes: 'Corner Route' }),
];

describe('NineBoxSummary', () => {
  it('renders the summary container', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    expect(screen.getByTestId('nine-box-summary')).toBeInTheDocument();
  });

  it('displays empty state when no tendencies are provided', () => {
    render(<NineBoxSummary tendencies={[]} />);
    expect(screen.getByTestId('nine-box-empty')).toBeInTheDocument();
    expect(screen.getByText(/No tendency data available/)).toBeInTheDocument();
  });

  it('renders the 3x3 grid', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    expect(screen.getByTestId('nine-box-grid')).toBeInTheDocument();
  });

  it('shows column headers (Left, Middle, Right)', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    expect(screen.getByTestId('nine-box-col-header-left')).toHaveTextContent('Left');
    expect(screen.getByTestId('nine-box-col-header-middle')).toHaveTextContent('Middle');
    expect(screen.getByTestId('nine-box-col-header-right')).toHaveTextContent('Right');
  });

  it('shows row headers (Run, Short Pass, Deep Pass)', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    expect(screen.getByTestId('nine-box-row-header-Run')).toHaveTextContent('Run');
    expect(screen.getByTestId('nine-box-row-header-Short Pass')).toHaveTextContent('Short Pass');
    expect(screen.getByTestId('nine-box-row-header-Deep Pass')).toHaveTextContent('Deep Pass');
  });

  it('renders all 9 cells', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    const rows = ['Run', 'Short Pass', 'Deep Pass'];
    const cols = ['left', 'middle', 'right'];
    for (const row of rows) {
      for (const col of cols) {
        expect(screen.getByTestId(`nine-box-cell-${row}-${col}`)).toBeInTheDocument();
      }
    }
  });

  it('displays correct total play count', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    // Total: 10+15+5+8+12+6+4+7+3 = 70
    expect(screen.getByTestId('nine-box-total')).toHaveTextContent('70 total plays analyzed');
  });

  it('displays correct play counts per cell', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    expect(screen.getByTestId('nine-box-count-Run-left')).toHaveTextContent('10');
    expect(screen.getByTestId('nine-box-count-Run-middle')).toHaveTextContent('15');
    expect(screen.getByTestId('nine-box-count-Run-right')).toHaveTextContent('5');
    expect(screen.getByTestId('nine-box-count-Short Pass-left')).toHaveTextContent('8');
    expect(screen.getByTestId('nine-box-count-Short Pass-middle')).toHaveTextContent('12');
    expect(screen.getByTestId('nine-box-count-Deep Pass-middle')).toHaveTextContent('7');
  });

  it('displays percentages per cell', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    // Run-middle: 15/70 = 21%
    expect(screen.getByTestId('nine-box-pct-Run-middle')).toHaveTextContent('21%');
    // Run-left: 10/70 = 14%
    expect(screen.getByTestId('nine-box-pct-Run-left')).toHaveTextContent('14%');
  });

  it('displays key plays in cells', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    // Run-left should show "Power Left"
    expect(screen.getByTestId('nine-box-play-Run-left-0')).toHaveTextContent('Power Left');
    // Run-middle should show "Inside Zone"
    expect(screen.getByTestId('nine-box-play-Run-middle-0')).toHaveTextContent('Inside Zone');
    // Short Pass-middle should show "Mesh"
    expect(screen.getByTestId('nine-box-play-Short Pass-middle-0')).toHaveTextContent('Mesh');
  });

  it('shows formation name as key play when notes are absent', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    // Run-right has no notes, only formation "I-Form"
    expect(screen.getByTestId('nine-box-play-Run-right-0')).toHaveTextContent('I-Form');
  });

  it('calls onCellClick with the correct cell data when a cell is clicked', async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    render(<NineBoxSummary tendencies={mockTendencies} onCellClick={onCellClick} />);

    await user.click(screen.getByTestId('nine-box-cell-Run-left'));

    expect(onCellClick).toHaveBeenCalledTimes(1);
    const arg = onCellClick.mock.calls[0][0];
    expect(arg.row).toBe('Run');
    expect(arg.column).toBe('left');
    expect(arg.playCount).toBe(10);
    expect(arg.entries).toHaveLength(1);
    expect(arg.entries[0].id).toBe('t1');
  });

  it('handles tendencies with no direction by defaulting to middle', () => {
    const tendenciesNoDir: TendencyEntry[] = [
      makeTendency({ id: 'nd1', playType: 'run', sampleSize: 20 }),
    ];
    render(<NineBoxSummary tendencies={tendenciesNoDir} />);
    // No direction -> defaults to 'middle'
    expect(screen.getByTestId('nine-box-count-Run-middle')).toHaveTextContent('20');
  });

  it('classifies deep/long pass types as Deep Pass', () => {
    const deepTendencies: TendencyEntry[] = [
      makeTendency({ id: 'd1', playType: 'long pass', direction: 'right', sampleSize: 10 }),
      makeTendency({ id: 'd2', playType: 'deep throw', direction: 'left', sampleSize: 5 }),
    ];
    render(<NineBoxSummary tendencies={deepTendencies} />);
    expect(screen.getByTestId('nine-box-count-Deep Pass-right')).toHaveTextContent('10');
    // "deep throw" contains "deep"
    expect(screen.getByTestId('nine-box-count-Deep Pass-left')).toHaveTextContent('5');
  });

  it('classifies screen/quick pass types as Short Pass', () => {
    const screenTendencies: TendencyEntry[] = [
      makeTendency({ id: 's1', playType: 'screen pass', direction: 'left', sampleSize: 8 }),
      makeTendency({ id: 's2', playType: 'quick pass', direction: 'right', sampleSize: 6 }),
    ];
    render(<NineBoxSummary tendencies={screenTendencies} />);
    expect(screen.getByTestId('nine-box-count-Short Pass-left')).toHaveTextContent('8');
    expect(screen.getByTestId('nine-box-count-Short Pass-right')).toHaveTextContent('6');
  });

  it('has proper aria-labels on cells', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    const cell = screen.getByTestId('nine-box-cell-Run-left');
    expect(cell).toHaveAttribute('aria-label', expect.stringContaining('Run Left'));
  });

  it('renders the title', () => {
    render(<NineBoxSummary tendencies={mockTendencies} />);
    expect(screen.getByText('Opponent Tendency Summary')).toBeInTheDocument();
  });
});
