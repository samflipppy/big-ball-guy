import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PracticeScriptEditor } from '@/components/gameplan/PracticeScriptEditor';
import type { PracticeScript, Play } from '@/types';

const mockPlays: Play[] = [
  {
    id: 'play-1',
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
];

const createScript = (overrides?: Partial<PracticeScript>): PracticeScript => ({
  id: 'ps-1',
  name: 'Monday Practice',
  date: '2025-09-01',
  periods: [
    {
      id: 'per-1',
      name: 'Individual',
      duration: 15,
      type: 'individual',
      plays: [],
      notes: '',
      order: 0,
    },
    {
      id: 'per-2',
      name: 'Team Run',
      duration: 20,
      type: 'team',
      plays: [
        { playId: 'play-1', order: 0 },
        { playId: 'play-2', order: 1 },
      ],
      notes: 'Focus on inside zone',
      order: 1,
    },
  ],
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

describe('PracticeScriptEditor', () => {
  const onChange = vi.fn();
  const onAddPlayToPeriod = vi.fn();

  const defaultProps = {
    script: createScript(),
    plays: mockPlays,
    onChange,
    onAddPlayToPeriod,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('practice-script-editor')).toBeInTheDocument();
  });

  it('displays total time', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('total-time')).toHaveTextContent('35m');
  });

  it('displays total time with hours', () => {
    const longScript = createScript({
      periods: [
        { id: 'p1', name: 'Long', duration: 75, type: 'team', plays: [], order: 0 },
      ],
    });
    render(<PracticeScriptEditor {...defaultProps} script={longScript} />);
    expect(screen.getByTestId('total-time')).toHaveTextContent('1h 15m');
  });

  it('displays period count', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('period-count')).toHaveTextContent('2');
  });

  it('displays total plays', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('total-plays')).toHaveTextContent('2');
  });

  it('renders all periods', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('period-per-1')).toBeInTheDocument();
    expect(screen.getByTestId('period-per-2')).toBeInTheDocument();
  });

  it('shows period type badge', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('period-type-badge-per-1')).toHaveTextContent('Individual');
    expect(screen.getByTestId('period-type-badge-per-2')).toHaveTextContent('Team');
  });

  it('renders plays within a period', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('period-play-play-1')).toBeInTheDocument();
    expect(screen.getByTestId('period-play-play-2')).toBeInTheDocument();
  });

  it('shows empty state when no periods', () => {
    const emptyScript = createScript({ periods: [] });
    render(<PracticeScriptEditor {...defaultProps} script={emptyScript} />);
    expect(screen.getByTestId('empty-script')).toBeInTheDocument();
  });

  it('adds a new period', async () => {
    const user = userEvent.setup();
    render(<PracticeScriptEditor {...defaultProps} />);

    await user.click(screen.getByTestId('add-period-btn'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        periods: expect.arrayContaining([
          expect.objectContaining({ name: 'Period 3', type: 'team', duration: 10 }),
        ]),
      }),
    );
  });

  it('removes a period', async () => {
    const user = userEvent.setup();
    render(<PracticeScriptEditor {...defaultProps} />);

    await user.click(screen.getByTestId('remove-period-per-1'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        periods: expect.arrayContaining([
          expect.objectContaining({ id: 'per-2', order: 0 }),
        ]),
      }),
    );
  });

  it('updates period type', async () => {
    const user = userEvent.setup();
    render(<PracticeScriptEditor {...defaultProps} />);

    const typeSelect = screen.getByTestId('period-type-select-per-1');
    await user.selectOptions(typeSelect, 'scout');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        periods: expect.arrayContaining([
          expect.objectContaining({ id: 'per-1', type: 'scout' }),
        ]),
      }),
    );
  });

  it('updates period duration', async () => {
    const user = userEvent.setup();
    render(<PracticeScriptEditor {...defaultProps} />);

    const durationInput = screen.getByTestId('period-duration-per-1');
    await user.clear(durationInput);
    await user.type(durationInput, '25');

    expect(onChange).toHaveBeenCalled();
  });

  it('removes a play from a period', async () => {
    const user = userEvent.setup();
    render(<PracticeScriptEditor {...defaultProps} />);

    await user.click(screen.getByTestId('remove-period-play-play-1'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        periods: expect.arrayContaining([
          expect.objectContaining({
            id: 'per-2',
            plays: [expect.objectContaining({ playId: 'play-2', order: 0 })],
          }),
        ]),
      }),
    );
  });

  it('calls onAddPlayToPeriod when add play button is clicked', async () => {
    const user = userEvent.setup();
    render(<PracticeScriptEditor {...defaultProps} />);

    await user.click(screen.getByTestId('add-play-to-period-per-2'));
    expect(onAddPlayToPeriod).toHaveBeenCalledWith('per-2');
  });

  it('collapses and expands periods', async () => {
    const user = userEvent.setup();
    render(<PracticeScriptEditor {...defaultProps} />);

    // Periods start expanded, so plays should be visible
    expect(screen.getByTestId('period-play-play-1')).toBeInTheDocument();

    // Click header to collapse
    await user.click(screen.getByTestId('period-header-per-2'));
    expect(screen.queryByTestId('period-play-play-1')).not.toBeInTheDocument();

    // Click header to expand
    await user.click(screen.getByTestId('period-header-per-2'));
    expect(screen.getByTestId('period-play-play-1')).toBeInTheDocument();
  });

  it('shows empty period message', () => {
    render(<PracticeScriptEditor {...defaultProps} />);
    expect(screen.getByTestId('empty-period-per-1')).toBeInTheDocument();
  });
});
