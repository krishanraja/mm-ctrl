import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { leader_id, assessment_id, snapshot_type = "assessment" } = await req.json();

    if (!leader_id) {
      return new Response(
        JSON.stringify({ error: "leader_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get current dimension scores from the latest assessment
    let targetAssessmentId = assessment_id;
    if (!targetAssessmentId) {
      const { data: latestAssessment } = await supabase
        .from("leader_assessments")
        .select("id, benchmark_score, benchmark_tier")
        .eq("leader_id", leader_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!latestAssessment) {
        return new Response(
          JSON.stringify({ error: "No assessment found for this leader" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      targetAssessmentId = latestAssessment.id;
    }

    // Step 2: Fetch dimension scores
    const { data: dimensionScores, error: scoresError } = await supabase
      .from("leader_dimension_scores")
      .select("dimension_key, score_numeric")
      .eq("assessment_id", targetAssessmentId);

    if (scoresError) {
      return new Response(
        JSON.stringify({ error: scoresError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Build dimension_scores JSONB
    const scores: Record<string, number> = {};
    for (const dim of dimensionScores || []) {
      scores[dim.dimension_key] = dim.score_numeric || 0;
    }

    // Step 4: Get assessment benchmark data
    const { data: assessmentData } = await supabase
      .from("leader_assessments")
      .select("benchmark_score, benchmark_tier")
      .eq("id", targetAssessmentId)
      .single();

    // Step 5: Compute comparison to baseline (first snapshot)
    const { data: firstSnapshot } = await supabase
      .from("leader_progress_snapshots")
      .select("dimension_scores")
      .eq("leader_id", leader_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const comparison: Record<string, number> = {};
    if (firstSnapshot?.dimension_scores) {
      const baseline = firstSnapshot.dimension_scores as Record<string, number>;
      for (const key of Object.keys(scores)) {
        comparison[key] = scores[key] - (baseline[key] || 0);
      }
    }

    // Step 6: Insert new snapshot
    const { data: newSnapshot, error: insertError } = await supabase
      .from("leader_progress_snapshots")
      .insert({
        leader_id,
        assessment_id: targetAssessmentId,
        dimension_scores: scores,
        comparison_to_baseline: comparison,
        benchmark_score: assessmentData?.benchmark_score || null,
        benchmark_tier: assessmentData?.benchmark_tier || null,
        snapshot_type,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: newSnapshot,
        dimensions: Object.keys(scores).length,
        hasComparison: Object.keys(comparison).length > 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-progress-snapshot:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
