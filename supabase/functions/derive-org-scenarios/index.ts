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

    console.log('🎯 Deriving org scenarios for assessment:', assessment_id);

    const scenarios: OrgScenario[] = [];

    // Detect scenarios based on dimension patterns
    const stagnationScenario = detectStagnationLoop(dimension_scores);
    if (stagnationScenario) scenarios.push(stagnationScenario);

    const shadowAIScenario = detectShadowAIInstability(dimension_scores, risk_signals);
    if (shadowAIScenario) scenarios.push(shadowAIScenario);

    const highVelocityScenario = detectHighVelocityPath(dimension_scores, tensions);
    if (highVelocityScenario) scenarios.push(highVelocityScenario);

    const cultureMismatchScenario = detectCultureCapabilityMismatch(dimension_scores, tensions);
    if (cultureMismatchScenario) scenarios.push(cultureMismatchScenario);

    // Sort by priority and take top 3
    scenarios.sort((a, b) => a.priority_rank - b.priority_rank);
    const topScenarios = scenarios.slice(0, 3);

    // Store scenarios in database
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
        console.error('Error storing scenario:', error);
      }
    }

    console.log('✅ Derived and stored', topScenarios.length, 'org scenarios');

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
  const avgScore = Object.values(dimensionScores).reduce((sum: number, score: any) => sum + score, 0) / 6;
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
      summary: 'Analysis paralysis has set in. Your team is waiting for perfect clarity that won't come. Launch a small, safe pilot to generate real learning and momentum.',
      priority_rank: 2,
    };
  }

  return null;
}

function detectShadowAIInstability(dimensionScores: any, riskSignals: any[]): OrgScenario | null {
  const governanceScore = dimensionScores?.risk_governance || 0;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;
  
  const hasShadowAIRisk = riskSignals?.some(r => r.risk_key === 'shadow_ai' && r.level !== 'low');

  // High experimentation, low governance
  if (experimentationScore > 60 && governanceScore < 50) {
    return {
      scenario_key: 'shadow_ai_instability',
      summary: 'Your team is moving fast with AI tools, but without shared frameworks or oversight. This creates short-term productivity but risks quality issues, data leaks, and scattered learning. You're one bad output away from losing executive confidence.',
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
  const avgScore = Object.values(dimensionScores).reduce((sum: number, score: any) => sum + score, 0) / 6;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;
  const alignmentScore = dimensionScores?.alignment_communication || 0;

  const fewTensions = !tensions || tensions.length <= 1;

  // High scores across dimensions with good alignment
  if (avgScore > 65 && experimentationScore > 60 && alignmentScore > 60 && fewTensions) {
    return {
      scenario_key: 'high_velocity_path',
      summary: 'You're on a strong trajectory. Teams are experimenting, learning is shared, and governance is proportionate. Your next challenge is scaling what works without losing speed. Focus on institutionalizing successful patterns.',
      priority_rank: 1,
    };
  }

  if (experimentationScore > 70 && alignmentScore > 65) {
    return {
      scenario_key: 'high_velocity_path',
      summary: 'Momentum is building. Experimentation is happening and teams are aligned. Capture learnings systematically and double down on what's working.',
      priority_rank: 2,
    };
  }

  return null;
}

function detectCultureCapabilityMismatch(dimensionScores: any, tensions: any[]): OrgScenario | null {
  const fluencyScore = dimensionScores?.ai_fluency || 0;
  const alignmentScore = dimensionScores?.alignment_communication || 0;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;

  const hasSkillsTension = tensions?.some(t => t.dimension_key === 'ai_fluency' || t.summary_line.toLowerCase().includes('skill'));

  // High ambition, low team readiness
  if (experimentationScore > 60 && fluencyScore < 45) {
    return {
      scenario_key: 'culture_capability_mismatch',
      summary: 'You're pushing for AI adoption faster than your team can absorb it. People want to help but lack the skills and confidence. Slow down to speed up: invest in hands-on training and celebrate small wins to build capability.',
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
