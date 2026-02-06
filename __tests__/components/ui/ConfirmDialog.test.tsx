import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Delete Play',
    message: 'Are you sure you want to delete this play? This action cannot be undone.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  const renderDialog = (props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) => {
    const merged = { ...defaultProps, ...props, onConfirm: props.onConfirm ?? vi.fn(), onCancel: props.onCancel ?? vi.fn() };
    return {
      ...render(<ConfirmDialog {...merged} />),
      onConfirm: merged.onConfirm,
      onCancel: merged.onCancel,
    };
  };

  it('renders title and message when open', () => {
    renderDialog();
    expect(screen.getByText('Delete Play')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Delete Play')).not.toBeInTheDocument();
  });

  it('renders default confirm and cancel labels', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders custom confirm and cancel labels', () => {
    renderDialog({ confirmLabel: 'Yes, delete', cancelLabel: 'Keep it' });
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows danger variant button for danger variant', () => {
    renderDialog({ variant: 'danger' });
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn.className).toContain('bg-red-600');
  });

  it('shows loading state on confirm button', () => {
    renderDialog({ loading: true });
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn).toBeDisabled();
    const spinner = confirmBtn.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('disables cancel button when loading', () => {
    renderDialog({ loading: true });
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toBeDisabled();
  });

  it('renders inside a modal dialog', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
