import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrintPreview } from '@/components/print/PrintPreview';
import type { Play, Formation } from '@/types';

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
];

// ============================================================
// Tests
// ============================================================

describe('PrintPreview', () => {
  const defaultProps = {
    plays,
    formations,
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open is true', () => {
    render(<PrintPreview {...defaultProps} />);
    expect(screen.getByTestId('print-preview-modal')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<PrintPreview {...defaultProps} open={false} />);
    expect(screen.queryByTestId('print-preview-modal')).not.toBeInTheDocument();
  });

  it('has correct dialog aria attributes', () => {
    render(<PrintPreview {...defaultProps} />);
    const dialog = screen.getByTestId('print-preview-modal');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  // Layout selector
  describe('Layout selector', () => {
    it('renders a layout selector dropdown', () => {
      render(<PrintPreview {...defaultProps} />);
      const selector = screen.getByTestId('layout-selector');
      expect(selector).toBeInTheDocument();
      expect(selector.tagName).toBe('SELECT');
    });

    it('has all 5 layout options', () => {
      render(<PrintPreview {...defaultProps} />);
      const selector = screen.getByTestId('layout-selector');
      const options = within(selector).getAllByRole('option');
      expect(options).toHaveLength(5);
    });

    it('defaults to single-play layout', () => {
      render(<PrintPreview {...defaultProps} />);
      const selector = screen.getByTestId('layout-selector') as HTMLSelectElement;
      expect(selector.value).toBe('single-play');
    });

    it('uses the provided initial layout', () => {
      render(<PrintPreview {...defaultProps} layout="play-grid" />);
      const selector = screen.getByTestId('layout-selector') as HTMLSelectElement;
      expect(selector.value).toBe('play-grid');
    });

    it('changes layout when a different option is selected', async () => {
      const user = userEvent.setup();
      render(<PrintPreview {...defaultProps} />);
      const selector = screen.getByTestId('layout-selector');
      await user.selectOptions(selector, 'play-grid');
      expect((selector as HTMLSelectElement).value).toBe('play-grid');
    });
  });

  // Page navigation
  describe('Page navigation', () => {
    it('displays page count', () => {
      render(<PrintPreview {...defaultProps} />);
      const pageCount = screen.getByTestId('page-count');
      // 3 plays with single-play layout = 3 pages
      expect(pageCount.textContent).toBe('1 / 3');
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      render(<PrintPreview {...defaultProps} />);
      const nextBtn = screen.getByTestId('next-page-btn');
      await user.click(nextBtn);
      const pageCount = screen.getByTestId('page-count');
      expect(pageCount.textContent).toBe('2 / 3');
    });

    it('navigates to previous page', async () => {
      const user = userEvent.setup();
      render(<PrintPreview {...defaultProps} />);
      const nextBtn = screen.getByTestId('next-page-btn');
      const prevBtn = screen.getByTestId('prev-page-btn');

      await user.click(nextBtn);
      await user.click(nextBtn);
      expect(screen.getByTestId('page-count').textContent).toBe('3 / 3');

      await user.click(prevBtn);
      expect(screen.getByTestId('page-count').textContent).toBe('2 / 3');
    });

    it('previous button is disabled on first page', () => {
      render(<PrintPreview {...defaultProps} />);
      const prevBtn = screen.getByTestId('prev-page-btn');
      expect(prevBtn).toBeDisabled();
    });

    it('next button is disabled on last page', async () => {
      const user = userEvent.setup();
      render(<PrintPreview {...defaultProps} />);
      const nextBtn = screen.getByTestId('next-page-btn');
      await user.click(nextBtn);
      await user.click(nextBtn);
      expect(nextBtn).toBeDisabled();
    });

    it('shows 0 / 0 when there are no plays', () => {
      render(<PrintPreview {...defaultProps} plays={[]} />);
      expect(screen.getByTestId('page-count').textContent).toBe('0 / 0');
    });
  });

  // Zoom
  describe('Zoom controls', () => {
    it('displays current zoom level', () => {
      render(<PrintPreview {...defaultProps} />);
      const zoomLevel = screen.getByTestId('zoom-level');
      expect(zoomLevel.textContent).toBe('50%');
    });

    it('zoom in increases zoom level', async () => {
      const user = userEvent.setup();
      render(<PrintPreview {...defaultProps} />);
      const zoomInBtn = screen.getByTestId('zoom-in-btn');
      await user.click(zoomInBtn);
      expect(screen.getByTestId('zoom-level').textContent).toBe('75%');
    });

    it('zoom out decreases zoom level', async () => {
      const user = userEvent.setup();
      render(<PrintPreview {...defaultProps} />);
      const zoomInBtn = screen.getByTestId('zoom-in-btn');
      const zoomOutBtn = screen.getByTestId('zoom-out-btn');
      // Zoom in first, then out
      await user.click(zoomInBtn);
      await user.click(zoomOutBtn);
      expect(screen.getByTestId('zoom-level').textContent).toBe('50%');
    });
  });

  // Print button
  describe('Print button', () => {
    it('renders a print button', () => {
      render(<PrintPreview {...defaultProps} />);
      const printBtn = screen.getByTestId('print-btn');
      expect(printBtn).toBeInTheDocument();
      expect(printBtn.textContent).toBe('Print');
    });

    it('calls window.print when print button is clicked', async () => {
      const user = userEvent.setup();
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      render(<PrintPreview {...defaultProps} />);
      await user.click(screen.getByTestId('print-btn'));
      expect(printSpy).toHaveBeenCalledTimes(1);
      printSpy.mockRestore();
    });
  });

  // Close
  describe('Close button', () => {
    it('renders a close button', () => {
      render(<PrintPreview {...defaultProps} />);
      expect(screen.getByTestId('close-btn')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<PrintPreview {...defaultProps} onClose={onClose} />);
      await user.click(screen.getByTestId('close-btn'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<PrintPreview {...defaultProps} onClose={onClose} />);
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // Preview area
  describe('Preview area', () => {
    it('renders a page container', () => {
      render(<PrintPreview {...defaultProps} />);
      expect(screen.getByTestId('page-container')).toBeInTheDocument();
    });

    it('renders preview area', () => {
      render(<PrintPreview {...defaultProps} />);
      expect(screen.getByTestId('preview-area')).toBeInTheDocument();
    });

    it('shows empty state when no plays match formations', () => {
      render(<PrintPreview {...defaultProps} plays={[makePlay('px', 'Orphan', 'nonexistent')]} />);
      // No valid plays should render the "No plays to preview" message
      expect(screen.getByText('No plays to preview')).toBeInTheDocument();
    });
  });

  // Formations as Map
  describe('Formations as Map', () => {
    it('accepts formations as a Map', () => {
      const formationMap = new Map<string, Formation>();
      formationMap.set('f1', makeFormation('f1', 'Singleback'));
      render(<PrintPreview {...defaultProps} formations={formationMap} />);
      expect(screen.getByTestId('page-count').textContent).toBe('1 / 3');
    });
  });
});
