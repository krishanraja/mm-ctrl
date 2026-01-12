import { supabase } from '@/integrations/supabase/client';
import { deriveLeadershipComparison, LeadershipComparison } from './scaleUpsMapping';
import { normalizeAIInObject } from './normalizeAI';
import { ensureArray, ensureString, ensureNumber, safeAccess } from './pipelineGuards';

export interface LeaderDimensionScore {
  dimension_key: string;
  score_numeric: number;
  dimension_tier: string;
  explanation: string;
}

export interface LeaderTension {
  dimension_key: string;
  summary_line: string;
  priority_rank: number;
}

export interface LeaderRiskSignal {
  risk_key: 'shadow_ai' | 'skills_gap' | 'roi_leakage' | 'decision_friction';
  level: 'low' | 'medium' | 'high';
  description: string;
  priority_rank: number;
}

export interface LeaderOrgScenario {
  scenario_key: 'stagnation_loop' | 'shadow_ai_instability' | 'high_velocity_path' | 'culture_capability_mismatch';
  summary: string;
  priority_rank: number;
}

export interface LeaderFirstMove {
  move_number: number;
  content: string;
}

export interface LeaderPromptSet {
  category_key: string;
  title: string;
  description: string;
  what_its_for: string;
  when_to_use: string;
  how_to_use: string;
  prompts_json: any;
  priority_rank: number;
}

export interface AggregatedLeaderResults {
  assessmentId: string;
  benchmarkScore: number;
  benchmarkTier: string;
  hasFullDiagnostic: boolean;
  hasDeepContext: boolean;
  dimensionScores: LeaderDimensionScore[];
  tensions: LeaderTension[];
  riskSignals: LeaderRiskSignal[];
  orgScenarios: LeaderOrgScenario[];
  firstMoves: LeaderFirstMove[];
  promptSets: LeaderPromptSet[];
  leadershipComparison: LeadershipComparison | null;
}

/**
 * Aggregates all leader assessment data from the new v2 schema
 * Applies free/paid filtering based on has_full_diagnostic flag
 */
export async function aggregateLeaderResults(
  assessmentId: string,
  applyGating: boolean = true
): Promise<AggregatedLeaderResults> {
  const safeDefaults: AggregatedLeaderResults = {
    assessmentId,
    benchmarkScore: 0,
    benchmarkTier: 'AI-Emerging',
    hasFullDiagnostic: false,
    hasDeepContext: false,
    dimensionScores: [],
    tensions: [],
    riskSignals: [],
    orgScenarios: [],
    firstMoves: [],
    promptSets: [],
    leadershipComparison: null,
  };
  
  try {
    console.log('📊 Aggregating leader results for assessment:', assessmentId);

    // PHASE 6: Fetch assessment details with RLS fallback
    let assessment: any = null;
    let hasFull = false;
    let hasDeep = false;
    let assessmentFetchFailed = false;

    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('leader_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) {
        console.warn('⚠️ Assessment fetch failed (likely RLS):', assessmentError.message);
        assessmentFetchFailed = true;
      } else {
        assessment = assessmentData;
        hasFull = assessment?.has_full_diagnostic || false;
        hasDeep = assessment?.has_deep_context || false;
      }
    } catch (e) {
      console.warn('⚠️ Assessment fetch exception:', e);
      assessmentFetchFailed = true;
    }

    const shouldApplyGating = applyGating && !hasFull;

    // PHASE 6: Fetch dimension scores with error handling - this works even if assessment fetch failed
    let dimensionScores: LeaderDimensionScore[] = [];
    try {
      const { data: dimensionScoresRaw, error: dimError } = await supabase
        .from('leader_dimension_scores')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('dimension_key');
      
      if (dimError) {
        console.warn('⚠️ Failed to fetch dimension scores:', dimError.message);
      } else {
        // Ensure dimension scores have correct shape
        dimensionScores = (dimensionScoresRaw || []).map(d => ({
          dimension_key: d.dimension_key || 'unknown',
          score_numeric: typeof d.score_numeric === 'number' ? d.score_numeric : 0,
          dimension_tier: d.dimension_tier || 'AI-Emerging',
          explanation: d.explanation || ''
        }));
      }
    } catch (e) {
      console.warn('⚠️ Dimension scores fetch exception:', e);
    }

    // PHASE 6: Compute benchmark from dimension scores if missing or 0
    let computedBenchmarkScore = assessment?.benchmark_score || 0;
    let computedBenchmarkTier = assessment?.benchmark_tier || 'AI-Emerging';
    
    // BULLETPROOF: Always compute from dimension scores if benchmark is 0 or missing
    if ((assessmentFetchFailed || computedBenchmarkScore === 0) && dimensionScores.length > 0) {
      // Calculate average score from dimensions
      const avgScore = Math.round(
        dimensionScores.reduce((sum, d) => sum + (d.score_numeric || 0), 0) / dimensionScores.length
      );
      computedBenchmarkScore = avgScore;
      
      // Derive tier from score
      if (avgScore >= 80) computedBenchmarkTier = 'AI-Orchestrator';
      else if (avgScore >= 60) computedBenchmarkTier = 'AI-Confident';
      else if (avgScore >= 40) computedBenchmarkTier = 'AI-Aware';
      else computedBenchmarkTier = 'AI-Emerging';
      
      console.log('📊 Computed benchmark from dimensions:', { avgScore, tier: computedBenchmarkTier });
    }

    // Fetch tensions (apply gating: free users see only top 1) - PHASE 4: Type guard
    let tensions: LeaderTension[] = [];
    try {
      const { data: allTensions, error: tensionsError } = await supabase
        .from('leader_tensions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('priority_rank');

      if (tensionsError) {
        console.warn('⚠️ Failed to fetch tensions:', tensionsError.message);
      } else {
        const safeTensions = ensureArray(allTensions, []);
        tensions = (shouldApplyGating ? safeTensions.slice(0, 1) : safeTensions).map(t => ({
          dimension_key: ensureString(t.dimension_key, 'general'),
          summary_line: ensureString(t.summary_line, ''),
          priority_rank: ensureNumber(t.priority_rank, 1, 1, 100)
        }));
      }
    } catch (e) {
      console.warn('⚠️ Tensions fetch exception:', e);
    }

    // Fetch risk signals (apply gating: free users see only top 1) - PHASE 4: Type guard
    let riskSignals: LeaderRiskSignal[] = [];
    try {
      const { data: allRiskSignals, error: risksError } = await supabase
        .from('leader_risk_signals')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('priority_rank');

      if (risksError) {
        console.warn('⚠️ Failed to fetch risk signals:', risksError.message);
      } else {
        const safeRiskSignals = ensureArray(allRiskSignals, []);
        const validRiskKeys: LeaderRiskSignal['risk_key'][] = ['shadow_ai', 'skills_gap', 'roi_leakage', 'decision_friction'];
        const validLevels: LeaderRiskSignal['level'][] = ['low', 'medium', 'high'];
        
        riskSignals = (shouldApplyGating ? safeRiskSignals.slice(0, 1) : safeRiskSignals)
          .map(r => ({
            risk_key: (validRiskKeys.includes(r.risk_key) ? r.risk_key : 'shadow_ai') as LeaderRiskSignal['risk_key'],
            level: (validLevels.includes(r.level) ? r.level : 'medium') as LeaderRiskSignal['level'],
            description: ensureString(r.description, ''),
            priority_rank: ensureNumber(r.priority_rank, 1, 1, 100),
          }))
          .filter(r => r.description.length > 0); // Filter out invalid entries
      }
    } catch (e) {
      console.warn('⚠️ Risk signals fetch exception:', e);
    }

    // Fetch org scenarios (apply gating: free users see only top 1) - PHASE 4: Type guard
    let orgScenarios: LeaderOrgScenario[] = [];
    try {
      const { data: allOrgScenarios, error: scenariosError } = await supabase
        .from('leader_org_scenarios')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('priority_rank');

      if (scenariosError) {
        console.warn('⚠️ Failed to fetch org scenarios:', scenariosError.message);
      } else {
        const safeOrgScenarios = ensureArray(allOrgScenarios, []);
        const validScenarioKeys: LeaderOrgScenario['scenario_key'][] = [
          'stagnation_loop', 'shadow_ai_instability', 'high_velocity_path', 'culture_capability_mismatch'
        ];
        
        orgScenarios = (shouldApplyGating ? safeOrgScenarios.slice(0, 1) : safeOrgScenarios)
          .map(s => ({
            scenario_key: (validScenarioKeys.includes(s.scenario_key) 
              ? s.scenario_key 
              : 'high_velocity_path') as LeaderOrgScenario['scenario_key'],
            summary: ensureString(s.summary, ''),
            priority_rank: ensureNumber(s.priority_rank, 1, 1, 100),
          }))
          .filter(s => s.summary.length > 0); // Filter out invalid entries
      }
    } catch (e) {
      console.warn('⚠️ Org scenarios fetch exception:', e);
    }

    // Fetch first moves (apply gating: free users see only move 1)
    let firstMoves: LeaderFirstMove[] = [];
    try {
      const { data: allFirstMoves, error: movesError } = await supabase
        .from('leader_first_moves')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('move_number');

      if (movesError) {
        console.warn('⚠️ Failed to fetch first moves:', movesError.message);
      } else {
        const safeFirstMoves = ensureArray(allFirstMoves, []);
        const filtered = shouldApplyGating
          ? safeFirstMoves.filter(m => ensureNumber(m.move_number, 1, 1, 3) === 1)
          : safeFirstMoves;
        
        firstMoves = filtered
          .map(m => ({
            move_number: ensureNumber(m.move_number, 1, 1, 3),
            content: ensureString(m.content, ''),
          }))
          .filter(m => m.content.length > 0) // Filter out invalid entries
          .sort((a, b) => a.move_number - b.move_number);
      }
    } catch (e) {
      console.warn('⚠️ First moves fetch exception:', e);
    }

    // Fetch prompt sets (apply gating: free users see only top 3)
    let promptSets: LeaderPromptSet[] = [];
    try {
      const { data: allPromptSets, error: promptsError } = await supabase
        .from('leader_prompt_sets')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('priority_rank');

      if (promptsError) {
        console.warn('⚠️ Failed to fetch prompt sets:', promptsError.message);
      } else {
        const safePromptSets = ensureArray(allPromptSets, []);
        const filtered = shouldApplyGating ? safePromptSets.slice(0, 3) : safePromptSets;
        
        promptSets = filtered
          .map(p => ({
            category_key: ensureString(p.category_key, 'strategic_planning'),
            title: ensureString(p.title, 'Untitled'),
            description: ensureString(p.description, ''),
            what_its_for: ensureString(p.what_its_for, ''),
            when_to_use: ensureString(p.when_to_use, ''),
            how_to_use: ensureString(p.how_to_use, ''),
            prompts_json: Array.isArray(p.prompts_json) ? p.prompts_json : (p.prompts_json || []),
            priority_rank: ensureNumber(p.priority_rank, 1, 1, 100),
          }))
          .filter(p => p.title.length > 0 && Array.isArray(p.prompts_json)); // Filter out invalid entries
      }
    } catch (e) {
      console.warn('⚠️ Prompt sets fetch exception:', e);
    }

    // PHASE 4: Generate leadershipComparison from dimension scores
    let leadershipComparison: LeadershipComparison | null = null;
    try {
      // Only generate if we have dimension scores
      if (dimensionScores && dimensionScores.length > 0) {
        // Reconstruct assessment data from dimension scores for scaleUpsMapping
        const reconstructedAssessmentData: any = {};
        dimensionScores.forEach(d => {
          // Map dimension keys back to assessment data keys
          const keyMap: Record<string, string> = {
            'ai_fluency': 'aiFluencyScore',
            'decision_velocity': 'decisionVelocityScore',
            'experimentation_cadence': 'experimentationScore',
            'delegation_augmentation': 'delegationScore',
            'alignment_communication': 'alignmentScore',
            'risk_governance': 'riskGovernanceScore',
          };
          const assessmentKey = keyMap[d.dimension_key];
          if (assessmentKey && typeof d.score_numeric === 'number') {
            reconstructedAssessmentData[assessmentKey] = d.score_numeric;
          }
        });
        
        // Only call if we have at least some data
        if (Object.keys(reconstructedAssessmentData).length > 0) {
          try {
            leadershipComparison = deriveLeadershipComparison(reconstructedAssessmentData, null);
            console.log('✅ Leadership comparison generated');
          } catch (deriveError) {
            console.warn('⚠️ deriveLeadershipComparison failed:', deriveError);
            // Continue without leadership comparison
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to generate leadership comparison:', error);
      // Continue without leadership comparison - it's optional
    }

    console.log('✅ Aggregated results:', {
      hasFull,
      shouldApplyGating,
      tensions: tensions.length,
      riskSignals: riskSignals.length,
      scenarios: orgScenarios.length,
      moves: firstMoves.length,
      prompts: promptSets.length,
      hasLeadershipComparison: !!leadershipComparison,
    });

    // PHASE 6: Return aggregated results with computed fallbacks
    // Ensure all arrays are properly initialized (never null/undefined)
    const results: AggregatedLeaderResults = {
      assessmentId: ensureString(assessmentId, ''),
      benchmarkScore: ensureNumber(computedBenchmarkScore, 50, 0, 100),
      benchmarkTier: ensureString(computedBenchmarkTier, 'AI-Emerging'),
      hasFullDiagnostic: typeof hasFull === 'boolean' ? hasFull : false,
      hasDeepContext: typeof hasDeep === 'boolean' ? hasDeep : false,
      dimensionScores: ensureArray(dimensionScores, []),
      tensions: ensureArray(tensions, []),
      riskSignals: ensureArray(riskSignals, []),
      orgScenarios: ensureArray(orgScenarios, []),
      firstMoves: ensureArray(firstMoves, []),
      promptSets: ensureArray(promptSets, []),
      leadershipComparison: leadershipComparison, // Can be null, that's expected
    };
    
    // Normalize AI capitalization in all text content
    return normalizeAIInObject(results);
  } catch (error) {
    console.error('❌ Aggregation failed completely, returning safe defaults:', error);
    return safeDefaults;
  }
}

/**
 * Helper to check if content should be locked based on gating rules
 */
export function isContentLocked(
  hasFullDiagnostic: boolean,
  contentType: 'tension' | 'risk' | 'scenario' | 'move' | 'prompt',
  itemIndex: number
): boolean {
  if (hasFullDiagnostic) return false;

  // Free tier limits
  const limits = {
    tension: 1,
    risk: 1,
    scenario: 1,
    move: 1,
    prompt: 3,
  };

  return itemIndex >= limits[contentType];
}
