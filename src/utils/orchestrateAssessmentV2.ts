import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from './edgeFunctionClient';
import { 
  applyBehavioralAdjustments, 
  calculateExecutionGaps 
} from './behavioralScoring';
import { storeAssessmentEvents, storeBehavioralAdjustments } from './storeAssessmentEvents';
import { determineAILearningStyle } from './aiLearningStyle';

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
      // CP4: Store fallback insights so results page always shows something
      await storeFallbackInsights(assessmentId, contactData, assessmentData, benchmarkScore, benchmarkTier);
      
      // CP3: Log error to generation_status
      await supabase
        .from('leader_assessments')
        .update({
          generation_status: {
            insights_generated: false,
            prompts_generated: false,
            risks_computed: false,
            tensions_computed: false,
            scenarios_generated: false,
            first_moves_generated: false,
            has_fallback_content: true,
            last_updated: new Date().toISOString(),
            error_log: [{ phase: 'insights_generated', error: insightsError.message, timestamp: new Date().toISOString() }]
          }
        })
        .eq('id', assessmentId);
    } else {
      console.log('✅ Personalized insights generated');
      // Status flag now set by edge function after DB writes
      
      // Store first moves if returned
      if (insightsData?.personalizedInsights?.firstMoves) {
        await storeFirstMoves(assessmentId, insightsData.personalizedInsights.firstMoves);
      }
    }

    // 5b: Generate prompt library
    // CP4: Fix foreign key constraint - pass userId as null, not leaderId
    const { data: libraryData, error: libraryError } = await invokeEdgeFunction(
      'generate-prompt-library',
      {
        assessmentId,
        sessionId,
        userId: null,  // CP4: Don't pass leaderId as userId - causes FK violation
        contactData,
        assessmentData,
        profileData: deepProfileData,
        leaderId,
      },
      { logPrefix: '📚', silent: false }
    );
    if (libraryError) {
      console.error('⚠️ Prompt library generation failed:', libraryError);
      // CP4: Store fallback prompts so results page always shows something
      await storeFallbackPrompts(assessmentId, contactData, assessmentData, deepProfileData);
      
      // CP3: Log error to generation_status
      const { data: currentStatus } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', assessmentId)
        .single();
      
      const existingStatus = (currentStatus?.generation_status as any) || {};
      const errorLog = existingStatus.error_log || [];
      await supabase
        .from('leader_assessments')
        .update({
          generation_status: {
            ...existingStatus,
            prompts_generated: false,
            has_fallback_content: true,
            last_updated: new Date().toISOString(),
            error_log: [...errorLog, 
              { phase: 'prompts_generated', error: libraryError.message, timestamp: new Date().toISOString() }]
          }
        })
        .eq('id', assessmentId);
    } else {
      console.log('✅ Prompt library generated');
      // Status flag now set by edge function after DB writes
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
        60000,  // Increased from 15s to 60s
        'Risk signals'
      ),
      withTimeout(
        invokeEdgeFunction('compute-tensions', {
          assessment_id: assessmentId,
          dimension_scores: dimensionScores,
          assessment_data: assessmentData,
          profile_data: deepProfileData,
        }, { logPrefix: '⚡', silent: false }),
        60000,  // Increased from 15s to 60s
        'Tensions'
      ),
      withTimeout(
        invokeEdgeFunction('derive-org-scenarios', {
          assessment_id: assessmentId,
          dimension_scores: dimensionScores,
          risk_signals: [],
          tensions: [],
        }, { logPrefix: '🎯', silent: false }),
        60000,  // Increased from 15s to 60s
        'Org scenarios'
      )
    ]);

    // Log results with graceful degradation + explicit error logging to generation_status
    if (riskResult.status === 'fulfilled' && riskResult.value.data) {
      console.log(`✅ Risk signals computed: ${riskResult.value.data?.count || 0}`);
    } else {
      const errorMsg = riskResult.status === 'rejected' ? riskResult.reason?.message : riskResult.value.error?.message;
      console.warn('⚠️ Risk signals failed:', errorMsg);
      
      // Log error to generation_status
      const { data: currentStatus } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', assessmentId)
        .single();
      
      const existingStatus = (currentStatus?.generation_status as any) || {};
      const errorLog = existingStatus.error_log || [];
      await supabase
        .from('leader_assessments')
        .update({
          generation_status: {
            ...existingStatus,
            risks_computed: false,
            error_log: [...errorLog, { phase: 'risks_computed', error: errorMsg, timestamp: new Date().toISOString() }]
          }
        })
        .eq('id', assessmentId);
    }

    if (tensionResult.status === 'fulfilled' && tensionResult.value.data) {
      console.log(`✅ Tensions computed: ${tensionResult.value.data?.count || 0}`);
    } else {
      const errorMsg = tensionResult.status === 'rejected' ? tensionResult.reason?.message : tensionResult.value.error?.message;
      console.warn('⚠️ Tensions failed:', errorMsg);
      
      // Log error to generation_status
      const { data: currentStatus } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', assessmentId)
        .single();
      
      const existingStatus = (currentStatus?.generation_status as any) || {};
      const errorLog = existingStatus.error_log || [];
      await supabase
        .from('leader_assessments')
        .update({
          generation_status: {
            ...existingStatus,
            tensions_computed: false,
            error_log: [...errorLog, { phase: 'tensions_computed', error: errorMsg, timestamp: new Date().toISOString() }]
          }
        })
        .eq('id', assessmentId);
    }

    if (scenarioResult.status === 'fulfilled' && scenarioResult.value.data) {
      console.log(`✅ Org scenarios derived: ${scenarioResult.value.data?.count || 0}`);
    } else {
      const errorMsg = scenarioResult.status === 'rejected' ? scenarioResult.reason?.message : scenarioResult.value.error?.message;
      console.warn('⚠️ Org scenarios failed:', errorMsg);
      
      // Log error to generation_status
      const { data: currentStatus } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', assessmentId)
        .single();
      
      const existingStatus = (currentStatus?.generation_status as any) || {};
      const errorLog = existingStatus.error_log || [];
      await supabase
        .from('leader_assessments')
        .update({
          generation_status: {
            ...existingStatus,
            scenarios_generated: false,
            error_log: [...errorLog, { phase: 'scenarios_generated', error: errorMsg, timestamp: new Date().toISOString() }]
          }
        })
        .eq('id', assessmentId);
    }

    // Phase 3: Store index participant data with structured fields
    const learningStyle = determineAILearningStyle(deepProfileData);
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

// CP4: Fallback content generators
async function storeFallbackInsights(
  assessmentId: string,
  contactData: any,
  assessmentData: any,
  benchmarkScore: number,
  benchmarkTier: string
) {
  console.log('📦 CP4: Generating fallback insights (LLM unavailable)');
  
  const tierMessages = {
    'AI-Orchestrator': {
      edge: 'Strong AI fluency and strategic alignment position you to drive organization-wide transformation.',
      risk: 'High capability brings visibility—ensure governance frameworks scale with adoption.',
      nextMove: 'Focus on knowledge transfer: document your AI decision frameworks to enable team autonomy.'
    },
    'AI-Confident': {
      edge: 'Solid AI fundamentals and growing team confidence create momentum for expansion.',
      risk: 'Mid-tier adoption can create silos—prioritize cross-functional alignment.',
      nextMove: 'Identify your highest-impact AI use case and run a 30-day sprint with measurable KPIs.'
    },
    'AI-Aware': {
      edge: 'Early awareness and willingness to experiment provide a foundation for growth.',
      risk: 'Limited experience may lead to missed opportunities—invest in structured learning.',
      nextMove: 'Start with daily AI tools (ChatGPT, Claude) for 1-2 specific tasks to build confidence.'
    },
    'AI-Emerging': {
      edge: 'Recognition of AI importance is the first step—early adopters gain competitive advantage.',
      risk: 'Low literacy increases risk of poor tool selection or abandoned pilots.',
      nextMove: 'Complete a 2-week AI fundamentals course to understand capabilities before implementation.'
    }
  };
  
  const tierAdvice = tierMessages[benchmarkTier as keyof typeof tierMessages] || tierMessages['AI-Aware'];
  
  const fallbackFirstMoves = [
    `Schedule 3 conversations with key stakeholders (${contactData.department || 'team leads'}) to align on AI priorities and concerns.`,
    `Identify 2-3 repetitive tasks consuming ${contactData.timeWaste || 20}% of your team's time for AI automation evaluation.`,
    `Create a shared AI experimentation sandbox where team members can safely test tools without compliance risks.`
  ];
  
  // Store first moves
  for (let i = 0; i < fallbackFirstMoves.length; i++) {
    await supabase.from('leader_first_moves').insert({
      assessment_id: assessmentId,
      move_number: i + 1,
      content: fallbackFirstMoves[i]
    });
  }
  
  console.log('✅ CP4: Fallback insights stored successfully');
}

async function storeFallbackPrompts(
  assessmentId: string,
  contactData: any,
  assessmentData: any,
  deepProfileData: any
) {
  console.log('📦 CP4: Generating fallback prompts (LLM unavailable)');
  
  const role = contactData.roleTitle || contactData.department || 'Leader';
  const focus = contactData.primaryFocus || 'operational efficiency';
  
  const fallbackPrompts = [
    {
      category_key: 'strategic_planning',
      title: 'Strategic AI Opportunity Scanner',
      description: 'Identify high-impact AI use cases across your organization',
      what_its_for: 'Finding AI opportunities that align with business objectives',
      when_to_use: 'Quarterly planning, budget allocation, or when initiating AI transformation',
      how_to_use: 'Run this prompt monthly to identify emerging opportunities',
      prompts_json: [
        `I'm a ${role} focused on ${focus}. Analyze my department's workflows and identify the top 3 AI automation opportunities that would save the most time or improve quality. For each: (1) Estimate time savings, (2) Identify required tools, (3) List implementation risks.`,
        `As a ${role}, help me prioritize AI investments. Compare: (1) AI-powered analytics for decision-making, (2) Process automation for repetitive tasks, (3) AI assistants for knowledge work. Rank by ROI potential for my team size and industry.`
      ],
      priority_rank: 1
    },
    {
      category_key: 'delegation_automation',
      title: 'Task Delegation & AI Augmentation',
      description: 'Identify tasks to delegate to AI vs humans',
      what_its_for: 'Optimizing how you allocate human and AI capacity',
      when_to_use: 'Weekly planning, when feeling overwhelmed, or scaling team',
      how_to_use: 'Use this prompt every Monday to optimize your week',
      prompts_json: [
        `Review my calendar for this week. For each meeting/task: (1) Can AI prepare materials? (2) Can AI automate follow-up? (3) Should I delegate to a human instead? Prioritize by time saved.`,
        `I spend ${deepProfileData?.timeWaste || 30}% of time on non-critical work. List these tasks: ${deepProfileData?.timeWasteExamples || 'status reports, meeting prep, data analysis'}. For each, provide: (1) Specific AI tool to use, (2) Exact prompt template, (3) Quality check process.`
      ],
      priority_rank: 2
    },
    {
      category_key: 'stakeholder_communication',
      title: 'Executive Communication Templates',
      description: 'AI-powered messaging for key stakeholders',
      what_its_for: 'Crafting clear, persuasive communication efficiently',
      when_to_use: 'Board updates, investor communications, all-hands meetings',
      how_to_use: 'Adapt these templates for your specific situation',
      prompts_json: [
        `Draft a ${contactData.timeline || '90-day'} AI transformation update for ${deepProfileData?.stakeholders?.join(', ') || 'executive team'}. Include: (1) Progress metrics, (2) Early wins, (3) Challenges faced, (4) Resource needs. Tone: confident but realistic.`,
        `Create talking points for discussing AI adoption risks with ${deepProfileData?.stakeholders?.[0] || 'the board'}. Address: (1) Data security, (2) Job displacement concerns, (3) Cost overruns, (4) Change resistance. Provide mitigation strategies for each.`
      ],
      priority_rank: 3
    }
  ];
  
  for (const prompt of fallbackPrompts) {
    await supabase.from('leader_prompt_sets').insert({
      assessment_id: assessmentId,
      ...prompt
    });
  }
  
  console.log('✅ CP4: Fallback prompts stored successfully');
}
