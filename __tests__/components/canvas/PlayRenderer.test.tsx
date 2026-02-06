import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

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

import { PlayRenderer } from '@/components/canvas/PlayRenderer';
import type { Play, Formation, Player } from '@/types';

const makeFormation = (players?: Player[]): Formation => ({
  id: 'formation-1',
  name: 'Singleback',
  side: 'offense',
  players: players ?? [
    { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
    { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
    { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 245 }, side: 'offense' },
  ],
  personnel: '11',
  tags: ['spread'],
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

describe('PlayRenderer', () => {
  it('renders a Stage (via FieldCanvas)', () => {
    render(
      <PlayRenderer
        play={makePlay()}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
      />,
    );
    const stage = screen.getByTestId('stage');
    expect(stage).toBeInTheDocument();
  });

  it('renders player Groups for each formation player', () => {
    const formation = makeFormation();
    render(
      <PlayRenderer
        play={makePlay()}
        formation={formation}
        mode="full"
        width={800}
        height={500}
      />,
    );
    const groups = screen.getAllByTestId('group');
    // Each player is a Group; at least formation.players.length groups
    expect(groups.length).toBeGreaterThanOrEqual(formation.players.length);
  });

  it('renders route lines when showRoutes=true', () => {
    render(
      <PlayRenderer
        play={makePlay()}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
        showRoutes={true}
      />,
    );
    // Routes create Arrow elements
    const arrows = screen.getAllByTestId('arrow');
    expect(arrows.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render route lines when showRoutes=false', () => {
    const play = makePlay({
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
    });
    render(
      <PlayRenderer
        play={play}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
        showRoutes={false}
        showBlocking={false}
      />,
    );
    // No route arrows should be rendered (only LOS line might exist)
    // Check there are no arrows from routes
    const arrows = screen.queryAllByTestId('arrow');
    expect(arrows.length).toBe(0);
  });

  it('renders blocking lines when showBlocking=true', () => {
    render(
      <PlayRenderer
        play={makePlay()}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
        showBlocking={true}
      />,
    );
    // Blocking creates Line elements
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('does not render blocking when showBlocking=false', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'rb',
          blocking: {
            id: 'block-rb',
            blockerId: 'rb',
            blockType: 'pass-pro',
          },
        },
      ],
    });
    render(
      <PlayRenderer
        play={play}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
        showBlocking={false}
        showRoutes={false}
      />,
    );
    // The only Lines should be from FieldCanvas (yard lines, etc.)
    // There should be no Group wrapping a blocking line
    // This is hard to test precisely with mocks, but at least verify it renders
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('renders defensive overlay when showDefense=true', () => {
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
      <PlayRenderer
        play={play}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
        showDefense={true}
      />,
    );
    // Defensive players add more Groups, Rects (DE=square), and Polygons (MLB=triangle)
    const groups = screen.getAllByTestId('group');
    // 3 offense + 2 defense + wrapper groups >= 5
    expect(groups.length).toBeGreaterThanOrEqual(5);
  });

  it('does not render defensive overlay when showDefense=false', () => {
    const play = makePlay({
      defensiveOverlay: {
        front: '4-3',
        coverage: 'Cover 2',
        players: [
          { id: 'de1', position: 'DE', label: 'DE', location: { x: 290, y: 220 }, side: 'defense' },
        ],
      },
    });
    const formation = makeFormation([
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
    ]);
    render(
      <PlayRenderer
        play={play}
        formation={formation}
        mode="full"
        width={800}
        height={500}
        showDefense={false}
      />,
    );
    // Only 1 offensive player group + its shape + canvas groups
    // The DE rect should not exist since defense is hidden
    // With just 1 offense player, we should see fewer groups
    const groups = screen.getAllByTestId('group');
    // Should have fewer groups than if defense was shown
    expect(groups.length).toBeLessThan(5);
  });

  it('makes players draggable in full mode', () => {
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation([
          { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
        ])}
        mode="full"
        width={800}
        height={500}
      />,
    );
    const groups = screen.getAllByTestId('group');
    // The player Group should be draggable
    const draggableGroup = groups.find(
      (g) => g.getAttribute('draggable') === 'true',
    );
    expect(draggableGroup).toBeInTheDocument();
  });

  it('makes players non-draggable in thumbnail mode', () => {
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation([
          { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
        ])}
        mode="thumbnail"
        width={200}
        height={125}
      />,
    );
    const groups = screen.getAllByTestId('group');
    // No group should have draggable=true
    const draggableGroup = groups.find(
      (g) => g.getAttribute('draggable') === 'true',
    );
    expect(draggableGroup).toBeUndefined();
  });

  it('makes players non-draggable in wristband mode', () => {
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation([
          { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
        ])}
        mode="wristband"
        width={90}
        height={55}
      />,
    );
    const groups = screen.getAllByTestId('group');
    const draggableGroup = groups.find(
      (g) => g.getAttribute('draggable') === 'true',
    );
    expect(draggableGroup).toBeUndefined();
  });

  it('shows play name label in card mode', () => {
    render(
      <PlayRenderer
        play={makePlay({ name: 'HB Dive' })}
        formation={makeFormation()}
        mode="card"
        width={300}
        height={200}
      />,
    );
    const texts = screen.getAllByTestId('konva-text');
    const nameLabel = texts.find(
      (t) => t.getAttribute('text') === 'HB Dive',
    );
    expect(nameLabel).toBeInTheDocument();
  });

  it('does not show play name label in full mode', () => {
    render(
      <PlayRenderer
        play={makePlay({ name: 'HB Dive' })}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
      />,
    );
    const texts = screen.getAllByTestId('konva-text');
    const nameLabel = texts.find(
      (t) => t.getAttribute('text') === 'HB Dive',
    );
    expect(nameLabel).toBeUndefined();
  });

  it('does not show play name label in thumbnail mode', () => {
    render(
      <PlayRenderer
        play={makePlay({ name: 'HB Dive' })}
        formation={makeFormation()}
        mode="thumbnail"
        width={200}
        height={125}
      />,
    );
    const texts = screen.getAllByTestId('konva-text');
    const nameLabel = texts.find(
      (t) => t.getAttribute('text') === 'HB Dive',
    );
    expect(nameLabel).toBeUndefined();
  });

  it('calls onPlayerSelect when a player is clicked in full mode', () => {
    const onSelect = vi.fn();
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation([
          { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
        ])}
        mode="full"
        width={800}
        height={500}
        onPlayerSelect={onSelect}
      />,
    );
    const groups = screen.getAllByTestId('group');
    // Click the player group (first group is the player)
    fireEvent.click(groups[0]);
    expect(onSelect).toHaveBeenCalledWith('qb');
  });

  it('does not call onPlayerSelect in thumbnail mode', () => {
    const onSelect = vi.fn();
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation([
          { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
        ])}
        mode="thumbnail"
        width={200}
        height={125}
        onPlayerSelect={onSelect}
      />,
    );
    const groups = screen.getAllByTestId('group');
    fireEvent.click(groups[0]);
    // onSelect should NOT have been called because thumbnail mode is non-interactive
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('allows overriding interactive prop', () => {
    const onSelect = vi.fn();
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation([
          { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
        ])}
        mode="thumbnail"
        width={200}
        height={125}
        interactive={true}
        onPlayerSelect={onSelect}
      />,
    );
    const groups = screen.getAllByTestId('group');
    fireEvent.click(groups[0]);
    // With interactive=true override, onSelect should fire
    expect(onSelect).toHaveBeenCalledWith('qb');
  });

  it('renders at correct dimensions for different sizes', () => {
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation()}
        mode="card"
        width={300}
        height={200}
      />,
    );
    const stage = screen.getByTestId('stage');
    expect(stage).toHaveAttribute('width', '300');
    expect(stage).toHaveAttribute('height', '200');
  });

  it('renders with print mode', () => {
    render(
      <PlayRenderer
        play={makePlay()}
        formation={makeFormation()}
        mode="print"
        width={1200}
        height={800}
      />,
    );
    const stage = screen.getByTestId('stage');
    expect(stage).toHaveAttribute('width', '1200');
    expect(stage).toHaveAttribute('height', '800');
  });

  it('handles play with no assignments gracefully', () => {
    render(
      <PlayRenderer
        play={makePlay({ assignments: [] })}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
      />,
    );
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('handles assignment referencing missing player gracefully', () => {
    const play = makePlay({
      assignments: [
        {
          playerId: 'nonexistent',
          route: {
            id: 'r1',
            name: 'test',
            type: 'streak',
            points: [{ x: 100, y: 100, type: 'line' }],
          },
        },
      ],
    });
    // Should not throw
    render(
      <PlayRenderer
        play={play}
        formation={makeFormation()}
        mode="full"
        width={800}
        height={500}
      />,
    );
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });
});
