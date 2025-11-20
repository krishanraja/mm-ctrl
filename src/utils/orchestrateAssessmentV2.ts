import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from './edgeFunctionClient';
import { 
  applyBehavioralAdjustments, 
  calculateExecutionGaps 
} from './behavioralScoring';
import { storeAssessmentEvents, storeBehavioralAdjustments } from './storeAssessmentEvents';
import { calculateAILearningStyle } from './aiLearningStyle';

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

    // Step 1: Calculate benchmark score and tier with behavioral adjustments
    const baseScores = {
      aiFluencyScore: assessmentData.aiFluencyScore || 0,
      decisionVelocityScore: assessmentData.decisionVelocityScore || 0,
      experimentationScore: assessmentData.experimentationScore || 0,
      delegationScore: assessmentData.delegationScore || 0,
      alignmentScore: assessmentData.alignmentScore || 0,
      riskGovernanceScore: assessmentData.riskGovernanceScore || 0,
    };
    
    const adjustedScores = applyBehavioralAdjustments(baseScores, deepProfileData);
    const executionGaps = calculateExecutionGaps(baseScores, adjustedScores, deepProfileData);
    
    // Use adjusted scores for final assessment
    const enhancedAssessmentData = { ...assessmentData, ...adjustedScores };
    
    const benchmarkScore = calculateBenchmarkScore(enhancedAssessmentData);
    console.log('📊 Base score:', calculateBenchmarkScore(assessmentData));
    console.log('📊 Adjusted score:', benchmarkScore);
    console.log('📊 Execution gaps:', executionGaps);
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

    // Step 4: Store dimension scores (with adjusted values)
    await storeDimensionScores(assessmentId, enhancedAssessmentData);
    
    // Step 4b: Store execution gaps as insights
    if (executionGaps.length > 0) {
      await storeExecutionGaps(assessmentId, executionGaps);
    }

    // Step 5: Call edge functions sequentially
    console.log('🔄 Calling edge functions...');

    // Phase 1: Store assessment events before generating insights
    console.log('💾 Storing assessment events for full traceability...');
    await storeAssessmentEvents(assessmentId, leaderId, sessionId, assessmentData, deepProfileData, source);
    
    // Phase 3: Store behavioral adjustments for transparency
    if (deepProfileData) {
      await storeBehavioralAdjustments(assessmentId, deepProfileData, adjustedScores, baseScores);
    }
    
    // 5a: Generate personalized insights (includes first moves now)
    const { data: insightsData, error: insightsError } = await invokeEdgeFunction(
      'generate-personalized-insights',
      {
        assessmentData,
        contactData,
        deepProfileData,
        assessmentId,
        leaderId,
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
    const { data: libraryData, error: libraryError } = await invokeEdgeFunction(
      'generate-prompt-library',
      {
        assessmentId,
        sessionId,
        userId: leaderId,
        contactData,
        assessmentData,
        profileData: deepProfileData,
        leaderId,
      },
      { logPrefix: '📚', silent: false }
    );
    if (libraryError) {
      console.error('⚠️ Prompt library generation failed:', libraryError);
    } else {
      console.log('✅ Prompt library generated');
    }

    // 5c-5e: Run non-critical computations in parallel with timeout protection
    console.log('⚙️ Running parallel computations (risk signals, tensions, org scenarios)...');
    
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
        )
      ]);
    };

    const dimensionScores = convertToDimensionScores(assessmentData);

    const [riskResult, tensionResult, scenarioResult] = await Promise.allSettled([
      withTimeout(
        invokeEdgeFunction('compute-risk-signals', {
          assessment_id: assessmentId,
          assessment_data: assessmentData,
          profile_data: deepProfileData,
        }, { logPrefix: '⚠️', silent: false }),
        15000,
        'Risk signals'
      ),
      withTimeout(
        invokeEdgeFunction('compute-tensions', {
          assessment_id: assessmentId,
          dimension_scores: dimensionScores,
          assessment_data: assessmentData,
          profile_data: deepProfileData,
        }, { logPrefix: '⚡', silent: false }),
        15000,
        'Tensions'
      ),
      withTimeout(
        invokeEdgeFunction('derive-org-scenarios', {
          assessment_id: assessmentId,
          dimension_scores: dimensionScores,
          risk_signals: [],
          tensions: [],
        }, { logPrefix: '🎯', silent: false }),
        15000,
        'Org scenarios'
      )
    ]);

    // Log results with graceful degradation
    if (riskResult.status === 'fulfilled' && riskResult.value.data) {
      console.log(`✅ Risk signals computed: ${riskResult.value.data?.count || 0}`);
    } else {
      console.warn('⚠️ Risk signals failed:', riskResult.status === 'rejected' ? riskResult.reason : riskResult.value.error);
    }

    if (tensionResult.status === 'fulfilled' && tensionResult.value.data) {
      console.log(`✅ Tensions computed: ${tensionResult.value.data?.count || 0}`);
    } else {
      console.warn('⚠️ Tensions failed:', tensionResult.status === 'rejected' ? tensionResult.reason : tensionResult.value.error);
    }

    if (scenarioResult.status === 'fulfilled' && scenarioResult.value.data) {
      console.log(`✅ Org scenarios derived: ${scenarioResult.value.data?.count || 0}`);
    } else {
      console.warn('⚠️ Org scenarios failed:', scenarioResult.status === 'rejected' ? scenarioResult.reason : scenarioResult.value.error);
    }

    // Phase 3: Store index participant data with structured fields
    const learningStyle = calculateAILearningStyle(assessmentData);
    try {
      await supabase.from('index_participant_data').insert({
        session_id: sessionId,
        readiness_score: benchmarkScore,
        tier: benchmarkTier,
        dimension_scores: assessmentData,
        deep_profile_data: deepProfileData,
        completed_at: new Date().toISOString(),
        industry: contactData.industry,
        company_size: contactData.companySize,
        role_title: contactData.role,
        ai_learning_style: learningStyle,
        time_waste_pct: deepProfileData?.timeWaste || null,
        delegation_tasks_count: deepProfileData?.delegationTasks || null,
        stakeholder_count: deepProfileData?.stakeholderNeeds || null,
        urgency_level: deepProfileData?.urgency || null,
        primary_bottleneck: deepProfileData?.primaryBottleneck || null
      });
      console.log('✅ Index participant data stored with structured behavioral fields');
    } catch (indexError) {
      console.error('⚠️ Failed to store index data:', indexError);
    }

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
  // V2 scores are already normalized to 0-100, so just average them
  const responses = Object.values(assessmentData).filter(v => typeof v === 'number');
  if (responses.length === 0) return 0;
  
  const sum = responses.reduce((acc: number, val: any) => acc + val, 0);
  return Math.round(sum / responses.length);
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
  console.log('📝 Storing first moves for assessment:', assessmentId);
  console.log('📊 First moves data:', firstMoves);
  
  // Handle both possible structures: { move1, move2, move3 } or array format
  let moves;
  
  if (Array.isArray(firstMoves)) {
    // Array format
    moves = firstMoves.map((content, index) => ({
      move_number: index + 1,
      content: content
    }));
  } else if (firstMoves && typeof firstMoves === 'object') {
    // Object format { move1, move2, move3 }
    moves = [
      { move_number: 1, content: firstMoves.move1 },
      { move_number: 2, content: firstMoves.move2 },
      { move_number: 3, content: firstMoves.move3 },
    ];
  } else {
    console.error('❌ Invalid first moves format:', firstMoves);
    return;
  }

  for (const move of moves) {
    if (move.content && typeof move.content === 'string' && move.content.trim()) {
      console.log(`✅ Inserting move ${move.move_number}:`, move.content.substring(0, 50) + '...');
      await supabase
        .from('leader_first_moves')
        .insert({
          assessment_id: assessmentId,
          move_number: move.move_number,
          content: move.content,
        });
    } else {
      console.warn(`⚠️ Skipping empty move ${move.move_number}`);
    }
  }
  
  console.log('✅ First moves stored successfully');
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

async function storeExecutionGaps(assessmentId: string, gaps: any[]) {
  for (const gap of gaps) {
    await supabase
      .from('leader_risk_signals')
      .insert({
        assessment_id: assessmentId,
        risk_key: `execution_gap_${gap.dimension.toLowerCase().replace(/\s+/g, '_')}`,
        level: Math.abs(gap.gapSize) > 15 ? 'high' : 'medium',
        description: `${gap.insight}\n\n${gap.recommendation}`,
        priority_rank: Math.abs(gap.gapSize),
      });
  }
}
