/**
 * Assessment Pipeline Orchestrator
 * 
 * Purpose: Orchestrates the full assessment pipeline from submission to results
 * Dependencies: Supabase client, ai-generate edge function, create-leader-assessment edge function
 * 
 * Flow: Create assessment → Generate AI content → Store to all tables → Update status flags
 * 
 * Returns: { success: boolean, assessmentId: string | null, source: string, durationMs: number, error?: string }
 * 
 * ANTI-FRAGILE DESIGN:
 * - All DB inserts use correct column names matching schema
 * - Progress callback for real-time UI updates
 * - Safe defaults and guards at every step
 * - Detailed error logging for debugging
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  safeInsertWithRetry, 
  parallelInsert, 
  validateDimensionScore,
  sanitizeText,
  validateRecords
} from './databaseHelpers';

// Progress callback type for real-time UI updates
export type ProgressCallback = (phase: string, percentage: number, message: string) => void;

// PHASE 3: Valid dimension keys per database schema CHECK constraint
const VALID_DIMENSION_KEYS = ['ai_fluency', 'decision_velocity', 'experimentation_cadence', 'delegation_augmentation', 'alignment_communication', 'risk_governance'] as const;

// PHASE 3: Map AI-generated dimension keys to schema-valid keys
const dimensionKeyMap: Record<string, string> = {
  // AI variations → valid schema keys
  'ai_readiness': 'ai_fluency',
  'ai_literacy': 'ai_fluency',
  'ai_awareness': 'ai_fluency',
  'decision_making': 'decision_velocity',
  'decisions': 'decision_velocity',
  'experimentation': 'experimentation_cadence',
  'innovation': 'experimentation_cadence',
  'team_capability': 'delegation_augmentation',
  'delegation': 'delegation_augmentation',
  'team_empowerment': 'delegation_augmentation',
  'value_clarity': 'alignment_communication',
  'alignment': 'alignment_communication',
  'communication': 'alignment_communication',
  'governance_maturity': 'risk_governance',
  'risk_management': 'risk_governance',
  'governance': 'risk_governance',
  // Direct matches
  'ai_fluency': 'ai_fluency',
  'decision_velocity': 'decision_velocity',
  'experimentation_cadence': 'experimentation_cadence',
  'delegation_augmentation': 'delegation_augmentation',
  'alignment_communication': 'alignment_communication',
  'risk_governance': 'risk_governance',
};

// PHASE 3: Valid tier labels per database schema CHECK constraint
const VALID_TIERS = ['AI-Emerging', 'AI-Aware', 'AI-Confident', 'AI-Orchestrator'] as const;

// PHASE 3: Map AI-generated tier labels to schema-valid tiers
const tierMap: Record<string, string> = {
  'emerging': 'AI-Emerging',
  'ai-emerging': 'AI-Emerging',
  'aware': 'AI-Aware',
  'ai-aware': 'AI-Aware',
  'confident': 'AI-Confident',
  'ai-confident': 'AI-Confident',
  'orchestrator': 'AI-Orchestrator',
  'ai-orchestrator': 'AI-Orchestrator',
  'leading': 'AI-Orchestrator',
  'advancing': 'AI-Confident',
  'establishing': 'AI-Aware',
  'beginner': 'AI-Emerging',
  'intermediate': 'AI-Aware',
  'advanced': 'AI-Confident',
  'expert': 'AI-Orchestrator',
};

// Helper to get valid dimension key with fallback
function getValidDimensionKey(key: string | undefined, idx: number): string {
  if (!key) return VALID_DIMENSION_KEYS[idx % VALID_DIMENSION_KEYS.length];
  const normalized = key.toLowerCase().replace(/[^a-z_]/g, '_');
  return dimensionKeyMap[normalized] || VALID_DIMENSION_KEYS[idx % VALID_DIMENSION_KEYS.length];
}

// Helper to get valid tier with fallback
function getValidTier(tier: string | undefined): string {
  if (!tier) return 'AI-Emerging';
  const normalized = tier.toLowerCase().replace(/[^a-z-]/g, '');
  return tierMap[normalized] || 'AI-Emerging';
}

// Legacy safe insert (kept for backward compatibility, now uses retry mechanism)
async function safeInsert(
  table: 'leader_dimension_scores' | 'leader_tensions' | 'leader_risk_signals' | 'leader_org_scenarios' | 'leader_prompt_sets' | 'leader_first_moves' | 'assessment_events',
  records: any[], 
  logPrefix: string = ''
): Promise<{ success: boolean; count: number; error?: string }> {
  return safeInsertWithRetry(table, records, { logPrefix });
}

// Validate AI content structure
function validateAIContent(data: any): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!data) return { valid: false, missing: ['data is null'] };
  if (!Array.isArray(data.dimensionScores) || data.dimensionScores.length === 0) {
    missing.push('dimensionScores');
  }
  if (!Array.isArray(data.tensions)) missing.push('tensions');
  if (!Array.isArray(data.risks)) missing.push('risks');
  if (!Array.isArray(data.prompts)) missing.push('prompts');
  
  return { valid: missing.length === 0, missing };
}

// FALLBACK: Compute dimension scores directly from quiz answers when AI fails
// Now includes score variance for nuanced, non-round numbers
function computeDimensionScoresFromQuiz(
  assessmentData: any,
  responseTimes: number[] = [],
  secondaryAnswers: Record<string, string> = {}
): any[] {
  console.log('🔧 Computing fallback dimension scores from quiz data:', assessmentData);
  
  // Import score variance utility dynamically to avoid circular deps
  const { applyScoreVariance } = require('@/utils/scoreVariance');
  
  // Map assessment data keys to dimension keys
  const dimensionMapping = {
    aiFluencyScore: { key: 'ai_fluency', label: 'AI Fluency' },
    experimentationScore: { key: 'experimentation_cadence', label: 'Experimentation Cadence' },
    alignmentScore: { key: 'alignment_communication', label: 'Alignment & Communication' },
    decisionVelocityScore: { key: 'decision_velocity', label: 'Decision Velocity' },
    delegationScore: { key: 'delegation_augmentation', label: 'Delegation & Augmentation' },
    riskGovernanceScore: { key: 'risk_governance', label: 'Risk & Governance' }
  };
  
  const scores: any[] = [];
  
  for (const [assessmentKey, config] of Object.entries(dimensionMapping)) {
    const baseScore = typeof assessmentData[assessmentKey] === 'number' 
      ? assessmentData[assessmentKey] 
      : 0;
    
    // Apply variance to get nuanced, non-round score
    const finalScore = applyScoreVariance(
      baseScore,
      config.key,
      responseTimes,
      secondaryAnswers
    );
    
    // Determine tier based on final score
    let tier = 'AI-Emerging';
    if (finalScore >= 80) tier = 'AI-Orchestrator';
    else if (finalScore >= 60) tier = 'AI-Confident';
    else if (finalScore >= 40) tier = 'AI-Aware';
    
    scores.push({
      key: config.key,
      score: finalScore,
      label: tier,
      summary: `Your ${config.label} score reflects your assessment responses and decision-making patterns.`
    });
  }
  
  console.log('✅ Fallback dimension scores computed with variance:', scores);
  return scores;
}

// Helper: Format dimension key to readable name
function formatDimensionName(key: string): string {
  const dimensionLabels: Record<string, string> = {
    'ai_fluency': 'AI Fluency',
    'decision_velocity': 'Decision Velocity',
    'experimentation_cadence': 'Experimentation Cadence',
    'delegation_augmentation': 'Delegation',
    'alignment_communication': 'Alignment & Communication',
    'risk_governance': 'Risk Governance'
  };
  return dimensionLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper: Get specific consequence by dimension
function getDimensionConsequence(key: string, score: number, role: string): string {
  const consequences: Record<string, string> = {
    'ai_fluency': `you're flying blind on AI capabilities. Your competitors who score 70+ are already automating what takes your team hours.`,
    'decision_velocity': `decisions that should take 1 day take 5. Your team is waiting on you, and opportunities are passing.`,
    'experimentation_cadence': `you're not testing enough to find what works. Leaders who experiment 3x more find winning AI use cases 4x faster.`,
    'delegation_augmentation': `you're doing work your direct reports should own. Every hour on automatable tasks costs you strategic capacity.`,
    'alignment_communication': `your team doesn't know where you're going with AI. Misalignment here means wasted pilot projects and skeptical stakeholders.`,
    'risk_governance': `your team is likely using AI tools you don't know about. Shadow AI becomes a compliance problem fast.`
  };
  return consequences[key] || `this gap limits your effectiveness as ${role || 'a leader'}.`;
}

// FALLBACK: Generate default tensions from dimension scores with sharp, specific language
function generateDefaultTensions(dimensionScores: any[], contactData?: any): any[] {
  const tensions: any[] = [];
  const sortedScores = [...dimensionScores].sort((a, b) => (a.score || 0) - (b.score || 0));
  const role = contactData?.role || 'Senior Leader';
  
  if (sortedScores.length < 2) {
    return [{
      key: 'general',
      summary: `As a ${role}, your AI leadership assessment reveals specific areas where focused action will drive results.`
    }];
  }
  
  const lowest = sortedScores[0];
  const secondLowest = sortedScores[1];
  const highest = sortedScores[sortedScores.length - 1];
  const secondHighest = sortedScores.length > 2 ? sortedScores[sortedScores.length - 2] : highest;
  
  // Tension 1: Lowest score with specific impact
  tensions.push({
    key: lowest.key || 'general',
    summary: `Your ${lowest.score}/100 in ${formatDimensionName(lowest.key)} is costing you. As ${role}, ${getDimensionConsequence(lowest.key, lowest.score, role)} Meanwhile, your strength in ${formatDimensionName(highest.key)} (${highest.score}/100) is underutilized because this gap holds you back.`
  });
  
  // Tension 2: Contrast between high and low (the contradiction)
  if (highest.score - lowest.score >= 20) {
    tensions.push({
      key: secondLowest.key || 'contrast',
      summary: `You scored ${highest.score}/100 in ${formatDimensionName(highest.key)} but only ${lowest.score}/100 in ${formatDimensionName(lowest.key)}. This ${highest.score - lowest.score}-point gap means you have vision without execution capability—or capability without direction. Pick one to fix first.`
    });
  } else {
    tensions.push({
      key: secondLowest.key || 'consistency',
      summary: `Your scores cluster around ${Math.round(sortedScores.reduce((sum, d) => sum + (d.score || 0), 0) / sortedScores.length)}/100 across dimensions. As ${role}, this consistency means no standout strengths to leverage. Identify one dimension to push to 80+ this quarter.`
    });
  }
  
  // Tension 3: Second lowest with action orientation
  if (sortedScores.length > 2 && secondLowest.score < 60) {
    tensions.push({
      key: secondLowest.key || 'secondary',
      summary: `Your ${secondLowest.score}/100 in ${formatDimensionName(secondLowest.key)} compounds your ${formatDimensionName(lowest.key)} gap. Fixing one without the other won't move the needle. Start with ${formatDimensionName(lowest.score < secondLowest.score ? lowest.key : secondLowest.key)}—it's the bottleneck.`
    });
  }
  
  return tensions;
}

// FALLBACK: Generate default risk signals with specific, quantified language
function generateDefaultRisks(dimensionScores: any[], contactData?: any): any[] {
  const avgScore = dimensionScores.reduce((sum, d) => sum + (d.score || 0), 0) / (dimensionScores.length || 1);
  const role = contactData?.role || 'leader';
  
  // Find specific low-scoring dimensions for targeted risk messaging
  const sortedScores = [...dimensionScores].sort((a, b) => (a.score || 0) - (b.score || 0));
  const lowestDim = sortedScores[0];
  const governanceScore = dimensionScores.find(d => d.key === 'risk_governance')?.score || avgScore;
  const delegationScore = dimensionScores.find(d => d.key === 'delegation_augmentation')?.score || avgScore;
  
  const risks: any[] = [];
  
  // Skills gap risk - tie to specific score
  if (avgScore < 50) {
    risks.push({ 
      key: 'skills_gap', 
      level: 'high', 
      description: `Your ${Math.round(avgScore)}/100 average score means critical AI capabilities are missing. As ${role}, you're making decisions about AI without the fluency to evaluate them. Within 90 days, expect to either over-invest in wrong tools or under-invest in right ones.`
    });
  } else if (avgScore < 65) {
    risks.push({ 
      key: 'skills_gap', 
      level: 'medium', 
      description: `Your ${Math.round(avgScore)}/100 average puts you in the "aware but not fluent" zone. You can discuss AI strategically but may miss practical implementation gaps. Budget 2-4 hours weekly for hands-on practice.`
    });
  }
  
  // Shadow AI risk - tie to governance score
  risks.push({ 
    key: 'shadow_ai', 
    level: governanceScore < 50 ? 'high' : (governanceScore < 65 ? 'medium' : 'low'), 
    description: governanceScore < 50 
      ? `Your ${governanceScore}/100 in governance means your team is likely using AI tools you don't know about. Expect a data handling incident or compliance flag within 60 days unless you audit tool usage this week.`
      : `Your ${governanceScore}/100 governance score provides some protection, but shadow AI still occurs in 73% of organizations at this maturity level. Schedule quarterly tool audits.`
  });
  
  // ROI leakage risk - tie to delegation score
  risks.push({ 
    key: 'roi_leakage', 
    level: delegationScore < 50 ? 'high' : 'medium', 
    description: delegationScore < 50
      ? `Your ${delegationScore}/100 delegation score means AI investments aren't translating to time savings. You're likely doing manually what AI could handle. Potential weekly waste: 5-10 hours of ${role} time.`
      : `At ${delegationScore}/100 delegation, you're capturing some AI ROI but leaving value on the table. Identify 3 recurring tasks to fully automate this month.`
  });
  
  return risks;
}

// FALLBACK: Generate default first moves
function generateDefaultFirstMoves(dimensionScores: any[]): string[] {
  const sortedScores = [...dimensionScores].sort((a, b) => (a.score || 0) - (b.score || 0));
  const lowestDim = sortedScores[0]?.key || 'ai_fluency';
  
  const movesByDimension: Record<string, string[]> = {
    ai_fluency: [
      'Spend 30 minutes daily practicing AI tools in your actual workflow for the next 2 weeks.',
      'Identify 3 repetitive tasks and create AI-assisted workflows for each.',
      'Schedule a team AI tools demo to share what you learn.'
    ],
    decision_velocity: [
      'Use AI to pre-analyze your next strategic decision with a tradeoff matrix.',
      'Create an AI-assisted decision brief template for recurring choices.',
      'Measure and track decision cycle times for your top 5 decision types.'
    ],
    experimentation_cadence: [
      'Launch a 2-week AI pilot on one repetitive process this month.',
      'Document learnings and create a simple test-and-learn framework.',
      'Share pilot results with your team to build momentum.'
    ],
    delegation_augmentation: [
      'Identify your top 3 time-consuming tasks and automate the most repetitive one.',
      'Create standard prompts for common requests you handle repeatedly.',
      'Train one team member to use AI for tasks you currently do manually.'
    ],
    alignment_communication: [
      'Build AI-powered templates for stakeholder updates in their preferred format.',
      'Create a one-page AI strategy document for your leadership team.',
      'Use AI to draft talking points for your next board/investor meeting.'
    ],
    risk_governance: [
      'Draft a one-page AI usage policy covering data sensitivity and tool standards.',
      'Audit current AI tools in use across your team (formal and shadow).',
      'Create an AI risk assessment checklist for new tool adoption.'
    ]
  };
  
  return movesByDimension[lowestDim] || movesByDimension['ai_fluency'];
}

export async function runAssessment(
  contactData: any,
  assessmentData: any,
  deepProfileData: any,
  sessionId: string,
  onProgress?: ProgressCallback
) {
  console.log('🚀 Starting assessment pipeline');
  const startTime = Date.now();
  const progress = onProgress || (() => {});
  let assessmentId: string | null = null;

  try {
    progress('creating', 10, 'Creating your assessment...');

    // Step 1: Create leader assessment record
    const { data: createData, error: createError } = await supabase.functions.invoke(
      'create-leader-assessment',
      {
        body: {
          contactData,
          assessmentData,
          deepProfileData,
          sessionId
        }
      }
    );

    if (createError) {
      console.error('❌ Create assessment error:', createError);
      throw new Error(`Failed to create assessment: ${createError.message}`);
    }
    if (!createData?.assessmentId) {
      throw new Error('No assessment ID returned from create-leader-assessment');
    }

    assessmentId = createData.assessmentId;
    console.log('✅ Assessment created:', assessmentId);
    progress('generating', 25, 'Generating AI insights...');

    // Helper to update generation_status flags
    const updateGenerationFlags = async (updates: Record<string, any>) => {
      try {
        const { data: current } = await supabase
          .from('leader_assessments')
          .select('generation_status')
          .eq('id', assessmentId)
          .single();

        const existingStatus = (current?.generation_status || {}) as any;
        const existingErrors = Array.isArray(existingStatus.error_log) ? existingStatus.error_log : [];
        const newErrors = Array.isArray(updates.error_log) ? updates.error_log : [];
        
        const mergedStatus = {
          ...existingStatus,
          ...updates,
          error_log: [...existingErrors, ...newErrors],
          last_updated: new Date().toISOString()
        };

        const { error } = await supabase
          .from('leader_assessments')
          .update({ generation_status: mergedStatus })
          .eq('id', assessmentId);

        if (error) console.error('⚠️ Failed to update generation flags:', error);
      } catch (e) {
        console.error('❌ Error in updateGenerationFlags:', e);
      }
    };

    // Step 2: Generate AI content (Gemini Plan A, OpenAI Plan B)
    const { data: aiData, error: aiError } = await supabase.functions.invoke(
      'ai-generate',
      {
        body: {
          assessmentData,
          contactData,
          deepProfileData
        }
      }
    );

    if (aiError) {
      console.error('⚠️ AI generation error:', aiError);
      await updateGenerationFlags({ 
        error_log: [{ phase: 'ai-generate', error: aiError.message, timestamp: new Date().toISOString() }] 
      });
    }

    let aiContent = aiData?.data || {};
    const generationSource = aiData?.source || 'fallback';
    console.log('✅ AI content generated via:', generationSource);
    console.log('🔍 Raw AI content received:', JSON.stringify(aiContent, null, 2).substring(0, 500) + '...');
    
    // Validate AI content
    const validation = validateAIContent(aiContent);
    if (!validation.valid) {
      console.warn('⚠️ AI content validation warnings - missing:', validation.missing);
      
      // BULLETPROOF FALLBACK: Compute missing data from quiz answers
      if (!aiContent.dimensionScores?.length) {
        console.log('🔧 Using fallback: computing dimension scores from quiz data');
        // Pass timing and secondary answers for score variance (if available)
        const responseTimes = assessmentData.responseTimes || [];
        const secondaryAnswers = assessmentData.secondaryAnswers || {};
        aiContent.dimensionScores = computeDimensionScoresFromQuiz(
          assessmentData, 
          responseTimes, 
          secondaryAnswers
        );
      }
      
      if (!aiContent.tensions?.length) {
        console.log('🔧 Using fallback: generating default tensions');
        aiContent.tensions = generateDefaultTensions(aiContent.dimensionScores, contactData);
      }
      
      if (!aiContent.risks?.length) {
        console.log('🔧 Using fallback: generating default risks');
        aiContent.risks = generateDefaultRisks(aiContent.dimensionScores, contactData);
      }
      
      if (!aiContent.firstMoves?.length) {
        console.log('🔧 Using fallback: generating default first moves');
        aiContent.firstMoves = generateDefaultFirstMoves(aiContent.dimensionScores);
      }
    }

    progress('storing', 50, 'Storing dimension scores...');

    // Step 3: Store dimension scores
    // SCHEMA FIX: leader_dimension_scores columns are:
    // - score_numeric (not 'score')
    // - dimension_tier (not 'label')
    // - explanation (not 'insight_summary')
    // - NO priority_rank column
    // PHASE 3: Use dimension key and tier mapping to ensure schema compliance
    // ALWAYS store dimension scores - use fallback if AI failed
    const responseTimes = assessmentData.responseTimes || [];
    const secondaryAnswers = assessmentData.secondaryAnswers || {};
    const dimensionScoresToStore = aiContent.dimensionScores?.length > 0 
      ? aiContent.dimensionScores 
      : computeDimensionScoresFromQuiz(assessmentData, responseTimes, secondaryAnswers);
    
    if (dimensionScoresToStore?.length > 0) {
      const scoreRecords = dimensionScoresToStore.map((d: any, idx: number) => ({
        assessment_id: assessmentId,
        dimension_key: getValidDimensionKey(d.key || d.dimension_key, idx),
        score_numeric: typeof d.score === 'number' ? d.score : 0,
        dimension_tier: getValidTier(d.label || d.tier),
        explanation: d.summary || d.insight_summary || d.explanation || ''
      }));

      const result = await safeInsert('leader_dimension_scores', scoreRecords, '📊');
      if (result.success) {
        await updateGenerationFlags({ insights_generated: true });
      } else {
        await updateGenerationFlags({ 
          error_log: [{ phase: 'dimension_scores', error: result.error, timestamp: new Date().toISOString() }] 
        });
      }
    }

    progress('storing', 60, 'Analyzing tensions...');

    // Step 4: Store tensions
    if (aiContent.tensions?.length > 0) {
      const tensionRecords = aiContent.tensions.map((t: any, idx: number) => ({
        assessment_id: assessmentId,
        dimension_key: t.key || t.dimension_key || 'general',
        summary_line: t.summary || t.summary_line || '',
        priority_rank: idx + 1
      }));

      const result = await safeInsert('leader_tensions', tensionRecords, '⚡');
      if (result.success) {
        await updateGenerationFlags({ tensions_computed: true });
      } else {
        await updateGenerationFlags({ 
          error_log: [{ phase: 'tensions', error: result.error, timestamp: new Date().toISOString() }] 
        });
      }
    }

    progress('storing', 70, 'Evaluating risks...');

    // Step 5: Store risk signals
    // SCHEMA FIX: leader_risk_signals uses 'level' not 'risk_level'
    if (aiContent.risks?.length > 0) {
      const riskRecords = aiContent.risks.map((r: any, idx: number) => ({
        assessment_id: assessmentId,
        risk_key: r.key || r.risk_key || 'unknown',
        level: r.level || r.risk_level || 'medium',
        description: r.description || '',
        priority_rank: idx + 1
      }));

      const result = await safeInsert('leader_risk_signals', riskRecords, '⚠️');
      if (result.success) {
        await updateGenerationFlags({ risks_computed: true });
      } else {
        await updateGenerationFlags({ 
          error_log: [{ phase: 'risks', error: result.error, timestamp: new Date().toISOString() }] 
        });
      }
    }

    progress('storing', 75, 'Mapping scenarios...');

    // Step 6: Store org scenarios
    if (aiContent.scenarios?.length > 0) {
      const scenarioRecords = aiContent.scenarios.map((s: any, idx: number) => ({
        assessment_id: assessmentId,
        scenario_key: s.key || s.scenario_key || 'unknown',
        summary: s.summary || '',
        priority_rank: idx + 1
      }));

      const result = await safeInsert('leader_org_scenarios', scenarioRecords, '🎯');
      if (result.success) {
        await updateGenerationFlags({ scenarios_generated: true });
      } else {
        await updateGenerationFlags({ 
          error_log: [{ phase: 'scenarios', error: result.error, timestamp: new Date().toISOString() }] 
        });
      }
    }

    progress('storing', 85, 'Building your prompt library...');

    // Step 7: Store prompt sets
    if (aiContent.prompts?.length > 0) {
      const promptRecords = aiContent.prompts.map((p: any, idx: number) => ({
        assessment_id: assessmentId,
        category_key: p.category || p.category_key || 'general',
        title: p.title || 'Untitled Prompt Set',
        description: p.description || '',
        what_its_for: p.whatItsFor || p.what_its_for || '',
        when_to_use: p.whenToUse || p.when_to_use || '',
        how_to_use: p.howToUse || p.how_to_use || '',
        prompts_json: Array.isArray(p.prompts) ? p.prompts : [],
        priority_rank: idx + 1
      }));

      const result = await safeInsert('leader_prompt_sets', promptRecords, '📝');
      if (result.success) {
        await updateGenerationFlags({ prompts_generated: true });
      } else {
        await updateGenerationFlags({ 
          error_log: [{ phase: 'prompts', error: result.error, timestamp: new Date().toISOString() }] 
        });
      }
    }

    progress('storing', 92, 'Creating action plan...');

    // Step 8: Store first moves
    // SCHEMA FIX: leader_first_moves uses:
    // - move_number (not priority_rank)
    // - content (not move_text)
    if (aiContent.firstMoves?.length > 0) {
      const moveRecords = aiContent.firstMoves.map((move: any, idx: number) => {
        // Handle both string array and object array formats
        const moveContent = typeof move === 'string' ? move : (move.content || move.text || String(move));
        return {
          assessment_id: assessmentId,
          move_number: idx + 1,
          content: moveContent
        };
      });

      const result = await safeInsert('leader_first_moves', moveRecords, '🚀');
      if (result.success) {
        await updateGenerationFlags({ first_moves_generated: true });
      } else {
        await updateGenerationFlags({ 
          error_log: [{ phase: 'first_moves', error: result.error, timestamp: new Date().toISOString() }] 
        });
      }
    }

    progress('finalizing', 96, 'Finalizing your results...');

    // Step 9: Store executive insights in generation_status
    try {
      await updateGenerationFlags({
        your_edge: aiContent.yourEdge || null,
        your_risk: aiContent.yourRisk || null,
        your_next_move: aiContent.yourNextMove || null,
        generation_source: generationSource,
        generation_duration_ms: Date.now() - startTime
      });
      console.log('✅ Executive insights stored in generation_status');
    } catch (e) {
      console.error('❌ Error storing executive insights:', e);
    }

    // Step 10: Store assessment events (raw question/answer data)
    // Fix #4: Use ON CONFLICT DO NOTHING for idempotency
    // PHASE 4: Use valid event_type and tool_name per schema CHECK constraints
    try {
      const eventRecords = Object.entries(assessmentData)
        .filter(([key, value]) => key.includes('Score') && typeof value === 'number')
        .map(([key, value]) => ({
          assessment_id: assessmentId,
          session_id: sessionId,
          question_id: key,
          question_text: key.replace(/Score$/, '').replace(/([A-Z])/g, ' $1').trim(),
          raw_input: String(value),
          structured_values: { score: Number(value), dimension: key } as Record<string, string | number>,
          event_type: 'question_answered',  // PHASE 4: Was 'assessment_response'
          tool_name: 'quiz',                 // PHASE 4: Was 'leaders_assessment'
          flow_name: 'unified_assessment'
        }));

      if (eventRecords.length > 0) {
        // Fix #4: Use upsert with ON CONFLICT DO NOTHING for idempotency
        const { error } = await supabase
          .from('assessment_events')
          .upsert(eventRecords, {
            onConflict: 'assessment_id,question_id,session_id',
            ignoreDuplicates: true
          });
        
        if (error) {
          console.error('📋 ❌ Failed to store assessment events:', error);
        } else {
          console.log('📋 ✅ Assessment events stored (idempotent)');
        }
      }
    } catch (e) {
      console.error('❌ Error storing assessment events:', e);
    }

    progress('complete', 100, 'Assessment complete!');

    const duration = Date.now() - startTime;
    console.log(`✅ Assessment pipeline complete in ${duration}ms`);

    return {
      success: true,
      assessmentId,
      source: generationSource,
      durationMs: duration
    };

  } catch (error) {
    console.error('❌ Assessment pipeline failed:', error);
    
    // Cleanup partial data on failure
    if (assessmentId) {
      console.log('🧹 Cleaning up partial assessment data...');
      const { cleanupFailedAssessment } = await import('./cleanupFailedAssessment');
      await cleanupFailedAssessment(assessmentId);
    }
    
    // Log critical failure
    try {
      if (assessmentId) {
        const { data: current } = await supabase
          .from('leader_assessments')
          .select('generation_status')
          .eq('id', assessmentId)
          .single();

        const existingStatus = (current?.generation_status || {}) as any;
        const existingErrors = Array.isArray(existingStatus.error_log) ? existingStatus.error_log : [];
        
        await supabase
          .from('leader_assessments')
          .update({ 
            generation_status: {
              ...existingStatus,
              error_log: [
                ...existingErrors,
                { 
                  phase: 'pipeline', 
                  error: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString(),
                  cleanup_performed: true
                }
              ]
            }
          })
          .eq('id', assessmentId);
      }
    } catch (logError) {
      console.error('❌ Failed to log pipeline error:', logError);
    }
    
    return {
      success: false,
      assessmentId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime
    };
  }
}
