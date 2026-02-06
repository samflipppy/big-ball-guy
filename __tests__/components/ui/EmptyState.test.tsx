import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No plays found" />);
    expect(screen.getByText('No plays found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="Empty"
        description="Create your first play to get started"
      />,
    );
    expect(screen.getByText('Create your first play to get started')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const descriptions = container.querySelectorAll('p');
    expect(descriptions).toHaveLength(0);
  });

  it('renders action button when actionLabel and onAction are provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Empty"
        actionLabel="Create Play"
        onAction={onAction}
      />,
    );
    expect(screen.getByRole('button', { name: 'Create Play' })).toBeInTheDocument();
  });

  it('does not render action button when actionLabel is missing', () => {
    render(<EmptyState title="Empty" onAction={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render action button when onAction is missing', () => {
    render(<EmptyState title="Empty" actionLabel="Create" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Empty"
        actionLabel="Create Play"
        onAction={onAction}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Create Play' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon when provided', () => {
    render(
      <EmptyState
        title="Empty"
        icon={<span data-testid="custom-icon">Icon</span>}
      />,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const iconContainer = container.querySelector('.rounded-full');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Empty" className="my-class" />);
    expect(container.firstElementChild?.className).toContain('my-class');
  });
});
