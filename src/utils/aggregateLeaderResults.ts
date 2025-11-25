import { supabase } from '@/integrations/supabase/client';
import { deriveLeadershipComparison, LeadershipComparison } from './scaleUpsMapping';

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

    // Fetch assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('leader_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('❌ Assessment not found, returning empty safe structure:', assessmentError);
      return safeDefaults;
    }

    const hasFull = assessment.has_full_diagnostic;
    const shouldApplyGating = applyGating && !hasFull;

    // Fetch dimension scores
    const { data: dimensionScores } = await supabase
      .from('leader_dimension_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('dimension_key');

    // Fetch tensions (apply gating: free users see only top 1) - PHASE 4: Type guard
    const { data: allTensions } = await supabase
      .from('leader_tensions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('priority_rank');

    const safeTensions = Array.isArray(allTensions) ? allTensions : [];
    const tensions = shouldApplyGating 
      ? safeTensions.slice(0, 1)
      : safeTensions;

    // Fetch risk signals (apply gating: free users see only top 1) - PHASE 4: Type guard
    const { data: allRiskSignals } = await supabase
      .from('leader_risk_signals')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('priority_rank');

    const safeRiskSignals = Array.isArray(allRiskSignals) ? allRiskSignals : [];
    const riskSignals = shouldApplyGating
      ? safeRiskSignals.slice(0, 1).map(r => ({
          risk_key: r.risk_key as LeaderRiskSignal['risk_key'],
          level: r.level as LeaderRiskSignal['level'],
          description: r.description,
          priority_rank: r.priority_rank,
        }))
      : safeRiskSignals.map(r => ({
          risk_key: r.risk_key as LeaderRiskSignal['risk_key'],
          level: r.level as LeaderRiskSignal['level'],
          description: r.description,
          priority_rank: r.priority_rank,
        }));

    // Fetch org scenarios (apply gating: free users see only top 1) - PHASE 4: Type guard
    const { data: allOrgScenarios } = await supabase
      .from('leader_org_scenarios')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('priority_rank');

    const safeOrgScenarios = Array.isArray(allOrgScenarios) ? allOrgScenarios : [];
    const orgScenarios = shouldApplyGating
      ? safeOrgScenarios.slice(0, 1).map(s => ({
          scenario_key: s.scenario_key as LeaderOrgScenario['scenario_key'],
          summary: s.summary,
          priority_rank: s.priority_rank,
        }))
      : safeOrgScenarios.map(s => ({
          scenario_key: s.scenario_key as LeaderOrgScenario['scenario_key'],
          summary: s.summary,
          priority_rank: s.priority_rank,
        }));

    // Fetch first moves (apply gating: free users see only move 1)
    const { data: allFirstMoves } = await supabase
      .from('leader_first_moves')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('move_number');

    const firstMoves = shouldApplyGating
      ? (allFirstMoves || []).filter(m => m.move_number === 1)
      : (allFirstMoves || []);

    // Fetch prompt sets (apply gating: free users see only top 3)
    const { data: allPromptSets } = await supabase
      .from('leader_prompt_sets')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('priority_rank');

    const promptSets = shouldApplyGating
      ? (allPromptSets || []).slice(0, 3)
      : (allPromptSets || []);

    // PHASE 4: Generate leadershipComparison from dimension scores
    let leadershipComparison: LeadershipComparison | null = null;
    try {
      // Reconstruct assessment data from dimension scores for scaleUpsMapping
      const reconstructedAssessmentData: any = {};
      dimensionScores?.forEach(d => {
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
        if (assessmentKey) {
          reconstructedAssessmentData[assessmentKey] = d.score_numeric;
        }
      });
      
      leadershipComparison = deriveLeadershipComparison(reconstructedAssessmentData, null);
      console.log('✅ Leadership comparison generated:', leadershipComparison);
    } catch (error) {
      console.error('⚠️ Failed to generate leadership comparison:', error);
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

    return {
      assessmentId,
      benchmarkScore: assessment.benchmark_score || 0,
      benchmarkTier: assessment.benchmark_tier || 'AI-Emerging',
      hasFullDiagnostic: hasFull,
      dimensionScores: dimensionScores || [],
      tensions,
      riskSignals,
      orgScenarios,
      firstMoves,
      promptSets,
      leadershipComparison,
    };
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
