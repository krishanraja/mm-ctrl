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
