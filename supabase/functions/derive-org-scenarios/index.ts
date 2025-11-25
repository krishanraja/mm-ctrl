import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrgScenario {
  scenario_key: 'stagnation_loop' | 'shadow_ai_instability' | 'high_velocity_path' | 'culture_capability_mismatch';
  summary: string;
  priority_rank: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { assessment_id, dimension_scores, risk_signals, tensions } = await req.json();

    // PHASE 3: Handle null inputs gracefully
    const safeRiskSignals = Array.isArray(risk_signals) ? risk_signals : [];
    const safeTensions = Array.isArray(tensions) ? tensions : [];
    const safeDimensionScores = dimension_scores && typeof dimension_scores === 'object' ? dimension_scores : {};

    console.log('🎯 Deriving org scenarios for assessment:', assessment_id);
    console.log('📊 Input safety:', {
      riskSignals: safeRiskSignals.length,
      tensions: safeTensions.length,
      hasDimensionScores: Object.keys(safeDimensionScores).length > 0,
    });

    const scenarios: OrgScenario[] = [];

    // PHASE 3: Use safe inputs for scenario detection
    const stagnationScenario = detectStagnationLoop(safeDimensionScores);
    if (stagnationScenario) scenarios.push(stagnationScenario);

    const shadowAIScenario = detectShadowAIInstability(safeDimensionScores, safeRiskSignals);
    if (shadowAIScenario) scenarios.push(shadowAIScenario);

    const highVelocityScenario = detectHighVelocityPath(safeDimensionScores, safeTensions);
    if (highVelocityScenario) scenarios.push(highVelocityScenario);

    const cultureMismatchScenario = detectCultureCapabilityMismatch(safeDimensionScores, safeTensions);
    if (cultureMismatchScenario) scenarios.push(cultureMismatchScenario);

    // Sort by priority and take top 3
    scenarios.sort((a, b) => a.priority_rank - b.priority_rank);
    const topScenarios = scenarios.slice(0, 3);

    // PHASE 3: Store scenarios with graceful error handling
    let storedCount = 0;
    let failedCount = 0;
    for (const scenario of topScenarios) {
      const { error } = await supabase
        .from('leader_org_scenarios')
        .insert({
          assessment_id,
          scenario_key: scenario.scenario_key,
          summary: scenario.summary,
          priority_rank: scenario.priority_rank,
        });

      if (error) {
        console.error('⚠️ Error storing scenario:', error);
        failedCount++;
        // PHASE 3: Continue with remaining scenarios instead of throwing
        continue;
      }
      storedCount++;
    }
    
    console.log(`✅ Scenarios: ${storedCount} stored, ${failedCount} failed`);

    console.log('✅ Derived and stored', topScenarios.length, 'org scenarios');

    // Update generation status AFTER all DB writes complete - MERGE with existing flags
    const { data: currentStatus } = await supabase
      .from('leader_assessments')
      .select('generation_status')
      .eq('id', assessment_id)
      .single();

    const { error: statusError } = await supabase
      .from('leader_assessments')
      .update({
        generation_status: {
          ...(currentStatus?.generation_status || {}),
          scenarios_generated: true,
          last_updated: new Date().toISOString(),
        },
      })
      .eq('id', assessment_id);

    if (statusError) {
      console.error('Failed to update generation status:', statusError);
    }

    return new Response(
      JSON.stringify({ scenarios: topScenarios, count: topScenarios.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error deriving org scenarios:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectStagnationLoop(dimensionScores: any): OrgScenario | null {
  if (!dimensionScores || typeof dimensionScores !== 'object') {
    return {
      scenario_key: 'stagnation_loop',
      summary: 'Assessment data is incomplete. Complete your profile for personalized organizational insights.',
      priority_rank: 3,
    };
  }
  
  const scores = Object.values(dimensionScores).filter(v => typeof v === 'number');
  if (scores.length === 0) {
    return {
      scenario_key: 'stagnation_loop',
      summary: 'No dimension scores available. Retake assessment for insights.',
      priority_rank: 3,
    };
  }
  
  const avgScore = scores.reduce((sum: number, score: any) => sum + score, 0) / scores.length;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;
  const decisionScore = dimensionScores?.decision_velocity || 0;

  // Low across all dimensions, especially experimentation
  if (avgScore < 45 && experimentationScore < 40) {
    return {
      scenario_key: 'stagnation_loop',
      summary: 'AI remains a talking point rather than a driver of change. Without clear pilots and ownership, the gap between your organization and competitors is widening. Break the cycle with one focused experiment tied to a real business problem.',
      priority_rank: 1,
    };
  }

  if (experimentationScore < 35 && decisionScore < 40) {
    return {
      scenario_key: 'stagnation_loop',
      summary: "Analysis paralysis has set in. Your team is waiting for perfect clarity that will not come. Launch a small, safe pilot to generate real learning and momentum.",
      priority_rank: 2,
    };
  }

  return null;
}

function detectShadowAIInstability(dimensionScores: any, riskSignals: any[]): OrgScenario | null {
  if (!dimensionScores || typeof dimensionScores !== 'object') {
    return null;
  }
  
  const governanceScore = dimensionScores?.risk_governance || 0;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;
  
  const hasShadowAIRisk = riskSignals?.some(r => r.risk_key === 'shadow_ai' && r.level !== 'low');

  // High experimentation, low governance
  if (experimentationScore > 60 && governanceScore < 50) {
    return {
      scenario_key: 'shadow_ai_instability',
      summary: "Your team is moving fast with AI tools, but without shared frameworks or oversight. This creates short-term productivity but risks quality issues, data leaks, and scattered learning. You are one bad output away from losing executive confidence.",
      priority_rank: 1,
    };
  }

  if (hasShadowAIRisk && governanceScore < 60) {
    return {
      scenario_key: 'shadow_ai_instability',
      summary: 'Uncoordinated AI adoption is creating pockets of value but also compliance and quality risks. Establish lightweight governance now before a crisis forces heavy-handed controls.',
      priority_rank: 2,
    };
  }

  return null;
}

function detectHighVelocityPath(dimensionScores: any, tensions: any[]): OrgScenario | null {
  if (!dimensionScores || typeof dimensionScores !== 'object') {
    return null;
  }
  
  const scores = Object.values(dimensionScores).filter(v => typeof v === 'number');
  if (scores.length === 0) return null;
  
  const avgScore = scores.reduce((sum: number, score: any) => sum + score, 0) / scores.length;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;
  const alignmentScore = dimensionScores?.alignment_communication || 0;

  const fewTensions = !tensions || tensions.length <= 1;

  // High scores across dimensions with good alignment
  if (avgScore > 65 && experimentationScore > 60 && alignmentScore > 60 && fewTensions) {
    return {
      scenario_key: 'high_velocity_path',
      summary: "You are on a strong trajectory. Teams are experimenting, learning is shared, and governance is proportionate. Your next challenge is scaling what works without losing speed. Focus on institutionalizing successful patterns.",
      priority_rank: 1,
    };
  }

  if (experimentationScore > 70 && alignmentScore > 65) {
    return {
      scenario_key: 'high_velocity_path',
      summary: "Momentum is building. Experimentation is happening and teams are aligned. Capture learnings systematically and double down on what is working.",
      priority_rank: 2,
    };
  }

  return null;
}

function detectCultureCapabilityMismatch(dimensionScores: any, tensions: any[]): OrgScenario | null {
  if (!dimensionScores || typeof dimensionScores !== 'object') {
    return null;
  }
  
  const fluencyScore = dimensionScores?.ai_fluency || 0;
  const alignmentScore = dimensionScores?.alignment_communication || 0;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;

  const hasSkillsTension = tensions?.some(t => t.dimension_key === 'ai_fluency' || t.summary_line.toLowerCase().includes('skill'));

  // High ambition, low team readiness
  if (experimentationScore > 60 && fluencyScore < 45) {
    return {
      scenario_key: 'culture_capability_mismatch',
      summary: "You are pushing for AI adoption faster than your team can absorb it. People want to help but lack the skills and confidence. Slow down to speed up: invest in hands-on training and celebrate small wins to build capability.",
      priority_rank: 1,
    };
  }

  if (hasSkillsTension && alignmentScore < 55) {
    return {
      scenario_key: 'culture_capability_mismatch',
      summary: 'The gap between leadership intent and team capability is creating frustration. Bridge it with practical training, clear use cases, and safe spaces to experiment.',
      priority_rank: 2,
    };
  }

  return null;
}
