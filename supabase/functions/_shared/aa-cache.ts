/**
 * Artificial Analysis API - Cache Layer
 *
 * Caches AA API responses in the ai_response_cache table.
 * TTL: 6 hours. Fail-open: returns null on cache errors.
 * Reuses the existing ai-cache.ts patterns.
 */

import type { AAModel, AAMediaModel } from "./aa-types.ts";
import { fetchLLMModels, fetchTTSModels, fetchImageModels } from "./artificial-analysis.ts";

const AA_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const CACHE_KEYS = {
  llm: "aa:llm_models",
  tts: "aa:tts_models",
  image: "aa:image_models",
} as const;

/**
 * Read from cache, returning null if expired or missing
 */
async function readCache<T>(supabase: any, cacheKey: string): Promise<T | null> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ai_response_cache")
      .select("response")
      .eq("prompt_hash", cacheKey)
      .eq("model", "artificial-analysis")
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    console.log(`Cache hit for ${cacheKey}`);
    return data.response as T;
  } catch {
    return null;
  }
}

/**
 * Write to cache (best-effort, never throws)
 */
async function writeCache(supabase: any, cacheKey: string, data: unknown): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + AA_CACHE_TTL_MS).toISOString();

    // Delete old entry first (upsert on composite key)
    await supabase
      .from("ai_response_cache")
      .delete()
      .eq("prompt_hash", cacheKey)
      .eq("model", "artificial-analysis");

    await supabase.from("ai_response_cache").insert({
      prompt_hash: cacheKey,
      model: "artificial-analysis",
      response: data,
      expires_at: expiresAt,
    });

    console.log(`Cached ${cacheKey} (TTL: 6h)`);
  } catch (err) {
    console.warn(`Cache write failed for ${cacheKey}:`, err);
  }
}

/**
 * Get LLM model benchmarks (cached, fail-open)
 */
export async function getModelBenchmarks(supabase: any): Promise<AAModel[]> {
  const cached = await readCache<AAModel[]>(supabase, CACHE_KEYS.llm);
  if (cached) return cached;

  try {
    const models = await fetchLLMModels();
    await writeCache(supabase, CACHE_KEYS.llm, models);
    return models;
  } catch (err) {
    console.error("Failed to fetch AA LLM data:", err);
    return [];
  }
}

/**
 * Get TTS model ratings (cached, fail-open)
 */
export async function getTTSRatings(supabase: any): Promise<AAMediaModel[]> {
  const cached = await readCache<AAMediaModel[]>(supabase, CACHE_KEYS.tts);
  if (cached) return cached;

  try {
    const models = await fetchTTSModels();
    await writeCache(supabase, CACHE_KEYS.tts, models);
    return models;
  } catch (err) {
    console.error("Failed to fetch AA TTS data:", err);
    return [];
  }
}

/**
 * Get image model ratings (cached, fail-open)
 */
export async function getImageRatings(supabase: any): Promise<AAMediaModel[]> {
  const cached = await readCache<AAMediaModel[]>(supabase, CACHE_KEYS.image);
  if (cached) return cached;

  try {
    const models = await fetchImageModels();
    await writeCache(supabase, CACHE_KEYS.image, models);
    return models;
  } catch (err) {
    console.error("Failed to fetch AA Image data:", err);
    return [];
  }
}
