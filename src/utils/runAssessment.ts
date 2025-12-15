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
    // Optimized: Start AI generation immediately after assessment creation
    // The AI generation can run in parallel with other operations if needed
    const aiGenerationPromise = supabase.functions.invoke(
      'ai-generate',
      {
        body: {
          assessmentData,
          contactData,
          deepProfileData
        }
      }
    );

    // Wait for AI generation (can be optimized further with background jobs)
    const { data: aiData, error: aiError } = await aiGenerationPromise;

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

    progress('storing', 50, 'Preparing data for storage...');

    // Step 3-8: Prepare all data records with validation and sanitization
    const responseTimes = assessmentData.responseTimes || [];
    const secondaryAnswers = assessmentData.secondaryAnswers || {};
    const dimensionScoresToStore = aiContent.dimensionScores?.length > 0 
      ? aiContent.dimensionScores 
      : computeDimensionScoresFromQuiz(assessmentData, responseTimes, secondaryAnswers);
    
    // Prepare dimension scores with validation
    const scoreRecords = dimensionScoresToStore?.length > 0 
      ? dimensionScoresToStore.map((d: any, idx: number) => {
          const record = {
            assessment_id: assessmentId,
            dimension_key: getValidDimensionKey(d.key || d.dimension_key, idx),
            score_numeric: typeof d.score === 'number' ? Math.max(0, Math.min(100, d.score)) : 0,
            dimension_tier: getValidTier(d.label || d.tier),
            explanation: sanitizeText(d.summary || d.insight_summary || d.explanation || '', 5000)
          };
          return record;
        })
      : [];

    // Validate dimension scores
    const scoreValidation = validateRecords(scoreRecords, validateDimensionScore, 'dimension_scores');
    if (!scoreValidation.valid && scoreValidation.errors.length > 0) {
      console.warn('⚠️ Dimension score validation errors:', scoreValidation.errors);
    }

    // Prepare tensions with sanitization
    const tensionRecords = aiContent.tensions?.length > 0
      ? aiContent.tensions.map((t: any, idx: number) => ({
          assessment_id: assessmentId,
          dimension_key: sanitizeText(t.key || t.dimension_key || 'general', 100),
          summary_line: sanitizeText(t.summary || t.summary_line || '', 2000),
          priority_rank: idx + 1
        }))
      : [];

    // Prepare risk signals with sanitization
    const riskRecords = aiContent.risks?.length > 0
      ? aiContent.risks.map((r: any, idx: number) => ({
          assessment_id: assessmentId,
          risk_key: sanitizeText(r.key || r.risk_key || 'unknown', 100),
          level: ['low', 'medium', 'high'].includes(r.level || r.risk_level) 
            ? (r.level || r.risk_level) 
            : 'medium',
          description: sanitizeText(r.description || '', 2000),
          priority_rank: idx + 1
        }))
      : [];

    // Prepare org scenarios with sanitization
    const scenarioRecords = aiContent.scenarios?.length > 0
      ? aiContent.scenarios.map((s: any, idx: number) => ({
          assessment_id: assessmentId,
          scenario_key: sanitizeText(s.key || s.scenario_key || 'unknown', 100),
          summary: sanitizeText(s.summary || '', 2000),
          priority_rank: idx + 1
        }))
      : [];

    // Prepare prompt sets with sanitization
    const promptRecords = aiContent.prompts?.length > 0
      ? aiContent.prompts.map((p: any, idx: number) => ({
          assessment_id: assessmentId,
          category_key: sanitizeText(p.category || p.category_key || 'general', 100),
          title: sanitizeText(p.title || 'Untitled Prompt Set', 200),
          description: sanitizeText(p.description || '', 1000),
          what_its_for: sanitizeText(p.whatItsFor || p.what_its_for || '', 1000),
          when_to_use: sanitizeText(p.whenToUse || p.when_to_use || '', 1000),
          how_to_use: sanitizeText(p.howToUse || p.how_to_use || '', 1000),
          prompts_json: Array.isArray(p.prompts) ? p.prompts : [],
          priority_rank: idx + 1
        }))
      : [];

    // Prepare first moves with sanitization
    const moveRecords = aiContent.firstMoves?.length > 0
      ? aiContent.firstMoves.map((move: any, idx: number) => {
          const moveContent = typeof move === 'string' 
            ? move 
            : (move.content || move.text || String(move));
          return {
            assessment_id: assessmentId,
            move_number: idx + 1,
            content: sanitizeText(moveContent, 1000)
          };
        })
      : [];

    // Prepare assessment events
    const eventRecords = Object.entries(assessmentData)
      .filter(([key, value]) => key.includes('Score') && typeof value === 'number')
      .map(([key, value]) => ({
        assessment_id: assessmentId,
        session_id: sessionId,
        question_id: sanitizeText(key, 200),
        question_text: sanitizeText(
          key.replace(/Score$/, '').replace(/([A-Z])/g, ' $1').trim(), 
          500
        ),
        raw_input: sanitizeText(String(value), 100),
        structured_values: { score: Number(value), dimension: key } as Record<string, string | number>,
        event_type: 'question_answered',
        tool_name: 'quiz',
        flow_name: 'unified_assessment'
      }));

    progress('storing', 60, 'Storing all assessment data atomically...');

    // Step 3-8: Use atomic RPC function for transaction safety
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('insert_assessment_data_atomic' as any, {
        p_assessment_id: assessmentId,
        p_dimension_scores: scoreValidation.validRecords,
        p_tensions: tensionRecords,
        p_risk_signals: riskRecords,
        p_org_scenarios: scenarioRecords,
        p_prompt_sets: promptRecords,
        p_first_moves: moveRecords,
        p_assessment_events: eventRecords
      });

      if (rpcError) {
        throw new Error(`Atomic insert failed: ${rpcError.message}`);
      }

      // Type assertion for RPC result
      const result = rpcResult as any;
      
      if (result && result.success) {
        console.log('✅ Atomic insert successful:', result.inserted);
        
        // Update generation flags based on what was inserted
        const updates: Record<string, any> = {
          insights_generated: (result.inserted?.dimension_scores || 0) > 0,
          tensions_computed: (result.inserted?.tensions || 0) > 0,
          risks_computed: (result.inserted?.risk_signals || 0) > 0,
          scenarios_generated: (result.inserted?.org_scenarios || 0) > 0,
          prompts_generated: (result.inserted?.prompt_sets || 0) > 0,
          first_moves_generated: (result.inserted?.first_moves || 0) > 0,
        };

        await updateGenerationFlags(updates);
      } else {
        const errors = result?.errors || ['Unknown error in atomic insert'];
        throw new Error(`Atomic insert failed: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`);
      }
    } catch (atomicError: any) {
      console.error('❌ Atomic insert failed, falling back to parallel inserts:', atomicError);
      
      // Fallback: Use parallel inserts if RPC fails
      progress('storing', 70, 'Using fallback storage method...');
      
      const parallelResult = await parallelInsert([
        { table: 'leader_dimension_scores', records: scoreValidation.validRecords, options: { logPrefix: '📊' } },
        { table: 'leader_tensions', records: tensionRecords, options: { logPrefix: '⚡' } },
        { table: 'leader_risk_signals', records: riskRecords, options: { logPrefix: '⚠️' } },
        { table: 'leader_org_scenarios', records: scenarioRecords, options: { logPrefix: '🎯' } },
        { table: 'leader_prompt_sets', records: promptRecords, options: { logPrefix: '📝' } },
        { table: 'leader_first_moves', records: moveRecords, options: { logPrefix: '🚀' } },
        { 
          table: 'assessment_events', 
          records: eventRecords, 
          options: { 
            logPrefix: '📋',
            onConflict: 'assessment_id,question_id,session_id',
            ignoreDuplicates: true
          } 
        },
      ]);

      if (!parallelResult.success) {
        await updateGenerationFlags({ 
          error_log: [{ 
            phase: 'data_storage', 
            error: `Parallel insert errors: ${parallelResult.errors.join(', ')}`, 
            timestamp: new Date().toISOString() 
          }] 
        });
        throw new Error(`Data storage failed: ${parallelResult.errors.join(', ')}`);
      }

      // Update generation flags
      const updates: Record<string, any> = {};
      parallelResult.results.forEach(result => {
        if (result.table === 'leader_dimension_scores' && result.success) updates.insights_generated = true;
        if (result.table === 'leader_tensions' && result.success) updates.tensions_computed = true;
        if (result.table === 'leader_risk_signals' && result.success) updates.risks_computed = true;
        if (result.table === 'leader_org_scenarios' && result.success) updates.scenarios_generated = true;
        if (result.table === 'leader_prompt_sets' && result.success) updates.prompts_generated = true;
        if (result.table === 'leader_first_moves' && result.success) updates.first_moves_generated = true;
      });
      await updateGenerationFlags(updates);
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

    // Assessment events are now stored in the atomic insert above
    // This section is kept for backward compatibility but events are handled in atomic function

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
