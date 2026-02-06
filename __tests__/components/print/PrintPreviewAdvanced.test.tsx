import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Play, Formation } from '@/types';
import { PrintPreviewAdvanced } from '@/components/print/PrintPreviewAdvanced';

// ============================================================
// Test data factories
// ============================================================

function makeFormation(id: string, name: string): Formation {
  return {
    id,
    name,
    side: 'offense',
    players: [
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
    ],
    personnel: '11',
    tags: [],
    isCustom: false,
    teamId: 'team1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

function makePlay(id: string, name: string, formationId: string): Play {
  return {
    id,
    name,
    formationId,
    assignments: [],
    tags: ['run'],
    notes: 'notes',
    personnel: '11',
    teamId: 'team1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

const formations = [makeFormation('f1', 'Singleback')];
const plays = [
  makePlay('p1', 'HB Dive', 'f1'),
  makePlay('p2', 'PA Slant', 'f1'),
  makePlay('p3', 'Power Right', 'f1'),
  makePlay('p4', 'Screen Left', 'f1'),
];

// ============================================================
// Tests
// ============================================================

describe('PrintPreviewAdvanced', () => {
  const defaultProps = {
    plays,
    formations,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the advanced print preview container', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    expect(screen.getByTestId('print-preview-advanced')).toBeInTheDocument();
  });

  it('renders the toolbar with layout, orientation, and print controls', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    expect(screen.getByTestId('advanced-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('layout-selector')).toBeInTheDocument();
    expect(screen.getByTestId('orientation-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('print-btn')).toBeInTheDocument();
  });

  it('defaults to single-play layout', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    const selector = screen.getByTestId('layout-selector') as HTMLSelectElement;
    expect(selector.value).toBe('single-play');
  });

  it('uses the provided initial layout', () => {
    render(<PrintPreviewAdvanced {...defaultProps} layout="play-grid" />);
    const selector = screen.getByTestId('layout-selector') as HTMLSelectElement;
    expect(selector.value).toBe('play-grid');
  });

  it('changes layout when selector changes', async () => {
    const user = userEvent.setup();
    render(<PrintPreviewAdvanced {...defaultProps} />);
    const selector = screen.getByTestId('layout-selector');

    await user.selectOptions(selector, 'call-sheet');
    expect((selector as HTMLSelectElement).value).toBe('call-sheet');
  });

  // Orientation
  it('starts in portrait orientation', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    const toggleBtn = screen.getByTestId('orientation-toggle');
    expect(toggleBtn).toHaveTextContent('Portrait');
  });

  it('toggles orientation when button is clicked', async () => {
    const user = userEvent.setup();
    render(<PrintPreviewAdvanced {...defaultProps} />);
    const toggleBtn = screen.getByTestId('orientation-toggle');

    await user.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Landscape');

    await user.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Portrait');
  });

  // Page navigation
  it('displays page count', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    const pageCount = screen.getByTestId('page-count');
    // 4 plays with single-play layout
    expect(pageCount.textContent).toContain('1 /');
  });

  it('navigates to next and previous page', async () => {
    const user = userEvent.setup();
    render(<PrintPreviewAdvanced {...defaultProps} />);

    const nextBtn = screen.getByTestId('next-page-btn');
    await user.click(nextBtn);
    expect(screen.getByTestId('page-count').textContent).toContain('2 /');

    const prevBtn = screen.getByTestId('prev-page-btn');
    await user.click(prevBtn);
    expect(screen.getByTestId('page-count').textContent).toContain('1 /');
  });

  it('previous button is disabled on first page', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    const prevBtn = screen.getByTestId('prev-page-btn');
    expect(prevBtn).toBeDisabled();
  });

  // Zoom controls
  it('displays zoom level', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('50%');
  });

  it('zoom in increases zoom level', async () => {
    const user = userEvent.setup();
    render(<PrintPreviewAdvanced {...defaultProps} />);

    await user.click(screen.getByTestId('zoom-in-btn'));
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('75%');
  });

  it('zoom out decreases zoom level', async () => {
    const user = userEvent.setup();
    render(<PrintPreviewAdvanced {...defaultProps} />);

    await user.click(screen.getByTestId('zoom-in-btn'));
    await user.click(screen.getByTestId('zoom-out-btn'));
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('50%');
  });

  // Print button
  it('calls onPrint callback when print button is clicked', async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();
    render(<PrintPreviewAdvanced {...defaultProps} onPrint={onPrint} />);

    await user.click(screen.getByTestId('print-btn'));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it('calls window.print when no onPrint callback provided', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintPreviewAdvanced {...defaultProps} />);

    await user.click(screen.getByTestId('print-btn'));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  // Page break controls
  it('renders page break controls section', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    expect(screen.getByTestId('page-break-controls')).toBeInTheDocument();
  });

  it('shows page break toggle buttons for plays (one fewer than total)', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);

    // 4 plays => 3 possible page break positions (after play 0, 1, 2)
    expect(screen.getByTestId('page-break-toggle-0')).toBeInTheDocument();
    expect(screen.getByTestId('page-break-toggle-1')).toBeInTheDocument();
    expect(screen.getByTestId('page-break-toggle-2')).toBeInTheDocument();
  });

  it('toggles a page break on and off', async () => {
    const user = userEvent.setup();
    render(<PrintPreviewAdvanced {...defaultProps} />);

    const breakBtn = screen.getByTestId('page-break-toggle-1');
    expect(breakBtn).not.toHaveTextContent('(active)');

    await user.click(breakBtn);
    expect(screen.getByTestId('page-break-toggle-1')).toHaveTextContent('(active)');

    // Click again to remove
    await user.click(screen.getByTestId('page-break-toggle-1'));
    expect(screen.getByTestId('page-break-toggle-1')).not.toHaveTextContent('(active)');
  });

  // Preview area
  it('renders preview area', () => {
    render(<PrintPreviewAdvanced {...defaultProps} />);
    expect(screen.getByTestId('preview-area')).toBeInTheDocument();
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });

  it('shows "No plays to preview" when no plays match formations', () => {
    render(
      <PrintPreviewAdvanced
        plays={[makePlay('px', 'Orphan', 'nonexistent')]}
        formations={formations}
      />,
    );
    expect(screen.getByText('No plays to preview')).toBeInTheDocument();
  });

  it('shows 0 / 0 when there are no valid plays', () => {
    render(
      <PrintPreviewAdvanced
        plays={[]}
        formations={formations}
      />,
    );
    expect(screen.getByTestId('page-count')).toHaveTextContent('0 / 0');
  });

  // Formations as Map
  it('accepts formations as a Map', () => {
    const formationMap = new Map<string, Formation>();
    formationMap.set('f1', makeFormation('f1', 'Singleback'));
    render(<PrintPreviewAdvanced plays={plays} formations={formationMap} />);
    expect(screen.getByTestId('page-count').textContent).toContain('1 /');
  });

  // Message about needing 2 plays
  it('shows message when there is only 1 play', () => {
    render(
      <PrintPreviewAdvanced
        plays={[makePlay('p1', 'Solo Play', 'f1')]}
        formations={formations}
      />,
    );
    expect(screen.getByText('Need at least 2 plays for page breaks')).toBeInTheDocument();
  });
});
