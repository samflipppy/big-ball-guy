import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CanvasContextMenu, type CanvasContextAction } from '@/components/canvas/CanvasContextMenu';

describe('CanvasContextMenu', () => {
  const defaultProps = {
    x: 200,
    y: 300,
    target: 'canvas' as const,
    onAction: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders the context menu', () => {
    render(<CanvasContextMenu {...defaultProps} />);
    const menu = screen.getByTestId('context-menu');
    expect(menu).toBeInTheDocument();
  });

  it('positions the menu at the given coordinates', () => {
    render(<CanvasContextMenu {...defaultProps} x={150} y={250} />);
    const menu = screen.getByTestId('context-menu');
    expect(menu.style.left).toBe('150px');
    expect(menu.style.top).toBe('250px');
  });

  it('renders canvas menu items when target is canvas', () => {
    render(<CanvasContextMenu {...defaultProps} target="canvas" />);
    expect(screen.getByTestId('context-menu-mirror-play')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-duplicate-play')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-select-all')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-clear-routes')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-clear-blocking')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-reset-formation')).toBeInTheDocument();
  });

  it('renders player menu items when target is player', () => {
    render(
      <CanvasContextMenu {...defaultProps} target="player" playerId="qb1" />,
    );
    expect(screen.getByTestId('context-menu-edit-route')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-clear-route')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-duplicate-assignment')).toBeInTheDocument();
  });

  it('includes canvas items when target is player', () => {
    render(
      <CanvasContextMenu {...defaultProps} target="player" playerId="qb1" />,
    );
    // Player menu also includes canvas items
    expect(screen.getByTestId('context-menu-mirror-play')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-duplicate-play')).toBeInTheDocument();
  });

  it('shows player id header when target is player', () => {
    render(
      <CanvasContextMenu {...defaultProps} target="player" playerId="qb1" />,
    );
    expect(screen.getByText('Player: qb1')).toBeInTheDocument();
  });

  it('does not show player header when target is canvas', () => {
    render(<CanvasContextMenu {...defaultProps} target="canvas" />);
    expect(screen.queryByText(/Player:/)).not.toBeInTheDocument();
  });

  it('fires onAction when a menu item is clicked', () => {
    const onAction = vi.fn();
    render(<CanvasContextMenu {...defaultProps} onAction={onAction} />);
    fireEvent.click(screen.getByTestId('context-menu-mirror-play'));
    expect(onAction).toHaveBeenCalledWith('mirror-play');
  });

  it('fires onClose after clicking a menu item', () => {
    const onClose = vi.fn();
    render(<CanvasContextMenu {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('context-menu-duplicate-play'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onAction with correct action for each canvas item', () => {
    const onAction = vi.fn();
    render(<CanvasContextMenu {...defaultProps} onAction={onAction} />);

    const actions: CanvasContextAction[] = [
      'mirror-play',
      'duplicate-play',
      'select-all',
      'clear-routes',
      'clear-blocking',
      'reset-formation',
    ];

    for (const action of actions) {
      fireEvent.click(screen.getByTestId(`context-menu-${action}`));
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });

  it('fires onAction with correct action for each player item', () => {
    const onAction = vi.fn();
    render(
      <CanvasContextMenu
        {...defaultProps}
        target="player"
        playerId="wr1"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByTestId('context-menu-edit-route'));
    expect(onAction).toHaveBeenCalledWith('edit-route');

    fireEvent.click(screen.getByTestId('context-menu-clear-route'));
    expect(onAction).toHaveBeenCalledWith('clear-route');

    fireEvent.click(screen.getByTestId('context-menu-duplicate-assignment'));
    expect(onAction).toHaveBeenCalledWith('duplicate-assignment');
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<CanvasContextMenu {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on click outside', () => {
    const onClose = vi.fn();
    render(<CanvasContextMenu {...defaultProps} onClose={onClose} />);
    fireEvent.mouseDown(document);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the menu', () => {
    const onClose = vi.fn();
    render(<CanvasContextMenu {...defaultProps} onClose={onClose} />);
    const menu = screen.getByTestId('context-menu');
    fireEvent.mouseDown(menu);
    // onClose should not be called by the outside-click handler
    // (it may be called by item click which also calls onClose,
    //  but mouseDown on the menu container itself should not trigger close)
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has role="menu" on the container', () => {
    render(<CanvasContextMenu {...defaultProps} />);
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('has role="menuitem" on each item', () => {
    render(<CanvasContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(6); // 6 canvas items
  });

  it('has role="menuitem" for all items when target is player', () => {
    render(
      <CanvasContextMenu {...defaultProps} target="player" playerId="qb1" />,
    );
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(9); // 3 player + 6 canvas
  });

  it('shows keyboard shortcuts for applicable items', () => {
    render(<CanvasContextMenu {...defaultProps} />);
    expect(screen.getByText('Ctrl+M')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+D')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+A')).toBeInTheDocument();
  });

  it('has appropriate aria-label based on target', () => {
    const { rerender } = render(
      <CanvasContextMenu {...defaultProps} target="canvas" />,
    );
    expect(screen.getByLabelText('Canvas context menu')).toBeInTheDocument();

    rerender(
      <CanvasContextMenu {...defaultProps} target="player" playerId="qb1" />,
    );
    expect(screen.getByLabelText('Player context menu')).toBeInTheDocument();
  });
});
