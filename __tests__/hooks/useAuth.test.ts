import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// --- Mocks ---
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockInsert = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
    from: vi.fn(() => ({
      insert: mockInsert,
      select: vi.fn(() => ({ data: [], error: null })),
    })),
  }),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('starts with loading true and no user', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets user from initial getUser call', async () => {
    const fakeUser = { id: 'u1', email: 'coach@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(fakeUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  it('subscribes to auth state changes and unsubscribes on unmount', () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderHook(() => useAuth());
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe('login', () => {
    it('calls signInWithPassword and returns no error on success', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let loginResult: { error: string | null } | undefined;
      await act(async () => {
        loginResult = await result.current.login('coach@test.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'coach@test.com',
        password: 'password123',
      });
      expect(loginResult?.error).toBeNull();
    });

    it('returns error on failed login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let loginResult: { error: string | null } | undefined;
      await act(async () => {
        loginResult = await result.current.login('bad@test.com', 'wrong');
      });

      expect(loginResult?.error).toBe('Invalid login credentials');
      expect(result.current.error).toBe('Invalid login credentials');
    });
  });

  describe('signup', () => {
    it('calls signUp and creates team on success', async () => {
      const fakeUser = { id: 'u2', email: 'new@test.com' };
      mockSignUp.mockResolvedValue({ data: { user: fakeUser }, error: null });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let signupResult: { error: string | null } | undefined;
      await act(async () => {
        signupResult = await result.current.signup(
          'new@test.com',
          'password123',
          'Tigers',
        );
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'password123',
      });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Tigers',
          owner_id: 'u2',
        }),
      );
      expect(signupResult?.error).toBeNull();
    });

    it('returns error on failed signup', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let signupResult: { error: string | null } | undefined;
      await act(async () => {
        signupResult = await result.current.signup(
          'existing@test.com',
          'password123',
          'Eagles',
        );
      });

      expect(signupResult?.error).toBe('User already registered');
      expect(result.current.error).toBe('User already registered');
    });

    it('returns error when team creation fails', async () => {
      const fakeUser = { id: 'u3', email: 'new2@test.com' };
      mockSignUp.mockResolvedValue({ data: { user: fakeUser }, error: null });
      mockInsert.mockResolvedValue({
        error: { message: 'Failed to create team' },
      });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let signupResult: { error: string | null } | undefined;
      await act(async () => {
        signupResult = await result.current.signup(
          'new2@test.com',
          'password123',
          'Hawks',
        );
      });

      expect(signupResult?.error).toBe('Failed to create team');
    });
  });

  describe('logout', () => {
    it('calls signOut and clears user', async () => {
      const fakeUser = { id: 'u1', email: 'coach@test.com' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns error on failed logout', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let logoutResult: { error: string | null } | undefined;
      await act(async () => {
        logoutResult = await result.current.logout();
      });

      expect(logoutResult?.error).toBe('Logout failed');
    });
  });

  describe('resetPassword', () => {
    it('calls resetPasswordForEmail successfully', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let resetResult: { error: string | null } | undefined;
      await act(async () => {
        resetResult = await result.current.resetPassword('coach@test.com');
      });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('coach@test.com');
      expect(resetResult?.error).toBeNull();
    });

    it('returns error on failed reset', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email not found' },
      });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let resetResult: { error: string | null } | undefined;
      await act(async () => {
        resetResult = await result.current.resetPassword('unknown@test.com');
      });

      expect(resetResult?.error).toBe('Email not found');
    });
  });

  describe('getCurrentUser', () => {
    it('returns current user from Supabase', async () => {
      const fakeUser = { id: 'u1', email: 'coach@test.com' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let user: unknown;
      await act(async () => {
        user = await result.current.getCurrentUser();
      });

      expect(user).toEqual(fakeUser);
    });
  });
});
