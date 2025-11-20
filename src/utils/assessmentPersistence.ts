/**
 * PHASE 1: Assessment Persistence Utility
 * Handles multi-layer persistence strategy for assessment IDs
 * Priority: URL params → localStorage → sessionStorage
 */

const ASSESSMENT_ID_KEY = 'current_assessment_id';
const SESSION_STORAGE_KEY = 'v2_assessment_id';

export interface AssessmentPersistence {
  assessmentId: string | null;
  source: 'url' | 'localStorage' | 'sessionStorage' | 'none';
}

/**
 * Get assessment ID from multiple sources with priority fallback
 */
export function getPersistedAssessmentId(): AssessmentPersistence {
  // Priority 1: URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl = urlParams.get('a');
  if (fromUrl) {
    // Found in URL - persist to localStorage
    persistAssessmentId(fromUrl);
    return { assessmentId: fromUrl, source: 'url' };
  }

  // Priority 2: localStorage (survives page refresh)
  const fromLocalStorage = localStorage.getItem(ASSESSMENT_ID_KEY);
  if (fromLocalStorage) {
    return { assessmentId: fromLocalStorage, source: 'localStorage' };
  }

  // Priority 3: sessionStorage (legacy support)
  const fromSessionStorage = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (fromSessionStorage) {
    // Upgrade to localStorage
    persistAssessmentId(fromSessionStorage);
    return { assessmentId: fromSessionStorage, source: 'sessionStorage' };
  }

  return { assessmentId: null, source: 'none' };
}

/**
 * Persist assessment ID to multiple storage layers
 */
export function persistAssessmentId(assessmentId: string): void {
  try {
    // Store in localStorage (primary)
    localStorage.setItem(ASSESSMENT_ID_KEY, assessmentId);
    
    // Store in sessionStorage (legacy compatibility)
    sessionStorage.setItem(SESSION_STORAGE_KEY, assessmentId);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('a', assessmentId);
    window.history.replaceState({}, '', url.toString());
    
    console.log('✅ Assessment ID persisted:', assessmentId);
  } catch (error) {
    console.error('❌ Failed to persist assessment ID:', error);
  }
}

/**
 * Clear assessment ID from all storage layers
 */
export function clearPersistedAssessmentId(): void {
  try {
    localStorage.removeItem(ASSESSMENT_ID_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    
    // Remove from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('a');
    window.history.replaceState({}, '', url.toString());
    
    console.log('✅ Assessment ID cleared');
  } catch (error) {
    console.error('❌ Failed to clear assessment ID:', error);
  }
}

/**
 * Link assessment to authenticated user
 */
export async function linkAssessmentToUser(
  assessmentId: string,
  userId: string
): Promise<boolean> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Update leader_assessments with user
    const { error } = await supabase
      .from('leader_assessments')
      .update({ 
        session_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (error) {
      console.error('❌ Failed to link assessment to user:', error);
      return false;
    }

    console.log('✅ Assessment linked to user:', { assessmentId, userId });
    return true;
  } catch (error) {
    console.error('❌ Error linking assessment:', error);
    return false;
  }
}
