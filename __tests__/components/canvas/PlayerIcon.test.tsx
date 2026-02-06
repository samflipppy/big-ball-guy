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

import { PlayerIcon } from '@/components/canvas/PlayerIcon';
import type { Player } from '@/types';
import { PLAYER_COLORS, PLAYER_RADIUS } from '@/lib/constants';

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'qb1',
  position: 'QB',
  label: 'QB',
  location: { x: 400, y: 280 },
  side: 'offense',
  ...overrides,
});

describe('PlayerIcon', () => {
  it('renders a Group at the player location', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} />);
    const groups = screen.getAllByTestId('group');
    const playerGroup = groups[0];
    expect(playerGroup).toHaveAttribute('x', '400');
    expect(playerGroup).toHaveAttribute('y', '280');
  });

  it('renders a Circle for offensive players', () => {
    const player = makePlayer({ side: 'offense' });
    render(<PlayerIcon player={player} />);
    const circles = screen.getAllByTestId('circle');
    // Should have at least one circle (the player shape)
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a RegularPolygon (triangle) for defensive LB/DB', () => {
    const player = makePlayer({
      id: 'mlb1',
      position: 'MLB',
      label: 'M',
      side: 'defense',
    });
    render(<PlayerIcon player={player} />);
    const polygons = screen.getAllByTestId('polygon');
    expect(polygons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a Rect (square) for defensive linemen', () => {
    const player = makePlayer({
      id: 'de1',
      position: 'DE',
      label: 'DE',
      side: 'defense',
    });
    render(<PlayerIcon player={player} />);
    const rects = screen.getAllByTestId('rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a Rect (square) for DT', () => {
    const player = makePlayer({
      id: 'dt1',
      position: 'DT',
      label: 'DT',
      side: 'defense',
    });
    render(<PlayerIcon player={player} />);
    const rects = screen.getAllByTestId('rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a Rect (square) for NT', () => {
    const player = makePlayer({
      id: 'nt1',
      position: 'NT',
      label: 'NT',
      side: 'defense',
    });
    render(<PlayerIcon player={player} />);
    const rects = screen.getAllByTestId('rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('shows player label text', () => {
    const player = makePlayer({ label: 'QB' });
    render(<PlayerIcon player={player} />);
    const texts = screen.getAllByTestId('konva-text');
    const labelText = texts.find((t) => t.getAttribute('text') === 'QB');
    expect(labelText).toBeInTheDocument();
  });

  it('does not show label in wristband mode', () => {
    const player = makePlayer({ label: 'QB' });
    render(<PlayerIcon player={player} mode="wristband" />);
    const texts = screen.queryAllByTestId('konva-text');
    const labelText = texts.find((t) => t.getAttribute('text') === 'QB');
    expect(labelText).toBeUndefined();
  });

  it('uses custom player color when provided', () => {
    const player = makePlayer({ color: '#ff00ff' });
    render(<PlayerIcon player={player} />);
    const circles = screen.getAllByTestId('circle');
    const playerCircle = circles.find((c) => c.getAttribute('fill') === '#ff00ff');
    expect(playerCircle).toBeInTheDocument();
  });

  it('uses offense color for offensive players without custom color', () => {
    const player = makePlayer({ side: 'offense', color: undefined });
    render(<PlayerIcon player={player} />);
    const circles = screen.getAllByTestId('circle');
    const offenseCircle = circles.find(
      (c) => c.getAttribute('fill') === PLAYER_COLORS.offense,
    );
    expect(offenseCircle).toBeInTheDocument();
  });

  it('uses defense color for defensive players without custom color', () => {
    const player = makePlayer({
      id: 'cb1',
      position: 'CB',
      label: 'CB',
      side: 'defense',
      color: undefined,
    });
    render(<PlayerIcon player={player} />);
    // Should find a polygon or shape with defense color
    const polygons = screen.getAllByTestId('polygon');
    const defenseShape = polygons.find(
      (p) => p.getAttribute('fill') === PLAYER_COLORS.defense,
    );
    expect(defenseShape).toBeInTheDocument();
  });

  it('shows selection highlight ring when selected', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} selected={true} />);
    const circles = screen.getAllByTestId('circle');
    // One of the circles should be the highlight ring with the highlight color
    const highlightCircle = circles.find(
      (c) => c.getAttribute('stroke') === PLAYER_COLORS.highlight,
    );
    expect(highlightCircle).toBeInTheDocument();
  });

  it('does not show selection highlight when not selected', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} selected={false} />);
    const circles = screen.getAllByTestId('circle');
    const highlightCircle = circles.find(
      (c) => c.getAttribute('stroke') === PLAYER_COLORS.highlight,
    );
    expect(highlightCircle).toBeUndefined();
  });

  it('uses selected stroke color when selected', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} selected={true} />);
    const circles = screen.getAllByTestId('circle');
    const selectedCircle = circles.find(
      (c) => c.getAttribute('stroke') === PLAYER_COLORS.selected,
    );
    expect(selectedCircle).toBeInTheDocument();
  });

  it('sets group draggable when interactive=true', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} interactive={true} />);
    const groups = screen.getAllByTestId('group');
    expect(groups[0]).toHaveAttribute('draggable', 'true');
  });

  it('sets group not draggable when interactive=false', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} interactive={false} />);
    const groups = screen.getAllByTestId('group');
    expect(groups[0].getAttribute('draggable')).not.toBe('true');
  });

  it('calls onSelect with player id when clicked', () => {
    const player = makePlayer({ id: 'player-42' });
    const onSelect = vi.fn();
    render(<PlayerIcon player={player} onSelect={onSelect} />);
    const groups = screen.getAllByTestId('group');
    fireEvent.click(groups[0]);
    expect(onSelect).toHaveBeenCalledWith('player-42');
  });

  it('scales down in thumbnail mode', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} mode="thumbnail" />);
    const circles = screen.getAllByTestId('circle');
    // The radius should be smaller than full mode (14 * 0.55 = 7.7)
    const playerCircle = circles.find((c) => {
      const r = parseFloat(c.getAttribute('radius') || '0');
      return r < PLAYER_RADIUS && r > 0;
    });
    expect(playerCircle).toBeInTheDocument();
  });

  it('scales down further in wristband mode', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} mode="wristband" />);
    const circles = screen.getAllByTestId('circle');
    // wristband scale = 0.4, so radius = 14 * 0.4 = 5.6
    const playerCircle = circles.find((c) => {
      const r = parseFloat(c.getAttribute('radius') || '0');
      return r < PLAYER_RADIUS * 0.5 && r > 0;
    });
    expect(playerCircle).toBeInTheDocument();
  });

  it('scales up in print mode', () => {
    const player = makePlayer();
    render(<PlayerIcon player={player} mode="print" />);
    const circles = screen.getAllByTestId('circle');
    // print scale = 1.1, so radius = 14 * 1.1 = 15.4
    const playerCircle = circles.find((c) => {
      const r = parseFloat(c.getAttribute('radius') || '0');
      return r > PLAYER_RADIUS;
    });
    expect(playerCircle).toBeInTheDocument();
  });
});
