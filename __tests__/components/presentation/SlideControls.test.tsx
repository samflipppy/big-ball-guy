import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlideControls } from '@/components/presentation/SlideControls';

const defaultProps = {
  currentSlide: 2,
  totalSlides: 10,
  autoAdvance: false,
  autoAdvanceSeconds: 10,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onToggleAutoAdvance: vi.fn(),
  onExit: vi.fn(),
};

describe('SlideControls', () => {
  it('renders the controls bar', () => {
    render(<SlideControls {...defaultProps} />);
    expect(screen.getByTestId('slide-controls')).toBeInTheDocument();
  });

  it('displays the correct slide counter', () => {
    render(<SlideControls {...defaultProps} currentSlide={2} totalSlides={10} />);
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('3 / 10');
  });

  it('displays 1 / 1 for a single slide', () => {
    render(<SlideControls {...defaultProps} currentSlide={0} totalSlides={1} />);
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('1 / 1');
  });

  it('calls onPrevious when Previous button is clicked', () => {
    const onPrevious = vi.fn();
    render(<SlideControls {...defaultProps} onPrevious={onPrevious} />);
    fireEvent.click(screen.getByTestId('slide-prev'));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when Next button is clicked', () => {
    const onNext = vi.fn();
    render(<SlideControls {...defaultProps} onNext={onNext} />);
    fireEvent.click(screen.getByTestId('slide-next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('disables Previous button on first slide', () => {
    render(<SlideControls {...defaultProps} currentSlide={0} />);
    expect(screen.getByTestId('slide-prev')).toBeDisabled();
  });

  it('disables Next button on last slide', () => {
    render(<SlideControls {...defaultProps} currentSlide={9} totalSlides={10} />);
    expect(screen.getByTestId('slide-next')).toBeDisabled();
  });

  it('enables both buttons on a middle slide', () => {
    render(<SlideControls {...defaultProps} currentSlide={5} totalSlides={10} />);
    expect(screen.getByTestId('slide-prev')).not.toBeDisabled();
    expect(screen.getByTestId('slide-next')).not.toBeDisabled();
  });

  it('calls onExit when Exit button is clicked', () => {
    const onExit = vi.fn();
    render(<SlideControls {...defaultProps} onExit={onExit} />);
    fireEvent.click(screen.getByTestId('slide-exit'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleAutoAdvance when auto-advance toggle is clicked', () => {
    const onToggle = vi.fn();
    render(<SlideControls {...defaultProps} onToggleAutoAdvance={onToggle} />);
    fireEvent.click(screen.getByTestId('auto-advance-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows "Auto: OFF" when auto-advance is disabled', () => {
    render(<SlideControls {...defaultProps} autoAdvance={false} />);
    expect(screen.getByTestId('auto-advance-toggle')).toHaveTextContent('Auto: OFF');
  });

  it('shows "Auto: ON" when auto-advance is enabled', () => {
    render(<SlideControls {...defaultProps} autoAdvance={true} />);
    expect(screen.getByTestId('auto-advance-toggle')).toHaveTextContent('Auto: ON');
  });

  it('shows timer display when auto-advance is enabled and timeRemaining is provided', () => {
    render(
      <SlideControls
        {...defaultProps}
        autoAdvance={true}
        autoAdvanceSeconds={15}
        timeRemaining={8}
      />,
    );
    const timer = screen.getByTestId('auto-advance-timer');
    expect(timer).toHaveTextContent('8s');
    expect(timer).toHaveTextContent('15s');
  });

  it('does not show timer when auto-advance is disabled', () => {
    render(
      <SlideControls
        {...defaultProps}
        autoAdvance={false}
        timeRemaining={8}
      />,
    );
    expect(screen.queryByTestId('auto-advance-timer')).not.toBeInTheDocument();
  });

  it('shows keyboard shortcut hints', () => {
    render(<SlideControls {...defaultProps} />);
    expect(screen.getByTestId('shortcut-hint-arrows')).toHaveTextContent('Arrow keys');
    expect(screen.getByTestId('shortcut-hint-escape')).toHaveTextContent('Esc');
  });

  it('has correct aria-labels on buttons', () => {
    render(<SlideControls {...defaultProps} />);
    expect(screen.getByTestId('slide-prev')).toHaveAttribute('aria-label', 'Previous slide');
    expect(screen.getByTestId('slide-next')).toHaveAttribute('aria-label', 'Next slide');
    expect(screen.getByTestId('slide-exit')).toHaveAttribute('aria-label', 'Exit presentation');
  });
});
