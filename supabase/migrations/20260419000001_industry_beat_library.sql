-- Briefing v2 Item 3: industry-aware seed beats for cold-start users.
--
-- Reference library of canonical beats + recommended entities per industry.
-- New users whose profile hasn't accumulated specifics yet get a one-tap
-- "here are the beats creators usually care about" prompt so their very
-- first briefing has a real lens to work against.
--
-- Read-only for authenticated users; writes happen via the Management API
-- or admin tooling (no end-user UX for editing the library).

CREATE TABLE IF NOT EXISTS industry_beat_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  beats JSONB NOT NULL,          -- [{ "label": "creator monetization" }, ...]
  entities JSONB NOT NULL DEFAULT '[]',  -- [{ "label": "MrBeast" }, ...]
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_industry_beat_library_active
  ON industry_beat_library (industry_key)
  WHERE is_active;

ALTER TABLE industry_beat_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS industry_beat_library_read ON industry_beat_library;
CREATE POLICY industry_beat_library_read
  ON industry_beat_library FOR SELECT
  TO authenticated
  USING (is_active);

COMMENT ON TABLE industry_beat_library IS
  'Canonical beats + recommended entities per industry. Seeds the Briefing Interests flow for new users before they have declared anything.';
COMMENT ON COLUMN industry_beat_library.aliases IS
  'Lowercase substrings matched against user-declared industry fact (fact_key=industry) to resolve to an industry_key.';

-- ── Seed data ───────────────────────────────────────────────────
-- Ten industries covering the majority of the user base. Each row is
-- idempotent via ON CONFLICT so re-running the migration is safe.

INSERT INTO industry_beat_library (industry_key, label, aliases, beats, entities) VALUES
(
  'creator_economy',
  'Creator Economy',
  ARRAY['creator', 'creator economy', 'influencer', 'content creator', 'youtuber', 'content creation'],
  '[
    {"label": "Creator monetization"},
    {"label": "Platform policy changes"},
    {"label": "Brand deals and sponsorships"},
    {"label": "AI tools for content creation"},
    {"label": "Short-form video trends"},
    {"label": "Newsletter and Substack economics"},
    {"label": "Creator tax and legal"},
    {"label": "Major creator business moves"}
  ]'::jsonb,
  '[
    {"label": "MrBeast"},
    {"label": "YouTube"},
    {"label": "TikTok"},
    {"label": "Substack"},
    {"label": "Patreon"},
    {"label": "Meta"}
  ]'::jsonb
),
(
  'saas',
  'SaaS',
  ARRAY['saas', 'software', 'b2b software', 'technology', 'tech company', 'software company'],
  '[
    {"label": "AI product pricing shifts"},
    {"label": "Build-vs-buy signals"},
    {"label": "API and platform launches"},
    {"label": "Vertical vs horizontal SaaS"},
    {"label": "PLG motion updates"},
    {"label": "Vendor consolidation and M&A"},
    {"label": "Cloud cost optimization"},
    {"label": "Enterprise AI adoption"}
  ]'::jsonb,
  '[
    {"label": "OpenAI"},
    {"label": "Anthropic"},
    {"label": "Google"},
    {"label": "Microsoft"},
    {"label": "Salesforce"},
    {"label": "Snowflake"},
    {"label": "Databricks"}
  ]'::jsonb
),
(
  'healthcare',
  'Healthcare',
  ARRAY['healthcare', 'healthtech', 'health tech', 'medical', 'hospital', 'provider'],
  '[
    {"label": "Healthcare AI adoption"},
    {"label": "FDA and HIPAA regulatory updates"},
    {"label": "Payer policy changes"},
    {"label": "Clinical AI validation"},
    {"label": "Healthcare M&A"},
    {"label": "Remote and virtual care"},
    {"label": "Drug pricing moves"},
    {"label": "Provider consolidation"}
  ]'::jsonb,
  '[
    {"label": "CMS"},
    {"label": "FDA"},
    {"label": "UnitedHealth"},
    {"label": "Epic Systems"},
    {"label": "Cerner"}
  ]'::jsonb
),
(
  'finance_fintech',
  'Finance / Fintech',
  ARRAY['finance', 'fintech', 'banking', 'payments', 'financial services', 'wealth management'],
  '[
    {"label": "Banking regulation shifts"},
    {"label": "Fintech funding and M&A"},
    {"label": "Payments infrastructure"},
    {"label": "Crypto and stablecoin policy"},
    {"label": "Embedded finance"},
    {"label": "AI risk scoring"},
    {"label": "Digital banking launches"},
    {"label": "Cross-border money movement"}
  ]'::jsonb,
  '[
    {"label": "Stripe"},
    {"label": "Plaid"},
    {"label": "JPMorgan"},
    {"label": "Visa"},
    {"label": "Mastercard"},
    {"label": "OCC"},
    {"label": "CFPB"}
  ]'::jsonb
),
(
  'consulting_professional_services',
  'Consulting / Professional Services',
  ARRAY['consulting', 'professional services', 'advisory', 'management consulting'],
  '[
    {"label": "AI in consulting delivery"},
    {"label": "Big 4 strategic moves"},
    {"label": "Client industry shifts"},
    {"label": "Engagement model changes"},
    {"label": "AI in legal and audit"},
    {"label": "Talent and hiring signals"},
    {"label": "Productivity benchmarks"},
    {"label": "Consolidation and roll-ups"}
  ]'::jsonb,
  '[
    {"label": "McKinsey"},
    {"label": "Bain"},
    {"label": "BCG"},
    {"label": "Deloitte"},
    {"label": "Accenture"}
  ]'::jsonb
),
(
  'ecommerce_retail',
  'Ecommerce / Retail',
  ARRAY['ecommerce', 'e-commerce', 'retail', 'dtc', 'consumer brands', 'cpg'],
  '[
    {"label": "Retail media network shifts"},
    {"label": "DTC performance trends"},
    {"label": "Shopify and Amazon moves"},
    {"label": "AI in merchandising"},
    {"label": "Supply chain signals"},
    {"label": "Tariff and trade policy"},
    {"label": "Payments and checkout evolution"},
    {"label": "Consumer spending data"}
  ]'::jsonb,
  '[
    {"label": "Amazon"},
    {"label": "Shopify"},
    {"label": "Walmart"},
    {"label": "Target"},
    {"label": "TikTok Shop"}
  ]'::jsonb
),
(
  'media_publishing',
  'Media / Publishing',
  ARRAY['media', 'publishing', 'news', 'journalism', 'broadcasting'],
  '[
    {"label": "AI training licensing deals"},
    {"label": "Digital ad market shifts"},
    {"label": "Platform algorithm changes"},
    {"label": "Subscription economics"},
    {"label": "Paywall strategies"},
    {"label": "AI-native news products"},
    {"label": "Creator-to-media pipelines"},
    {"label": "News attribution and referral traffic"}
  ]'::jsonb,
  '[
    {"label": "New York Times"},
    {"label": "News Corp"},
    {"label": "Reddit"},
    {"label": "OpenAI"},
    {"label": "Google"}
  ]'::jsonb
),
(
  'education_edtech',
  'Education / EdTech',
  ARRAY['education', 'edtech', 'ed-tech', 'learning', 'k12', 'k-12', 'higher education'],
  '[
    {"label": "AI in learning"},
    {"label": "Accreditation moves"},
    {"label": "University-AI partnerships"},
    {"label": "K-12 adoption signals"},
    {"label": "Workforce upskilling"},
    {"label": "Alternative credentials"},
    {"label": "Tutoring automation"},
    {"label": "Regulatory shifts"}
  ]'::jsonb,
  '[
    {"label": "Coursera"},
    {"label": "Duolingo"},
    {"label": "Khan Academy"},
    {"label": "OpenAI"},
    {"label": "Pearson"}
  ]'::jsonb
),
(
  'biotech_life_sciences',
  'Biotech / Life Sciences',
  ARRAY['biotech', 'life sciences', 'pharmaceutical', 'pharma', 'drug discovery'],
  '[
    {"label": "AI drug discovery milestones"},
    {"label": "FDA and EMA decisions"},
    {"label": "Biotech M&A"},
    {"label": "Lab automation"},
    {"label": "Clinical trial AI"},
    {"label": "Platform biology launches"},
    {"label": "Diagnostics moves"},
    {"label": "Regulatory science updates"}
  ]'::jsonb,
  '[
    {"label": "FDA"},
    {"label": "EMA"},
    {"label": "Moderna"},
    {"label": "Recursion"},
    {"label": "Isomorphic Labs"}
  ]'::jsonb
),
(
  'legal_services',
  'Legal Services',
  ARRAY['legal', 'law', 'law firm', 'legal tech', 'legaltech'],
  '[
    {"label": "AI in law firms"},
    {"label": "Regulatory guidance on AI work product"},
    {"label": "Legal tech M&A"},
    {"label": "In-house AI adoption"},
    {"label": "Billing and pricing shifts"},
    {"label": "AI liability case law"},
    {"label": "Ethics rulings"},
    {"label": "Alternative legal service providers"}
  ]'::jsonb,
  '[
    {"label": "Harvey"},
    {"label": "Thomson Reuters"},
    {"label": "LexisNexis"},
    {"label": "ABA"}
  ]'::jsonb
),
(
  'generic',
  'General Business',
  ARRAY['generic', 'general', 'other', 'business'],
  '[
    {"label": "AI enterprise adoption"},
    {"label": "Build-vs-buy shifts"},
    {"label": "Major product launches"},
    {"label": "Pricing changes"},
    {"label": "Vendor consolidation"},
    {"label": "Regulatory updates"},
    {"label": "Talent market signals"},
    {"label": "Major leadership moves"}
  ]'::jsonb,
  '[
    {"label": "OpenAI"},
    {"label": "Anthropic"},
    {"label": "Google"},
    {"label": "Microsoft"},
    {"label": "Nvidia"}
  ]'::jsonb
)
ON CONFLICT (industry_key) DO UPDATE SET
  label = EXCLUDED.label,
  aliases = EXCLUDED.aliases,
  beats = EXCLUDED.beats,
  entities = EXCLUDED.entities,
  is_active = TRUE,
  updated_at = NOW();
