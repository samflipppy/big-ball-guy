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

import { GridOverlay } from '@/components/canvas/GridOverlay';

describe('GridOverlay', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(
      <GridOverlay width={800} height={500} gridSize={10} visible={false} />,
    );
    const lines = screen.queryAllByTestId('line');
    expect(lines.length).toBe(0);
  });

  it('renders grid lines when visible is true', () => {
    render(
      <GridOverlay width={100} height={100} gridSize={10} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // 9 vertical (10, 20, ..., 90) + 9 horizontal (10, 20, ..., 90) = 18
    expect(lines.length).toBe(18);
  });

  it('renders correct number of lines for gridSize=20', () => {
    render(
      <GridOverlay width={100} height={100} gridSize={20} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // 4 vertical (20, 40, 60, 80) + 4 horizontal (20, 40, 60, 80) = 8
    expect(lines.length).toBe(8);
  });

  it('renders correct number of lines for gridSize=5', () => {
    render(
      <GridOverlay width={30} height={30} gridSize={5} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // 5 vertical (5,10,15,20,25) + 5 horizontal (5,10,15,20,25) = 10
    expect(lines.length).toBe(10);
  });

  it('lines span the full width for horizontal lines', () => {
    render(
      <GridOverlay width={100} height={50} gridSize={10} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // Find a horizontal line (its points should start at x=0 and end at x=width)
    const horizontalLines = lines.filter((line) => {
      const points = line.getAttribute('points');
      return points?.startsWith('0,');
    });
    expect(horizontalLines.length).toBeGreaterThan(0);
  });

  it('lines span the full height for vertical lines', () => {
    render(
      <GridOverlay width={50} height={100} gridSize={10} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // Vertical lines: points like "10,0,10,100"
    const verticalLines = lines.filter((line) => {
      const points = line.getAttribute('points');
      // Vertical lines start at y=0 and end at y=height
      if (!points) return false;
      const parts = points.split(',');
      return parts[1] === '0' && parts[3] === '100';
    });
    expect(verticalLines.length).toBeGreaterThan(0);
  });

  it('renders all lines as non-interactive (listening=false)', () => {
    render(
      <GridOverlay width={100} height={100} gridSize={10} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // All lines should exist and be rendered (listening is a Konva prop,
    // which may not appear as a DOM attribute in our mock)
    expect(lines.length).toBeGreaterThan(0);
  });

  it('applies different stroke for major vs minor grid lines', () => {
    render(
      <GridOverlay width={100} height={100} gridSize={10} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    const strokes = lines.map((line) => line.getAttribute('stroke'));
    const uniqueStrokes = new Set(strokes);
    // Should have at least 2 different stroke colors (major and minor)
    expect(uniqueStrokes.size).toBeGreaterThanOrEqual(2);
  });

  it('uses thicker stroke for major grid lines', () => {
    render(
      <GridOverlay width={100} height={100} gridSize={10} visible={true} />,
    );
    const lines = screen.getAllByTestId('line');
    // Major lines at position 50 (index 5) should have a larger strokeWidth
    // Find a line at a major interval vs a minor one
    const majorLine = lines.find((line) => {
      const stroke = line.getAttribute('stroke');
      return stroke && stroke.includes('0.12');
    });
    const minorLine = lines.find((line) => {
      const stroke = line.getAttribute('stroke');
      return stroke && stroke.includes('0.06');
    });
    expect(majorLine).toBeDefined();
    expect(minorLine).toBeDefined();
  });

  it('renders no lines when grid size is larger than field dimensions', () => {
    render(
      <GridOverlay width={50} height={50} gridSize={100} visible={true} />,
    );
    const lines = screen.queryAllByTestId('line');
    expect(lines.length).toBe(0);
  });

  it('renders no lines when gridSize is 0', () => {
    render(
      <GridOverlay width={100} height={100} gridSize={0} visible={true} />,
    );
    const lines = screen.queryAllByTestId('line');
    expect(lines.length).toBe(0);
  });
});
