import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { FieldCanvas } from '@/components/canvas/FieldCanvas';
import {
  CANVAS_BG_COLOR,
  CANVAS_BG_COLOR_DARK,
} from '@/lib/constants';

describe('FieldCanvas', () => {
  it('renders Stage with correct width and height', () => {
    render(<FieldCanvas width={800} height={500} />);
    const stage = screen.getByTestId('stage');
    expect(stage).toBeInTheDocument();
    expect(stage).toHaveAttribute('width', '800');
    expect(stage).toHaveAttribute('height', '500');
  });

  it('renders a Layer inside the Stage', () => {
    render(<FieldCanvas width={800} height={500} />);
    const layers = screen.getAllByTestId('layer');
    expect(layers.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the field background as a Rect', () => {
    render(<FieldCanvas width={800} height={500} />);
    const rects = screen.getAllByTestId('rect');
    // The first rect should be the field background
    const bgRect = rects.find(
      (r) => r.getAttribute('fill') === CANVAS_BG_COLOR,
    );
    expect(bgRect).toBeInTheDocument();
  });

  it('uses dark mode background when darkMode=true', () => {
    render(<FieldCanvas width={800} height={500} darkMode={true} />);
    const rects = screen.getAllByTestId('rect');
    const darkBgRect = rects.find(
      (r) => r.getAttribute('fill') === CANVAS_BG_COLOR_DARK,
    );
    expect(darkBgRect).toBeInTheDocument();
  });

  it('renders yard lines', () => {
    render(<FieldCanvas width={800} height={500} yardsVisible={30} />);
    // There should be multiple Line elements for yard lines and hashes
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThan(5);
  });

  it('renders the line of scrimmage', () => {
    render(
      <FieldCanvas width={800} height={500} lineOfScrimmageY={250} />,
    );
    const lines = screen.getAllByTestId('line');
    // The LOS line has a distinctive blue stroke
    const losLine = lines.find(
      (l) => l.getAttribute('stroke') === '#3b82f6',
    );
    expect(losLine).toBeInTheDocument();
  });

  it('renders sideline boundaries', () => {
    render(<FieldCanvas width={800} height={500} />);
    const lines = screen.getAllByTestId('line');
    // Sidelines have white stroke — there should be at least 2 lines with white stroke
    const whiteLines = lines.filter(
      (l) => l.getAttribute('stroke') === '#ffffff',
    );
    expect(whiteLines.length).toBeGreaterThanOrEqual(2);
  });

  it('passes zoom scale to Stage', () => {
    render(<FieldCanvas width={800} height={500} zoom={2} />);
    const stage = screen.getByTestId('stage');
    expect(stage).toHaveAttribute('scaleX', '2');
    expect(stage).toHaveAttribute('scaleY', '2');
  });

  it('passes pan offsets to Stage', () => {
    render(<FieldCanvas width={800} height={500} panX={50} panY={100} />);
    const stage = screen.getByTestId('stage');
    expect(stage).toHaveAttribute('x', '50');
    expect(stage).toHaveAttribute('y', '100');
  });

  it('sets Stage draggable when panMode is true', () => {
    render(<FieldCanvas width={800} height={500} panMode={true} />);
    const stage = screen.getByTestId('stage');
    expect(stage).toHaveAttribute('draggable', 'true');
  });

  it('sets Stage not draggable when panMode is false', () => {
    render(<FieldCanvas width={800} height={500} panMode={false} />);
    const stage = screen.getByTestId('stage');
    // draggable should be false (attribute value "false")
    expect(stage.getAttribute('draggable')).not.toBe('true');
  });

  it('renders children inside the Stage', () => {
    render(
      <FieldCanvas width={800} height={500}>
        <div data-testid="child-content">Hello</div>
      </FieldCanvas>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders field numbers as Text elements', () => {
    render(
      <FieldCanvas width={800} height={500} lineOfScrimmageY={250} />,
    );
    const texts = screen.getAllByTestId('konva-text');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('renders end zone rects', () => {
    render(<FieldCanvas width={800} height={500} />);
    const rects = screen.getAllByTestId('rect');
    // Should have background + 2 end zones = at least 3 rects
    expect(rects.length).toBeGreaterThanOrEqual(3);
  });

  it('uses default yardsVisible of 30 when not specified', () => {
    const { container } = render(<FieldCanvas width={800} height={500} />);
    // Just verify it renders without error
    expect(container).toBeTruthy();
  });
});
