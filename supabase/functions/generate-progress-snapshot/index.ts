// Phase 2: Generate Progress Snapshot
// Creates a snapshot of current dimension scores and compares to baseline

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leaderId, assessmentId } = await req.json()

    if (!leaderId) {
      throw new Error('leaderId is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get baseline (first assessment)
    const { data: baseline, error: baselineError } = await supabaseClient
      .from('leader_assessments')
      .select('id, created_at, leader_dimension_scores(*)')
      .eq('leader_id', leaderId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (baselineError && baselineError.code !== 'PGRST116') {
      console.error('Error fetching baseline:', baselineError)
      throw baselineError
    }

    // Get latest assessment (current)
    const latestAssessmentId = assessmentId || baseline?.id
    if (!latestAssessmentId) {
      throw new Error('No assessment found for this leader')
    }

    const { data: latest, error: latestError } = await supabaseClient
      .from('leader_assessments')
      .select('id, created_at, leader_dimension_scores(*)')
      .eq('id', latestAssessmentId)
      .single()

    if (latestError) {
      console.error('Error fetching latest assessment:', latestError)
      throw latestError
    }

    // Compute dimension scores
    const dimensionScores: Record<string, number> = {}
    const comparisonToBaseline: Record<string, number> = {}

    if (latest.leader_dimension_scores) {
      for (const dimension of latest.leader_dimension_scores) {
        dimensionScores[dimension.dimension_key] = dimension.score || 0

        // Find baseline score for this dimension
        if (baseline?.leader_dimension_scores) {
          const baselineScore = baseline.leader_dimension_scores.find(
            (d: any) => d.dimension_key === dimension.dimension_key
          )
          if (baselineScore) {
            comparisonToBaseline[dimension.dimension_key] = 
              (dimension.score || 0) - (baselineScore.score || 0)
          }
        }
      }
    }

    // Get completed missions count
    const { count: completedCount } = await supabaseClient
      .from('leader_missions')
      .select('id', { count: 'exact', head: true })
      .eq('leader_id', leaderId)
      .eq('status', 'completed')

    // Get active missions count
    const { count: activeCount } = await supabaseClient
      .from('leader_missions')
      .select('id', { count: 'exact', head: true })
      .eq('leader_id', leaderId)
      .eq('status', 'active')

    // Calculate benchmark score (average of dimension scores)
    const scores = Object.values(dimensionScores)
    const benchmarkScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    // Determine benchmark tier
    const benchmarkTier = 
      benchmarkScore >= 80 ? 'Leading' :
      benchmarkScore >= 60 ? 'Advancing' :
      benchmarkScore >= 40 ? 'Establishing' :
      'Emerging'

    // Determine snapshot type
    const snapshotType = baseline?.id === latest.id ? 'baseline' : 'monthly'

    // Create snapshot
    const { data: snapshot, error: insertError } = await supabaseClient
      .from('leader_progress_snapshots')
      .insert({
        leader_id: leaderId,
        assessment_id: latest.id,
        snapshot_type: snapshotType,
        snapshot_date: new Date().toISOString(),
        dimension_scores: dimensionScores,
        comparison_to_baseline: comparisonToBaseline,
        completed_missions_count: completedCount || 0,
        active_missions_count: activeCount || 0,
        benchmark_tier: benchmarkTier,
        benchmark_score: benchmarkScore
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating snapshot:', insertError)
      throw insertError
    }

    console.log('Progress snapshot created:', snapshot.id)

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: snapshot,
        baseline: baseline,
        improvement: Object.keys(comparisonToBaseline).length > 0 ? comparisonToBaseline : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in generate-progress-snapshot:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
