import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

describe('Modal', () => {
  const renderModal = (props: Partial<React.ComponentProps<typeof Modal>> = {}) => {
    const defaultProps = {
      open: true,
      onClose: vi.fn(),
      ...props,
    };
    return {
      ...render(
        <Modal {...defaultProps}>
          <ModalHeader>Test Title</ModalHeader>
          <ModalBody>Test content</ModalBody>
          <ModalFooter>
            <button>Footer Button</button>
          </ModalFooter>
        </Modal>,
      ),
      onClose: defaultProps.onClose,
    };
  };

  it('renders when open is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders header, body, and footer slots', () => {
    renderModal();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when content is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByText('Test content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closeOnEscape is false', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ closeOnEscape: false });
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose on backdrop click when closeOnBackdrop is false', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ closeOnBackdrop: false });
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies size class for sm', () => {
    renderModal({ size: 'sm' });
    const dialog = screen.getByRole('dialog');
    const panel = dialog.firstElementChild;
    expect(panel?.className).toContain('max-w-sm');
  });

  it('applies size class for lg', () => {
    renderModal({ size: 'lg' });
    const dialog = screen.getByRole('dialog');
    const panel = dialog.firstElementChild;
    expect(panel?.className).toContain('max-w-2xl');
  });

  it('applies size class for full', () => {
    renderModal({ size: 'full' });
    const dialog = screen.getByRole('dialog');
    const panel = dialog.firstElementChild;
    expect(panel?.className).toContain('w-full');
    expect(panel?.className).toContain('h-full');
  });

  it('has correct aria attributes', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
