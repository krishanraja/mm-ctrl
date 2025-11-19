import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from './edgeFunctionClient';

export interface AssessmentOrchestrationResult {
  success: boolean;
  assessmentId?: string;
  error?: string;
}

/**
 * Orchestrates the complete v2 assessment flow:
 * 1. Create or get leader record
 * 2. Create leader_assessment record
 * 3. Call all edge functions in sequence:
 *    - generate-personalized-insights (enhanced with first moves)
 *    - generate-prompt-library
 *    - compute-risk-signals
 *    - compute-tensions
 *    - derive-org-scenarios
 * 4. Return assessment ID for results display
 */
export async function orchestrateAssessmentV2(
  contactData: any,
  assessmentData: any,
  deepProfileData: any,
  sessionId: string,
  source: 'quiz' | 'voice' = 'quiz'
): Promise<AssessmentOrchestrationResult> {
  try {
    console.log('🚀 Starting v2 assessment orchestration for:', contactData.email);
    console.log('📊 Assessment data received:', assessmentData);
    console.log('📊 Data types:', Object.entries(assessmentData).map(([k,v]) => `${k}: ${typeof v}`));

    // Step 1: Calculate benchmark score and tier
    const benchmarkScore = calculateBenchmarkScore(assessmentData);
    console.log('📊 Calculated benchmark score:', benchmarkScore);
    const benchmarkTier = calculateBenchmarkTier(benchmarkScore);

    // Step 3: Create leader_assessment via edge function (bypasses RLS)
    console.log('🔐 Calling create-leader-assessment edge function...');
    const { data: assessmentResult, error: assessmentError } = await invokeEdgeFunction(
      'create-leader-assessment',
      {
        contactData,
        assessmentData,
        deepProfileData,
        sessionId,
        source,
        benchmarkScore,
        benchmarkTier,
      },
      { logPrefix: '🔐', silent: false }
    );

    if (assessmentError || !assessmentResult?.success || !assessmentResult?.assessmentId) {
      throw new Error('Failed to create assessment: ' + (assessmentError?.message || 'Unknown error'));
    }

    const assessmentId = assessmentResult.assessmentId;
    const leaderId = assessmentResult.leaderId;
    console.log('✅ Assessment record created via edge function:', assessmentId);

    // Step 4: Store dimension scores
    await storeDimensionScores(assessmentId, assessmentData);

    // Step 5: Call edge functions sequentially
    console.log('🔄 Calling edge functions...');

    // 5a: Generate personalized insights (includes first moves now)
    const { data: insightsData, error: insightsError } = await invokeEdgeFunction(
      'generate-personalized-insights',
      {
        assessmentData,
        contactData,
        deepProfileData,
      },
      { logPrefix: '🧠', silent: false }
    );

    if (insightsError) {
      console.error('⚠️ Insights generation failed:', insightsError);
    } else {
      console.log('✅ Personalized insights generated');
      // Store first moves if returned
      if (insightsData?.personalizedInsights?.firstMoves) {
        await storeFirstMoves(assessmentId, insightsData.personalizedInsights.firstMoves);
      }
    }

    // 5b: Generate prompt library
    const { data: promptData, error: promptError } = await invokeEdgeFunction(
      'generate-prompt-library',
      {
        assessmentData,
        contactData,
        deepProfileData,
      },
      { logPrefix: '📚', silent: false }
    );

    if (promptError) {
      console.error('⚠️ Prompt library generation failed:', promptError);
    } else {
      console.log('✅ Prompt library generated');
      // Store prompt sets if returned
      if (promptData?.promptSets) {
        await storePromptSets(assessmentId, promptData.promptSets);
      }
    }

    // 5c: Compute risk signals
    const { data: riskData, error: riskError } = await invokeEdgeFunction(
      'compute-risk-signals',
      {
        assessment_id: assessmentId,
        assessment_data: assessmentData,
        profile_data: deepProfileData,
      },
      { logPrefix: '⚠️', silent: false }
    );

    if (riskError) {
      console.error('⚠️ Risk signals computation failed:', riskError);
    } else {
      console.log('✅ Risk signals computed:', riskData?.count || 0);
    }

    // 5d: Compute tensions
    const dimensionScoresForTensions = convertToDimensionScores(assessmentData);
    const { data: tensionData, error: tensionError } = await invokeEdgeFunction(
      'compute-tensions',
      {
        assessment_id: assessmentId,
        dimension_scores: dimensionScoresForTensions,
        assessment_data: assessmentData,
        profile_data: deepProfileData,
      },
      { logPrefix: '⚡', silent: false }
    );

    if (tensionError) {
      console.error('⚠️ Tensions computation failed:', tensionError);
    } else {
      console.log('✅ Tensions computed:', tensionData?.count || 0);
    }

    // 5e: Derive org scenarios
    const { data: scenarioData, error: scenarioError } = await invokeEdgeFunction(
      'derive-org-scenarios',
      {
        assessment_id: assessmentId,
        dimension_scores: dimensionScoresForTensions,
        risk_signals: riskData?.risks || [],
        tensions: tensionData?.tensions || [],
      },
      { logPrefix: '🎯', silent: false }
    );

    if (scenarioError) {
      console.error('⚠️ Org scenarios derivation failed:', scenarioError);
    } else {
      console.log('✅ Org scenarios derived:', scenarioData?.count || 0);
    }

    console.log('🎉 V2 assessment orchestration complete!');

    return {
      success: true,
      assessmentId,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Assessment orchestration failed:', error);
    
    // Throw error to surface to UI instead of silent failure
    throw new Error(`Assessment orchestration failed: ${errorMessage}. Please try again or contact support.`);
  }
}

function calculateBenchmarkScore(assessmentData: any): number {
  // Calculate aggregate score from assessment responses
  const responses = Object.values(assessmentData).filter(v => typeof v === 'number');
  if (responses.length === 0) return 0;
  
  const sum = responses.reduce((acc: number, val: any) => acc + val, 0);
  return Math.round((sum / (responses.length * 5)) * 100);
}

function calculateBenchmarkTier(score: number): string {
  if (score >= 75) return 'AI-Orchestrator';
  if (score >= 60) return 'AI-Confident';
  if (score >= 40) return 'AI-Aware';
  return 'AI-Emerging';
}

async function storeDimensionScores(assessmentId: string, assessmentData: any) {
  const dimensions = [
    { key: 'ai_fluency', score: assessmentData.aiFluencyScore || 0 },
    { key: 'decision_velocity', score: assessmentData.decisionVelocityScore || 0 },
    { key: 'experimentation_cadence', score: assessmentData.experimentationScore || 0 },
    { key: 'delegation_augmentation', score: assessmentData.delegationScore || 0 },
    { key: 'alignment_communication', score: assessmentData.alignmentScore || 0 },
    { key: 'risk_governance', score: assessmentData.riskGovernanceScore || 0 },
  ];

  for (const dim of dimensions) {
    const tier = calculateBenchmarkTier(dim.score);
    
    await supabase
      .from('leader_dimension_scores')
      .insert({
        assessment_id: assessmentId,
        dimension_key: dim.key,
        score_numeric: dim.score,
        dimension_tier: tier,
        explanation: `Score: ${dim.score}/100`,
      });
  }
}

async function storeFirstMoves(assessmentId: string, firstMoves: any) {
  const moves = [
    { move_number: 1, content: firstMoves.move1 },
    { move_number: 2, content: firstMoves.move2 },
    { move_number: 3, content: firstMoves.move3 },
  ];

  for (const move of moves) {
    if (move.content) {
      await supabase
        .from('leader_first_moves')
        .insert({
          assessment_id: assessmentId,
          move_number: move.move_number,
          content: move.content,
        });
    }
  }
}

async function storePromptSets(assessmentId: string, promptSets: any[]) {
  for (let i = 0; i < promptSets.length; i++) {
    const set = promptSets[i];
    await supabase
      .from('leader_prompt_sets')
      .insert({
        assessment_id: assessmentId,
        category_key: set.category_key || `category_${i}`,
        title: set.title,
        description: set.description,
        what_its_for: set.what_its_for,
        when_to_use: set.when_to_use,
        how_to_use: set.how_to_use,
        prompts_json: set.prompts || [],
        priority_rank: i + 1,
      });
  }
}

function convertToDimensionScores(assessmentData: any): any {
  return {
    ai_fluency: assessmentData.aiFluencyScore || 0,
    decision_velocity: assessmentData.decisionVelocityScore || 0,
    experimentation_cadence: assessmentData.experimentationScore || 0,
    delegation_augmentation: assessmentData.delegationScore || 0,
    alignment_communication: assessmentData.alignmentScore || 0,
    risk_governance: assessmentData.riskGovernanceScore || 0,
  };
}
