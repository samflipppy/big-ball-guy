'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      }));
    });

    // Fetch initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        loading: false,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error: error.message };
      }
      setState((prev) => ({ ...prev, loading: false }));
      return { error: null };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const signup = useCallback(
    async (email: string, password: string, teamName: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error: error.message };
      }

      // Create team for the new user
      if (data.user) {
        const { error: teamError } = await supabase.from('teams').insert({
          name: teamName,
          owner_id: data.user.id,
          created_at: new Date().toISOString(),
        });
        if (teamError) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: teamError.message,
          }));
          return { error: teamError.message };
        }
      }

      setState((prev) => ({ ...prev, loading: false }));
      return { error: null };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { error } = await supabase.auth.signOut();
    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      return { error: error.message };
    }
    setState((prev) => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      loading: false,
    }));
    return { error: null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetPassword = useCallback(
    async (email: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error: error.message };
      }
      setState((prev) => ({ ...prev, loading: false }));
      return { error: null };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const getCurrentUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    signup,
    logout,
    resetPassword,
    getCurrentUser,
  };
}
