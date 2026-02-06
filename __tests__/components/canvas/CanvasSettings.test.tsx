import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import React from 'react';
import { CanvasSettings } from '@/components/canvas/CanvasSettings';
import { useAppStore } from '@/stores/playStore';

describe('CanvasSettings', () => {
  beforeEach(() => {
    // Reset store to defaults
    useAppStore.setState({
      gridEnabled: false,
      gridSize: 10,
      snapToGridEnabled: false,
      showYardNumbers: true,
      showHashMarks: true,
      showPlayerLabels: true,
    });
  });

  it('renders the settings toggle button', () => {
    render(<CanvasSettings />);
    const toggle = screen.getByTestId('canvas-settings-toggle');
    expect(toggle).toBeInTheDocument();
  });

  it('has accessible label on the toggle button', () => {
    render(<CanvasSettings />);
    const toggle = screen.getByLabelText('Canvas settings');
    expect(toggle).toBeInTheDocument();
  });

  it('does not show the panel initially', () => {
    render(<CanvasSettings />);
    expect(screen.queryByTestId('canvas-settings-panel')).not.toBeInTheDocument();
  });

  it('shows the panel when toggle is clicked', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    expect(screen.getByTestId('canvas-settings-panel')).toBeInTheDocument();
  });

  it('hides the panel when toggle is clicked again', () => {
    render(<CanvasSettings />);
    const toggle = screen.getByTestId('canvas-settings-toggle');
    fireEvent.click(toggle);
    expect(screen.getByTestId('canvas-settings-panel')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByTestId('canvas-settings-panel')).not.toBeInTheDocument();
  });

  it('sets aria-expanded on the toggle', () => {
    render(<CanvasSettings />);
    const toggle = screen.getByTestId('canvas-settings-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes panel on click outside', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    expect(screen.getByTestId('canvas-settings-panel')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('canvas-settings-panel')).not.toBeInTheDocument();
  });

  // ---- Toggle: Show Grid ----

  it('renders Show grid checkbox', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const checkbox = screen.getByTestId('toggle-show-grid');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('toggles gridEnabled in the store', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));

    const checkbox = screen.getByTestId('toggle-show-grid');
    fireEvent.click(checkbox);
    expect(useAppStore.getState().gridEnabled).toBe(true);

    fireEvent.click(checkbox);
    expect(useAppStore.getState().gridEnabled).toBe(false);
  });

  // ---- Toggle: Snap to Grid ----

  it('renders Snap to grid checkbox', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const checkbox = screen.getByTestId('toggle-snap-to-grid');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('toggles snapToGridEnabled in the store', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));

    const checkbox = screen.getByTestId('toggle-snap-to-grid');
    fireEvent.click(checkbox);
    expect(useAppStore.getState().snapToGridEnabled).toBe(true);
  });

  // ---- Grid Size Selector ----

  it('renders grid size selector with default value', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const selector = screen.getByTestId('grid-size-selector');
    expect(selector).toBeInTheDocument();
    expect((selector as HTMLSelectElement).value).toBe('10');
  });

  it('updates gridSize in the store when changed', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const selector = screen.getByTestId('grid-size-selector');

    fireEvent.change(selector, { target: { value: '20' } });
    expect(useAppStore.getState().gridSize).toBe(20);
  });

  it('has options for all default grid sizes', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const options = screen.getByTestId('grid-size-selector').querySelectorAll('option');
    expect(options.length).toBe(4);
    expect(options[0].value).toBe('5');
    expect(options[1].value).toBe('10');
    expect(options[2].value).toBe('15');
    expect(options[3].value).toBe('20');
  });

  // ---- Toggle: Show Yard Numbers ----

  it('renders Show yard numbers checkbox (checked by default)', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const checkbox = screen.getByTestId('toggle-yard-numbers');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it('toggles showYardNumbers in the store', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));

    const checkbox = screen.getByTestId('toggle-yard-numbers');
    fireEvent.click(checkbox);
    expect(useAppStore.getState().showYardNumbers).toBe(false);
  });

  // ---- Toggle: Show Hash Marks ----

  it('renders Show hash marks checkbox (checked by default)', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const checkbox = screen.getByTestId('toggle-hash-marks');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it('toggles showHashMarks in the store', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));

    const checkbox = screen.getByTestId('toggle-hash-marks');
    fireEvent.click(checkbox);
    expect(useAppStore.getState().showHashMarks).toBe(false);
  });

  // ---- Toggle: Show Player Labels ----

  it('renders Show player labels checkbox (checked by default)', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));
    const checkbox = screen.getByTestId('toggle-player-labels');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it('toggles showPlayerLabels in the store', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));

    const checkbox = screen.getByTestId('toggle-player-labels');
    fireEvent.click(checkbox);
    expect(useAppStore.getState().showPlayerLabels).toBe(false);
  });

  // ---- className prop ----

  it('applies custom className', () => {
    const { container } = render(<CanvasSettings className="my-custom-class" />);
    expect(container.firstElementChild?.classList.contains('my-custom-class')).toBe(true);
  });

  // ---- Display labels ----

  it('shows all label texts in the panel', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));

    expect(screen.getByText('Show grid')).toBeInTheDocument();
    expect(screen.getByText('Snap to grid')).toBeInTheDocument();
    expect(screen.getByText('Grid size')).toBeInTheDocument();
    expect(screen.getByText('Show yard numbers')).toBeInTheDocument();
    expect(screen.getByText('Show hash marks')).toBeInTheDocument();
    expect(screen.getByText('Show player labels')).toBeInTheDocument();
  });

  it('shows section headers', () => {
    render(<CanvasSettings />);
    fireEvent.click(screen.getByTestId('canvas-settings-toggle'));

    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
  });
});
