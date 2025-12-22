/**
 * Auth State Machine
 * 
 * Single source of truth for authentication state across the app.
 * Provides explicit states, transitions, and guards for auth flows.
 * 
 * States:
 * - loading: Initial state while checking session
 * - anonymous: No auth, no session (pure visitor)
 * - anonymous_session: Has Supabase anonymous auth (can write to DB)
 * - authenticated: Full user account (email + password)
 * - session_expired: Had a session but it expired
 * - signed_out: Explicitly signed out
 */

import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Auth states
export type AuthState = 
  | 'loading'
  | 'anonymous'
  | 'anonymous_session'
  | 'authenticated'
  | 'session_expired'
  | 'signed_out';

// Auth context data
export interface AuthContext {
  state: AuthState;
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
  lastStateChange: Date;
}

// State change callback
export type AuthStateCallback = (context: AuthContext) => void;

// Auth machine class
class AuthMachine {
  private context: AuthContext;
  private listeners: Set<AuthStateCallback>;
  private initialized: boolean;

  constructor() {
    this.context = {
      state: 'loading',
      user: null,
      session: null,
      isAnonymous: false,
      userId: null,
      email: null,
      error: null,
      lastStateChange: new Date(),
    };
    this.listeners = new Set();
    this.initialized = false;
  }

  /**
   * Initialize the auth machine and start listening to Supabase auth changes
   */
  async initialize(): Promise<AuthContext> {
    if (this.initialized) {
      return this.context;
    }

    // Get initial session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.transition('signed_out', null, null, error.message);
      } else {
        this.processSession(session);
      }
    } catch (error) {
      console.error('❌ AuthMachine: Failed to get initial session:', error);
      this.transition('signed_out', null, null, 'Failed to initialize auth');
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.handleAuthChange(event, session);
    });

    this.initialized = true;
    return this.context;
  }

  /**
   * Process a session and determine the correct state
   */
  private processSession(session: Session | null, isRefreshFailure: boolean = false): void {
    if (!session?.user) {
      // Check if we previously had an authenticated session
      // If so, this is a session expiry
      if (this.context.state === 'authenticated' || isRefreshFailure) {
        this.transition('session_expired', null, null);
      } else {
        this.transition('anonymous', null, null);
      }
      return;
    }

    const user = session.user;
    const isAnonymous = user.is_anonymous === true || 
                        (user.user_metadata as any)?.is_anonymous === true;

    if (isAnonymous) {
      this.transition('anonymous_session', user, session);
    } else {
      this.transition('authenticated', user, session);
    }
  }

  /**
   * Handle Supabase auth change events
   */
  private handleAuthChange(event: AuthChangeEvent, session: Session | null): void {
    console.log('🔐 AuthMachine: Auth event:', event);

    switch (event) {
      case 'INITIAL_SESSION':
        this.processSession(session);
        break;

      case 'SIGNED_IN':
        this.processSession(session);
        break;

      case 'SIGNED_OUT':
        this.transition('signed_out', null, null);
        break;

      case 'TOKEN_REFRESHED':
        this.processSession(session);
        break;

      case 'USER_UPDATED':
        this.processSession(session);
        break;

      case 'PASSWORD_RECOVERY':
        // Stay in current state, just update session
        if (session) {
          this.transition(this.context.state, session.user, session);
        }
        break;

      default:
        console.warn('🔐 AuthMachine: Unhandled event:', event);
    }
  }

  /**
   * Transition to a new state
   */
  private transition(
    newState: AuthState, 
    user: User | null, 
    session: Session | null,
    error: string | null = null
  ): void {
    const previousState = this.context.state;
    
    this.context = {
      state: newState,
      user,
      session,
      isAnonymous: user?.is_anonymous === true || 
                   (user?.user_metadata as any)?.is_anonymous === true,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error,
      lastStateChange: new Date(),
    };

    console.log(`🔐 AuthMachine: ${previousState} → ${newState}`, {
      userId: this.context.userId,
      isAnonymous: this.context.isAnonymous,
      email: this.context.email,
    });

    // Notify all listeners
    this.notifyListeners();
  }

  /**
   * Notify all registered listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.context);
      } catch (error) {
        console.error('❌ AuthMachine: Listener error:', error);
      }
    });
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback: AuthStateCallback): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.context);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current auth context
   */
  getContext(): AuthContext {
    return { ...this.context };
  }

  /**
   * Get current state
   */
  getState(): AuthState {
    return this.context.state;
  }

  /**
   * Check if user is authenticated (not anonymous)
   */
  isAuthenticated(): boolean {
    return this.context.state === 'authenticated';
  }

  /**
   * Check if user has any session (including anonymous)
   */
  hasSession(): boolean {
    return ['anonymous_session', 'authenticated'].includes(this.context.state);
  }

  /**
   * Check if current session is anonymous
   */
  isAnonymousSession(): boolean {
    return this.context.state === 'anonymous_session';
  }

  /**
   * Get user ID if available
   */
  getUserId(): string | null {
    return this.context.userId;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Sign in failed' };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string, 
    password: string, 
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata,
        },
      });
      
      if (error) {
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      const needsVerification = !data.session && !!data.user;
      
      return { success: true, needsVerification };
    } catch (error) {
      return { success: false, error: 'Sign up failed' };
    }
  }

  /**
   * Create anonymous session
   */
  async createAnonymousSession(): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Check if already have a session
      if (this.hasSession()) {
        return { success: true, userId: this.context.userId ?? undefined };
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, userId: data.user?.id };
    } catch (error) {
      return { success: false, error: 'Failed to create anonymous session' };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Sign out failed' };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Password reset failed' };
    }
  }

  /**
   * Upgrade anonymous session to full account
   * Note: This creates a new account and migrates data
   */
  async upgradeAnonymousSession(
    email: string, 
    password: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isAnonymousSession()) {
      return { success: false, error: 'No anonymous session to upgrade' };
    }

    try {
      // Link email to current anonymous user
      const { error } = await supabase.auth.updateUser({
        email,
        password,
        data: metadata,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to upgrade session' };
    }
  }
}

// Singleton instance
export const authMachine = new AuthMachine();

// Initialize on import (async, but doesn't block)
authMachine.initialize().then((ctx) => {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authMachine.ts:init',message:'AuthMachine initialized',data:{state:ctx.state,userId:ctx.userId,isAnonymous:ctx.isAnonymous},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
}).catch(console.error);

