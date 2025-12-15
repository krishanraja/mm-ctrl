/**
 * Cleanup Failed Assessment
 * 
 * Removes orphaned records when assessment pipeline fails
 * This implements partial failure recovery
 */

import { supabase } from '@/integrations/supabase/client';

export async function cleanupFailedAssessment(assessmentId: string): Promise<{ success: boolean; cleaned: string[]; errors: string[] }> {
  const cleaned: string[] = [];
  const errors: string[] = [];

  console.log(`🧹 Cleaning up failed assessment: ${assessmentId}`);

  // Tables to clean up (in dependency order)
  const tables: Array<'leader_first_moves' | 'leader_prompt_sets' | 'leader_org_scenarios' | 'leader_risk_signals' | 'leader_tensions' | 'leader_dimension_scores' | 'assessment_events'> = [
    'leader_first_moves',
    'leader_prompt_sets',
    'leader_org_scenarios',
    'leader_risk_signals',
    'leader_tensions',
    'leader_dimension_scores',
    'assessment_events',
  ];

  // Delete from each table
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('assessment_id', assessmentId);

      if (error) {
        errors.push(`${table}: ${error.message}`);
      } else {
        cleaned.push(table);
      }
    } catch (e: any) {
      errors.push(`${table}: ${e.message || 'Unknown error'}`);
    }
  }

  // Note: We don't delete the leader_assessments record itself
  // as it may contain useful metadata and can be marked as failed

  console.log(`✅ Cleanup complete. Cleaned: ${cleaned.length}, Errors: ${errors.length}`);

  return {
    success: errors.length === 0,
    cleaned,
    errors,
  };
}
