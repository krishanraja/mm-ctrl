/**
 * Artificial Analysis API - Shared Types
 *
 * Type definitions for the Artificial Analysis benchmarking API.
 * Used across edge functions for model recommendations, routing, and monitoring.
 */

// ── LLM Model ─────────────────────────────────────────────────────

export interface AAModelCreator {
  name: string;
  slug: string;
}

export interface AAModel {
  id: number;
  name: string;
  slug: string;
  model_creator: AAModelCreator;
  artificial_analysis_intelligence_index: number | null;
  artificial_analysis_coding_index: number | null;
  artificial_analysis_math_index: number | null;
  mmlu_pro: number | null;
  gpqa: number | null;
  hle: number | null;
  live_code_bench: number | null;
  sci_code: number | null;
  math_500: number | null;
  aime: number | null;
  median_output_tokens_per_second: number | null;
  median_time_to_first_token_seconds: number | null;
  price_1m_blended_3_to_1: number | null;
  price_1m_input_tokens: number | null;
  price_1m_output_tokens: number | null;
}

// ── Media Models (TTS, Image, Video) ──────────────────────────────

export interface AAMediaModel {
  id: number;
  name: string;
  slug: string;
  model_creator: AAModelCreator;
  elo_rating: number | null;
  elo_rating_ci_lower: number | null;
  elo_rating_ci_upper: number | null;
  appearances: number | null;
  release_date: string | null;
}

export type AATTSModel = AAMediaModel;
export type AAImageModel = AAMediaModel;

// ── Recommendation Output ─────────────────────────────────────────

export interface AAModelRecommendation {
  model_name: string;
  creator: string;
  primary_score: number;
  secondary_score: number | null;
  price_per_1m_tokens: number | null;
  reasoning: string;
}

// ── Model Router Types ────────────────────────────────────────────

export type ModelCapability = 'intelligence' | 'coding' | 'math' | 'speed';

export interface TaskProfile {
  capability: ModelCapability;
  minQuality: number;
  maxCostPer1MTokens?: number;
  preferredProviders?: string[];
}

export interface ModelSelection {
  model: string;
  provider: string;
  qualityScore: number;
  costPer1MTokens: number | null;
  reasoning: string;
}

export const TASK_PROFILES: Record<string, TaskProfile> = {
  briefing_script: { capability: 'intelligence', minQuality: 75 },
  briefing_curation: { capability: 'intelligence', minQuality: 55 },
  edge_synthesis: { capability: 'intelligence', minQuality: 70 },
  coaching_analysis: { capability: 'intelligence', minQuality: 60 },
  transcript_cleanup: { capability: 'speed', minQuality: 40 },
  code_review: { capability: 'coding', minQuality: 70 },
};

// ── Attribution ───────────────────────────────────────────────────

export const AA_ATTRIBUTION = "Benchmark data from Artificial Analysis";
