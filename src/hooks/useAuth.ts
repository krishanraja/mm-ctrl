/**
 * useAuth Hook
 * 
 * React hook for consuming the auth state machine.
 * Provides reactive auth state and actions for components.
 */

import { useState, useEffect, useCallback } from 'react';
import { authMachine, AuthContext, AuthState } from '@/lib/authMachine';

export interface UseAuthReturn {
  // State
  state: AuthState;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  hasSession: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  createAnonymousSession: () => Promise<{ success: boolean; userId?: string; error?: string }>;
  upgradeAnonymousSession: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
}

export function useAuth(): UseAuthReturn {
  const [authContext, setAuthContext] = useState<AuthContext>(authMachine.getContext());

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authMachine.subscribe((ctx) => {
      setAuthContext(ctx);
    });
    return unsubscribe;
  }, []);

  // Memoized actions
  const signIn = useCallback(
    (email: string, password: string) => authMachine.signIn(email, password),
    []
  );

  const signUp = useCallback(
    (email: string, password: string, metadata?: Record<string, any>) => 
      authMachine.signUp(email, password, metadata),
    []
  );

  const signOut = useCallback(
    () => authMachine.signOut(),
    []
  );

  const resetPassword = useCallback(
    (email: string) => authMachine.resetPassword(email),
    []
  );

  const createAnonymousSession = useCallback(
    () => authMachine.createAnonymousSession(),
    []
  );

  const upgradeAnonymousSession = useCallback(
    (email: string, password: string, metadata?: Record<string, any>) =>
      authMachine.upgradeAnonymousSession(email, password, metadata),
    []
  );

  return {
    // State
    state: authContext.state,
    isLoading: authContext.state === 'loading',
    isAuthenticated: authContext.state === 'authenticated',
    isAnonymous: authContext.isAnonymous,
    hasSession: ['anonymous_session', 'authenticated'].includes(authContext.state),
    userId: authContext.userId,
    email: authContext.email,
    error: authContext.error,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    createAnonymousSession,
    upgradeAnonymousSession,
  };
}

/**
 * Hook to check if auth state matches expected states
 * Useful for route guards
 */
export function useAuthGuard(allowedStates: AuthState[]): {
  isAllowed: boolean;
  isLoading: boolean;
  currentState: AuthState;
} {
  const { state, isLoading } = useAuth();

  return {
    isAllowed: allowedStates.includes(state),
    isLoading,
    currentState: state,
  };
}

/**
 * Hook to require authentication
 * Returns redirect function if not authenticated
 */
export function useRequireAuth(): {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
} {
  const { isAuthenticated, isLoading, userId } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    userId,
  };
}

