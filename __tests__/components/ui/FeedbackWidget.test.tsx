import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackWidget } from '@/components/ui/FeedbackWidget';

describe('FeedbackWidget', () => {
  const defaultProps = {
    userId: 'user-1',
    onSubmit: vi.fn(),
  };

  it('renders a feedback button initially', () => {
    render(<FeedbackWidget {...defaultProps} />);
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeInTheDocument();
  });

  it('opens the feedback form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    expect(screen.getByRole('dialog', { name: /feedback form/i })).toBeInTheDocument();
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });

  it('closes the form when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close feedback form/i }));
    // Dialog should be gone, and the trigger button should be back
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeInTheDocument();
  });

  it('displays three feedback type options', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    expect(screen.getByText('Bug Report')).toBeInTheDocument();
    expect(screen.getByText('Feature Request')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('displays five star rating buttons', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);
  });

  it('submit button is disabled when message is empty', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    const submitBtn = screen.getByRole('button', { name: /submit feedback/i });
    expect(submitBtn).toBeDisabled();
  });

  it('calls onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeedbackWidget userId="u1" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    // Select bug type
    await user.click(screen.getByText('Bug Report'));

    // Set rating to 3
    await user.click(screen.getByRole('radio', { name: '3 stars' }));

    // Type message
    await user.type(screen.getByPlaceholderText(/tell us what you think/i), 'Found a bug');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        type: 'bug',
        rating: 3,
        message: 'Found a bug',
      }),
    );
  });

  it('shows thank you message after submit', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.type(screen.getByPlaceholderText(/tell us what you think/i), 'Great app!');
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(screen.getByText('Thank you!')).toBeInTheDocument();
  });

  it('renders in bottom-left position when specified', () => {
    render(<FeedbackWidget {...defaultProps} position="bottom-left" />);
    const btn = screen.getByRole('button', { name: /send feedback/i });
    expect(btn.className).toContain('left-4');
  });

  it('renders in bottom-right position by default', () => {
    render(<FeedbackWidget {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /send feedback/i });
    expect(btn.className).toContain('right-4');
  });
});
