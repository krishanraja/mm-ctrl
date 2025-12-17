-- Peer tension matching: anonymous, curated snippets
-- Matches leaders facing similar tensions to provide high-signal insights
-- Uses k-anonymity (requires at least k=3 leaders with same tension) and consent

-- 1) Peer snippets table
CREATE TABLE IF NOT EXISTS public.leader_peer_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_id UUID NULL REFERENCES public.leaders(id) ON DELETE SET NULL,
  
  -- Matching criteria (anonymized)
  tension_key TEXT NOT NULL, -- e.g., 'delegation_augmentation'
  dimension_key TEXT NOT NULL, -- e.g., 'delegation_augmentation'
  benchmark_tier TEXT NULL, -- e.g., 'AI-Aware'
  company_size_band TEXT NULL, -- e.g., '50-200'
  
  -- Snippet content (curated, anonymized)
  snippet_text TEXT NOT NULL, -- e.g., "Another leader asked: 'What would expose vendor theatre vs real capability?'"
  source_type TEXT NOT NULL CHECK (source_type IN ('checkin', 'capture', 'action')),
  source_created_at TIMESTAMP NULL,
  
  -- Consent and privacy
  consent_given BOOLEAN NOT NULL DEFAULT false, -- User must opt-in to share
  k_anonymity_count INTEGER NOT NULL DEFAULT 0, -- Number of peers in this cohort (must be >= 3)
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peer_snippets_user_id ON public.leader_peer_snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_snippets_matching ON public.leader_peer_snippets(tension_key, dimension_key, benchmark_tier, company_size_band);

-- 2) RLS: users can only read their own snippets
ALTER TABLE public.leader_peer_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leader_peer_snippets_own_rows"
  ON public.leader_peer_snippets
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) Consent table for sharing
CREATE TABLE IF NOT EXISTS public.leader_sharing_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  consent_to_share BOOLEAN NOT NULL DEFAULT false,
  consent_updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.leader_sharing_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leader_sharing_consent_own_rows"
  ON public.leader_sharing_consent
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
