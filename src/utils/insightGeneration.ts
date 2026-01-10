/**
 * Insight Generation - Extract and Store Insights
 * 
 * Purpose: Extract insights from events and store in both:
 * - leader_dimension_scores (scores)
 * - profile_insights (rich insights with context)
 * 
 * Key Features:
 * - Maps to core dimensions (ai_posture, data_posture, value_pressure, etc.)
 * - Extracts insights from assessment events
 * - Stores both dimension scores and rich profile insights
 * - Links insights back to source events
 * - Handles missing data gracefully
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureArray, ensureNumber, ensureString, safeAccess } from './pipelineGuards';

export interface InsightData {
  profileId: string;
  sourceEventIds: string[];
  dimensionName: string;
  dimensionKey?: string;
  score: number;
  label: string;
  llmSummary: string;
  contextSnapshot: Record<string, any>;
  evidence: string[];
  toolName?: string;
  flowName?: string;
  generatedBy?: string;
  confidence?: number;
  surpriseFactor?: 'high' | 'medium' | 'low';
  contradictionFlag?: boolean;
}

export interface DimensionScoreData {
  assessmentId: string;
  dimensionKey: string;
  scoreNumeric: number;
  dimensionTier: string;
  explanation: string;
  llmSummary?: string;
  contextSnapshot?: Record<string, any>;
  evidence?: string[];
}

export interface InsightGenerationResult {
  success: boolean;
  profileInsightIds: string[];
  dimensionScoreIds: string[];
  errors: string[];
  fallbacksUsed: string[];
}

/**
 * Core dimension names for insights
 */
export const CORE_DIMENSIONS = [
  'ai_posture',
  'data_posture',
  'value_pressure',
  'decision_cadence',
  'sponsor_strength',
  'willingness',
  'learning_style',
  'risk_appetite',
  'momentum',
  'experimentation_cadence'
] as const;

/**
 * Maps dimension keys to dimension names
 */
const DIMENSION_KEY_TO_NAME: Record<string, string> = {
  'ai_fluency': 'ai_posture',
  'decision_velocity': 'decision_cadence',
  'experimentation_cadence': 'experimentation_cadence',
  'delegation_augmentation': 'sponsor_strength',
  'alignment_communication': 'value_pressure',
  'risk_governance': 'risk_appetite'
};

/**
 * Generates and stores insights from events
 */
export async function generateAndStoreInsights(
  profileId: string,
  assessmentId: string,
  events: Array<{
    id: string;
    questionId?: string | null;
    questionText: string;
    rawInput: string;
    structuredValues?: Record<string, any> | null;
    dimensionKey?: string | null;
    toolName: string;
    flowName?: string | null;
  }>,
  dimensionScores: Array<{
    dimensionKey: string;
    scoreNumeric: number;
    dimensionTier: string;
    explanation: string;
  }>
): Promise<InsightGenerationResult> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];
  const profileInsightIds: string[] = [];
  const dimensionScoreIds: string[] = [];

  try {
    // Validate inputs
    if (!profileId) {
      errors.push('profileId is required');
      return { success: false, profileInsightIds, dimensionScoreIds, errors, fallbacksUsed };
    }

    if (!assessmentId) {
      errors.push('assessmentId is required');
      return { success: false, profileInsightIds, dimensionScoreIds, errors, fallbacksUsed };
    }

    // Step 1: Store dimension scores with enhanced insight fields
    for (const score of dimensionScores) {
      try {
        // Extract evidence from events for this dimension
        const relevantEvents = events.filter(e => 
          e.dimensionKey === score.dimensionKey || 
          e.questionText?.toLowerCase().includes(score.dimensionKey.toLowerCase())
        );

        const evidence = relevantEvents
          .slice(0, 5) // Limit to top 5 evidence items
          .map(e => {
            const input = e.rawInput || '';
            const question = e.questionText || '';
            return `${question}: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`;
          });

        const contextSnapshot = {
          events_count: relevantEvents.length,
          tool_names: [...new Set(relevantEvents.map(e => e.toolName))],
          flow_names: [...new Set(relevantEvents.map(e => e.flowName).filter(Boolean))],
          event_ids: relevantEvents.map(e => e.id)
        };

        const llmSummary = score.explanation || `Score of ${score.scoreNumeric}/100 in ${score.dimensionKey}`;

        const { data: insertedScore, error: scoreError } = await supabase
          .from('leader_dimension_scores')
          .insert({
            assessment_id: assessmentId,
            dimension_key: score.dimensionKey,
            score_numeric: ensureNumber(score.scoreNumeric, 50, 0, 100),
            dimension_tier: score.dimensionTier || 'AI-Aware',
            explanation: ensureString(score.explanation, ''),
            llm_summary: llmSummary,
            context_snapshot: contextSnapshot,
            evidence: evidence
          })
          .select('id')
          .single();

        if (scoreError) {
          console.warn(`⚠️ Failed to insert dimension score for ${score.dimensionKey}:`, scoreError.message);
          errors.push(`Dimension score insert failed: ${scoreError.message}`);
        } else if (insertedScore) {
          dimensionScoreIds.push(insertedScore.id);
        }
      } catch (error: any) {
        console.warn(`⚠️ Error storing dimension score for ${score.dimensionKey}:`, error);
        errors.push(`Dimension score error: ${error.message}`);
      }
    }

    // Step 2: Generate and store profile insights
    // Group events by dimension
    const eventsByDimension = new Map<string, typeof events>();

    for (const event of events) {
      const dimensionKey = event.dimensionKey;
      if (dimensionKey) {
        const dimensionName = DIMENSION_KEY_TO_NAME[dimensionKey] || dimensionKey;
        
        if (!eventsByDimension.has(dimensionName)) {
          eventsByDimension.set(dimensionName, []);
        }
        eventsByDimension.get(dimensionName)!.push(event);
      }
    }

    // Create insights for each dimension
    for (const [dimensionName, dimensionEvents] of eventsByDimension.entries()) {
      try {
        // Find corresponding dimension score
        const dimensionKey = Object.keys(DIMENSION_KEY_TO_NAME).find(
          key => DIMENSION_KEY_TO_NAME[key] === dimensionName
        ) || dimensionName;

        const dimensionScore = dimensionScores.find(s => s.dimensionKey === dimensionKey);
        const score = dimensionScore?.scoreNumeric || 50;
        const label = getLabelFromScore(score);
        const llmSummary = dimensionScore?.explanation || 
          `Based on ${dimensionEvents.length} responses, ${dimensionName} shows ${label} characteristics.`;

        // Build context snapshot
        const contextSnapshot = {
          events_count: dimensionEvents.length,
          tool_names: [...new Set(dimensionEvents.map(e => e.toolName))],
          flow_names: [...new Set(dimensionEvents.map(e => e.flowName).filter(Boolean))],
          question_ids: dimensionEvents.map(e => e.questionId).filter(Boolean),
          sample_responses: dimensionEvents.slice(0, 3).map(e => ({
            question: e.questionText,
            response: e.rawInput.substring(0, 200)
          }))
        };

        // Extract evidence
        const evidence = dimensionEvents
          .slice(0, 5)
          .map(e => {
            const question = e.questionText || 'Question';
            const response = e.rawInput || '';
            return `${question}: "${response.substring(0, 150)}${response.length > 150 ? '...' : ''}"`;
          });

        // Determine surprise factor based on score variance
        const scores = dimensionEvents
          .map(e => {
            const structured = e.structuredValues || {};
            return typeof structured.score === 'number' ? structured.score : null;
          })
          .filter((s): s is number => s !== null);

        const surpriseFactor = scores.length > 0 && scores.some(s => Math.abs(s - score) > 20)
          ? 'high'
          : score < 30 || score > 80
          ? 'medium'
          : 'low';

        const { data: insertedInsight, error: insightError } = await supabase
          .from('profile_insights')
          .insert({
            profile_id: profileId,
            source_event_ids: dimensionEvents.map(e => e.id),
            dimension_name: dimensionName,
            dimension_key: dimensionKey,
            score: ensureNumber(score, 50, 0, 100),
            label: label,
            llm_summary: llmSummary,
            context_snapshot: contextSnapshot,
            evidence: evidence,
            tool_name: dimensionEvents[0]?.toolName || 'quiz',
            flow_name: dimensionEvents[0]?.flowName || null,
            generated_by: 'system',
            confidence: 0.7,
            surprise_factor: surpriseFactor,
            contradiction_flag: false
          })
          .select('id')
          .single();

        if (insightError) {
          console.warn(`⚠️ Failed to insert profile insight for ${dimensionName}:`, insightError.message);
          errors.push(`Profile insight insert failed: ${insightError.message}`);
        } else if (insertedInsight) {
          profileInsightIds.push(insertedInsight.id);
        }
      } catch (error: any) {
        console.warn(`⚠️ Error storing profile insight for ${dimensionName}:`, error);
        errors.push(`Profile insight error: ${error.message}`);
      }
    }

    // Step 3: Create general insights if no dimension-specific insights were created
    if (profileInsightIds.length === 0 && events.length > 0) {
      try {
        const generalInsight = {
          profile_id: profileId,
          source_event_ids: events.map(e => e.id),
          dimension_name: 'general',
          score: 50,
          label: 'Baseline',
          llm_summary: `Based on ${events.length} assessment responses, establishing baseline profile.`,
          context_snapshot: {
            events_count: events.length,
            tool_names: [...new Set(events.map(e => e.toolName))],
            flow_names: [...new Set(events.map(e => e.flowName).filter(Boolean))]
          },
          evidence: events.slice(0, 3).map(e => e.rawInput.substring(0, 100)),
          tool_name: events[0]?.toolName || 'quiz',
          generated_by: 'system',
          confidence: 0.5,
          surprise_factor: 'low' as const,
          contradiction_flag: false
        };

        const { data: insertedInsight, error: insightError } = await supabase
          .from('profile_insights')
          .insert(generalInsight)
          .select('id')
          .single();

        if (insightError) {
          console.warn('⚠️ Failed to insert general profile insight:', insightError.message);
          errors.push(`General insight insert failed: ${insightError.message}`);
        } else if (insertedInsight) {
          profileInsightIds.push(insertedInsight.id);
          fallbacksUsed.push('general_insight');
        }
      } catch (error: any) {
        console.warn('⚠️ Error storing general profile insight:', error);
        errors.push(`General insight error: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      profileInsightIds,
      dimensionScoreIds,
      errors,
      fallbacksUsed
    };
  } catch (error: any) {
    console.error('❌ Unexpected error in generateAndStoreInsights:', error);
    errors.push(`Unexpected error: ${error.message || String(error)}`);
    return {
      success: false,
      profileInsightIds,
      dimensionScoreIds,
      errors,
      fallbacksUsed
    };
  }
}

/**
 * Gets label from score
 */
function getLabelFromScore(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Moderate-High';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Low-Moderate';
  return 'Low';
}

/**
 * Retrieves latest insights for a profile
 */
export async function getProfileInsights(
  profileId: string,
  dimensionName?: string
): Promise<{
  success: boolean;
  insights: Array<{
    id: string;
    dimensionName: string;
    score: number | null;
    label: string | null;
    llmSummary: string | null;
    generatedAt: string;
    toolName: string | null;
  }>;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const { data: insights, error: insightsError } = await supabase
      .rpc('get_latest_profile_insights', {
        p_profile_id: profileId,
        p_dimension_name: dimensionName || null
      });

    if (insightsError) {
      errors.push(`Failed to fetch insights: ${insightsError.message}`);
      return { success: false, insights: [], errors };
    }

    return {
      success: true,
      insights: (insights || []).map(insight => ({
        id: insight.id,
        dimensionName: insight.dimension_name,
        score: insight.score,
        label: insight.label,
        llmSummary: insight.llm_summary,
        generatedAt: insight.generated_at,
        toolName: insight.tool_name
      })),
      errors
    };
  } catch (error: any) {
    console.error('❌ Error in getProfileInsights:', error);
    errors.push(`Unexpected error: ${error.message || String(error)}`);
    return { success: false, insights: [], errors };
  }
}
