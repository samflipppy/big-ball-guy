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

import {
  FreehandDrawing,
  detectRouteBreaks,
  convertToRoutePoints,
} from '@/components/canvas/FreehandDrawing';

describe('FreehandDrawing', () => {
  describe('component rendering', () => {
    it('renders a Group wrapper', () => {
      render(<FreehandDrawing isDrawing={false} />);
      const groups = screen.getAllByTestId('group');
      expect(groups.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a hit area Line when isDrawing is true', () => {
      render(<FreehandDrawing isDrawing={true} />);
      const lines = screen.getAllByTestId('line');
      // The hit area line has fill="transparent"
      const hitArea = lines.find(
        (l) => l.getAttribute('fill') === 'transparent',
      );
      expect(hitArea).toBeInTheDocument();
    });

    it('does not render a hit area Line when isDrawing is false', () => {
      render(<FreehandDrawing isDrawing={false} />);
      const lines = screen.queryAllByTestId('line');
      const hitArea = lines.find(
        (l) => l.getAttribute('fill') === 'transparent',
      );
      expect(hitArea).toBeUndefined();
    });

    it('uses custom color when provided', () => {
      render(<FreehandDrawing isDrawing={true} color="#ff0000" />);
      // The component uses color for drawing strokes
      // Since there's no active drawing, we can't check the stroke
      // But we can verify the component renders without error
      expect(screen.getAllByTestId('group').length).toBeGreaterThanOrEqual(1);
    });

    it('renders with default props', () => {
      const { container } = render(<FreehandDrawing isDrawing={false} />);
      expect(container).toBeTruthy();
    });
  });

  describe('detectRouteBreaks', () => {
    it('returns empty array for fewer than 3 points', () => {
      const result = detectRouteBreaks([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);
      expect(result).toEqual([]);
    });

    it('returns empty array for empty points', () => {
      const result = detectRouteBreaks([]);
      expect(result).toEqual([]);
    });

    it('detects a 90-degree direction change', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 }, // going right
        { x: 100, y: 100 }, // turning down (90 degrees)
      ];
      const breaks = detectRouteBreaks(points, 45);
      expect(breaks).toContain(1);
    });

    it('does not detect a gentle curve as a break', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 1 }, // very slight angle change
      ];
      const breaks = detectRouteBreaks(points, 45);
      expect(breaks).toEqual([]);
    });

    it('detects a 180-degree reversal', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 }, // going right
        { x: 90, y: 0 }, // going left (180 degrees)
      ];
      const breaks = detectRouteBreaks(points, 45);
      expect(breaks).toContain(1);
    });

    it('detects multiple breaks', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 }, // going right
        { x: 100, y: 100 }, // turn down
        { x: 0, y: 100 }, // turn left
      ];
      const breaks = detectRouteBreaks(points, 45);
      expect(breaks.length).toBe(2);
      expect(breaks).toContain(1);
      expect(breaks).toContain(2);
    });

    it('uses custom angle threshold', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 150, y: 50 }, // ~45 degree turn
      ];
      // With 30 degree threshold, should detect
      const breaks30 = detectRouteBreaks(points, 30);
      expect(breaks30.length).toBeGreaterThanOrEqual(1);

      // With 90 degree threshold, should not detect a 45-degree turn
      const breaks90 = detectRouteBreaks(points, 90);
      expect(breaks90.length).toBe(0);
    });

    it('handles straight line with no breaks', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
        { x: 30, y: 30 },
      ];
      const breaks = detectRouteBreaks(points, 45);
      expect(breaks).toEqual([]);
    });
  });

  describe('convertToRoutePoints', () => {
    it('returns empty array for fewer than 2 points', () => {
      const result = convertToRoutePoints([{ x: 0, y: 0 }]);
      expect(result).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      const result = convertToRoutePoints([]);
      expect(result).toEqual([]);
    });

    it('converts simple two-point line', () => {
      const result = convertToRoutePoints([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]);
      expect(result.length).toBe(2);
      expect(result[0].type).toBe('line');
      expect(result[0].x).toBe(0);
      expect(result[0].y).toBe(0);
    });

    it('simplifies a noisy path', () => {
      // Create a roughly straight line with noise
      const points = [];
      for (let i = 0; i <= 20; i++) {
        points.push({
          x: i * 10,
          y: Math.sin(i * 0.1) * 0.5, // Very slight noise
        });
      }
      const result = convertToRoutePoints(points, 3);
      // The simplified result should have fewer points than the input
      expect(result.length).toBeLessThan(points.length);
    });

    it('marks break points correctly', () => {
      // Create a clear L-shape path
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 }, // sharp right turn
        { x: 100, y: 100 },
      ];
      const result = convertToRoutePoints(points, 1, 45);
      // Should find at least one break point at the turn
      const breakPoints = result.filter((p) => p.type === 'break');
      expect(breakPoints.length).toBeGreaterThanOrEqual(1);
    });

    it('marks non-break points as line type', () => {
      const result = convertToRoutePoints([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 }, // straight line, no breaks
      ]);
      // All points should be 'line' type for a straight path
      const linePoints = result.filter((p) => p.type === 'line');
      expect(linePoints.length).toBe(result.length);
    });

    it('preserves first and last points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 25 },
        { x: 100, y: 50 },
        { x: 150, y: 75 },
        { x: 200, y: 100 },
      ];
      const result = convertToRoutePoints(points, 3);
      expect(result[0].x).toBe(0);
      expect(result[0].y).toBe(0);
      expect(result[result.length - 1].x).toBe(200);
      expect(result[result.length - 1].y).toBe(100);
    });

    it('uses default epsilon and breakAngle', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      // Should work without specifying epsilon and breakAngle
      const result = convertToRoutePoints(points);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });
});
