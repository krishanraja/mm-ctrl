/**
 * Assessment Persistence Utility
 * 
 * SECURITY FIX (P0-7): Removed URL query param exposure
 * Assessment IDs are now stored ONLY in localStorage (not in URL)
 * This prevents accidental sharing of assessment data via URL copy/paste
 * 
 * For explicit sharing, use a dedicated share flow with consent
 */

const ASSESSMENT_ID_KEY = 'mindmaker_assessment_id';
const SESSION_STORAGE_KEY = 'v2_assessment_id'; // Legacy key for migration

export interface AssessmentPersistence {
  assessmentId: string | null;
  source: 'localStorage' | 'sessionStorage' | 'none';
}

/**
 * Get assessment ID from storage (NOT from URL for security)
 */
export function getPersistedAssessmentId(): AssessmentPersistence {
  try {
    // Primary: localStorage (survives page refresh, tab close)
    const fromLocalStorage = localStorage.getItem(ASSESSMENT_ID_KEY);
    if (fromLocalStorage) {
      return { assessmentId: fromLocalStorage, source: 'localStorage' };
    }

    // Legacy: sessionStorage (migrate to localStorage if found)
    const fromSessionStorage = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (fromSessionStorage) {
      // Migrate to localStorage
      localStorage.setItem(ASSESSMENT_ID_KEY, fromSessionStorage);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return { assessmentId: fromSessionStorage, source: 'sessionStorage' };
    }

    return { assessmentId: null, source: 'none' };
  } catch (error) {
    console.error('❌ Failed to get persisted assessment ID:', error);
    return { assessmentId: null, source: 'none' };
  }
}

/**
 * Persist assessment ID to localStorage only
 * SECURITY: Does NOT expose in URL to prevent accidental sharing
 */
export function persistAssessmentId(assessmentId: string): void {
  if (!assessmentId) {
    console.warn('⚠️ Attempted to persist empty assessment ID');
    return;
  }

  try {
    // Store in localStorage only (secure)
    localStorage.setItem(ASSESSMENT_ID_KEY, assessmentId);
    
    // Clean up legacy sessionStorage if exists
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    
    // SECURITY FIX: Remove any assessment ID from URL if present (cleanup)
    cleanUrlParams();
    
    console.log('✅ Assessment ID persisted securely');
  } catch (error) {
    console.error('❌ Failed to persist assessment ID:', error);
  }
}

/**
 * Clean sensitive params from URL without page reload
 */
function cleanUrlParams(): void {
  try {
    const url = new URL(window.location.href);
    const hasAssessmentParam = url.searchParams.has('a');
    
    if (hasAssessmentParam) {
      url.searchParams.delete('a');
      window.history.replaceState({}, '', url.toString());
      console.log('🔒 Cleaned assessment ID from URL for security');
    }
  } catch {
    // Ignore URL cleaning errors (not critical)
  }
}

/**
 * Clear assessment ID from all storage layers
 */
export function clearPersistedAssessmentId(): void {
  try {
    localStorage.removeItem(ASSESSMENT_ID_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    cleanUrlParams();
    console.log('✅ Assessment ID cleared');
  } catch (error) {
    console.error('❌ Failed to clear assessment ID:', error);
  }
}

/**
 * Link assessment to authenticated user
 * SECURITY FIX: Uses owner_user_id (proper column) instead of session_id
 */
export async function linkAssessmentToUser(
  assessmentId: string,
  userId: string
): Promise<boolean> {
  if (!assessmentId || !userId) {
    console.error('❌ linkAssessmentToUser: Missing assessmentId or userId');
    return false;
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Update leader_assessments with proper owner_user_id column
    const { error } = await supabase
      .from('leader_assessments')
      .update({ 
        owner_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (error) {
      console.error('❌ Failed to link assessment to user:', error);
      return false;
    }

    console.log('✅ Assessment linked to user');
    return true;
  } catch (error) {
    console.error('❌ Error linking assessment:', error);
    return false;
  }
}

/**
 * Migrate any URL-based assessment IDs to localStorage (one-time cleanup)
 * Call this on app initialization
 */
export function migrateUrlAssessmentId(): void {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('a');
    
    if (fromUrl) {
      // Migrate to localStorage
      localStorage.setItem(ASSESSMENT_ID_KEY, fromUrl);
      
      // Clean URL
      cleanUrlParams();
      
      console.log('✅ Migrated assessment ID from URL to localStorage');
    }
  } catch {
    // Non-critical, ignore errors
  }
}
