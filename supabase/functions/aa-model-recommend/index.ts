/**
 * aa-model-recommend Edge Function
 *
 * Returns AI model recommendations based on live Artificial Analysis benchmarks.
 * Maps use cases to benchmark dimensions and ranks models by quality/cost.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getModelBenchmarks } from "../_shared/aa-cache.ts";
import type { AAModel, AAModelRecommendation } from "../_shared/aa-types.ts";
import { AA_ATTRIBUTION } from "../_shared/aa-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map use cases to benchmark dimensions
const USE_CASE_DIMENSIONS: Record<
  string,
  { primary: keyof AAModel; secondary: keyof AAModel; label: string }
> = {
  general: {
    primary: "artificial_analysis_intelligence_index",
    secondary: "median_output_tokens_per_second",
    label: "General Advisor",
  },
  meeting: {
    primary: "artificial_analysis_intelligence_index",
    secondary: "price_1m_blended_3_to_1",
    label: "Meeting Prep",
  },
  decision: {
    primary: "artificial_analysis_intelligence_index",
    secondary: "mmlu_pro",
    label: "Decision Support",
  },
  code: {
    primary: "artificial_analysis_coding_index",
    secondary: "live_code_bench",
    label: "Code Review",
  },
  email: {
    primary: "median_output_tokens_per_second",
    secondary: "price_1m_blended_3_to_1",
    label: "Email Drafting",
  },
  strategy: {
    primary: "artificial_analysis_intelligence_index",
    secondary: "gpqa",
    label: "Strategic Planning",
  },
};

function scoreModel(
  model: AAModel,
  primaryKey: keyof AAModel,
  secondaryKey: keyof AAModel
): { primary: number; secondary: number | null } {
  const primary = (model[primaryKey] as number) ?? 0;
  const secondary = model[secondaryKey] as number | null;
  return { primary, secondary };
}

function buildReasoning(
  model: AAModel,
  useCase: string,
  primaryScore: number,
  dims: { primary: keyof AAModel; secondary: keyof AAModel; label: string }
): string {
  const parts: string[] = [];

  if (useCase === "code") {
    parts.push(`Scores ${primaryScore} on coding benchmarks`);
  } else if (useCase === "email") {
    parts.push(`Outputs ${primaryScore} tokens/sec for fast drafting`);
  } else {
    parts.push(`Intelligence index: ${primaryScore}`);
  }

  const price = model.price_1m_blended_3_to_1;
  if (price != null) {
    parts.push(`$${price.toFixed(2)}/1M tokens`);
  }

  return parts.join("; ");
}

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

    const { useCase, platform } = await req.json();
    const dims = USE_CASE_DIMENSIONS[useCase] || USE_CASE_DIMENSIONS.general;

    const models = await getModelBenchmarks(supabase);

    if (models.length === 0) {
      return new Response(
        JSON.stringify({
          recommendations: [],
          use_case: useCase,
          platform: platform || null,
          attribution: AA_ATTRIBUTION,
          error: "Benchmark data temporarily unavailable",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score and rank models
    const scored = models
      .map((m) => {
        const { primary, secondary } = scoreModel(m, dims.primary, dims.secondary);
        return { model: m, primary, secondary };
      })
      .filter((s) => s.primary > 0)
      .sort((a, b) => b.primary - a.primary);

    // Top 3 recommendations
    const recommendations: AAModelRecommendation[] = scored
      .slice(0, 3)
      .map((s) => ({
        model_name: s.model.name,
        creator: s.model.model_creator?.name || "Unknown",
        primary_score: s.primary,
        secondary_score: s.secondary,
        price_per_1m_tokens: s.model.price_1m_blended_3_to_1,
        reasoning: buildReasoning(s.model, useCase, s.primary, dims),
      }));

    return new Response(
      JSON.stringify({
        recommendations,
        use_case: useCase,
        platform: platform || null,
        attribution: AA_ATTRIBUTION,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("aa-model-recommend error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate recommendations" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
