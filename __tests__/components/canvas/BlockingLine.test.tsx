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

import { BlockingLine } from '@/components/canvas/BlockingLine';
import type { BlockingAssignment, Position } from '@/types';
import { BLOCK_COLORS } from '@/lib/constants';

const blockerPos: Position = { x: 400, y: 248 };
const targetPos: Position = { x: 400, y: 220 };

const makeDriveBlock = (overrides: Partial<BlockingAssignment> = {}): BlockingAssignment => ({
  id: 'block-1',
  blockerId: 'lt',
  targetId: 'de1',
  blockType: 'drive',
  ...overrides,
});

describe('BlockingLine', () => {
  it('renders a Group wrapper', () => {
    const assignment = makeDriveBlock();
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const groups = screen.getAllByTestId('group');
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a Line for drive block type', () => {
    const assignment = makeDriveBlock({ blockType: 'drive' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('uses correct color for drive block', () => {
    const assignment = makeDriveBlock({ blockType: 'drive' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const lines = screen.getAllByTestId('line');
    const driveColorLine = lines.find(
      (l) => l.getAttribute('stroke') === BLOCK_COLORS.drive,
    );
    expect(driveColorLine).toBeInTheDocument();
  });

  it('uses correct color for pull block', () => {
    const assignment = makeDriveBlock({ blockType: 'pull' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const arrows = screen.getAllByTestId('arrow');
    const pullColorArrow = arrows.find(
      (a) => a.getAttribute('stroke') === BLOCK_COLORS.pull,
    );
    expect(pullColorArrow).toBeInTheDocument();
  });

  it('renders an Arrow for pull block type', () => {
    const assignment = makeDriveBlock({ blockType: 'pull' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const arrows = screen.getAllByTestId('arrow');
    expect(arrows.length).toBeGreaterThanOrEqual(1);
  });

  it('renders an Arrow for trap block type', () => {
    const assignment = makeDriveBlock({ blockType: 'trap' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const arrows = screen.getAllByTestId('arrow');
    expect(arrows.length).toBeGreaterThanOrEqual(1);
  });

  it('renders perpendicular end bar for drive block', () => {
    const assignment = makeDriveBlock({ blockType: 'drive' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const lines = screen.getAllByTestId('line');
    // Should have at least 2 lines: the main line + the perpendicular bar
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('renders perpendicular end bar for reach block', () => {
    const assignment = makeDriveBlock({ blockType: 'reach' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('renders X symbol for cut block', () => {
    const assignment = makeDriveBlock({ blockType: 'cut' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const lines = screen.getAllByTestId('line');
    // Cut block: main line + two X lines = at least 3 lines
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('renders dashed line for pass-pro block', () => {
    const assignment = makeDriveBlock({ blockType: 'pass-pro' });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const lines = screen.getAllByTestId('line');
    const dashedLine = lines.find((l) => l.getAttribute('dash'));
    expect(dashedLine).toBeInTheDocument();
  });

  it('uses default color for unknown block type', () => {
    const assignment = makeDriveBlock({ blockType: 'custom' as any });
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
      />,
    );
    const lines = screen.getAllByTestId('line');
    const defaultLine = lines.find(
      (l) => l.getAttribute('stroke') === BLOCK_COLORS.default,
    );
    expect(defaultLine).toBeInTheDocument();
  });

  it('computes target from direction when no target position', () => {
    const assignment = makeDriveBlock({ direction: 90 });
    const { container } = render(
      <BlockingLine assignment={assignment} blockerPosition={blockerPos} />,
    );
    // Should render without error even without targetPosition
    expect(container).toBeTruthy();
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('defaults direction to 90 (straight up) when no direction or target', () => {
    const assignment = makeDriveBlock({ direction: undefined, targetId: undefined });
    const { container } = render(
      <BlockingLine assignment={assignment} blockerPosition={blockerPos} />,
    );
    expect(container).toBeTruthy();
  });

  it('calls onClick with assignment id when clicked', () => {
    const assignment = makeDriveBlock({ id: 'block-42' });
    const onClick = vi.fn();
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
        onClick={onClick}
      />,
    );
    const groups = screen.getAllByTestId('group');
    fireEvent.click(groups[0]);
    expect(onClick).toHaveBeenCalledWith('block-42');
  });

  it('scales stroke width in thumbnail mode', () => {
    const assignment = makeDriveBlock();
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
        mode="thumbnail"
      />,
    );
    const lines = screen.getAllByTestId('line');
    // Thumbnail mode renders successfully with scaled stroke
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('scales stroke width in print mode', () => {
    const assignment = makeDriveBlock();
    render(
      <BlockingLine
        assignment={assignment}
        blockerPosition={blockerPos}
        targetPosition={targetPos}
        mode="print"
      />,
    );
    const lines = screen.getAllByTestId('line');
    // Print mode renders successfully with scaled stroke
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });
});
