import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// Mock react-konva so PlayRenderer can render in jsdom
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="stage" {...props}>{children}</div>,
  Layer: ({ children, ...props }: any) => <div data-testid="layer" {...props}>{children}</div>,
  Circle: (props: any) => <div data-testid="circle" {...props} />,
  Line: (props: any) => <div data-testid="line" {...props} />,
  Text: (props: any) => <div data-testid="konva-text" {...props} />,
  Rect: (props: any) => <div data-testid="rect" {...props} />,
  Group: ({ children, ...props }: any) => <div data-testid="group" {...props}>{children}</div>,
  Arrow: (props: any) => <div data-testid="arrow" {...props} />,
  RegularPolygon: (props: any) => <div data-testid="polygon" {...props} />,
  Path: (props: any) => <div data-testid="path" {...props} />,
}));

import { MeetingDeck } from '@/components/presentation/MeetingDeck';
import type { Play, Formation } from '@/types';

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

const makePlays = (count: number): Play[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `play-${i}`,
    name: `Test Play ${i + 1}`,
    formationId: 'f1',
    assignments: [],
    tags: [],
    personnel: '11',
    notes: i === 0 ? 'Opening play notes' : undefined,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  }));

describe('MeetingDeck', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the meeting deck container', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('meeting-deck')).toBeInTheDocument();
  });

  it('renders empty state when no plays are provided', () => {
    render(
      <MeetingDeck plays={[]} formations={mockFormations} onExit={vi.fn()} />,
    );
    expect(screen.getByTestId('empty-deck')).toHaveTextContent('No plays to present');
  });

  it('displays the first play name by default', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 1');
  });

  it('starts on the initialSlide if provided', () => {
    render(
      <MeetingDeck
        plays={makePlays(5)}
        formations={mockFormations}
        initialSlide={2}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 3');
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('3 / 5');
  });

  it('shows the slide counter', () => {
    render(
      <MeetingDeck
        plays={makePlays(15)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('1 / 15');
  });

  it('navigates forward with the Next button', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('slide-next'));
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 2');
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('2 / 3');
  });

  it('navigates backward with the Previous button', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        initialSlide={2}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('slide-prev'));
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 2');
  });

  it('navigates forward with Right arrow key', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 2');
  });

  it('navigates backward with Left arrow key', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        initialSlide={1}
        onExit={vi.fn()}
      />,
    );
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 1');
  });

  it('calls onExit when Escape key is pressed', () => {
    const onExit = vi.fn();
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={onExit}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('calls onExit when Exit button is clicked', () => {
    const onExit = vi.fn();
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={onExit}
      />,
    );
    fireEvent.click(screen.getByTestId('slide-exit'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('calls onExit from empty state exit button', () => {
    const onExit = vi.fn();
    render(
      <MeetingDeck plays={[]} formations={mockFormations} onExit={onExit} />,
    );
    fireEvent.click(screen.getByTestId('empty-deck-exit'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('does not navigate past the last slide', () => {
    render(
      <MeetingDeck
        plays={makePlays(2)}
        formations={mockFormations}
        initialSlide={1}
        onExit={vi.fn()}
      />,
    );
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 2');
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('2 / 2');
  });

  it('does not navigate before the first slide', () => {
    render(
      <MeetingDeck
        plays={makePlays(2)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 1');
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('1 / 2');
  });

  it('renders the notes panel', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('notes-panel')).toBeInTheDocument();
    expect(screen.getByTestId('slide-notes')).toBeInTheDocument();
  });

  it('displays existing play notes', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('play-notes')).toHaveTextContent('Opening play notes');
  });

  it('allows typing meeting notes', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    const textarea = screen.getByTestId('slide-notes');
    fireEvent.change(textarea, { target: { value: 'Coach says run this on 3rd down' } });
    expect(textarea).toHaveValue('Coach says run this on 3rd down');
  });

  it('creates a laser dot on click in the slide area', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    const slideArea = screen.getByTestId('slide-area');

    // Mock getBoundingClientRect
    vi.spyOn(slideArea, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 500,
      width: 800,
      height: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.click(slideArea, { clientX: 200, clientY: 150 });
    expect(screen.getByTestId('laser-dot')).toBeInTheDocument();
  });

  it('laser dot fades after timeout', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    const slideArea = screen.getByTestId('slide-area');
    vi.spyOn(slideArea, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 800, bottom: 500,
      width: 800, height: 500, x: 0, y: 0, toJSON: () => {},
    });

    fireEvent.click(slideArea, { clientX: 100, clientY: 100 });
    expect(screen.getByTestId('laser-dot')).toBeInTheDocument();

    // After 1500ms the dot should disappear
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByTestId('laser-dot')).not.toBeInTheDocument();
  });

  it('auto-advance toggle works', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('auto-advance-toggle')).toHaveTextContent('Auto: OFF');
    fireEvent.click(screen.getByTestId('auto-advance-toggle'));
    expect(screen.getByTestId('auto-advance-toggle')).toHaveTextContent('Auto: ON');
  });

  it('auto-advance timer advances slides', () => {
    render(
      <MeetingDeck
        plays={makePlays(5)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );

    // Enable auto-advance
    fireEvent.click(screen.getByTestId('auto-advance-toggle'));

    // Default is 10 seconds per slide. Advance 10 seconds.
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId('slide-play-name')).toHaveTextContent('Test Play 2');
  });

  it('allows configuring auto-advance seconds', () => {
    render(
      <MeetingDeck
        plays={makePlays(3)}
        formations={mockFormations}
        onExit={vi.fn()}
      />,
    );
    const input = screen.getByTestId('auto-advance-seconds-input');
    fireEvent.change(input, { target: { value: '5' } });
    expect(input).toHaveValue(5);
  });

  it('shows missing formation message when formation is not found', () => {
    const plays: Play[] = [
      {
        id: 'p1',
        name: 'Orphan Play',
        formationId: 'nonexistent',
        assignments: [],
        tags: [],
        personnel: '11',
        teamId: 'team-1',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];
    render(
      <MeetingDeck plays={plays} formations={mockFormations} onExit={vi.fn()} />,
    );
    expect(screen.getByTestId('missing-formation')).toHaveTextContent('Formation not found');
  });
});
