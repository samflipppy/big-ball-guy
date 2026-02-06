import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GamePlanSection } from '@/components/gameplan/GamePlanSection';
import type { GamePlanSection as GamePlanSectionType, Play } from '@/types';

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

const mockSection: GamePlanSectionType = {
  id: 'sec-1',
  situation: '1st & 10',
  plays: [
    { playId: 'play-1', order: 0 },
    { playId: 'play-2', order: 1, notes: 'Use against Cover 3' },
  ],
  notes: 'Keep it balanced',
  order: 0,
};

const defaultProps = {
  section: mockSection,
  plays: mockPlays,
  onUpdateSituation: vi.fn(),
  onUpdateNotes: vi.fn(),
  onRemoveSection: vi.fn(),
  onRemovePlay: vi.fn(),
  onReorderPlay: vi.fn(),
  onAddPlayClick: vi.fn(),
};

describe('GamePlanSection', () => {
  it('renders section with situation name', () => {
    render(<GamePlanSection {...defaultProps} />);
    expect(screen.getByTestId('situation-label')).toHaveTextContent('1st & 10');
  });

  it('renders play count', () => {
    render(<GamePlanSection {...defaultProps} />);
    expect(screen.getByText('2 plays')).toBeInTheDocument();
  });

  it('renders singular play count', () => {
    const singlePlaySection = {
      ...mockSection,
      plays: [{ playId: 'play-1', order: 0 }],
    };
    render(<GamePlanSection {...defaultProps} section={singlePlaySection} />);
    expect(screen.getByText('1 play')).toBeInTheDocument();
  });

  it('renders play cards with names', () => {
    render(<GamePlanSection {...defaultProps} />);
    expect(screen.getByText('HB Dive')).toBeInTheDocument();
    expect(screen.getByText('PA Boot')).toBeInTheDocument();
  });

  it('renders play notes', () => {
    render(<GamePlanSection {...defaultProps} />);
    expect(screen.getByText('Use against Cover 3')).toBeInTheDocument();
  });

  it('renders coaching notes', () => {
    render(<GamePlanSection {...defaultProps} />);
    const notesTextarea = screen.getByTestId('section-notes');
    expect(notesTextarea).toHaveValue('Keep it balanced');
  });

  it('renders empty state when no plays', () => {
    const emptySection = { ...mockSection, plays: [] };
    render(<GamePlanSection {...defaultProps} section={emptySection} />);
    expect(screen.getByTestId('empty-section')).toBeInTheDocument();
  });

  it('calls onAddPlayClick when Add Play button is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanSection {...defaultProps} />);
    await user.click(screen.getByTestId('add-play-btn'));
    expect(defaultProps.onAddPlayClick).toHaveBeenCalledWith('sec-1');
  });

  it('calls onRemoveSection when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanSection {...defaultProps} />);
    await user.click(screen.getByTestId('remove-section-btn'));
    expect(defaultProps.onRemoveSection).toHaveBeenCalledWith('sec-1');
  });

  it('calls onRemovePlay when play remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanSection {...defaultProps} />);
    await user.click(screen.getByTestId('remove-play-play-1'));
    expect(defaultProps.onRemovePlay).toHaveBeenCalledWith('sec-1', 'play-1');
  });

  it('allows editing the situation name', async () => {
    const user = userEvent.setup();
    render(<GamePlanSection {...defaultProps} />);

    await user.click(screen.getByTestId('situation-label'));
    const input = screen.getByTestId('situation-input');
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '3rd & Short{Enter}');
    expect(defaultProps.onUpdateSituation).toHaveBeenCalledWith('sec-1', '3rd & Short');
  });

  it('calls onUpdateNotes when notes are changed', async () => {
    const user = userEvent.setup();
    render(<GamePlanSection {...defaultProps} />);
    const notesTextarea = screen.getByTestId('section-notes');
    await user.clear(notesTextarea);
    await user.type(notesTextarea, 'New notes');
    expect(defaultProps.onUpdateNotes).toHaveBeenCalled();
  });

  it('reverts situation name on Escape key', async () => {
    const user = userEvent.setup();
    render(<GamePlanSection {...defaultProps} />);

    await user.click(screen.getByTestId('situation-label'));
    const input = screen.getByTestId('situation-input');
    await user.clear(input);
    await user.type(input, 'Something else');
    await user.keyboard('{Escape}');

    // Should revert and show the label again
    expect(screen.getByTestId('situation-label')).toHaveTextContent('1st & 10');
  });

  it('renders personnel info on play cards', () => {
    render(<GamePlanSection {...defaultProps} />);
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('handles unknown play references gracefully', () => {
    const sectionWithUnknown = {
      ...mockSection,
      plays: [{ playId: 'unknown-play', order: 0 }],
    };
    render(<GamePlanSection {...defaultProps} section={sectionWithUnknown} />);
    expect(screen.getByText('Unknown Play')).toBeInTheDocument();
  });
});
