import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import type { User } from '@supabase/supabase-js';

/**
 * useUserState Hook
 * 
 * Single source of truth for user authentication and baseline state.
 * Consolidates all state checks to ensure consistency across components.
 * 
 * Returns:
 * - user: Current user object (null if no user)
 * - isAuthenticated: True if user is authenticated (not anonymous)
 * - isAnonymous: True if user has anonymous session
 * - hasBaseline: True if user has completed diagnostic
 * - assessmentId: The assessment ID if baseline exists
 * - isLoading: True while checking auth state
 */
export function useUserState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasBaseline, setHasBaseline] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeState = async () => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (isMounted) {
        setUser(currentUser);
      }

      // Check for baseline
      const { assessmentId: persistedId } = getPersistedAssessmentId();
      
      if (isMounted) {
        setAssessmentId(persistedId);
        setHasBaseline(Boolean(persistedId));
        setIsLoading(false);
      }
    };

    initializeState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        
        // Re-check baseline when auth state changes
        const { assessmentId: persistedId } = getPersistedAssessmentId();
        setAssessmentId(persistedId);
        setHasBaseline(Boolean(persistedId));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = user !== null && !user.is_anonymous;
  const isAnonymous = user !== null && (user.is_anonymous === true || (user.user_metadata as any)?.is_anonymous === true);

  return {
    user,
    isAuthenticated,
    isAnonymous,
    hasBaseline,
    assessmentId,
    isLoading,
  };
}
