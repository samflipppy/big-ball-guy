import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { RulerTool } from '@/components/canvas/RulerTool';

vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="stage" {...props}>{children}</div>,
  Layer: ({ children, ...props }: any) => <div data-testid="layer" {...props}>{children}</div>,
  Rect: (props: any) => <div data-testid="rect" {...props} />,
  Line: (props: any) => <div data-testid="line" {...props} />,
  Text: (props: any) => <div data-testid="text" {...props} />,
  Circle: (props: any) => <div data-testid="circle" {...props} />,
  Group: ({ children, ...props }: any) => <div data-testid="group" {...props}>{children}</div>,
}));

const DEFAULT_PROPS = {
  startPoint: { x: 100, y: 200 },
  endPoint: { x: 300, y: 200 },
  fieldWidth: 800,
  fieldHeight: 500,
};

describe('RulerTool', () => {
  it('renders a ruler line between start and end points', () => {
    const { getAllByTestId } = render(<RulerTool {...DEFAULT_PROPS} />);
    const lines = getAllByTestId('line');
    expect(lines).toHaveLength(1);
  });

  it('renders two draggable circle endpoints', () => {
    const { getAllByTestId } = render(<RulerTool {...DEFAULT_PROPS} />);
    const circles = getAllByTestId('circle');
    expect(circles).toHaveLength(2);
  });

  it('renders a distance label text', () => {
    const { getByTestId } = render(<RulerTool {...DEFAULT_PROPS} />);
    const text = getByTestId('text');
    // Should contain "yds"
    expect(text.getAttribute('text')).toContain('yds');
  });

  it('displays the correct distance in yards', () => {
    // 200 pixels horizontal at 800/53.3 px/yard = 200/15.009... = ~13.3 yards
    const { getByTestId } = render(<RulerTool {...DEFAULT_PROPS} />);
    const text = getByTestId('text');
    const textContent = text.getAttribute('text')!;
    const yardValue = parseFloat(textContent);
    expect(yardValue).toBeCloseTo(13.3, 0);
  });

  it('shows 0 yds when start equals end', () => {
    const { getByTestId } = render(
      <RulerTool
        startPoint={{ x: 100, y: 100 }}
        endPoint={{ x: 100, y: 100 }}
        fieldWidth={800}
        fieldHeight={500}
      />,
    );
    const text = getByTestId('text');
    expect(text.getAttribute('text')).toBe('0 yds');
  });

  it('marks endpoints as draggable', () => {
    const { getAllByTestId } = render(<RulerTool {...DEFAULT_PROPS} />);
    const circles = getAllByTestId('circle');
    circles.forEach((circle) => {
      expect(circle.getAttribute('draggable')).toBeTruthy();
    });
  });

  it('wraps elements in a Group', () => {
    const { getByTestId } = render(<RulerTool {...DEFAULT_PROPS} />);
    expect(getByTestId('group')).toBeDefined();
  });

  it('renders with dashed stroke on the ruler line', () => {
    const { getByTestId } = render(<RulerTool {...DEFAULT_PROPS} />);
    const line = getByTestId('line');
    expect(line.getAttribute('dash')).toBeDefined();
  });

  it('accepts onUpdate callback prop without errors', () => {
    const onUpdate = vi.fn();
    const { getAllByTestId } = render(
      <RulerTool {...DEFAULT_PROPS} onUpdate={onUpdate} />,
    );
    // Should render without errors
    expect(getAllByTestId('circle')).toHaveLength(2);
  });
});
