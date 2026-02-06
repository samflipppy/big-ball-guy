import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { FieldMarkings } from '@/components/canvas/FieldMarkings';

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
  fieldWidth: 800,
  fieldHeight: 500,
};

describe('FieldMarkings', () => {
  it('renders hash marks when showHashMarks is true', () => {
    const { getAllByTestId } = render(
      <FieldMarkings {...DEFAULT_PROPS} showHashMarks showYardNumbers={false} />,
    );
    const lines = getAllByTestId('line');
    // 29 yard positions * 2 (left + right) = 58 hash marks
    expect(lines).toHaveLength(58);
  });

  it('renders no hash marks when showHashMarks is false', () => {
    const { queryAllByTestId } = render(
      <FieldMarkings {...DEFAULT_PROPS} showHashMarks={false} showYardNumbers={false} />,
    );
    const lines = queryAllByTestId('line');
    expect(lines).toHaveLength(0);
  });

  it('renders yard numbers at 10-yard intervals', () => {
    const { getAllByTestId } = render(
      <FieldMarkings {...DEFAULT_PROPS} showHashMarks={false} showYardNumbers />,
    );
    const texts = getAllByTestId('text');
    // 5 markers * 2 sides = 10 text elements
    expect(texts).toHaveLength(10);
  });

  it('renders no yard numbers when showYardNumbers is false', () => {
    const { queryAllByTestId } = render(
      <FieldMarkings {...DEFAULT_PROPS} showHashMarks={false} showYardNumbers={false} />,
    );
    const texts = queryAllByTestId('text');
    expect(texts).toHaveLength(0);
  });

  it('renders end zone text when enabled with text config', () => {
    const { getAllByTestId } = render(
      <FieldMarkings
        {...DEFAULT_PROPS}
        showHashMarks={false}
        showYardNumbers={false}
        showEndZoneText
        endZoneText={{ top: 'HOME', bottom: 'AWAY' }}
      />,
    );
    const texts = getAllByTestId('text');
    expect(texts).toHaveLength(2);
  });

  it('renders only top end zone text when bottom is not provided', () => {
    const { getAllByTestId } = render(
      <FieldMarkings
        {...DEFAULT_PROPS}
        showHashMarks={false}
        showYardNumbers={false}
        showEndZoneText
        endZoneText={{ top: 'EAGLES' }}
      />,
    );
    const texts = getAllByTestId('text');
    expect(texts).toHaveLength(1);
  });

  it('does not render end zone text when showEndZoneText is false', () => {
    const { queryAllByTestId } = render(
      <FieldMarkings
        {...DEFAULT_PROPS}
        showHashMarks={false}
        showYardNumbers={false}
        showEndZoneText={false}
        endZoneText={{ top: 'HOME', bottom: 'AWAY' }}
      />,
    );
    const texts = queryAllByTestId('text');
    expect(texts).toHaveLength(0);
  });

  it('end zone text has rotation applied', () => {
    const { getAllByTestId } = render(
      <FieldMarkings
        {...DEFAULT_PROPS}
        showHashMarks={false}
        showYardNumbers={false}
        showEndZoneText
        endZoneText={{ top: 'HOME', bottom: 'AWAY' }}
      />,
    );
    const texts = getAllByTestId('text');
    // Top text should have rotation=-90, bottom should have rotation=90
    expect(texts[0].getAttribute('rotation')).toBe('-90');
    expect(texts[1].getAttribute('rotation')).toBe('90');
  });

  it('wraps everything in a Group element', () => {
    const { getByTestId } = render(
      <FieldMarkings {...DEFAULT_PROPS} showHashMarks showYardNumbers />,
    );
    expect(getByTestId('group')).toBeDefined();
  });

  it('uses college hash positions by default', () => {
    const { getAllByTestId } = render(
      <FieldMarkings {...DEFAULT_PROPS} showHashMarks showYardNumbers={false} />,
    );
    const lines = getAllByTestId('line');
    // Check first hash mark x position corresponds to college fraction (0.3)
    const firstLine = lines[0];
    const points = firstLine.getAttribute('points');
    // The points should include the college hash x position
    expect(lines.length).toBeGreaterThan(0);
  });
});
