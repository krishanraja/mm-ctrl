import { authMachine } from '@/lib/authMachine';

/**
 * ensureAnonSession
 *
 * Purpose:
 * - Anonymous-first identity that still respects RLS.
 * - Creates (or restores) a Supabase Auth session without forcing email sign-in.
 *
 * Why:
 * - Longitudinal features (check-ins, decision captures, drift detection) must be scoped
 *   to a stable identifier. Supabase anonymous auth gives us a stable `auth.uid()`.
 *
 * Now uses the auth state machine for consistent state management.
 */
export async function ensureAnonSession(): Promise<{
  userId: string | null;
  isAnonymous: boolean;
}> {
  // Wait for auth machine to be ready
  const context = await authMachine.initialize();

  // If already have a session, return it
  if (authMachine.hasSession()) {
    return {
      userId: context.userId,
      isAnonymous: context.isAnonymous,
    };
  }

  // No session → create anonymous identity
  const result = await authMachine.createAnonymousSession();
  
  if (!result.success) {
    console.error('❌ ensureAnonSession: Failed to create anonymous session:', result.error);
    return { userId: null, isAnonymous: false };
  }

  return { 
    userId: result.userId ?? null, 
    isAnonymous: true 
  };
}
