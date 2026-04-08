/**
 * Artificial Analysis API - Frontend Types
 *
 * Mirrors backend types for API response shapes consumed by React components.
 */

export interface AAModelRecommendation {
  model_name: string;
  creator: string;
  primary_score: number;
  secondary_score: number | null;
  price_per_1m_tokens: number | null;
  reasoning: string;
}

export interface AAModelRecommendationResponse {
  recommendations: AAModelRecommendation[];
  use_case: string;
  platform: string | null;
  attribution: string;
}

export interface AABenchmarkEnrichment {
  detected_tools: {
    name: string;
    benchmark_rank: number | null;
    intelligence_score: number | null;
    price_per_1m_tokens: number | null;
  }[];
  frontier_models: {
    name: string;
    creator: string;
    intelligence_score: number;
    price_per_1m_tokens: number | null;
  }[];
  recommendations: string[];
  gap_analysis: string | null;
  attribution: string;
}

export interface AATTSSnapshot {
  provider: string;
  elo_rating: number | null;
  rank: number;
}

export const AA_ATTRIBUTION = "Benchmark data from Artificial Analysis";
