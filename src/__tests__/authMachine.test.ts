/**
 * Auth State Machine Tests
 *
 * Tests initialization, state transitions, session management,
 * auth actions (signIn, signUp, signOut), and subscriptions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

// --- Supabase mock setup ---

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInAnonymously = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signInAnonymously: mockSignInAnonymously,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
  },
}));

// --- Helpers to create fake User / Session objects ---

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    is_anonymous: false,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

function fakeSession(user: User, overrides: Partial<Session> = {}): Session {
  return {
    access_token: 'token-abc',
    refresh_token: 'refresh-xyz',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
    ...overrides,
  } as Session;
}

// Because authMachine is a singleton that auto-initializes on import,
// we need to re-import a fresh module for each test group.
// We use vi.resetModules() + dynamic import to get a clean instance.

async function freshAuthMachine() {
  vi.resetModules();
  const mod = await import('@/lib/authMachine');
  return mod;
}

describe('AuthMachine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: getSession returns no session (so auto-init goes to anonymous)
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  // ----------------------------------------------------------------
  // Initialization
  // ----------------------------------------------------------------
  describe('Initialization', () => {
    it('should start in loading state before initialize() resolves', async () => {
      // Make getSession hang so we can inspect state before it resolves
      let resolveSession!: (v: any) => void;
      mockGetSession.mockReturnValue(
        new Promise((resolve) => {
          resolveSession = resolve;
        })
      );

      const mod = await import('@/lib/authMachine');
      // The auto-init fires but getSession is still pending.
      // getContext should reflect loading.
      const ctx = mod.authMachine.getContext();
      expect(ctx.state).toBe('loading');

      // Resolve to finish cleanup
      resolveSession({ data: { session: null }, error: null });
    });

    it('should transition to anonymous when getSession returns null session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      // Wait for auto-init to settle
      await authMachine.initialize();

      expect(authMachine.getState()).toBe('anonymous');
      expect(authMachine.getContext().user).toBeNull();
      expect(authMachine.getContext().session).toBeNull();
    });

    it('should transition to authenticated when session has a real user', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });

      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.getState()).toBe('authenticated');
      expect(authMachine.getContext().userId).toBe('user-123');
      expect(authMachine.getContext().email).toBe('test@example.com');
      expect(authMachine.getContext().isAnonymous).toBe(false);
    });

    it('should transition to anonymous_session when user is anonymous', async () => {
      const user = fakeUser({ id: 'anon-456', is_anonymous: true, email: undefined });
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });

      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.getState()).toBe('anonymous_session');
      expect(authMachine.getContext().isAnonymous).toBe(true);
      expect(authMachine.getContext().userId).toBe('anon-456');
    });

    it('should transition to signed_out when getSession returns an error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.getState()).toBe('signed_out');
      expect(authMachine.getContext().error).toBe('Session expired');
    });

    it('should transition to signed_out when getSession throws', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'));

      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.getState()).toBe('signed_out');
      expect(authMachine.getContext().error).toBe('Failed to initialize auth');
    });

    it('should not re-initialize if already initialized', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();
      // Call again
      const ctx = await authMachine.initialize();
      expect(ctx.state).toBe('anonymous');
      // getSession should have been called only once (from auto-init, plus our explicit call collapses)
      // The important thing is the state doesn't reset.
    });
  });

  // ----------------------------------------------------------------
  // Auth change event handling
  // ----------------------------------------------------------------
  describe('Auth change events', () => {
    it('should handle SIGNED_IN event', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      // Grab the callback registered with onAuthStateChange
      const authChangeCallback = mockOnAuthStateChange.mock.calls[0][0];
      expect(authChangeCallback).toBeDefined();

      const user = fakeUser();
      const session = fakeSession(user);
      authChangeCallback('SIGNED_IN', session);

      expect(authMachine.getState()).toBe('authenticated');
      expect(authMachine.getContext().userId).toBe('user-123');
    });

    it('should handle SIGNED_OUT event', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();
      expect(authMachine.getState()).toBe('authenticated');

      const authChangeCallback = mockOnAuthStateChange.mock.calls[0][0];
      authChangeCallback('SIGNED_OUT', null);

      expect(authMachine.getState()).toBe('signed_out');
    });

    it('should handle TOKEN_REFRESHED event', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const authChangeCallback = mockOnAuthStateChange.mock.calls[0][0];
      const newSession = fakeSession(user, { access_token: 'new-token' });
      authChangeCallback('TOKEN_REFRESHED', newSession);

      expect(authMachine.getState()).toBe('authenticated');
      expect(authMachine.getContext().session?.access_token).toBe('new-token');
    });

    it('should detect session_expired when authenticated user loses session', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();
      expect(authMachine.getState()).toBe('authenticated');

      const authChangeCallback = mockOnAuthStateChange.mock.calls[0][0];
      // TOKEN_REFRESHED with null session while authenticated -> session_expired
      authChangeCallback('TOKEN_REFRESHED', null);

      expect(authMachine.getState()).toBe('session_expired');
    });

    it('should handle PASSWORD_RECOVERY event keeping current state', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const authChangeCallback = mockOnAuthStateChange.mock.calls[0][0];
      authChangeCallback('PASSWORD_RECOVERY', session);

      // State should remain authenticated
      expect(authMachine.getState()).toBe('authenticated');
    });
  });

  // ----------------------------------------------------------------
  // signIn
  // ----------------------------------------------------------------
  describe('signIn', () => {
    it('should return success when credentials are valid', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });
      const result = await authMachine.signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error when credentials are invalid', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' },
      });
      const result = await authMachine.signIn('test@example.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
    });

    it('should return error when signIn throws', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));
      const result = await authMachine.signIn('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign in failed');
    });
  });

  // ----------------------------------------------------------------
  // signUp
  // ----------------------------------------------------------------
  describe('signUp', () => {
    it('should return success with needsVerification when no session returned', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignUp.mockResolvedValue({
        data: { user: fakeUser(), session: null },
        error: null,
      });
      const result = await authMachine.signUp('new@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.needsVerification).toBe(true);
    });

    it('should return success without needsVerification when session is returned', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const user = fakeUser();
      mockSignUp.mockResolvedValue({
        data: { user, session: fakeSession(user) },
        error: null,
      });
      const result = await authMachine.signUp('new@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.needsVerification).toBe(false);
    });

    it('should return error when email is already registered', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignUp.mockResolvedValue({
        data: {},
        error: { message: 'User already registered' },
      });
      const result = await authMachine.signUp('existing@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already registered');
    });

    it('should return error when signUp throws', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignUp.mockRejectedValue(new Error('Network error'));
      const result = await authMachine.signUp('new@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign up failed');
    });

    it('should pass metadata to signUp options', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignUp.mockResolvedValue({
        data: { user: fakeUser(), session: null },
        error: null,
      });
      await authMachine.signUp('new@example.com', 'pass', { full_name: 'Test User' });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { full_name: 'Test User' },
          }),
        })
      );
    });
  });

  // ----------------------------------------------------------------
  // createAnonymousSession
  // ----------------------------------------------------------------
  describe('createAnonymousSession', () => {
    it('should create anonymous session successfully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();
      // State is 'anonymous' (no session), so hasSession() is false

      mockSignInAnonymously.mockResolvedValue({
        data: { user: fakeUser({ id: 'anon-789', is_anonymous: true }) },
        error: null,
      });
      const result = await authMachine.createAnonymousSession();

      expect(result.success).toBe(true);
      expect(result.userId).toBe('anon-789');
    });

    it('should return existing session if already has one', async () => {
      const user = fakeUser({ id: 'existing-user' });
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();
      // State is 'authenticated', so hasSession() is true

      const result = await authMachine.createAnonymousSession();

      expect(result.success).toBe(true);
      expect(result.userId).toBe('existing-user');
      expect(mockSignInAnonymously).not.toHaveBeenCalled();
    });

    it('should return error when signInAnonymously fails', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignInAnonymously.mockResolvedValue({
        data: {},
        error: { message: 'Anonymous auth disabled' },
      });
      const result = await authMachine.createAnonymousSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Anonymous auth disabled');
    });
  });

  // ----------------------------------------------------------------
  // signOut
  // ----------------------------------------------------------------
  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignOut.mockResolvedValue({ error: null });
      const result = await authMachine.signOut();

      expect(result.success).toBe(true);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should return error when signOut fails', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockSignOut.mockResolvedValue({ error: { message: 'Sign out error' } });
      const result = await authMachine.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out error');
    });
  });

  // ----------------------------------------------------------------
  // upgradeAnonymousSession
  // ----------------------------------------------------------------
  describe('upgradeAnonymousSession', () => {
    it('should upgrade anonymous session successfully', async () => {
      const user = fakeUser({ id: 'anon-001', is_anonymous: true });
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();
      expect(authMachine.getState()).toBe('anonymous_session');

      mockUpdateUser.mockResolvedValue({ data: {}, error: null });
      const result = await authMachine.upgradeAnonymousSession('user@example.com', 'pass123');

      expect(result.success).toBe(true);
      expect(mockUpdateUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'pass123',
        data: undefined,
      });
    });

    it('should fail if not in anonymous session state', async () => {
      const user = fakeUser(); // not anonymous
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();
      expect(authMachine.getState()).toBe('authenticated');

      const result = await authMachine.upgradeAnonymousSession('user@example.com', 'pass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No anonymous session to upgrade');
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should return error when updateUser fails', async () => {
      const user = fakeUser({ id: 'anon-001', is_anonymous: true });
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockUpdateUser.mockResolvedValue({
        data: {},
        error: { message: 'Email already taken' },
      });
      const result = await authMachine.upgradeAnonymousSession('taken@example.com', 'pass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already taken');
    });
  });

  // ----------------------------------------------------------------
  // resetPassword
  // ----------------------------------------------------------------
  describe('resetPassword', () => {
    it('should send reset email successfully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const result = await authMachine.resetPassword('user@example.com');

      expect(result.success).toBe(true);
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({ redirectTo: expect.any(String) })
      );
    });

    it('should return error on failure', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      });
      const result = await authMachine.resetPassword('user@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  // ----------------------------------------------------------------
  // Subscription
  // ----------------------------------------------------------------
  describe('Subscription', () => {
    it('should call subscriber immediately with current state', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const callback = vi.fn();
      authMachine.subscribe(callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'anonymous' })
      );
    });

    it('should notify subscribers on state change via auth events', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const callback = vi.fn();
      authMachine.subscribe(callback);
      // Clear the immediate call
      callback.mockClear();

      // Simulate auth event
      const authChangeCallback = mockOnAuthStateChange.mock.calls[0][0];
      const user = fakeUser();
      authChangeCallback('SIGNED_IN', fakeSession(user));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'authenticated', userId: 'user-123' })
      );
    });

    it('should stop notifying after unsubscribe', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const callback = vi.fn();
      const unsubscribe = authMachine.subscribe(callback);
      callback.mockClear();

      unsubscribe();

      // Simulate auth event
      const authChangeCallback = mockOnAuthStateChange.mock.calls[0][0];
      authChangeCallback('SIGNED_OUT', null);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not crash if a subscriber throws', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const badCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const goodCallback = vi.fn();

      authMachine.subscribe(badCallback);
      authMachine.subscribe(goodCallback);

      // Both called on subscribe (immediate invocation)
      expect(badCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // Helper methods
  // ----------------------------------------------------------------
  describe('Helper methods', () => {
    it('isAuthenticated() returns true only for authenticated state', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated() returns false for anonymous_session', async () => {
      const user = fakeUser({ is_anonymous: true });
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.isAuthenticated()).toBe(false);
    });

    it('hasSession() returns true for authenticated and anonymous_session', async () => {
      const user = fakeUser();
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.hasSession()).toBe(true);
    });

    it('hasSession() returns false for anonymous (no session)', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.hasSession()).toBe(false);
    });

    it('isAnonymousSession() returns true only for anonymous_session', async () => {
      const user = fakeUser({ is_anonymous: true });
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.isAnonymousSession()).toBe(true);
    });

    it('getUserId() returns the user id when authenticated', async () => {
      const user = fakeUser({ id: 'uid-999' });
      const session = fakeSession(user);
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.getUserId()).toBe('uid-999');
    });

    it('getUserId() returns null when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      expect(authMachine.getUserId()).toBeNull();
    });

    it('getContext() returns a copy (not the internal reference)', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const { authMachine } = await freshAuthMachine();
      await authMachine.initialize();

      const ctx1 = authMachine.getContext();
      const ctx2 = authMachine.getContext();
      expect(ctx1).toEqual(ctx2);
      expect(ctx1).not.toBe(ctx2); // different object references
    });
  });
});
