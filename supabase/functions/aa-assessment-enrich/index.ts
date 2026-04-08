/**
 * aa-assessment-enrich Edge Function
 *
 * Enriches AI literacy assessment results with live Artificial Analysis
 * benchmark data. Returns price-performance frontier data and personalized
 * model recommendations based on the user's detected AI tools.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getModelBenchmarks } from "../_shared/aa-cache.ts";
import { AA_ATTRIBUTION } from "../_shared/aa-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map detected tool flags to model name search terms
const TOOL_TO_MODEL: Record<string, string[]> = {
  usesChatGPT: ["gpt-4o", "gpt-4", "chatgpt"],
  usesNotionAI: ["notion"],
  usesGrammarlyAI: ["grammarly"],
  usesClaude: ["claude"],
  usesGemini: ["gemini"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { detectedTools, scores } = await req.json();

    const models = await getModelBenchmarks(supabase);

    if (models.length === 0) {
      return new Response(
        JSON.stringify({
          detected_tools: [],
          frontier_models: [],
          recommendations: [],
          gap_analysis: null,
          attribution: AA_ATTRIBUTION,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort models by intelligence index for frontier calculation
    const rankedModels = models
      .filter((m) => m.artificial_analysis_intelligence_index != null)
      .sort(
        (a, b) =>
          (b.artificial_analysis_intelligence_index ?? 0) -
          (a.artificial_analysis_intelligence_index ?? 0)
      );

    // Match detected tools to benchmark data
    const detectedToolData = Object.entries(detectedTools || {})
      .filter(([_, used]) => used === true)
      .map(([toolKey]) => {
        const searchTerms = TOOL_TO_MODEL[toolKey] || [];
        const matched = rankedModels.find((m) =>
          searchTerms.some(
            (term) =>
              m.name?.toLowerCase().includes(term) ||
              m.slug?.toLowerCase().includes(term)
          )
        );

        const rank = matched
          ? rankedModels.findIndex((rm) => rm.id === matched.id) + 1
          : null;

        return {
          name: toolKey.replace(/^uses/, "").replace(/AI$/, " AI"),
          benchmark_rank: rank,
          intelligence_score: matched?.artificial_analysis_intelligence_index ?? null,
          price_per_1m_tokens: matched?.price_1m_blended_3_to_1 ?? null,
        };
      });

    // Frontier models: top 8 by intelligence, with pricing
    const frontierModels = rankedModels.slice(0, 8).map((m) => ({
      name: m.name,
      creator: m.model_creator?.name || "Unknown",
      intelligence_score: m.artificial_analysis_intelligence_index ?? 0,
      price_per_1m_tokens: m.price_1m_blended_3_to_1 ?? null,
    }));

    // Personalized recommendations
    const recommendations: string[] = [];

    const bestDetected = detectedToolData
      .filter((d) => d.intelligence_score != null)
      .sort((a, b) => (b.intelligence_score ?? 0) - (a.intelligence_score ?? 0));

    if (bestDetected.length > 0 && rankedModels.length > 0) {
      const topScore = rankedModels[0].artificial_analysis_intelligence_index ?? 0;
      const userBest = bestDetected[0].intelligence_score ?? 0;
      const gap = topScore - userBest;

      if (gap > 10) {
        recommendations.push(
          `${rankedModels[0].name} scores ${gap.toFixed(0)} points higher than your current best tool on intelligence benchmarks.`
        );
      }
    }

    // Cost optimization recommendation
    const cheapGood = rankedModels.find(
      (m) =>
        (m.artificial_analysis_intelligence_index ?? 0) > 70 &&
        (m.price_1m_blended_3_to_1 ?? 999) < 1.0
    );
    if (cheapGood) {
      recommendations.push(
        `${cheapGood.name} offers strong reasoning (score: ${cheapGood.artificial_analysis_intelligence_index}) at just $${cheapGood.price_1m_blended_3_to_1?.toFixed(2)}/1M tokens.`
      );
    }

    // Gap analysis
    let gapAnalysis: string | null = null;
    if (detectedToolData.length === 0) {
      gapAnalysis =
        "No AI tools detected. The current model landscape offers strong options across price points.";
    } else if (
      detectedToolData.every((d) => d.intelligence_score == null)
    ) {
      gapAnalysis =
        "Your detected tools are not yet benchmarked. Consider trying top-ranked models for critical tasks.";
    }

    return new Response(
      JSON.stringify({
        detected_tools: detectedToolData,
        frontier_models: frontierModels,
        recommendations,
        gap_analysis: gapAnalysis,
        attribution: AA_ATTRIBUTION,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("aa-assessment-enrich error:", err);
    return new Response(
      JSON.stringify({ error: "Assessment enrichment failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
