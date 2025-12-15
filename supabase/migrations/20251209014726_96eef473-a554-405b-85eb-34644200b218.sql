-- Fix 1: Remove overly permissive booking_requests policy
DROP POLICY IF EXISTS "System can manage booking requests" ON public.booking_requests;

-- Add a service-role only policy for backend operations (uses RLS bypass via service role)
-- The existing user policies handle normal user access

-- Fix 2: Recreate the public_index_snapshots view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_index_snapshots;

CREATE VIEW public.public_index_snapshots 
WITH (security_invoker = true) AS
SELECT 
    quarter,
    methodology_version,
    published_at,
    total_assessments,
    effective_sample_size,
    consent_rate,
    avg_readiness_score,
    avg_readiness_score_ci_lower,
    avg_readiness_score_ci_upper,
    median_readiness_score,
    tier_emerging_pct,
    tier_establishing_pct,
    tier_advancing_pct,
    tier_leading_pct,
    industry_benchmarks,
    company_size_benchmarks,
    role_benchmarks,
    dimension_benchmarks,
    qoq_change,
    qoq_change_significant
FROM ai_leadership_index_snapshots
WHERE published_at IS NOT NULL;

-- Grant SELECT on the view to authenticated and anon roles (public index data)
GRANT SELECT ON public.public_index_snapshots TO authenticated;
GRANT SELECT ON public.public_index_snapshots TO anon;