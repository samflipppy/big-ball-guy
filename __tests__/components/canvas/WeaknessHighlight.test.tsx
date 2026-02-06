import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

import { WeaknessHighlight, getZoneRect, type Weakness } from '@/components/canvas/WeaknessHighlight';
import { DEFAULT_FIELD } from '@/lib/constants';

// ============================================================
// Tests — getZoneRect
// ============================================================

describe('getZoneRect', () => {
  // The function uses DEFAULT_FIELD.width / 3 as thirdW before rounding.
  // Rounding happens at the end via Math.round(), so we mirror that here.
  const rawThird = DEFAULT_FIELD.width / 3;
  const losY = DEFAULT_FIELD.lineOfScrimmageY;
  const halfH = losY / 2;

  it('returns full left third for "left"', () => {
    const rect = getZoneRect('left');
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    expect(rect.width).toBe(Math.round(rawThird));
    expect(rect.height).toBe(losY);
  });

  it('returns full middle third for "middle"', () => {
    const rect = getZoneRect('middle');
    expect(rect.x).toBe(Math.round(rawThird));
    expect(rect.width).toBe(Math.round(rawThird));
  });

  it('returns full right third for "right"', () => {
    const rect = getZoneRect('right');
    expect(rect.x).toBe(Math.round(rawThird * 2));
    expect(rect.width).toBe(Math.round(rawThird));
  });

  it('returns deep-left zone correctly', () => {
    const rect = getZoneRect('deep-left');
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    expect(rect.height).toBe(halfH);
  });

  it('returns short-middle zone correctly', () => {
    const rect = getZoneRect('short-middle');
    expect(rect.x).toBe(Math.round(rawThird));
    expect(rect.y).toBe(halfH);
    expect(rect.height).toBe(halfH);
  });

  it('returns full width for unknown zone name', () => {
    const rect = getZoneRect('unknown');
    expect(rect.x).toBe(0);
    expect(rect.width).toBe(DEFAULT_FIELD.width);
  });
});

// ============================================================
// Tests — WeaknessHighlight Component
// ============================================================

describe('WeaknessHighlight', () => {
  it('renders nothing when weaknesses array is empty', () => {
    const { container } = render(<WeaknessHighlight weaknesses={[]} />);
    // With empty weaknesses, returns null
    expect(container.innerHTML).toBe('');
  });

  it('renders a Group wrapper', () => {
    const weaknesses: Weakness[] = [
      { zone: 'left', severity: 'high', description: 'Weak run defense' },
    ];
    render(<WeaknessHighlight weaknesses={weaknesses} />);
    const groups = screen.getAllByTestId('group');
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it('renders one Rect and one Text per weakness', () => {
    const weaknesses: Weakness[] = [
      { zone: 'left', severity: 'high', description: 'Weak run D' },
      { zone: 'right', severity: 'low', description: 'Soft corner' },
    ];
    render(<WeaknessHighlight weaknesses={weaknesses} />);

    const rects = screen.getAllByTestId('rect');
    const texts = screen.getAllByTestId('konva-text');
    expect(rects).toHaveLength(2);
    expect(texts).toHaveLength(2);
  });

  it('sets Rect fill color based on severity', () => {
    const weaknesses: Weakness[] = [
      { zone: 'left', severity: 'high', description: 'High severity' },
      { zone: 'middle', severity: 'medium', description: 'Medium severity' },
      { zone: 'right', severity: 'low', description: 'Low severity' },
    ];
    render(<WeaknessHighlight weaknesses={weaknesses} />);

    const rects = screen.getAllByTestId('rect');
    expect(rects[0]).toHaveAttribute('fill', '#ef4444'); // high = red
    expect(rects[1]).toHaveAttribute('fill', '#f97316'); // medium = orange
    expect(rects[2]).toHaveAttribute('fill', '#f59e0b'); // low = amber
  });

  it('sets Rect opacity based on severity', () => {
    const weaknesses: Weakness[] = [
      { zone: 'left', severity: 'high', description: 'test' },
      { zone: 'middle', severity: 'medium', description: 'test' },
      { zone: 'right', severity: 'low', description: 'test' },
    ];
    render(<WeaknessHighlight weaknesses={weaknesses} />);

    const rects = screen.getAllByTestId('rect');
    expect(rects[0]).toHaveAttribute('opacity', '0.45');
    expect(rects[1]).toHaveAttribute('opacity', '0.3');
    expect(rects[2]).toHaveAttribute('opacity', '0.15');
  });

  it('passes description text to Text component', () => {
    const weaknesses: Weakness[] = [
      { zone: 'middle', severity: 'medium', description: 'Cannot stop the pass' },
    ];
    render(<WeaknessHighlight weaknesses={weaknesses} />);

    const texts = screen.getAllByTestId('konva-text');
    expect(texts[0]).toHaveAttribute('text', 'Cannot stop the pass');
  });

  it('positions the Rect based on zone', () => {
    const weaknesses: Weakness[] = [
      { zone: 'right', severity: 'low', description: 'test' },
    ];
    render(<WeaknessHighlight weaknesses={weaknesses} />);

    const rects = screen.getAllByTestId('rect');
    const rightX = Math.round((DEFAULT_FIELD.width / 3) * 2);
    expect(rects[0]).toHaveAttribute('x', String(rightX));
    expect(rects[0]).toHaveAttribute('y', '0');
  });

  it('handles deep- and short- compound zones', () => {
    const weaknesses: Weakness[] = [
      { zone: 'deep-right', severity: 'high', description: 'Deep weakness' },
    ];
    render(<WeaknessHighlight weaknesses={weaknesses} />);

    const rects = screen.getAllByTestId('rect');
    const rightX = Math.round((DEFAULT_FIELD.width / 3) * 2);
    const halfH = DEFAULT_FIELD.lineOfScrimmageY / 2;
    expect(rects[0]).toHaveAttribute('x', String(rightX));
    expect(rects[0]).toHaveAttribute('y', '0');
    expect(rects[0]).toHaveAttribute('height', String(halfH));
  });
});
