# LLM Strategy Review & Recommendations for Mindmaker for Leaders

## Context

Mindmaker is a voice-first executive coaching platform using ~15 AI-powered Supabase Edge Functions. The current LLM strategy is **already sophisticated**, with cognitive framework training, chain-of-thought enforcement, quality guardrails, and multi-provider fallback. However, several architectural issues have accumulated: duplicate implementations, stale model choices, missing resilience patterns, and no observability. This plan addresses the highest-impact improvements while keeping the scope practical for a small team.

---

## Priority 1: Quick Wins (High Impact, Low Effort)

### 1A. Upgrade to Multi-Provider Model Routing (Best Model per Task)
**Why:** GPT-4o is no longer frontier. Different providers excel at different tasks. Route each task to the best model for the job.

**File:** `supabase/functions/_shared/openai-utils.ts`
- Rename to `llm-utils.ts` (provider-agnostic)
- Replace `selectModel()` with `selectProvider()` that returns both model AND provider:

| Task Tier | Model | Provider | Rationale |
|-----------|-------|----------|-----------|
| `simple` | `claude-haiku-4-5-20251001` | Anthropic | Fastest, cheapest - pattern detection, prompt coach, daily prompts |
| `chat` | `gpt-4.1` | OpenAI | Strong conversational quality - assessment chat, sharpen |
| `analysis` | `claude-sonnet-4-6` | Anthropic | Best at structured JSON output - weekly checkin, context extraction, team instructions |
| `complex` | `claude-opus-4-6` | Anthropic | Deepest reasoning - ai-generate with cognitive frameworks, meeting prep |
| `transcription` | `whisper-1` | OpenAI | Best-in-class speech-to-text (keep as-is) |

- Each provider has its own API call path (Anthropic Messages API, OpenAI Chat Completions)
- Fallback chain per task: primary provider fails → next best provider → Gemini Flash

**Cost impact:** Haiku for simple tasks cuts costs ~5x vs GPT-4o-mini. Opus only used where deep reasoning justifies the cost. GPT-4.1 stays for conversational tasks where it excels.

### 1B. Consolidate Duplicate Cache Implementations
**Why:** Two separate caches (`openai-utils.ts` → `ai_cache` table, `ai-cache.ts` → `ai_response_cache` table) with different TTLs and interfaces cause confusion and wasted storage.

**Action:**
- Keep `ai-cache.ts` as the single cache module (better interface, has `normalizePromptForCache`)
- Migrate `ai_cache` table data to `ai_response_cache` (or unify table name)
- Update `openai-utils.ts` (now `llm-utils.ts`) to use `ai-cache.ts` internally
- Standardize TTL to 24 hours (7 days is too long for personalized coaching, since user context changes)
- Delete duplicate hash function from `openai-utils.ts`

**Files:**
- `supabase/functions/_shared/openai-utils.ts` → remove cache code, import from `ai-cache.ts`
- `supabase/functions/_shared/ai-cache.ts` → becomes single source of truth

### 1C. Consolidate Duplicate Rate Limiting
**Why:** Two rate limiting files (`rate-limit.ts` and `rate-limiting.ts`). The second one is never imported.

**Action:**
- Delete `supabase/functions/_shared/rate-limiting.ts` (unused)
- Keep `supabase/functions/_shared/rate-limit.ts` (actively used via `check_rate_limit` RPC)

---

## Priority 2: Resilience & Reliability (High Impact, Medium Effort)

### 2A. Add Retry Logic with Exponential Backoff
**Why:** No retry logic means a single transient API failure (rate limit, network blip) results in user-facing errors.

**File:** `supabase/functions/_shared/llm-utils.ts` (renamed openai-utils.ts)
- Add retry wrapper: 3 attempts, exponential backoff (1s, 2s, 4s)
- Retry on: 429 (rate limit), 500/502/503 (server errors), network timeouts
- Do NOT retry on: 400 (bad request), 401 (auth), 404

### 2B. Standardize Multi-Provider Fallback
**Why:** Gemini fallback is implemented ad-hoc in only some functions (ai-generate, weekly-checkin). Others have no fallback.

**Action:** Build fallback into `llm-utils.ts` so ALL functions get it automatically:
```
For Anthropic-primary tasks: Anthropic → OpenAI → Gemini Flash
For OpenAI-primary tasks:    OpenAI → Anthropic → Gemini Flash
```

**File:** `supabase/functions/_shared/llm-utils.ts`
- `callLLM()` tries providers in order based on task routing, catches errors, falls through
- Each provider adapter normalizes request/response format so callers are provider-agnostic
- Remove ad-hoc fallback code from individual edge functions (ai-generate, submit-weekly-checkin, etc.)

### 2C. Use Anthropic's Native JSON Mode
**Why:** Current approach uses OpenAI's `response_format: { type: 'json_object' }`. The Anthropic API doesn't have this, but Claude models follow JSON instructions in system prompts extremely reliably. For critical paths, use tool_use with a defined schema for guaranteed structured output.

**Action:**
- For simple JSON responses: instruct in system prompt (Claude follows this reliably)
- For critical/complex schemas (assessment analysis, weekly checkin): use Anthropic `tool_use` with JSON schema definition, which guarantees valid structure
- Keep the JSON extraction regex fallback for Gemini (already exists in ai-generate)

---

## Priority 3: Observability (Medium Impact, Medium Effort)

### 3A. Add LLM Call Logging Table
**Why:** No visibility into LLM costs, latency, error rates, or cache hit rates.

**Action:** Create `llm_call_log` table and log every LLM call:
```sql
CREATE TABLE llm_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  function_name text NOT NULL,        -- 'ai-generate', 'sharpen-analyze', etc.
  model text NOT NULL,                -- 'claude-sonnet-4-6', 'gpt-4o', etc.
  provider text NOT NULL,             -- 'anthropic', 'openai', 'vertex'
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  latency_ms int,
  cached boolean DEFAULT false,
  error text,                         -- null if success
  user_id uuid REFERENCES auth.users,
  estimated_cost_usd numeric(10,6)
);
```

**File:** New migration + update `llm-utils.ts` to log after every call
- Log async (don't block response)
- Include cost estimation based on model pricing

### 3B. Weekly Cost Dashboard Query
**Action:** Add a SQL view or function for cost monitoring:
```sql
SELECT date_trunc('day', created_at), model,
       count(*), sum(total_tokens), sum(estimated_cost_usd)
FROM llm_call_log GROUP BY 1, 2 ORDER BY 1 DESC;
```

---

## Priority 4: Memory & RAG Improvement (High Impact, Higher Effort)

### 4A. Add pgvector Embeddings for Memory Retrieval
**Why:** Users accumulate 20+ facts. Category-based retrieval alone misses relevant context when the fact pool grows. For example, a "delegation" question should surface the user's team structure facts, their stated blockers about letting go of control, AND their preference for async communication, even though these span 3 different categories.

**Action:**
- Enable `pgvector` extension in Supabase (one SQL command)
- Add `embedding vector(1536)` column to `user_memory` table
- Generate embeddings on fact insert/update using OpenAI `text-embedding-3-small` ($0.02/1M tokens, negligible cost)
- Create a `match_user_memory` RPC function for similarity search
- Update `memory-context-builder.ts` to do **hybrid retrieval**:
  1. Category filter (existing) - keeps use-case-aware filtering as first pass
  2. Vector similarity ranking within the candidate set - surfaces the most relevant facts for the current query
  3. Token budget trimming (existing) - now trims the least relevant facts instead of arbitrary warm facts

**Migration:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE user_memory ADD COLUMN embedding vector(1536);
CREATE INDEX ON user_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE FUNCTION match_user_memory(query_embedding vector(1536), match_count int, user_uuid uuid)
RETURNS TABLE(id uuid, fact_label text, fact_value text, similarity float)
AS $$
  SELECT id, fact_label, fact_value, 1 - (embedding <=> query_embedding) as similarity
  FROM user_memory
  WHERE user_id = user_uuid AND is_current = true AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;
```

**Files:**
- New migration: add vector column + index + RPC function
- New utility: `supabase/functions/_shared/embeddings.ts` - wraps OpenAI embeddings API
- `supabase/functions/_shared/memory-context-builder.ts` - add embedding-based ranking
- `supabase/functions/extract-user-context/index.ts` - generate embeddings on fact creation
- `supabase/functions/memory-crud/index.ts` - generate embeddings on fact update
- Backfill script: one-time migration to generate embeddings for existing facts

---

## Priority 5: Prompt Management (Lower Priority)

### 5A. Centralize Prompts into Shared Module
**Why:** Prompts are scattered across 15+ edge functions, making iteration slow.

**Action:**
- Create `supabase/functions/_shared/prompts/` directory
- Move system prompts from each edge function into named exports:
  - `prompts/cognitive-frameworks.ts` - the COGNITIVE_FRAMEWORKS_ANCHOR
  - `prompts/sharpen.ts` - SHARPEN_SYSTEM_PROMPT
  - `prompts/weekly-checkin.ts` - weekly checkin system prompt
  - `prompts/assessment-chat.ts` - assessment advisor prompt
  - etc.
- Edge functions import prompts instead of defining inline
- Also move `src/data/sharpenSystemPrompt.ts` to shared location (currently duplicated between frontend and backend)

### 5B. Add Prompt Version Tracking (Optional)
**Action:** Add `prompt_version` field to `llm_call_log` table so you can correlate output quality with prompt changes over time.

---

## What NOT to Change

- **Quality guardrails** (`llm-quality-guardrails.ts`) - already excellent, keep as-is
- **Cognitive framework training** - the 5-framework approach is well-designed
- **Use-case-aware context building** (`memory-context-builder.ts`) - the 7-mode system is smart
- **Token budget optimization** - the hot/warm/cold hierarchy works well
- **Voice transcription** - Whisper-1 remains best for this use case
- **Prompt normalization for cache** - already handles timestamps/UUIDs well

---

## Implementation Order

| Phase | Changes | Estimated Scope |
|-------|---------|-----------------|
| **Phase 1** | 1B (consolidate cache), 1C (delete unused rate-limit), 2A (retry logic) | ~3 files changed |
| **Phase 2** | 1A (multi-provider routing), 2B (standardize fallback), 2C (structured output) | ~15 files changed (openai-utils.ts → llm-utils.ts + all edge functions importing it) |
| **Phase 3** | 3A (logging table), 3B (cost dashboard) | 1 migration + 1 file |
| **Phase 4** | 4A (pgvector embeddings), **promoted from Phase 5** since users have 20+ facts | 1 migration + 4 files + backfill script |
| **Phase 5** | 5A (centralize prompts) | ~15 files (move prompts, update imports) |

---

## Verification

- **Phase 1:** Deploy edge functions, trigger AI features, verify cache works with single implementation, verify retries on simulated failures
- **Phase 2:** Test each AI feature with its routed model (Opus for ai-generate, Sonnet for analysis, GPT-4.1 for chat, Haiku for simple), verify JSON output quality, test fallback by temporarily disabling primary API key
- **Phase 3:** Query `llm_call_log` after a day of usage, verify cost tracking accuracy
- **Phase 4:** Compare memory retrieval relevance before/after embeddings with a test user who has 20+ facts. Measure: are the top-5 returned facts more relevant to the query?
- **Phase 5:** Run all AI features, verify identical behavior with centralized prompts

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/_shared/openai-utils.ts` | Rename to `llm-utils.ts`, switch to Anthropic API, add retry logic, add fallback chain, add logging, use `ai-cache.ts` for caching |
| `supabase/functions/_shared/ai-cache.ts` | Becomes single cache implementation, no major changes needed |
| `supabase/functions/_shared/rate-limiting.ts` | **Delete** (unused) |
| `supabase/functions/_shared/llm-quality-guardrails.ts` | No changes |
| `supabase/functions/_shared/memory-context-builder.ts` | Add embedding-based ranking (Phase 5) |
| `supabase/functions/ai-generate/index.ts` | Remove ad-hoc Gemini fallback, import from `llm-utils.ts` |
| `supabase/functions/submit-weekly-checkin/index.ts` | Remove ad-hoc fallback, import from `llm-utils.ts` |
| All other edge functions using `openai-utils.ts` | Update import path |
