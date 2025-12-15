/**
 * Cleanup Failed Assessment Utility
 * 
 * Purpose: Deletes partial data when assessment pipeline fails
 * This prevents orphaned records and ensures data consistency
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Cleans up partial assessment data when pipeline fails
 * Deletes all related records to prevent orphaned data
 */
export async function cleanupFailedAssessment(assessmentId: string | null): Promise<void> {
  if (!assessmentId) {
    console.log('⚠️ No assessment ID provided for cleanup');
    return;
  }

  console.log(`🧹 Cleaning up failed assessment: ${assessmentId}`);

  try {
    // Delete in reverse order of dependencies to avoid FK constraint violations
    const tables = [
      'leader_first_moves',
      'leader_prompt_sets',
      'leader_org_scenarios',
      'leader_risk_signals',
      'leader_tensions',
      'leader_dimension_scores',
      'assessment_events',
      'assessment_behavioral_adjustments'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('assessment_id', assessmentId);

      if (error) {
        console.error(`❌ Failed to delete from ${table}:`, error.message);
        // Continue with other tables even if one fails
      } else {
        console.log(`✅ Cleaned up ${table}`);
      }
    }

    // Finally, delete the assessment record itself
    const { error: assessmentError } = await supabase
      .from('leader_assessments')
      .delete()
      .eq('id', assessmentId);

    if (assessmentError) {
      console.error('❌ Failed to delete assessment record:', assessmentError.message);
    } else {
      console.log(`✅ Cleaned up assessment record: ${assessmentId}`);
    }

    console.log(`✅ Cleanup complete for assessment: ${assessmentId}`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't throw - cleanup is best effort
  }
}

