import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Play } from '@/types';
import { WristbandEditor } from '@/components/gameplan/WristbandEditor';

// ============================================================
// Test data factories
// ============================================================

function makePlay(id: string, name: string): Play {
  return {
    id,
    name,
    formationId: 'formation-1',
    assignments: [],
    tags: ['run'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };
}

const testPlays = [
  makePlay('p1', 'HB Dive'),
  makePlay('p2', 'PA Slant'),
  makePlay('p3', 'Power Right'),
  makePlay('p4', 'Screen Left'),
  makePlay('p5', 'Four Verts'),
  makePlay('p6', 'Mesh Concept'),
];

// ============================================================
// Tests
// ============================================================

describe('WristbandEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the wristband editor container', () => {
    render(<WristbandEditor plays={testPlays} />);
    expect(screen.getByTestId('wristband-editor')).toBeInTheDocument();
  });

  it('renders the toolbar with controls', () => {
    render(<WristbandEditor plays={testPlays} />);
    expect(screen.getByTestId('wristband-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('columns-select')).toBeInTheDocument();
    expect(screen.getByTestId('export-btn')).toBeInTheDocument();
  });

  it('renders a cell for each play', () => {
    render(<WristbandEditor plays={testPlays} />);
    for (let i = 0; i < testPlays.length; i++) {
      expect(screen.getByTestId(`wristband-cell-${i}`)).toBeInTheDocument();
    }
  });

  it('displays play names in cells', () => {
    render(<WristbandEditor plays={testPlays} />);
    expect(screen.getByTestId('cell-name-0')).toHaveTextContent('HB Dive');
    expect(screen.getByTestId('cell-name-1')).toHaveTextContent('PA Slant');
    expect(screen.getByTestId('cell-name-5')).toHaveTextContent('Mesh Concept');
  });

  it('displays mini thumbnail placeholders in cells', () => {
    render(<WristbandEditor plays={testPlays} />);
    for (let i = 0; i < testPlays.length; i++) {
      expect(screen.getByTestId(`cell-thumbnail-${i}`)).toBeInTheDocument();
    }
  });

  it('shows correct play count and row count', () => {
    render(<WristbandEditor plays={testPlays} columns={3} />);
    const playCount = screen.getByTestId('play-count');
    // 6 plays, 3 columns => 2 rows
    expect(playCount).toHaveTextContent('6 plays / 2 rows');
  });

  it('defaults to 4 columns', () => {
    render(<WristbandEditor plays={testPlays} />);
    const select = screen.getByTestId('columns-select') as HTMLSelectElement;
    expect(select.value).toBe('4');
  });

  it('respects the columns prop', () => {
    render(<WristbandEditor plays={testPlays} columns={5} />);
    const select = screen.getByTestId('columns-select') as HTMLSelectElement;
    expect(select.value).toBe('5');
  });

  it('clamps columns to range 3-6', () => {
    render(<WristbandEditor plays={testPlays} columns={2} />);
    const select = screen.getByTestId('columns-select') as HTMLSelectElement;
    expect(select.value).toBe('3');
  });

  it('changes columns when select is changed', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<WristbandEditor plays={testPlays} onLayoutChange={onLayoutChange} />);

    const select = screen.getByTestId('columns-select');
    await user.selectOptions(select, '5');

    expect((select as HTMLSelectElement).value).toBe('5');
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({ columns: 5 }),
    );
  });

  it('calls onLayoutChange when column count changes', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<WristbandEditor plays={testPlays} onLayoutChange={onLayoutChange} />);

    const select = screen.getByTestId('columns-select');
    await user.selectOptions(select, '6');

    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: 6,
        cells: expect.arrayContaining([
          expect.objectContaining({ playId: 'p1', playName: 'HB Dive' }),
        ]),
      }),
    );
  });

  it('applies team colors to export button', () => {
    render(
      <WristbandEditor
        plays={testPlays}
        teamColors={{ primary: '#ff0000', secondary: '#00ff00' }}
      />,
    );

    const exportBtn = screen.getByTestId('export-btn');
    expect(exportBtn.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(exportBtn.style.color).toBe('rgb(0, 255, 0)');
  });

  it('applies team colors to play names', () => {
    render(
      <WristbandEditor
        plays={testPlays}
        teamColors={{ primary: '#ff0000', secondary: '#00ff00' }}
      />,
    );

    const nameEl = screen.getByTestId('cell-name-0');
    expect(nameEl.style.color).toBe('rgb(255, 0, 0)');
  });

  it('export button triggers print', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<WristbandEditor plays={testPlays} />);

    await user.click(screen.getByTestId('export-btn'));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it('renders orientation selector', () => {
    render(<WristbandEditor plays={testPlays} />);
    const orientSelect = screen.getByTestId('orientation-select');
    expect(orientSelect).toBeInTheDocument();
    expect((orientSelect as HTMLSelectElement).value).toBe('portrait');
  });

  it('handles empty plays array', () => {
    render(<WristbandEditor plays={[]} />);
    expect(screen.getByTestId('wristband-grid')).toBeInTheDocument();
    expect(screen.getByTestId('play-count')).toHaveTextContent('0 plays / 0 rows');
  });

  it('cells are draggable', () => {
    render(<WristbandEditor plays={testPlays} />);
    const cell = screen.getByTestId('wristband-cell-0');
    expect(cell).toHaveAttribute('draggable', 'true');
  });
});
