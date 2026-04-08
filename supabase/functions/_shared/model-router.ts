/**
 * Dynamic Model Router
 *
 * Selects the cheapest AI model meeting quality thresholds for each task type.
 * Uses Artificial Analysis benchmark data. Falls back to hardcoded defaults
 * if AA data is unavailable or routing is disabled.
 */

import { getModelBenchmarks } from "./aa-cache.ts";
import type { AAModel, TaskProfile, ModelSelection, ModelCapability } from "./aa-types.ts";
import { TASK_PROFILES } from "./aa-types.ts";

/**
 * Get the benchmark score for a model based on the requested capability
 */
function getCapabilityScore(model: AAModel, capability: ModelCapability): number {
  switch (capability) {
    case "intelligence":
      return model.artificial_analysis_intelligence_index ?? 0;
    case "coding":
      return model.artificial_analysis_coding_index ?? 0;
    case "math":
      return model.artificial_analysis_math_index ?? 0;
    case "speed":
      return model.median_output_tokens_per_second ?? 0;
  }
}

/**
 * Hardcoded fallback model selections (matches existing openai-utils.ts behavior)
 */
const FALLBACK_SELECTIONS: Record<string, ModelSelection> = {
  briefing_script: {
    model: "gpt-4o",
    provider: "openai",
    qualityScore: 0,
    costPer1MTokens: null,
    reasoning: "Default fallback",
  },
  briefing_curation: {
    model: "gpt-4o-mini",
    provider: "openai",
    qualityScore: 0,
    costPer1MTokens: null,
    reasoning: "Default fallback",
  },
  edge_synthesis: {
    model: "gpt-4o",
    provider: "openai",
    qualityScore: 0,
    costPer1MTokens: null,
    reasoning: "Default fallback",
  },
  coaching_analysis: {
    model: "gpt-4o-mini",
    provider: "openai",
    qualityScore: 0,
    costPer1MTokens: null,
    reasoning: "Default fallback",
  },
  transcript_cleanup: {
    model: "gpt-4o-mini",
    provider: "openai",
    qualityScore: 0,
    costPer1MTokens: null,
    reasoning: "Default fallback",
  },
  code_review: {
    model: "gpt-4o",
    provider: "openai",
    qualityScore: 0,
    costPer1MTokens: null,
    reasoning: "Default fallback",
  },
};

/**
 * Select the optimal model for a task based on live benchmark data.
 * Returns the cheapest model that meets the quality threshold.
 *
 * @param taskName - Key from TASK_PROFILES (e.g., 'briefing_script')
 * @param supabase - Supabase client for cache access
 * @returns ModelSelection with the chosen model and reasoning
 */
export async function selectOptimalModel(
  taskName: string,
  supabase: any
): Promise<ModelSelection> {
  const profile = TASK_PROFILES[taskName];
  if (!profile) {
    console.warn(`Unknown task profile: ${taskName}, using fallback`);
    return FALLBACK_SELECTIONS[taskName] || FALLBACK_SELECTIONS.briefing_script;
  }

  // Check if routing is enabled
  const routingEnabled = Deno.env.get("MODEL_ROUTING_ENABLED") === "true";
  if (!routingEnabled) {
    const fallback = FALLBACK_SELECTIONS[taskName] || FALLBACK_SELECTIONS.briefing_script;
    return { ...fallback, reasoning: "Routing disabled; using default" };
  }

  try {
    const models = await getModelBenchmarks(supabase);

    if (models.length === 0) {
      return FALLBACK_SELECTIONS[taskName] || FALLBACK_SELECTIONS.briefing_script;
    }

    // Filter models meeting quality threshold
    const qualifying = models
      .map((m) => ({
        model: m,
        score: getCapabilityScore(m, profile.capability),
        cost: m.price_1m_blended_3_to_1,
      }))
      .filter((entry) => entry.score >= profile.minQuality)
      .filter(
        (entry) =>
          !profile.maxCostPer1MTokens ||
          (entry.cost != null && entry.cost <= profile.maxCostPer1MTokens)
      )
      .filter(
        (entry) =>
          !profile.preferredProviders ||
          profile.preferredProviders.some(
            (p) =>
              entry.model.model_creator?.name?.toLowerCase().includes(p) ||
              entry.model.slug?.toLowerCase().includes(p)
          )
      );

    if (qualifying.length === 0) {
      console.log(`No models meet threshold for ${taskName}, using fallback`);
      return FALLBACK_SELECTIONS[taskName] || FALLBACK_SELECTIONS.briefing_script;
    }

    // Sort by cost ascending (cheapest first), then by quality descending as tiebreaker
    qualifying.sort((a, b) => {
      const costA = a.cost ?? 999;
      const costB = b.cost ?? 999;
      if (costA !== costB) return costA - costB;
      return b.score - a.score;
    });

    const best = qualifying[0];
    const selection: ModelSelection = {
      model: best.model.slug || best.model.name,
      provider: best.model.model_creator?.name || "unknown",
      qualityScore: best.score,
      costPer1MTokens: best.cost,
      reasoning: `Score ${best.score} on ${profile.capability} (min: ${profile.minQuality}), $${best.cost?.toFixed(2) ?? "?"}/1M tokens`,
    };

    console.log(
      `Model router [${taskName}]: selected ${selection.model} (${selection.reasoning})`
    );
    return selection;
  } catch (err) {
    console.error(`Model router error for ${taskName}:`, err);
    return FALLBACK_SELECTIONS[taskName] || FALLBACK_SELECTIONS.briefing_script;
  }
}
