import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { ZoneCoverageOverlay } from '@/components/canvas/ZoneCoverageOverlay';

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

describe('ZoneCoverageOverlay', () => {
  it('renders Cover 2 zones (2 deep + 5 underneath = 7 rects)', () => {
    const { getAllByTestId } = render(
      <ZoneCoverageOverlay coverage="cover-2" {...DEFAULT_PROPS} />,
    );
    const rects = getAllByTestId('rect');
    expect(rects).toHaveLength(7);
  });

  it('renders Cover 3 zones (3 deep + 4 underneath = 7 rects)', () => {
    const { getAllByTestId } = render(
      <ZoneCoverageOverlay coverage="cover-3" {...DEFAULT_PROPS} />,
    );
    const rects = getAllByTestId('rect');
    expect(rects).toHaveLength(7);
  });

  it('renders Cover 4 zones (4 deep + 3 underneath = 7 rects)', () => {
    const { getAllByTestId } = render(
      <ZoneCoverageOverlay coverage="cover-4" {...DEFAULT_PROPS} />,
    );
    const rects = getAllByTestId('rect');
    expect(rects).toHaveLength(7);
  });

  it('renders zone labels as Text elements', () => {
    const { getAllByTestId } = render(
      <ZoneCoverageOverlay coverage="cover-2" {...DEFAULT_PROPS} />,
    );
    const texts = getAllByTestId('text');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('renders nothing for unknown coverage type', () => {
    const { container } = render(
      <ZoneCoverageOverlay coverage="unknown" {...DEFAULT_PROPS} />,
    );
    // Should render null, so the container should be empty
    expect(container.innerHTML).toBe('');
  });

  it('applies custom opacity to zone rects', () => {
    const { getAllByTestId } = render(
      <ZoneCoverageOverlay coverage="cover-2" {...DEFAULT_PROPS} opacity={0.5} />,
    );
    const rects = getAllByTestId('rect');
    rects.forEach((rect) => {
      expect(rect.getAttribute('opacity')).toBe('0.5');
    });
  });

  it('handles "Cover 2" with space in name', () => {
    const { getAllByTestId } = render(
      <ZoneCoverageOverlay coverage="Cover 2" {...DEFAULT_PROPS} />,
    );
    const rects = getAllByTestId('rect');
    expect(rects).toHaveLength(7);
  });

  it('wraps zones in a Group element', () => {
    const { getByTestId } = render(
      <ZoneCoverageOverlay coverage="cover-3" {...DEFAULT_PROPS} />,
    );
    expect(getByTestId('group')).toBeDefined();
  });

  it('supports "quarters" as alias for cover-4', () => {
    const { getAllByTestId } = render(
      <ZoneCoverageOverlay coverage="quarters" {...DEFAULT_PROPS} />,
    );
    const rects = getAllByTestId('rect');
    expect(rects).toHaveLength(7);
  });
});
