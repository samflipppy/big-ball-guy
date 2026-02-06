import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock zustand stores
const mockSetCanvasTool = vi.fn();
const mockUndo = vi.fn();
const mockRedo = vi.fn();
let mockCanvasTool = 'select';
let mockPastLength = 0;
let mockFutureLength = 0;

vi.mock('@/stores/playStore', () => ({
  useAppStore: (selector: any) => {
    const state = {
      canvasTool: mockCanvasTool,
      setCanvasTool: mockSetCanvasTool,
    };
    return selector(state);
  },
  useHistoryStore: (selector: any) => {
    const state = {
      undo: mockUndo,
      redo: mockRedo,
      past: new Array(mockPastLength),
      future: new Array(mockFutureLength),
    };
    return selector(state);
  },
}));

import { DrawingTools } from '@/components/canvas/DrawingTools';

describe('DrawingTools', () => {
  beforeEach(() => {
    mockCanvasTool = 'select';
    mockPastLength = 0;
    mockFutureLength = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a toolbar', () => {
    render(<DrawingTools />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('renders all 6 tool buttons', () => {
    render(<DrawingTools />);
    expect(screen.getByLabelText('Select')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw Route')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw Block')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw Motion')).toBeInTheDocument();
    expect(screen.getByLabelText('Eraser')).toBeInTheDocument();
    expect(screen.getByLabelText('Pan')).toBeInTheDocument();
  });

  it('renders undo and redo buttons', () => {
    render(<DrawingTools />);
    expect(screen.getByLabelText('Undo')).toBeInTheDocument();
    expect(screen.getByLabelText('Redo')).toBeInTheDocument();
  });

  it('highlights the active tool', () => {
    mockCanvasTool = 'draw-route';
    render(<DrawingTools />);
    const routeBtn = screen.getByLabelText('Draw Route');
    expect(routeBtn).toHaveAttribute('aria-pressed', 'true');
    const selectBtn = screen.getByLabelText('Select');
    expect(selectBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setCanvasTool when a tool button is clicked', () => {
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Draw Route'));
    expect(mockSetCanvasTool).toHaveBeenCalledWith('draw-route');
  });

  it('calls setCanvasTool(select) when Select is clicked', () => {
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Select'));
    expect(mockSetCanvasTool).toHaveBeenCalledWith('select');
  });

  it('calls setCanvasTool(draw-block) when Draw Block is clicked', () => {
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Draw Block'));
    expect(mockSetCanvasTool).toHaveBeenCalledWith('draw-block');
  });

  it('calls setCanvasTool(draw-motion) when Draw Motion is clicked', () => {
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Draw Motion'));
    expect(mockSetCanvasTool).toHaveBeenCalledWith('draw-motion');
  });

  it('calls setCanvasTool(eraser) when Eraser is clicked', () => {
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Eraser'));
    expect(mockSetCanvasTool).toHaveBeenCalledWith('eraser');
  });

  it('calls setCanvasTool(pan) when Pan is clicked', () => {
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Pan'));
    expect(mockSetCanvasTool).toHaveBeenCalledWith('pan');
  });

  it('calls undo when Undo button is clicked', () => {
    mockPastLength = 3;
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Undo'));
    expect(mockUndo).toHaveBeenCalled();
  });

  it('calls redo when Redo button is clicked', () => {
    mockFutureLength = 2;
    render(<DrawingTools />);
    fireEvent.click(screen.getByLabelText('Redo'));
    expect(mockRedo).toHaveBeenCalled();
  });

  it('disables undo button when no history', () => {
    mockPastLength = 0;
    render(<DrawingTools />);
    const undoBtn = screen.getByLabelText('Undo');
    expect(undoBtn).toBeDisabled();
  });

  it('disables redo button when no future', () => {
    mockFutureLength = 0;
    render(<DrawingTools />);
    const redoBtn = screen.getByLabelText('Redo');
    expect(redoBtn).toBeDisabled();
  });

  it('enables undo button when there is history', () => {
    mockPastLength = 1;
    render(<DrawingTools />);
    const undoBtn = screen.getByLabelText('Undo');
    expect(undoBtn).not.toBeDisabled();
  });

  it('enables redo button when there is future', () => {
    mockFutureLength = 1;
    render(<DrawingTools />);
    const redoBtn = screen.getByLabelText('Redo');
    expect(redoBtn).not.toBeDisabled();
  });

  it('shows keyboard shortcuts in tooltips', () => {
    render(<DrawingTools />);
    const selectBtn = screen.getByLabelText('Select');
    expect(selectBtn).toHaveAttribute('title', 'Select (V)');
    const routeBtn = screen.getByLabelText('Draw Route');
    expect(routeBtn).toHaveAttribute('title', 'Draw Route (R)');
  });

  it('renders in horizontal orientation by default', () => {
    render(<DrawingTools />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar.className).toContain('flex-row');
  });

  it('renders in vertical orientation when specified', () => {
    render(<DrawingTools orientation="vertical" />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar.className).toContain('flex-col');
  });

  it('applies custom className', () => {
    render(<DrawingTools className="my-custom-class" />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar.className).toContain('my-custom-class');
  });

  it('renders a separator between tool buttons and undo/redo', () => {
    render(<DrawingTools />);
    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
  });

  describe('keyboard shortcuts', () => {
    it('activates Select tool on V key', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'v' });
      expect(mockSetCanvasTool).toHaveBeenCalledWith('select');
    });

    it('activates Draw Route tool on R key', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'r' });
      expect(mockSetCanvasTool).toHaveBeenCalledWith('draw-route');
    });

    it('activates Draw Block tool on B key', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'b' });
      expect(mockSetCanvasTool).toHaveBeenCalledWith('draw-block');
    });

    it('activates Draw Motion tool on M key', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'm' });
      expect(mockSetCanvasTool).toHaveBeenCalledWith('draw-motion');
    });

    it('activates Eraser tool on E key', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'e' });
      expect(mockSetCanvasTool).toHaveBeenCalledWith('eraser');
    });

    it('activates Pan tool on H key', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'h' });
      expect(mockSetCanvasTool).toHaveBeenCalledWith('pan');
    });

    it('calls undo on Ctrl+Z', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      expect(mockUndo).toHaveBeenCalled();
    });

    it('calls redo on Ctrl+Shift+Z', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
      expect(mockRedo).toHaveBeenCalled();
    });

    it('calls redo on Ctrl+Y', () => {
      render(<DrawingTools />);
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      expect(mockRedo).toHaveBeenCalled();
    });

    it('does not trigger shortcuts when typing in an input', () => {
      render(
        <div>
          <DrawingTools />
          <input data-testid="text-input" />
        </div>,
      );
      const input = screen.getByTestId('text-input');
      fireEvent.keyDown(input, { key: 'r', target: input });
      // Should not have been called since target is an input
      expect(mockSetCanvasTool).not.toHaveBeenCalledWith('draw-route');
    });
  });

  it('has data-tool attributes on buttons for testing', () => {
    render(<DrawingTools />);
    const selectBtn = screen.getByLabelText('Select');
    expect(selectBtn).toHaveAttribute('data-tool', 'select');
    const routeBtn = screen.getByLabelText('Draw Route');
    expect(routeBtn).toHaveAttribute('data-tool', 'draw-route');
  });
});
