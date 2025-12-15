/**
 * Rate Limiting Utility for Edge Functions
 * 
 * Purpose: Prevents abuse and cost escalation by limiting requests per session/IP
 */

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

// In-memory rate limit store (simple implementation)
// For production, consider using Redis or Supabase KV
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks if a request should be rate limited
 * @param config Rate limit configuration
 * @param identifier Unique identifier (session_id, IP, user_id)
 * @returns Rate limit result
 */
export function checkRateLimit(
  config: RateLimitConfig,
  identifier: string
): RateLimitResult {
  const key = `${config.identifier}:${identifier}`;
  const now = Date.now();
  
  // Clean up expired entries (simple cleanup)
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  const entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      error: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  };
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

