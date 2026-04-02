/**
 * Security Headers Utility
 *
 * Shared security headers for all edge functions.
 * Implements SOC2, ISO 27001, and OWASP recommended headers.
 */

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cache-Control': 'no-store',
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Merge CORS + security headers for API responses
 */
export function getResponseHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    ...corsHeaders,
    ...securityHeaders,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}
