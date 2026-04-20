# Decisions Log

Key architectural and product decisions with rationale.

---

## Decision 1: Single DB-Based Architecture
**Date**: Jan 2025
**Decision**: Delete V1 components, use only V2 (DB-based)
**Rationale**: Dual architecture caused stale UI, technical debt
**Trade-off**: Short-term migration work vs long-term maintainability
**Outcome**: ✅ Successful, cleaner codebase

## Decision 2: Reposition as AI Literacy
**Date**: Jan 2025
**Decision**: Drop "AI transformation", focus on "AI literacy for executive cognition"
**Rationale**: Better differentiation, resonates with senior leaders
**Trade-off**: Narrower positioning vs clearer value prop
**Outcome**: ✅ Stronger messaging

## Decision 3: Surface Tensions/Risks/Scenarios
**Date**: Jan 2025
**Decision**: Make cognitive work (tensions, risks, scenarios) primary UI content
**Rationale**: These are valuable, were hidden backstage
**Trade-off**: More complex UI vs showcasing actual value
**Outcome**: ✅ Differentiated from alternatives

## Decision 4: Use OpenAI + Vertex Fallback
**Date**: 2024
**Decision**: Primary OpenAI, fallback to Vertex AI
**Rationale**: OpenAI quality better, Vertex for redundancy
**Trade-off**: Dual integration complexity vs reliability
**Outcome**: ✅ Improved uptime

## Decision 5: Supabase Edge Functions
**Date**: 2024
**Decision**: Use Supabase Edge Functions (Deno) vs separate backend
**Rationale**: Faster deployment, integrated with DB
**Trade-off**: Vendor lock-in vs speed of development
**Outcome**: ✅ Appropriate for stage

## Decision 6: Paid Tier at $49
**Date**: 2024
**Decision**: Single payment $49 for full diagnostic
**Rationale**: Low enough for individual purchase, high enough to qualify leads
**Trade-off**: One-time vs subscription revenue
**Outcome**: ⚠️ TBD (early data)

## Decision 7: Voice Assessment Path
**Date**: 2024
**Decision**: Add voice alternative to quiz
**Rationale**: Executive preference for speaking vs typing
**Trade-off**: Development complexity vs accessibility
**Outcome**: ✅ Differentiator

## Decision 8: Anonymised Benchmarking
**Date**: 2024
**Decision**: Opt-in AI Leadership Index with anonymisation
**Rationale**: Aggregate insights valuable, privacy critical
**Trade-off**: Reduced sample size vs ethical data use
**Outcome**: ✅ GDPR-compliant

## Decision 9: No Chat Interface
**Date**: Jan 2025
**Decision**: Remove AI chat, focus on structured diagnostic
**Rationale**: Chat didn't add value, felt like ChatGPT clone
**Trade-off**: Less "AI-powered" feel vs clearer positioning
**Outcome**: ✅ Stronger differentiation

## Decision 10: Minimal Animation
**Date**: Jan 2025
**Decision**: Restrained animations, no gratuitous motion
**Rationale**: Senior aesthetic, avoid "quiz app" feel
**Trade-off**: Less flashy vs more professional
**Outcome**: ✅ Matches brand

## Decision 11: Remove Pre-Results Contact Form
**Date**: Dec 2024
**Decision**: Remove contact collection form before results, collect via unlock form on results page
**Rationale**: Reduce friction in assessment flow, let users see value first
**Trade-off**: Delayed contact capture vs better completion rates
**Outcome**: ⏳ In progress

## Decision 12: Remove All Toast Notifications
**Date**: Dec 2024
**Decision**: Remove toast notifications throughout the application
**Rationale**: Toasts interrupt user flow, create anxiety, require dismissal action. CEOs shouldn't need to swipe away notifications.
**Trade-off**: Less explicit feedback vs cleaner experience
**Outcome**: ✅ Implemented - using inline UI feedback instead

## Decision 13: Mobile Viewport-Fit Design
**Date**: Dec 2024
**Decision**: All input screens must fit within viewport without scrolling
**Rationale**: Executive users shouldn't need to scroll during data input phases - reduces anxiety and improves completion rates
**Trade-off**: Denser UI on mobile vs no-scroll guarantee
**Outcome**: ✅ Implemented - using h-[100dvh] and flex layouts

## Decision 14: Monotonic Progress Bar
**Date**: Dec 2024
**Decision**: Progress bar must only move forward, never regress
**Rationale**: Regressing progress bars feel unprofessional and create uncertainty
**Trade-off**: Progress may not be 100% accurate vs professional feel
**Outcome**: ✅ Implemented - using displayProgress state with Math.max

## Decision 15: Results Value Before Unlock
**Date**: Dec 2024
**Decision**: Show dimension scores and risk signals before requiring account creation
**Rationale**: Users need to see value before being asked to unlock - increases conversion
**Trade-off**: Give away some value vs higher unlock rates
**Outcome**: ✅ Implemented - unlock form collapsed by default

## Decision 16: Vertex AI as Primary LLM
**Date**: Jan 2026
**Decision**: Switch primary AI model from OpenAI GPT-4o to Vertex AI (Gemini 2.0 Flash)
**Rationale**: Lower cost per request, competitive quality, Google Cloud integration. OpenAI retained as fallback.
**Trade-off**: Google Cloud dependency vs cost reduction and redundancy
**Outcome**: ✅ Implemented - 3-tier fallback (Vertex → OpenAI → static)

## Decision 17: Single ai-generate Function
**Date**: Jan 2026
**Decision**: Consolidate individual generation functions (insights, prompts, tensions, risks, scenarios) into a single `ai-generate` edge function
**Rationale**: Reduced latency (one LLM call vs five), lower cost, simpler orchestration
**Trade-off**: Larger single function vs simpler pipeline
**Outcome**: ✅ Implemented - one comprehensive generation call

## Decision 18: Memory Center with Voice-First
**Date**: Jan 2026
**Decision**: Build voice-first Memory Center for persistent leader context
**Rationale**: Executives prefer speaking over typing; persistent context enables increasingly personalised AI interactions
**Trade-off**: Development complexity vs long-term personalisation quality
**Outcome**: ✅ Implemented - encrypted storage, fact verification, privacy controls

## Decision 19: Missions System (First Moves Tracking)
**Date**: Feb 2026
**Decision**: Add Missions system for tracking commitment to diagnostic First Moves
**Rationale**: Assessment value diminishes without follow-through; missions create accountability
**Trade-off**: Ongoing engagement complexity vs retention and impact
**Outcome**: ✅ Implemented - commit, check-in, complete flow

## Decision 20: Progress Snapshots & Drift Detection
**Date**: Feb 2026
**Decision**: Implement progress tracking with periodic snapshots and drift scoring
**Rationale**: Leaders need to see how their AI literacy evolves over time
**Trade-off**: Additional data storage and computation vs demonstrable growth
**Outcome**: ✅ Implemented - snapshot generation, drift computation

## Decision 21: Lazy Loading All Pages
**Date**: Feb 2026
**Decision**: Lazy-load all 20 pages using React.lazy() with Suspense boundaries
**Rationale**: Improve initial load performance; most users only visit a few pages per session
**Trade-off**: Slight delay on first page navigation vs faster initial load
**Outcome**: ✅ Implemented in src/router.tsx

## Decision 22: Memory Encryption at Rest
**Date**: Jan 2026
**Decision**: Encrypt all memory content at rest using AES-256-GCM
**Rationale**: Memory contains sensitive business context; encryption is non-negotiable for executive trust
**Trade-off**: Performance overhead of encryption/decryption vs data security
**Outcome**: ✅ Implemented - server-side only, never client-side decryption

## Decision 23: Cognitive Frameworks in AI Prompts
**Date**: Jan 2026
**Decision**: Embed five cognitive frameworks (A/B Framing, Dialectical, WOOP, Reflective Equilibrium, First Principles) directly into ai-generate prompts
**Rationale**: Ensures AI outputs are grounded in established reasoning frameworks, not generic advice
**Trade-off**: Longer prompts and token usage vs higher quality, differentiated insights
**Outcome**: ✅ Implemented - all AI-generated content applies frameworks

## Decision 24: Rebrand from Mindmaker to CTRL
**Date**: Mar 2026
**Decision**: Rename the product from "Mindmaker" to "CTRL" across all user-facing surfaces
**Rationale**: CTRL positions the product around decision speed and executive control over AI strategy, aligning with the core value proposition of helping leaders take command of their AI-era leadership
**Trade-off**: Brand recognition reset vs stronger, more differentiated positioning
**Outcome**: ✅ Implemented

## Decision 25: Rebuild Briefing Personalization Around an Evidence-Based Lens (v2)
**Date**: Apr 2026
**Decision**: Replace the v1 briefing pipeline (flattened profile → templated queries → race-and-keep-one provider → LLM ranker-narrator) with a seven-stage evidence-based pipeline where every retained segment carries a `lens_item_id`, a `relevance_score`, and the specific `matched_profile_fact` that justifies inclusion.
**Rationale**: v1 asserted personalization in prose but couldn't prove it. A creator-economy user's briefing ran four consecutive off-topic stories (geopolitics, CIO100, fintech VC) because the LLM had nothing to anchor against. Auditable relevance is both a product feature (users see why each story was surfaced) and an engineering feature (the diagnose endpoint answers "why did this happen?" in one call).
**Trade-off**: Added 3 LLM hops + one embedding batch call per briefing (~5-8s more on cache miss) vs personalization that is legible, debuggable, and learnable.
**Outcome**: ✅ Shipped behind `BRIEFING_V2_ENABLED_DEFAULT` flag + per-user opt-in. ai_landscape briefings stay on v1 (they use synthetic headlines from AA benchmark data).

## Decision 26: Add pgvector for Embedding-Based Relevance (not LLM-asserted)
**Date**: Apr 2026
**Decision**: Enable the pgvector extension; embed candidate headlines and lens items with `text-embedding-3-small` (batched); score via cosine similarity × lens weight.
**Rationale**: Considered staying LLM-only (ask gpt-4o-mini to rank each candidate against each lens item), but that's opaque, slow at 50+ candidates, and doesn't compose well with dedupe. Embeddings give us real evidence (cosine score persisted on every segment), fast enough to do 45+ candidates in a single API call, and enable the semantic exclude filter ("kill geopolitics" = drop anything cosine >= 0.80).
**Trade-off**: New DB extension + ongoing embedding API cost (~$0.02 per 1M tokens, negligible at scale) vs opaque LLM-only ranking.
**Outcome**: ✅ pgvector enabled on remote; lens-item embeddings cached in `ai_response_cache` (7d TTL); candidate embeddings computed inline per briefing.

## Decision 27: First-Class `briefing_interests` Table, NOT user_memory Overload
**Date**: Apr 2026
**Decision**: Create a dedicated `briefing_interests` table for user-declared beats / entities / excludes rather than overloading `user_memory` with another `fact_category`.
**Rationale**: Interests are declared preferences with their own UX (Settings tab + inline Add buttons), lifecycle (soft-delete, source provenance: manual / seed_accepted / feedback_promoted), and weight semantics (1.0 with LLM floor at 0.8). `user_memory` is for AI-extracted facts with a different validation story. Mixing the two would complicate both systems.
**Trade-off**: One more table + CRUD surface vs clean separation of "things the AI extracted" from "things the user declared."
**Outcome**: ✅ Shipped with RLS self-only policies. Interests seed the lens at the top, outranking inferred signals.

## Decision 28: Signature-Based Persistent Negative Feedback (not lens-item-id)
**Date**: Apr 2026
**Decision**: Key `briefing_lens_feedback` on SHA-256 of `bucket|normalized_text`, NOT on the ephemeral `lens_item_id` that shows up on segments.
**Rationale**: Lens items are regenerated every day - `decision_0` today is a different decision tomorrow. Keying on the id means feedback evaporates overnight. Keying on the content signature means a user who Bans "geopolitics" keeps it banned forever, even as the lens rebuilds. The `bucket` coarsens lens types (decisions / missions / objectives / blockers all bucket to `goal`) so related profile items share fate.
**Trade-off**: Slightly more CPU per lens build (SHA-256 per item, batched via Promise.all) vs persistent, predictable user control.
**Outcome**: ✅ Applied in both cold and cached lens paths so kills take effect within one regeneration.

## Decision 29: In-Database Aggregator (plpgsql + pg_cron), Not HTTP Cron
**Date**: Apr 2026
**Decision**: Implement the nightly feedback aggregation as `sp_aggregate_briefing_feedback` plpgsql + a pg_cron schedule, rather than calling the `briefing-aggregate-feedback` edge function via `net.http_post`.
**Rationale**: The HTTP path requires storing the service-role JWT in Postgres (vault or a setting), adding blast-radius. The SQL function runs as `SECURITY DEFINER postgres`, owns its own query plan, and never touches a token. Faster (no HTTP roundtrip), simpler ops (one less secret), safer (no exposed key). The edge function stays for admin/ad-hoc invocation.
**Trade-off**: Maintained logic in two places (plpgsql + TypeScript) vs no service-role token exposure.
**Outcome**: ✅ Scheduled at 03:07 UTC daily. Dry-run on deploy returned zero buckets as expected (no v2 feedback in the wild yet).
