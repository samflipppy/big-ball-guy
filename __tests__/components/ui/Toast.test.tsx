import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from '@/components/ui/Toast';
import { useToastStore } from '@/stores/toastStore';

describe('Toast system', () => {
  beforeEach(() => {
    // Reset the toast store before each test
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a toast when one is added to the store', () => {
    render(<ToastContainer />);

    act(() => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Play saved',
      });
    });

    expect(screen.getByText('Play saved')).toBeInTheDocument();
  });

  it('renders toast with message', () => {
    render(<ToastContainer />);

    act(() => {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Could not save play',
      });
    });

    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.getByText('Could not save play')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    render(<ToastContainer />);

    act(() => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', title: 'First' });
      store.addToast({ type: 'info', title: 'Second' });
      store.addToast({ type: 'warning', title: 'Third' });
    });

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('removes a toast when dismiss is clicked', async () => {
    const user = userEvent.setup();
    render(<ToastContainer />);

    act(() => {
      useToastStore.getState().addToast({
        type: 'info',
        title: 'Dismissible',
        duration: 0, // no auto-dismiss
      });
    });

    expect(screen.getByText('Dismissible')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss notification');
    await user.click(dismissBtn);

    // After the exit animation delay (150ms), the toast should be removed
    await vi.waitFor(() => {
      expect(screen.queryByText('Dismissible')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers();
    render(<ToastContainer />);

    act(() => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Auto dismiss',
        duration: 1000,
      });
    });

    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    // Advance past the duration
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // Wait for the exit animation timeout
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('has role="alert" on each toast', () => {
    render(<ToastContainer />);

    act(() => {
      useToastStore.getState().addToast({
        type: 'warning',
        title: 'Warning toast',
      });
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live region for the container', () => {
    render(<ToastContainer />);

    act(() => {
      useToastStore.getState().addToast({
        type: 'info',
        title: 'Test',
      });
    });

    expect(screen.getByLabelText('Notifications')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('addToast creates a toast with a unique id', () => {
    const id = useToastStore.getState().addToast({
      type: 'success',
      title: 'Test',
    });
    expect(id).toBeTruthy();
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].id).toBe(id);
  });

  it('addToast defaults duration to 5000', () => {
    useToastStore.getState().addToast({
      type: 'info',
      title: 'Default duration',
    });
    expect(useToastStore.getState().toasts[0].duration).toBe(5000);
  });

  it('removeToast removes the correct toast', () => {
    const store = useToastStore.getState();
    const id1 = store.addToast({ type: 'info', title: 'First' });
    store.addToast({ type: 'info', title: 'Second' });
    expect(useToastStore.getState().toasts).toHaveLength(2);

    useToastStore.getState().removeToast(id1);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].title).toBe('Second');
  });

  it('clearToasts removes all toasts', () => {
    const store = useToastStore.getState();
    store.addToast({ type: 'info', title: 'First' });
    store.addToast({ type: 'info', title: 'Second' });
    expect(useToastStore.getState().toasts).toHaveLength(2);

    useToastStore.getState().clearToasts();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
