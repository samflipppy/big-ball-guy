import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CallSheetView } from '@/components/gameplan/CallSheetView';
import type { CallSheet, Play } from '@/types';

const mockPlays: Play[] = [
  {
    id: 'play-1',
    name: 'HB Dive',
    formationId: 'f1',
    assignments: [],
    tags: ['run'],
    personnel: '11',
    notes: 'Best run play',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'play-2',
    name: 'PA Boot',
    formationId: 'f1',
    assignments: [],
    tags: ['pass'],
    personnel: '12',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'play-3',
    name: 'Mesh Concept',
    formationId: 'f2',
    assignments: [],
    tags: ['pass'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockCallSheet: CallSheet = {
  id: 'cs-1',
  gamePlanId: 'gp-1',
  sections: [
    {
      name: '1st & 10',
      plays: [
        { playId: 'play-1', order: 0 },
        { playId: 'play-2', order: 1 },
      ],
      color: '#2563eb',
    },
    {
      name: 'Red Zone',
      plays: [
        { playId: 'play-3', order: 0 },
      ],
      color: '#dc2626',
    },
  ],
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

describe('CallSheetView', () => {
  it('renders the call sheet view', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getByTestId('call-sheet-view')).toBeInTheDocument();
  });

  it('renders all sections', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getByTestId('call-sheet-section-0')).toBeInTheDocument();
    expect(screen.getByTestId('call-sheet-section-1')).toBeInTheDocument();
  });

  it('renders section headers with names', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getByTestId('section-header-0')).toHaveTextContent('1st & 10');
    expect(screen.getByTestId('section-header-1')).toHaveTextContent('Red Zone');
  });

  it('renders section headers with play counts', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getByTestId('section-header-0')).toHaveTextContent('(2)');
    expect(screen.getByTestId('section-header-1')).toHaveTextContent('(1)');
  });

  it('renders section header background color', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    const header = screen.getByTestId('section-header-0');
    expect(header).toHaveStyle({ backgroundColor: '#2563eb' });
  });

  it('renders play cards', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getByTestId('call-sheet-play-play-1')).toBeInTheDocument();
    expect(screen.getByTestId('call-sheet-play-play-2')).toBeInTheDocument();
    expect(screen.getByTestId('call-sheet-play-play-3')).toBeInTheDocument();
  });

  it('displays play names', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getByText('HB Dive')).toBeInTheDocument();
    expect(screen.getByText('PA Boot')).toBeInTheDocument();
    expect(screen.getByText('Mesh Concept')).toBeInTheDocument();
  });

  it('displays play personnel', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getAllByText('11')).toHaveLength(2);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('displays play notes in non-compact mode', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} />);
    expect(screen.getByText('Best run play')).toBeInTheDocument();
  });

  it('hides play notes in compact mode', () => {
    render(<CallSheetView callSheet={mockCallSheet} plays={mockPlays} compact />);
    expect(screen.queryByText('Best run play')).not.toBeInTheDocument();
  });

  it('renders empty call sheet message', () => {
    const emptyCallSheet: CallSheet = {
      ...mockCallSheet,
      sections: [],
    };
    render(<CallSheetView callSheet={emptyCallSheet} plays={mockPlays} />);
    expect(screen.getByTestId('empty-call-sheet')).toBeInTheDocument();
  });

  it('renders empty section message when section has no plays', () => {
    const callSheetWithEmpty: CallSheet = {
      ...mockCallSheet,
      sections: [{ name: 'Empty Section', plays: [], color: '#000' }],
    };
    render(<CallSheetView callSheet={callSheetWithEmpty} plays={mockPlays} />);
    expect(screen.getByTestId('empty-section-0')).toBeInTheDocument();
  });

  it('handles unknown play references', () => {
    const callSheetWithUnknown: CallSheet = {
      ...mockCallSheet,
      sections: [
        { name: 'Test', plays: [{ playId: 'unknown', order: 0 }] },
      ],
    };
    render(<CallSheetView callSheet={callSheetWithUnknown} plays={mockPlays} />);
    expect(screen.getByText('Unknown Play')).toBeInTheDocument();
  });

  it('uses default colors when section has no color', () => {
    const noColorSheet: CallSheet = {
      ...mockCallSheet,
      sections: [
        { name: 'No Color', plays: [{ playId: 'play-1', order: 0 }] },
      ],
    };
    render(<CallSheetView callSheet={noColorSheet} plays={mockPlays} />);
    const header = screen.getByTestId('section-header-0');
    expect(header).toHaveStyle({ backgroundColor: '#2563eb' });
  });
});
