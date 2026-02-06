import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UndoToast } from '@/components/ui/UndoToast';

describe('UndoToast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders with the given message', () => {
    render(<UndoToast message="Play deleted" onUndo={() => {}} />);
    expect(screen.getByText('Play deleted')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<UndoToast message="Item removed" onUndo={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="assertive"', () => {
    render(<UndoToast message="Item removed" onUndo={() => {}} />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders an undo button', () => {
    render(<UndoToast message="Deleted" onUndo={() => {}} />);
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('undo-button')).toHaveTextContent('Undo');
  });

  it('calls onUndo when undo button is clicked', async () => {
    const onUndo = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<UndoToast message="Deleted" onUndo={onUndo} />);

    await user.click(screen.getByTestId('undo-button'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<UndoToast message="Deleted" onUndo={() => {}} onDismiss={onDismiss} />);

    await user.click(screen.getByTestId('dismiss-button'));

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after the specified duration', () => {
    const onDismiss = vi.fn();
    render(<UndoToast message="Deleted" onUndo={() => {}} duration={3000} onDismiss={onDismiss} />);

    expect(screen.getByTestId('undo-toast')).toBeInTheDocument();

    // Advance past duration
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders a progress bar when duration > 0', () => {
    render(<UndoToast message="Deleted" onUndo={() => {}} duration={5000} />);
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not render a progress bar when duration is 0', () => {
    render(<UndoToast message="Deleted" onUndo={() => {}} duration={0} />);
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('has a dismiss button with accessible label', () => {
    render(<UndoToast message="Deleted" onUndo={() => {}} />);
    const dismissButton = screen.getByTestId('dismiss-button');
    expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
  });

  it('disappears from DOM after undo + exit animation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<UndoToast message="Deleted" onUndo={() => {}} />);

    expect(screen.getByTestId('undo-toast')).toBeInTheDocument();

    await user.click(screen.getByTestId('undo-button'));

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.queryByTestId('undo-toast')).not.toBeInTheDocument();
  });
});
