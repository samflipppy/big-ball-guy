import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import type { Play, Formation } from '@/types';

// ============================================================
// Mock canvas
// ============================================================

const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  globalAlpha: 1,
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  setLineDash: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();

  // Mock HTMLCanvasElement.getContext
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as any);

  // Mock requestAnimationFrame / cancelAnimationFrame
  let rafId = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafId++;
    // We don't auto-invoke callbacks — tests will do so manually via act()
    return rafId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

import { PlayAnimation } from '@/components/canvas/PlayAnimation';

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
    {
      playerId: 'rb',
      blocking: {
        id: 'block-rb',
        blockerId: 'rb',
        blockType: 'pass-pro',
      },
    },
  ],
  tags: ['pass'],
  personnel: '11',
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

// ============================================================
// Tests
// ============================================================

describe('PlayAnimation', () => {
  it('renders the animation container', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('play-animation')).toBeInTheDocument();
  });

  it('renders a canvas element', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const canvas = screen.getByTestId('animation-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('renders animation controls', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('animation-controls')).toBeInTheDocument();
  });

  it('renders play/pause button', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const btn = screen.getByTestId('btn-play-pause');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', 'Play');
  });

  it('renders rewind button', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('btn-rewind')).toBeInTheDocument();
  });

  it('renders step forward/backward buttons', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('btn-step-forward')).toBeInTheDocument();
    expect(screen.getByTestId('btn-step-backward')).toBeInTheDocument();
  });

  it('renders speed button', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const speedBtn = screen.getByTestId('btn-speed');
    expect(speedBtn).toBeInTheDocument();
    expect(speedBtn).toHaveTextContent('1x');
  });

  it('renders time display', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const timeDisplay = screen.getByTestId('time-display');
    expect(timeDisplay).toBeInTheDocument();
    // Should show 0.0s / total
    expect(timeDisplay).toHaveTextContent('0.0s');
  });

  it('renders progress bar', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('draws on canvas on initial render', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    // renderFrame should have been called, which calls fillRect for the field bg
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('toggles play/pause state when play button is clicked', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const btn = screen.getByTestId('btn-play-pause');

    // Initially paused
    expect(btn).toHaveAttribute('aria-label', 'Play');

    // Click to play
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-label', 'Pause');

    // Click to pause
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-label', 'Play');
  });

  it('starts playing with requestAnimationFrame', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const btn = screen.getByTestId('btn-play-pause');
    fireEvent.click(btn);

    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('cancels animation on pause', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const btn = screen.getByTestId('btn-play-pause');

    // Play
    fireEvent.click(btn);
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    // Pause
    fireEvent.click(btn);
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('cycles speed on speed button click', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const speedBtn = screen.getByTestId('btn-speed');

    // Initial: 1x
    expect(speedBtn).toHaveTextContent('1x');

    // Click cycles to 2x
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent('2x');

    // Click cycles to 0.5x
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent('0.5x');

    // Click cycles back to 1x
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent('1x');
  });

  it('responds to Space key for play/pause', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const btn = screen.getByTestId('btn-play-pause');
    expect(btn).toHaveAttribute('aria-label', 'Play');

    // Press space to play
    fireEvent.keyDown(document, { code: 'Space' });
    expect(btn).toHaveAttribute('aria-label', 'Pause');

    // Press space to pause
    fireEvent.keyDown(document, { code: 'Space' });
    expect(btn).toHaveAttribute('aria-label', 'Play');
  });

  it('responds to ArrowRight key for step forward', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const timeDisplay = screen.getByTestId('time-display');
    const initialText = timeDisplay.textContent;

    fireEvent.keyDown(document, { code: 'ArrowRight' });

    // Time should have advanced
    expect(timeDisplay.textContent).not.toBe(initialText);
  });

  it('responds to ArrowLeft key for step backward', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    // Step forward first, then backward
    fireEvent.keyDown(document, { code: 'ArrowRight' });
    const timeAfterForward = screen.getByTestId('time-display').textContent;

    fireEvent.keyDown(document, { code: 'ArrowLeft' });
    const timeAfterBackward = screen.getByTestId('time-display').textContent;

    // Time after backward should differ from after forward
    // (it went back)
    expect(timeAfterBackward).not.toBe(timeAfterForward);
  });

  it('responds to Shift+ArrowRight for speed increase', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const speedBtn = screen.getByTestId('btn-speed');
    expect(speedBtn).toHaveTextContent('1x');

    fireEvent.keyDown(document, { code: 'ArrowRight', shiftKey: true });
    expect(speedBtn).toHaveTextContent('2x');
  });

  it('responds to Shift+ArrowLeft for speed decrease', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const speedBtn = screen.getByTestId('btn-speed');
    expect(speedBtn).toHaveTextContent('1x');

    fireEvent.keyDown(document, { code: 'ArrowLeft', shiftKey: true });
    expect(speedBtn).toHaveTextContent('0.5x');
  });

  it('rewinds to start on rewind button click', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    // Step forward first
    fireEvent.keyDown(document, { code: 'ArrowRight' });
    fireEvent.keyDown(document, { code: 'ArrowRight' });

    // Rewind
    fireEvent.click(screen.getByTestId('btn-rewind'));

    const timeDisplay = screen.getByTestId('time-display');
    expect(timeDisplay.textContent).toMatch(/^0\.0s/);
  });

  it('handles play with pre-snap motion', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'x',
          route: {
            id: 'route-x',
            name: 'Streak',
            type: 'streak',
            points: [{ x: 80, y: 150, type: 'line' }],
          },
          motion: {
            startPosition: { x: 80, y: 245 },
            endPosition: { x: 200, y: 245 },
            timing: 'pre-snap',
          },
        },
      ],
    });

    // Should not throw
    render(
      <PlayAnimation
        play={play}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('play-animation')).toBeInTheDocument();
  });

  it('handles play with defensive overlay', () => {
    const play = makePlay({
      defensiveOverlay: {
        front: '4-3',
        coverage: 'Cover 2',
        players: [
          { id: 'de1', position: 'DE', label: 'DE', location: { x: 290, y: 220 }, side: 'defense' },
          { id: 'mlb', position: 'MLB', label: 'M', location: { x: 400, y: 190 }, side: 'defense' },
        ],
      },
    });

    render(
      <PlayAnimation
        play={play}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('play-animation')).toBeInTheDocument();
    // Canvas should have drawn defensive players
    expect(mockCtx.arc).toHaveBeenCalled();
  });

  it('handles play with no assignments', () => {
    render(
      <PlayAnimation
        play={makePlay({ assignments: [] })}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    expect(screen.getByTestId('play-animation')).toBeInTheDocument();
  });

  it('clicking progress bar scrubs the timeline', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
      />,
    );

    const progressBar = screen.getByTestId('progress-bar');

    // Simulate a click at the midpoint
    const rect = { left: 0, width: 200, top: 0, height: 8 };
    vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);

    fireEvent.click(progressBar, { clientX: 100 }); // 50% of width

    const timeDisplay = screen.getByTestId('time-display');
    // Time should have changed to approximately half of total duration
    expect(timeDisplay.textContent).not.toMatch(/^0\.0s/);
  });

  it('sets autoPlay to start playing automatically', () => {
    render(
      <PlayAnimation
        play={makePlay()}
        formation={makeFormation()}
        width={800}
        height={500}
        autoPlay={true}
      />,
    );

    // Should start playing immediately
    const btn = screen.getByTestId('btn-play-pause');
    expect(btn).toHaveAttribute('aria-label', 'Pause');
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });
});
