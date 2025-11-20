import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskSignal {
  risk_key: 'shadow_ai' | 'skills_gap' | 'roi_leakage' | 'decision_friction';
  level: 'low' | 'medium' | 'high';
  description: string;
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

    const { assessment_id, assessment_data, profile_data } = await req.json();

    console.log('🔍 Computing risk signals for assessment:', assessment_id);

    const risks: RiskSignal[] = [];

    // Analyze Shadow AI risk
    const shadowAIRisk = analyzeShadowAI(assessment_data, profile_data);
    if (shadowAIRisk) risks.push(shadowAIRisk);

    // Analyze Skills Gap risk
    const skillsGapRisk = analyzeSkillsGap(assessment_data, profile_data);
    if (skillsGapRisk) risks.push(skillsGapRisk);

    // Analyze ROI Leakage risk
    const roiLeakageRisk = analyzeROILeakage(assessment_data, profile_data);
    if (roiLeakageRisk) risks.push(roiLeakageRisk);

    // Analyze Decision Friction risk
    const decisionFrictionRisk = analyzeDecisionFriction(assessment_data, profile_data);
    if (decisionFrictionRisk) risks.push(decisionFrictionRisk);

    // Store risk signals in database
    for (const risk of risks) {
      const { error } = await supabase
        .from('leader_risk_signals')
        .insert({
          assessment_id,
          risk_key: risk.risk_key,
          level: risk.level,
          description: risk.description,
          priority_rank: risk.priority_rank,
        });

      if (error) {
        console.error('Error storing risk signal:', error);
        throw new Error(`Failed to store risk signal: ${error.message}`);
      }
    }

    console.log('✅ Computed and stored', risks.length, 'risk signals');

    // Update generation status AFTER all DB writes complete
    const { error: statusError } = await supabase
      .from('leader_assessments')
      .update({
        generation_status: {
          risks_computed: true,
          last_updated: new Date().toISOString(),
        },
      })
      .eq('id', assessment_id);

    if (statusError) {
      console.error('Failed to update generation status:', statusError);
    }

    return new Response(
      JSON.stringify({ risks, count: risks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error computing risk signals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeShadowAI(assessmentData: any, profileData: any): RiskSignal | null {
  const personalAIUse = assessmentData?.personalAIUsage || 'none';
  const teamAlignment = assessmentData?.teamAlignment || 'low';
  const governanceScore = assessmentData?.riskGovernanceScore || 0;

  let level: 'low' | 'medium' | 'high' = 'low';
  let description = '';

  if (personalAIUse === 'daily' && teamAlignment === 'low' && governanceScore < 40) {
    level = 'high';
    description = "Your team is experimenting with AI tools without centralized oversight, creating security and quality risks. One bad output could erode executive confidence.";
  } else if (personalAIUse !== 'none' && governanceScore < 60) {
    level = 'medium';
    description = 'AI usage is growing without clear frameworks. Establish lightweight governance now before risks compound.';
  } else {
    level = 'low';
    description = 'AI governance foundations are in place. Continue monitoring as usage scales.';
  }

  return {
    risk_key: 'shadow_ai',
    level,
    description,
    priority_rank: level === 'high' ? 1 : level === 'medium' ? 2 : 3,
  };
}

function analyzeSkillsGap(assessmentData: any, profileData: any): RiskSignal | null {
  const ambitionLevel = assessmentData?.businessImpact || 'low';
  const teamCapability = assessmentData?.teamAlignment || 'low';
  const fluencyScore = assessmentData?.aiFluencyScore || 0;

  let level: 'low' | 'medium' | 'high' = 'low';
  let description = '';

  if ((ambitionLevel === 'transformative' || ambitionLevel === 'high') && fluencyScore < 50) {
    level = 'high';
    description = 'High ambition for AI adoption but limited team training. This will slow execution and reduce ROI by 50%+.';
  } else if (fluencyScore < 60) {
    level = 'medium';
    description = 'Team capability is developing but trails your ambition. Invest in targeted upskilling now.';
  } else {
    level = 'low';
    description = 'Team capability aligns with goals. Maintain momentum through continued learning.';
  }

  return {
    risk_key: 'skills_gap',
    level,
    description,
    priority_rank: level === 'high' ? 1 : level === 'medium' ? 2 : 3,
  };
}

function analyzeROILeakage(assessmentData: any, profileData: any): RiskSignal | null {
  const experimentationScore = assessmentData?.experimentationScore || 0;
  const kpiConnection = assessmentData?.kpiConnection || 'none';
  const timing = assessmentData?.timing || '12+';

  let level: 'low' | 'medium' | 'high' = 'low';
  let description = '';

  if (experimentationScore > 60 && kpiConnection === 'none') {
    level = 'high';
    description = 'Running AI experiments without clear success metrics. Spending time and budget without capturing value.';
  } else if (experimentationScore > 40 && kpiConnection === 'loose') {
    level = 'medium';
    description = 'AI activity is happening but ROI tracking is weak. Connect pilots to business metrics to justify investment.';
  } else {
    level = 'low';
    description = 'AI initiatives are tied to measurable outcomes. Continue disciplined ROI tracking.';
  }

  return {
    risk_key: 'roi_leakage',
    level,
    description,
    priority_rank: level === 'high' ? 1 : level === 'medium' ? 2 : 3,
  };
}

function analyzeDecisionFriction(assessmentData: any, profileData: any): RiskSignal | null {
  const decisionVelocity = assessmentData?.decisionVelocityScore || 0;
  const timing = assessmentData?.timing || '12+';
  const timeBreakdown = profileData?.timeBreakdown;

  let level: 'low' | 'medium' | 'high' = 'low';
  let description = '';

  if (decisionVelocity < 40 && timing === '0-3') {
    level = 'high';
    description = 'Urgent AI timelines but slow decision-making. Competing priorities and unclear ownership are stalling progress.';
  } else if (decisionVelocity < 60) {
    level = 'medium';
    description = 'Decision-making is creating bottlenecks. Clarify ownership and streamline approval processes.';
  } else {
    level = 'low';
    description = 'Decisions are flowing at appropriate pace. Maintain clear ownership as complexity increases.';
  }

  return {
    risk_key: 'decision_friction',
    level,
    description,
    priority_rank: level === 'high' ? 1 : level === 'medium' ? 2 : 3,
  };
}
