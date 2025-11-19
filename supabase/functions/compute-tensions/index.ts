import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Tension {
  dimension_key: string;
  summary_line: string;
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

    const { assessment_id, dimension_scores, assessment_data, profile_data } = await req.json();

    console.log('⚡ Computing tensions for assessment:', assessment_id);

    const tensions: Tension[] = [];

    // Check for Vision-Execution Gap (high strategy, low experimentation)
    const visionExecutionGap = detectVisionExecutionGap(dimension_scores, assessment_data);
    if (visionExecutionGap) tensions.push(visionExecutionGap);

    // Check for Leadership-Team Disconnect (high personal use, low team sponsorship)
    const leadershipTeamDisconnect = detectLeadershipTeamDisconnect(dimension_scores, assessment_data);
    if (leadershipTeamDisconnect) tensions.push(leadershipTeamDisconnect);

    // Check for Priority-Action Mismatch (AI critical, but no time allocated)
    const priorityActionMismatch = detectPriorityActionMismatch(assessment_data, profile_data);
    if (priorityActionMismatch) tensions.push(priorityActionMismatch);

    // Check for Delegation-Control Paradox (wants to delegate, but doesn't trust AI)
    const delegationControlParadox = detectDelegationControlParadox(dimension_scores, assessment_data);
    if (delegationControlParadox) tensions.push(delegationControlParadox);

    // Store tensions in database
    for (const tension of tensions) {
      const { error } = await supabase
        .from('leader_tensions')
        .insert({
          assessment_id,
          dimension_key: tension.dimension_key,
          summary_line: tension.summary_line,
          priority_rank: tension.priority_rank,
        });

      if (error) {
        console.error('Error storing tension:', error);
      }
    }

    console.log('✅ Computed and stored', tensions.length, 'tensions');

    return new Response(
      JSON.stringify({ tensions, count: tensions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error computing tensions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectVisionExecutionGap(dimensionScores: any, assessmentData: any): Tension | null {
  const fluencyScore = dimensionScores?.ai_fluency || 0;
  const experimentationScore = dimensionScores?.experimentation_cadence || 0;
  const businessImpact = assessmentData?.businessImpact || 'incremental';

  // High vision/awareness but low action
  if (fluencyScore > 65 && experimentationScore < 45) {
    return {
      dimension_key: 'experimentation_cadence',
      summary_line: "You see AI as critical but have not launched pilots. This gap will widen—move from planning to testing.",
      priority_rank: 1,
    };
  }

  if (businessImpact === 'transformative' && experimentationScore < 50) {
    return {
      dimension_key: 'experimentation_cadence',
      summary_line: "Transformative ambition meets incremental execution. Start small pilots now to build momentum.",
      priority_rank: 2,
    };
  }

  return null;
}

function detectLeadershipTeamDisconnect(dimensionScores: any, assessmentData: any): Tension | null {
  const personalAIUse = assessmentData?.personalAIUsage || 'none';
  const teamAlignment = assessmentData?.teamAlignment || 'low';
  const alignmentScore = dimensionScores?.alignment_communication || 0;

  // High personal use, low team engagement
  if (personalAIUse === 'daily' && alignmentScore < 50) {
    return {
      dimension_key: 'alignment_communication',
      summary_line: "Using AI daily yourself but team reports low clarity. They need your vision translated into action.",
      priority_rank: 1,
    };
  }

  if (personalAIUse !== 'none' && teamAlignment === 'low') {
    return {
      dimension_key: 'alignment_communication',
      summary_line: "You are exploring AI but your team is not following. Share learnings and set clear expectations.",
      priority_rank: 2,
    };
  }

  return null;
}

function detectPriorityActionMismatch(assessmentData: any, profileData: any): Tension | null {
  const businessImpact = assessmentData?.businessImpact || 'incremental';
  const timing = assessmentData?.timing || '12+';
  const timeBreakdown = profileData?.timeBreakdown;

  // Says AI is critical but no time allocated
  if ((businessImpact === 'transformative' || timing === '0-3') && timeBreakdown) {
    const aiTimePercent = timeBreakdown.ai_work || 0;
    
    if (aiTimePercent < 10) {
      return {
        dimension_key: 'decision_velocity',
        summary_line: "AI is urgent but you are allocating less than 10% of your time. Calendars do not lie—priorities need time.",
        priority_rank: 1,
      };
    }
  }

  if (timing === '0-3' && !assessmentData?.sponsorshipBehavior) {
    return {
      dimension_key: 'decision_velocity',
      summary_line: "Aggressive timeline but no clear ownership. Appoint pilots and remove blockers now.",
      priority_rank: 2,
    };
  }

  return null;
}

function detectDelegationControlParadox(dimensionScores: any, assessmentData: any): Tension | null {
  const delegationScore = dimensionScores?.delegation_augmentation || 0;
  const governanceScore = dimensionScores?.risk_governance || 0;

  // Wants to delegate but doesn't trust AI outputs
  if (delegationScore < 40 && governanceScore > 75) {
    return {
      dimension_key: 'delegation_augmentation',
      summary_line: "High control needs are limiting AI delegation. Define clear quality thresholds to unlock value.",
      priority_rank: 2,
    };
  }

  const painPoints = assessmentData?.painPoints || [];
  if (painPoints.includes('time') && delegationScore < 50) {
    return {
      dimension_key: 'delegation_augmentation',
      summary_line: "Time is your constraint but you are not delegating to AI. Start with low-risk tasks to build trust.",
      priority_rank: 1,
    };
  }

  return null;
}
