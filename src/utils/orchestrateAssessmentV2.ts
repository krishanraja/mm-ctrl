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

    // Step 1: Create or get leader record
    const { data: existingLeader } = await supabase
      .from('leaders')
      .select('*')
      .eq('email', contactData.email)
      .single();

    let leaderId: string;

    if (existingLeader) {
      leaderId = existingLeader.id;
      
      // Update leader details
      await supabase
        .from('leaders')
        .update({
          name: contactData.fullName,
          role: contactData.roleTitle,
          company: contactData.companyName,
          company_size_band: contactData.companySize,
          primary_focus: contactData.primaryFocus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leaderId);
    } else {
      const { data: newLeader, error: leaderError } = await supabase
        .from('leaders')
        .insert({
          email: contactData.email,
          name: contactData.fullName,
          role: contactData.roleTitle,
          company: contactData.companyName,
          company_size_band: contactData.companySize,
          primary_focus: contactData.primaryFocus,
        })
        .select()
        .single();

      if (leaderError || !newLeader) {
        throw new Error('Failed to create leader record: ' + leaderError?.message);
      }

      leaderId = newLeader.id;
    }

    console.log('✅ Leader record ready:', leaderId);

    // Step 2: Calculate benchmark score and tier
    const benchmarkScore = calculateBenchmarkScore(assessmentData);
    const benchmarkTier = calculateBenchmarkTier(benchmarkScore);

    // Step 3: Create leader_assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('leader_assessments')
      .insert({
        leader_id: leaderId,
        source,
        benchmark_score: benchmarkScore,
        benchmark_tier: benchmarkTier,
        learning_style: assessmentData.learningStyle || null,
        has_deep_profile: !!deepProfileData,
        has_full_diagnostic: false, // Start as free
        session_id: sessionId,
      })
      .select()
      .single();

    if (assessmentError || !assessment) {
      throw new Error('Failed to create assessment: ' + assessmentError?.message);
    }

    const assessmentId = assessment.id;
    console.log('✅ Assessment record created:', assessmentId);

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
    console.error('❌ Assessment orchestration failed:', error);
    return {
      success: false,
      error: error.message,
    };
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
