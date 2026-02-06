import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '@/components/auth/AuthForm';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe('AuthForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('login mode', () => {
    it('renders login form with email and password fields', () => {
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Sign in' }),
      ).toBeInTheDocument();
    });

    it('does not render team name field', () => {
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      expect(screen.queryByLabelText('Team Name')).not.toBeInTheDocument();
    });

    it('shows signup link', () => {
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      const signupLink = screen.getByText("Don't have an account? Sign up");
      expect(signupLink).toBeInTheDocument();
      expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('shows forgot password link', () => {
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      const forgotLink = screen.getByText('Forgot password?');
      expect(forgotLink).toBeInTheDocument();
    });

    it('submits form with email and password', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'coach@test.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'coach@test.com',
          password: 'password123',
        });
      });
    });
  });

  describe('signup mode', () => {
    it('renders signup form with team name, email, and password fields', () => {
      render(
        <AuthForm
          mode="signup"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      expect(screen.getByLabelText('Team Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create Account' }),
      ).toBeInTheDocument();
    });

    it('shows login link', () => {
      render(
        <AuthForm
          mode="signup"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      const loginLink = screen.getByText('Already have an account? Sign in');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    it('shows password hint', () => {
      render(
        <AuthForm
          mode="signup"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      expect(
        screen.getByText('Must be at least 8 characters long'),
      ).toBeInTheDocument();
    });

    it('submits form with all fields', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          mode="signup"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      await user.type(screen.getByLabelText('Team Name'), 'Eagles');
      await user.type(screen.getByLabelText('Email'), 'new@test.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(
        screen.getByRole('button', { name: 'Create Account' }),
      );

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'new@test.com',
          password: 'password123',
          teamName: 'Eagles',
        });
      });
    });
  });

  describe('validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Email is required',
        );
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when email is invalid', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'notanemail');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Please enter a valid email address',
        );
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when password is empty', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'coach@test.com');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Password is required',
        );
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'coach@test.com');
      await user.type(screen.getByLabelText('Password'), 'short');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Password must be at least 8 characters',
        );
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when team name is empty in signup mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          mode="signup"
          onSubmit={mockOnSubmit}
          loading={false}
          error={null}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'coach@test.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(
        screen.getByRole('button', { name: 'Create Account' }),
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Team name is required',
        );
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('displays server error passed via props', () => {
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={false}
          error="Invalid login credentials"
        />,
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid login credentials',
      );
    });
  });

  describe('loading state', () => {
    it('disables submit button when loading', () => {
      render(
        <AuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={true}
          error={null}
        />,
      );

      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });
  });
});
