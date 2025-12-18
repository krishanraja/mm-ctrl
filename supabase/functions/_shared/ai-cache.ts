/**
 * AI Response Caching Utility
 * Caches AI responses to reduce API costs and improve response times
 * Uses Supabase database for persistent caching across edge function instances
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface CachedResponse {
  id: string;
  prompt_hash: string;
  model: string;
  response: any;
  created_at: string;
  expires_at: string;
}

/**
 * Generate a hash from a prompt string
 * Uses simple hash function (for production, consider crypto.subtle)
 */
export function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if a cached response exists and is still valid
 * 
 * @param supabase Supabase client (with service role key)
 * @param promptHash Hash of the prompt
 * @param model AI model used (e.g., 'gpt-4o', 'gemini-2.0-flash')
 * @param cacheTtlMs Cache TTL in milliseconds (default: 24 hours)
 * @returns Cached response if found and valid, null otherwise
 */
export async function getCachedResponse(
  supabase: any,
  promptHash: string,
  model: string,
  cacheTtlMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<any | null> {
  try {
    // Ensure cache table exists
    await ensureCacheTable(supabase);

    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('ai_response_cache')
      .select('*')
      .eq('prompt_hash', promptHash)
      .eq('model', model)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    console.log('✅ Cache hit for prompt hash:', promptHash);
    return data.response;
  } catch (error) {
    console.error('Cache lookup error:', error);
    return null; // Fail open - return null on error
  }
}

/**
 * Store a response in the cache
 * 
 * @param supabase Supabase client (with service role key)
 * @param promptHash Hash of the prompt
 * @param model AI model used
 * @param response The AI response to cache
 * @param cacheTtlMs Cache TTL in milliseconds (default: 24 hours)
 */
export async function setCachedResponse(
  supabase: any,
  promptHash: string,
  model: string,
  response: any,
  cacheTtlMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<void> {
  try {
    // Ensure cache table exists
    await ensureCacheTable(supabase);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + cacheTtlMs);

    const { error } = await supabase
      .from('ai_response_cache')
      .insert({
        prompt_hash: promptHash,
        model,
        response,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('Cache store error:', error);
      // Don't throw - caching is best effort
    } else {
      console.log('✅ Cached response for prompt hash:', promptHash);
    }
  } catch (error) {
    console.error('Cache store error:', error);
    // Don't throw - caching is best effort
  }
}

/**
 * Clean up expired cache entries
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredCache(supabase: any): Promise<number> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('ai_response_cache')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Cleaned up ${deletedCount} expired cache entries`);
    return deletedCount;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

/**
 * Ensure cache table exists (fallback - should be created via migration)
 */
async function ensureCacheTable(supabase: any): Promise<void> {
  try {
    // Try to query the table - if it fails, table doesn't exist
    await supabase
      .from('ai_response_cache')
      .select('id')
      .limit(1);
  } catch (error) {
    // Table doesn't exist - create it
    // Note: This requires service role key and may fail in some environments
    // Better to create via migration
    console.warn('ai_response_cache table may not exist. Create via migration.');
  }
}

/**
 * Normalize prompt for caching (remove variable data like timestamps, IDs)
 * This helps cache similar prompts even if they have slight variations
 */
export function normalizePromptForCache(prompt: string): string {
  // Remove common variable patterns
  return prompt
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[\d.Z-]+/g, '[TIMESTAMP]') // ISO timestamps
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID]') // UUIDs
    .replace(/session[_-]?id["\s:=]+[a-zA-Z0-9_-]+/gi, 'session_id=[SESSION]') // Session IDs
    .replace(/assessment[_-]?id["\s:=]+[a-zA-Z0-9_-]+/gi, 'assessment_id=[ASSESSMENT]') // Assessment IDs
    .trim();
}

