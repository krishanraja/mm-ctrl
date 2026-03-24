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
