import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { Play, Formation } from '@/types';

// ============================================================
// Mock export functions
// ============================================================

const mockExportPlayAsPng = vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
const mockExportPlayAsPdf = vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
const mockExportPlaybookAsPdf = vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
const mockDownloadBlob = vi.fn();

vi.mock('@/lib/export', () => ({
  exportPlayAsPng: (...args: any[]) => mockExportPlayAsPng(...args),
  exportPlayAsPdf: (...args: any[]) => mockExportPlayAsPdf(...args),
  exportPlaybookAsPdf: (...args: any[]) => mockExportPlaybookAsPdf(...args),
  downloadBlob: (...args: any[]) => mockDownloadBlob(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();

  // Mock HTMLCanvasElement.prototype.getContext for the preview canvas
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    closePath: vi.fn(),
  } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

import ExportDialog from '@/components/playbook/ExportDialog';

// ============================================================
// Test data
// ============================================================

const makeFormation = (): Formation => ({
  id: 'formation-1',
  name: 'Singleback',
  side: 'offense',
  players: [
    { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
    { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
    { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 245 }, side: 'offense' },
  ],
  personnel: '11',
  tags: [],
  isCustom: false,
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
});

const makePlay = (overrides: Partial<Play> = {}): Play => ({
  id: 'play-1',
  name: 'Four Verts',
  formationId: 'formation-1',
  assignments: [
    {
      playerId: 'x',
      route: {
        id: 'route-x',
        name: 'Streak',
        type: 'streak',
        points: [
          { x: 80, y: 200, type: 'line' },
          { x: 80, y: 150, type: 'line' },
        ],
      },
    },
  ],
  tags: ['pass'],
  personnel: '11',
  teamId: 'team-1',
  notes: 'Hit the X receiver deep',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

// ============================================================
// Tests
// ============================================================

describe('ExportDialog', () => {
  it('renders when open is true', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Export Play')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={false}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText('Export Play')).not.toBeInTheDocument();
  });

  it('shows format selector with PNG and PDF options', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('format-png')).toBeInTheDocument();
    expect(screen.getByTestId('format-pdf')).toBeInTheDocument();
  });

  it('shows Playbook PDF option when allPlays is provided', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        allPlays={[makePlay()]}
        allFormations={[makeFormation()]}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('format-playbook-pdf')).toBeInTheDocument();
  });

  it('does not show Playbook PDF option when allPlays is not provided', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('format-playbook-pdf')).not.toBeInTheDocument();
  });

  it('shows PNG size selector when PNG format is selected', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    // PNG is selected by default
    expect(screen.getByTestId('png-size-select')).toBeInTheDocument();
  });

  it('shows page size selector when PDF format is selected', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    // Switch to PDF
    fireEvent.click(screen.getByTestId('format-pdf'));

    expect(screen.getByTestId('page-size-select')).toBeInTheDocument();
  });

  it('shows include notes toggle for PDF formats', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    // In PNG mode, notes toggle should not be visible
    expect(screen.queryByTestId('toggle-notes')).not.toBeInTheDocument();

    // Switch to PDF
    fireEvent.click(screen.getByTestId('format-pdf'));
    expect(screen.getByTestId('toggle-notes')).toBeInTheDocument();
  });

  it('has defense and labels toggles', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('toggle-defense')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-labels')).toBeInTheDocument();
  });

  it('shows preview canvas', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('export-preview')).toBeInTheDocument();
  });

  it('triggers PNG download when Download is clicked with PNG format', async () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('export-download'));

    await waitFor(() => {
      expect(mockExportPlayAsPng).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
    });

    // Check filename ends with .png
    const [, filename] = mockDownloadBlob.mock.calls[0];
    expect(filename).toMatch(/\.png$/);
  });

  it('triggers PDF download when Download is clicked with PDF format', async () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    // Switch to PDF
    fireEvent.click(screen.getByTestId('format-pdf'));
    fireEvent.click(screen.getByTestId('export-download'));

    await waitFor(() => {
      expect(mockExportPlayAsPdf).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
    });

    const [, filename] = mockDownloadBlob.mock.calls[0];
    expect(filename).toMatch(/\.pdf$/);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId('export-cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose after successful export', async () => {
    const onClose = vi.fn();
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId('export-download'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('toggles defense checkbox', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    const checkbox = screen.getByTestId('toggle-defense') as HTMLInputElement;
    const initialChecked = checkbox.checked;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(!initialChecked);
  });

  it('toggles labels checkbox', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        open={true}
        onClose={vi.fn()}
      />,
    );

    const checkbox = screen.getByTestId('toggle-labels') as HTMLInputElement;
    // Labels default to true
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('shows playbook info text for playbook-pdf format', () => {
    render(
      <ExportDialog
        play={makePlay()}
        formation={makeFormation()}
        allPlays={[makePlay(), makePlay({ id: 'play-2', name: 'HB Dive' })]}
        allFormations={[makeFormation()]}
        open={true}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('format-playbook-pdf'));
    expect(screen.getByTestId('playbook-info')).toHaveTextContent('2 plays');
  });
});
