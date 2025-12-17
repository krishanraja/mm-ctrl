import { supabase } from '@/integrations/supabase/client';

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
 * Notes:
 * - Safe to call multiple times; it is idempotent for an existing session.
 */
export async function ensureAnonSession(): Promise<{
  userId: string | null;
  isAnonymous: boolean;
}> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.warn('⚠️ ensureAnonSession: getSession failed', sessionError);
  }

  const existingUser = sessionData?.session?.user;
  if (existingUser?.id) {
    // `is_anonymous` is present for anonymous users; be defensive across versions.
    const isAnonymous = Boolean((existingUser.user_metadata as any)?.is_anonymous);
    return { userId: existingUser.id, isAnonymous };
  }

  // No session → create anonymous identity
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('❌ ensureAnonSession: signInAnonymously failed', error);
    return { userId: null, isAnonymous: false };
  }

  const newUser = data?.user;
  return { userId: newUser?.id ?? null, isAnonymous: true };
}

