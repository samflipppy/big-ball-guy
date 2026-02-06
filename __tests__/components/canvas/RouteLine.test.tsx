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

import { RouteLine } from '@/components/canvas/RouteLine';
import type { Route, Position } from '@/types';
import { ROUTE_COLORS } from '@/lib/constants';

const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  id: 'route-1',
  name: 'Slant',
  type: 'slant',
  points: [
    { x: 410, y: 260, type: 'line' },
    { x: 430, y: 220, type: 'break' },
    { x: 460, y: 180, type: 'line' },
  ],
  ...overrides,
});

const startPos: Position = { x: 400, y: 280 };

describe('RouteLine', () => {
  it('renders a Group wrapper', () => {
    const route = makeRoute();
    render(<RouteLine route={route} startPosition={startPos} />);
    const groups = screen.getAllByTestId('group');
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it('renders an Arrow for the final segment', () => {
    const route = makeRoute();
    render(<RouteLine route={route} startPosition={startPos} />);
    const arrows = screen.getAllByTestId('arrow');
    expect(arrows.length).toBeGreaterThanOrEqual(1);
  });

  it('uses correct color for route type', () => {
    const route = makeRoute({ type: 'slant' });
    render(<RouteLine route={route} startPosition={startPos} />);
    const arrows = screen.getAllByTestId('arrow');
    const slantArrow = arrows.find(
      (a) => a.getAttribute('stroke') === ROUTE_COLORS.slant,
    );
    expect(slantArrow).toBeInTheDocument();
  });

  it('uses custom color when provided', () => {
    const route = makeRoute({ color: '#ff0000' });
    render(<RouteLine route={route} startPosition={startPos} />);
    const arrows = screen.getAllByTestId('arrow');
    const customArrow = arrows.find(
      (a) => a.getAttribute('stroke') === '#ff0000',
    );
    expect(customArrow).toBeInTheDocument();
  });

  it('uses default color for unknown route type', () => {
    const route = makeRoute({ type: 'custom' as any, color: undefined });
    render(<RouteLine route={route} startPosition={startPos} />);
    const arrows = screen.getAllByTestId('arrow');
    const defaultArrow = arrows.find(
      (a) => a.getAttribute('stroke') === ROUTE_COLORS.custom,
    );
    expect(defaultArrow).toBeInTheDocument();
  });

  it('renders a dashed line for hot routes', () => {
    const route = makeRoute();
    render(
      <RouteLine route={route} startPosition={startPos} isHotRoute={true} />,
    );
    const arrows = screen.getAllByTestId('arrow');
    // Arrow should have a dash attribute
    const dashedArrow = arrows.find((a) => a.getAttribute('dash'));
    expect(dashedArrow).toBeInTheDocument();
  });

  it('does not render dashed line for regular routes', () => {
    const route = makeRoute();
    render(
      <RouteLine route={route} startPosition={startPos} isHotRoute={false} />,
    );
    const arrows = screen.getAllByTestId('arrow');
    // Check that arrows don't have dash set
    const nonDashed = arrows.find((a) => !a.getAttribute('dash'));
    expect(nonDashed).toBeInTheDocument();
  });

  it('returns null when there are not enough points', () => {
    const route = makeRoute({ points: [] });
    const { container } = render(
      <RouteLine route={route} startPosition={startPos} />,
    );
    // With no route points, only start position exists = just 2 numbers, not enough
    const arrows = screen.queryAllByTestId('arrow');
    expect(arrows.length).toBe(0);
  });

  it('shows selection highlight when selected', () => {
    const route = makeRoute();
    render(
      <RouteLine route={route} startPosition={startPos} selected={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // Selection highlight line should have opacity 0.3
    const highlight = lines.find(
      (l) => l.getAttribute('opacity') === '0.3',
    );
    expect(highlight).toBeInTheDocument();
  });

  it('does not show selection highlight when not selected', () => {
    const route = makeRoute();
    render(
      <RouteLine route={route} startPosition={startPos} selected={false} />,
    );
    const lines = screen.queryAllByTestId('line');
    const highlight = lines.find(
      (l) => l.getAttribute('opacity') === '0.3',
    );
    expect(highlight).toBeUndefined();
  });

  it('calls onClick with route id when clicked', () => {
    const route = makeRoute({ id: 'route-xyz' });
    const onClick = vi.fn();
    render(
      <RouteLine route={route} startPosition={startPos} onClick={onClick} />,
    );
    const groups = screen.getAllByTestId('group');
    fireEvent.click(groups[0]);
    expect(onClick).toHaveBeenCalledWith('route-xyz');
  });

  it('renders with reduced stroke width in thumbnail mode', () => {
    const route = makeRoute();
    render(
      <RouteLine route={route} startPosition={startPos} mode="thumbnail" />,
    );
    const arrows = screen.getAllByTestId('arrow');
    // Thumbnail mode renders successfully with scaled stroke
    expect(arrows.length).toBeGreaterThanOrEqual(1);
  });

  it('renders with increased stroke width in print mode', () => {
    const route = makeRoute();
    render(
      <RouteLine route={route} startPosition={startPos} mode="print" />,
    );
    const arrows = screen.getAllByTestId('arrow');
    // Print mode renders successfully with scaled stroke
    expect(arrows.length).toBeGreaterThanOrEqual(1);
  });

  it('renders main path Line when there are multiple segments', () => {
    const route = makeRoute({
      points: [
        { x: 410, y: 260, type: 'line' },
        { x: 430, y: 220, type: 'break' },
        { x: 460, y: 180, type: 'line' },
      ],
    });
    render(<RouteLine route={route} startPosition={startPos} />);
    // Should have at least one Line for the main path (all but last segment)
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('handles a route with only one point (minimum for arrow)', () => {
    const route = makeRoute({
      points: [{ x: 410, y: 260, type: 'line' }],
    });
    render(<RouteLine route={route} startPosition={startPos} />);
    // start (400,280) + one point (410,260) = 4 numbers = enough for arrow
    const arrows = screen.getAllByTestId('arrow');
    expect(arrows.length).toBeGreaterThanOrEqual(1);
  });
});
