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

// Safe insert helper with logging
async function safeInsert(
  table: 'leader_dimension_scores' | 'leader_tensions' | 'leader_risk_signals' | 'leader_org_scenarios' | 'leader_prompt_sets' | 'leader_first_moves' | 'assessment_events',
  records: any[], 
  logPrefix: string = ''
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!records || records.length === 0) {
    console.log(`${logPrefix} ⚠️ No records to insert for ${table}`);
    return { success: true, count: 0 };
  }

  try {
    const { error } = await supabase.from(table).insert(records);
    if (error) {
      console.error(`${logPrefix} ❌ Insert failed for ${table}:`, error.message);
      return { success: false, count: 0, error: error.message };
    }
    console.log(`${logPrefix} ✅ ${table}: ${records.length} records inserted`);
    return { success: true, count: records.length };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    console.error(`${logPrefix} ❌ Exception in ${table} insert:`, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
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

    const assessmentId = createData.assessmentId;
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

    const aiContent = aiData?.data || {};
    const generationSource = aiData?.source || 'fallback';
    console.log('✅ AI content generated via:', generationSource);
    
    // Validate AI content
    const validation = validateAIContent(aiContent);
    if (!validation.valid) {
      console.warn('⚠️ AI content validation warnings - missing:', validation.missing);
    }

    progress('storing', 50, 'Storing dimension scores...');

    // Step 3: Store dimension scores
    // SCHEMA FIX: leader_dimension_scores columns are:
    // - score_numeric (not 'score')
    // - dimension_tier (not 'label')
    // - explanation (not 'insight_summary')
    // - NO priority_rank column
    // PHASE 3: Use dimension key and tier mapping to ensure schema compliance
    if (aiContent.dimensionScores?.length > 0) {
      const scoreRecords = aiContent.dimensionScores.map((d: any, idx: number) => ({
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
        await safeInsert('assessment_events', eventRecords, '📋');
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
    
    // Log critical failure
    try {
      const { data: current } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', sessionId)
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
                timestamp: new Date().toISOString() 
              }
            ]
          }
        })
        .eq('id', sessionId);
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
