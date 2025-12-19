/**
 * Rate Limiting Utility for Edge Functions
 * 
 * Purpose: Prevents abuse and cost escalation by limiting requests per session/IP
 * 
 * Uses database-backed rate limiting for distributed edge function deployments
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string; // session_id, ip_address, or user_id
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  error?: string;
}

/**
 * Checks if a request should be rate limited using database-backed storage
 * @param config Rate limit configuration
 * @param identifier Unique identifier (session_id, IP, user_id)
 * @param supabase Supabase client (must use service role key)
 * @returns Rate limit result
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string,
  supabase: any
): Promise<RateLimitResult> {
  const rateLimitKey = `${config.identifier}:${identifier}`;
  const windowSeconds = Math.floor(config.windowMs / 1000);
  
  try {
    // Call database function to check and update rate limit atomically
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_rate_limit_key: rateLimitKey,
      p_max_requests: config.maxRequests,
      p_window_seconds: windowSeconds
    });
    
    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request but log the issue
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: Date.now() + config.windowMs,
        error: 'Rate limit check failed, allowing request'
      };
    }
    
    if (!data || data.length === 0) {
      // Fallback if function returns no data
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: Date.now() + config.windowMs
      };
    }
    
    const result = data[0];
    const resetAtMs = new Date(result.reset_at).getTime();
    
    if (!result.allowed) {
      return {
        allowed: false,
        remaining: result.remaining,
        resetAt: resetAtMs,
        error: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${windowSeconds} seconds.`
      };
    }
    
    return {
      allowed: true,
      remaining: result.remaining,
      resetAt: resetAtMs
    };
    
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // On exception, allow the request but log the issue
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Date.now() + config.windowMs,
      error: 'Rate limit check exception, allowing request'
    };
  }
}

/**
 * Default rate limit configs for different operations
 */
export const RATE_LIMITS = {
  // Assessment creation: 3 per hour per session
  ASSESSMENT_CREATE: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: 'session'
  },
  
  // AI generation: 5 per hour per session
  AI_GENERATE: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: 'session'
  },
  
  // Payment creation: 10 per hour per session
  PAYMENT_CREATE: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: 'session'
  },
  
  // General API: 100 per hour per IP
  GENERAL_API: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: 'ip'
  }
};

/**
 * Extracts identifier from request (session_id, IP, or user_id)
 */
export function extractIdentifier(
  req: Request,
  identifierType: 'session' | 'ip' | 'user'
): string {
  if (identifierType === 'ip') {
    // Get IP from headers (Supabase provides this)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    return forwarded?.split(',')[0] || realIp || 'unknown';
  }
  
  if (identifierType === 'user') {
    // Extract from auth token if available
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // In real implementation, decode JWT to get user_id
      return authHeader.substring(0, 20); // Simplified
    }
    return 'anonymous';
  }
  
  // Default to session (extract from body or headers)
  return 'session';
}

