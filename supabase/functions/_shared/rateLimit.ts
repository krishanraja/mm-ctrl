/**
 * In-Memory Rate Limiting Utility for Edge Functions
 *
 * Provides lightweight, synchronous rate limiting using an in-memory Map.
 * This prevents burst abuse within a single edge function instance.
 * For distributed rate limiting across instances, see rate-limit.ts (database-backed).
 *
 * Usage:
 *   import { checkRateLimit } from "../_shared/rateLimit.ts";
 *   const result = checkRateLimit(userId, { maxRequests: 10, windowMs: 60_000 });
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** Timestamp (ms) when the current window resets */
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Global store keyed by identifier; entries are automatically pruned on access
const store = new Map<string, RateLimitEntry>();

/**
 * Check whether a request from the given identifier should be allowed.
 *
 * @param identifier  Unique key for the caller (user ID, IP, session ID, etc.)
 * @param config      Rate limit configuration
 * @returns           Result indicating whether the request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  // If no entry or the window has expired, start a fresh window
  if (!entry || now - entry.windowStart >= config.windowMs) {
    store.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  const resetAt = entry.windowStart + config.windowMs;

  // Window is still active - check the count
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Increment and allow
  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt,
  };
}
