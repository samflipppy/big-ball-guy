import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollaboratorAvatars, type EditorInfo } from '@/components/ui/CollaboratorAvatars';

const mockEditors: EditorInfo[] = [
  { id: '1', name: 'Coach Smith', color: '#2563eb' },
  { id: '2', name: 'Coach Jones', color: '#dc2626' },
  { id: '3', name: 'Coach Williams', color: '#16a34a' },
];

describe('CollaboratorAvatars', () => {
  it('renders nothing when editors array is empty', () => {
    const { container } = render(<CollaboratorAvatars editors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders avatars for all editors within maxVisible', () => {
    render(<CollaboratorAvatars editors={mockEditors} maxVisible={3} />);
    expect(screen.getByLabelText('Coach Smith')).toBeInTheDocument();
    expect(screen.getByLabelText('Coach Jones')).toBeInTheDocument();
    expect(screen.getByLabelText('Coach Williams')).toBeInTheDocument();
  });

  it('displays initials from editor names', () => {
    render(<CollaboratorAvatars editors={[{ id: '1', name: 'Coach Smith', color: '#2563eb' }]} />);
    expect(screen.getByText('CS')).toBeInTheDocument();
  });

  it('displays initials for single-word names', () => {
    render(<CollaboratorAvatars editors={[{ id: '1', name: 'Admin', color: '#2563eb' }]} />);
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('shows editor count label', () => {
    render(<CollaboratorAvatars editors={mockEditors} />);
    expect(screen.getByText('3 editors')).toBeInTheDocument();
  });

  it('shows singular label for one editor', () => {
    render(<CollaboratorAvatars editors={[mockEditors[0]]} />);
    expect(screen.getByText('1 editor')).toBeInTheDocument();
  });

  it('shows overflow indicator when editors exceed maxVisible', () => {
    const editors: EditorInfo[] = [
      ...mockEditors,
      { id: '4', name: 'Coach Davis', color: '#f59e0b' },
      { id: '5', name: 'Coach Brown', color: '#9333ea' },
    ];
    render(<CollaboratorAvatars editors={editors} maxVisible={3} />);

    // Should show +2 overflow
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByLabelText('2 more editors')).toBeInTheDocument();
  });

  it('shows "+1" for single overflow', () => {
    const editors: EditorInfo[] = [
      ...mockEditors,
      { id: '4', name: 'Coach Davis', color: '#f59e0b' },
    ];
    render(<CollaboratorAvatars editors={editors} maxVisible={3} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByLabelText('1 more editor')).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<CollaboratorAvatars editors={[mockEditors[0]]} />);

    const avatar = screen.getByLabelText('Coach Smith');
    await user.hover(avatar);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Coach Smith');
  });

  it('hides tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    render(<CollaboratorAvatars editors={[mockEditors[0]]} />);

    const avatar = screen.getByLabelText('Coach Smith');
    await user.hover(avatar);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.unhover(avatar);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders pulsing active indicator', () => {
    render(<CollaboratorAvatars editors={[mockEditors[0]]} />);
    const indicator = screen.getByTestId('pulse-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('applies editor color as background', () => {
    render(<CollaboratorAvatars editors={[{ id: '1', name: 'Test', color: '#ff00ff' }]} />);
    const avatar = screen.getByLabelText('Test');
    expect(avatar).toHaveStyle({ backgroundColor: '#ff00ff' });
  });

  it('renders the container with data-testid', () => {
    render(<CollaboratorAvatars editors={mockEditors} />);
    expect(screen.getByTestId('collaborator-avatars')).toBeInTheDocument();
  });
});
