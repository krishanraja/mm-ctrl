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
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ensureAnonSession.ts:entry',message:'ensureAnonSession called',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion

  // Wait for auth machine to be ready
  const context = await authMachine.initialize();

  // If already have a session, return it
  if (authMachine.hasSession()) {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ensureAnonSession.ts:hasSession',message:'Already has session',data:{userId:context.userId,isAnonymous:context.isAnonymous},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    return {
      userId: context.userId,
      isAnonymous: context.isAnonymous,
    };
  }

  // No session → create anonymous identity
  const result = await authMachine.createAnonymousSession();
  
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ensureAnonSession.ts:created',message:'Anonymous session result',data:{success:result.success,userId:result.userId,error:result.error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  if (!result.success) {
    console.error('❌ ensureAnonSession: Failed to create anonymous session:', result.error);
    return { userId: null, isAnonymous: false };
  }

  return { 
    userId: result.userId ?? null, 
    isAnonymous: true 
  };
}
