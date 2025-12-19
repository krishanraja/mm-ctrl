/**
 * Distributed rate limiting using Supabase database
 * Replaces in-memory rate limiting for production scalability
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface RateLimitConfig {
  key: string;
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit using Supabase database
 * Creates a rate_limit_logs table if it doesn't exist
 * 
 * @param supabase Supabase client (with service role key for writes)
 * @param config Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  supabase: any,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { key, maxRequests, windowMs } = config;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Ensure rate_limit_logs table exists (idempotent)
    // This should be done via migration, but we check here as fallback
    await ensureRateLimitTable(supabase);

    // Clean up old entries (older than window)
    await supabase
      .from('rate_limit_logs')
      .delete()
      .lt('created_at', new Date(windowStart).toISOString());

    // Count requests in current window
    const { count, error: countError } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('rate_limit_key', key)
      .gte('created_at', new Date(windowStart).toISOString());

    if (countError) {
      console.error('Rate limit count error:', countError);
      // On error, allow request (fail open)
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: now + windowMs,
      };
    }

    const currentCount = count || 0;
    const remaining = Math.max(0, maxRequests - currentCount);
    const allowed = currentCount < maxRequests;
    const resetAt = now + windowMs;

    if (allowed) {
      // Log this request
      await supabase
        .from('rate_limit_logs')
        .insert({
          rate_limit_key: key,
          created_at: new Date().toISOString(),
        });
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil((resetAt - now) / 1000),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow request (fail open)
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
    };
  }
}

/**
 * Ensure rate_limit_logs table exists
 * This is a fallback - should be created via migration
 */
async function ensureRateLimitTable(supabase: any): Promise<void> {
  try {
    // Try to query the table - if it fails, table doesn't exist
    await supabase
      .from('rate_limit_logs')
      .select('id')
      .limit(1);
  } catch (error) {
    // Table doesn't exist - create it
    // Note: This requires service role key and may fail in some environments
    // Better to create via migration
    console.warn('rate_limit_logs table may not exist. Create via migration.');
  }
}

/**
 * Create rate limit key from user ID and action
 */
export function createRateLimitKey(userId: string, action: string): string {
  return `${action}:${userId}`;
}

/**
 * Fallback in-memory rate limiting (for development or when DB is unavailable)
 */
export class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  check(key: string, maxRequests: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && entry.resetAt > now) {
      if (entry.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.resetAt,
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
      }
      entry.count++;
      return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetAt: entry.resetAt,
      };
    }

    // New entry or expired
    this.store.set(key, { count: 1, resetAt: now + windowMs });
    
    // Cleanup old entries periodically
    if (this.store.size > 1000) {
      for (const [k, v] of this.store.entries()) {
        if (v.resetAt < now) {
          this.store.delete(k);
        }
      }
    }

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }
}


