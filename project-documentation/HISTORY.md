# History

Evolution of CTRL (originally Mindmaker) and major product pivots.

**Last Updated:** 2026-04-26

---

## Timeline

### Phase 1: AI Leadership Benchmark (Original)
**Period**: Early 2024
**Positioning**: "AI-led transformation" platform
**Features**:
- Quiz-based assessment
- AI Leadership Benchmark scoring
- Prompt library generation
- Generic AI coaching

**Issues**:
- Felt like "ChatGPT quiz wrapper"
- Unclear differentiation from free tools
- Hype-driven messaging alienated senior leaders
- No clear business model

---

### Phase 2: Dual Architecture Addition
**Period**: Mid 2024
**Changes**:
- Added V2 components alongside V1
- Created `LeadershipBenchmarkV2.tsx`, `PromptLibraryV2.tsx`
- Added voice assessment path
- Introduced deep profile questionnaire

**Issues**:
- Two architectures coexisting (prop-based vs DB-based)
- Conditional rendering caused stale UI
- Inconsistent user experience
- Technical debt accumulated

---

### Phase 3: AI Literacy Repositioning
**Period**: January 2025
**Changes**:
- Repositioned as "AI literacy for executive cognition"
- Removed V1 components entirely
- Unified architecture (DB-based only)
- Reframed copy (removed quiz/gamification language)
- Surfaced tensions, risks, scenarios
- Renamed "Prompt Library" to "Thinking Tools"

**Outcomes**:
- Single, coherent architecture
- Senior, professional tone
- Clear differentiation from alternatives
- Anti-fragile pipeline guarantees

---

### Phase 4: V3 Complete Rebuild (Current)
**Period**: January 2026
**Positioning**: "Apple-like, executive-grade AI literacy tool"

**Trigger**: User feedback indicated the application had become visually unacceptable:
> "This has become one of the WORST looking apps I've ever seen... I cannot put this in front of my dog let alone an enterprise CEO."

**Key Requirements**:
1. **Design System**: Match previous iteration (light mode, off-white backgrounds, ink text)
2. **Apple-Like Quality**: Must look like an Apple product - 10/10 visual quality
3. **Video Background**: Subtle overlay (12% opacity, desaturated)
4. **No-Scroll Mobile**: ENTIRE app must be no-scroll on mobile
5. **Executive Framer Motion**: Beautiful, world-class animations everywhere
6. **Adaptive Design**: Must work perfectly on all devices

**Technical Changes**:
- OpenAI Whisper integration for voice transcription
- OpenAI GPT-4o/GPT-4o-mini for insights
- Google Gemini as fallback
- Supabase Edge Functions (Deno)
- React with Framer Motion
- Tailwind CSS / Shadcn UI
- Mobile viewport utilities for no-scroll experience

**Design System Overhaul**:
- Light mode color system (warm off-white #faf9f7, deep ink #0e1a2b)
- Apple-like shadows (subtle, multi-layer)
- Generous spacing (p-8 sm:p-12 md:p-16 lg:p-20)
- Rounded corners (rounded-3xl for cards, rounded-2xl for buttons)
- System font stack (San Francisco, Segoe UI)

**Component Architecture**:
- Mobile dashboard with fixed header, scrollable content, bottom nav
- Bottom sheet pattern for overlays
- Floating voice button
- Hero status cards
- Priority card stacks

**Animation System**:
- Framer Motion throughout
- Spring physics (stiffness: 400, damping: 35)
- Fast animations (200-350ms)
- Subtle movements (24px max)
- SVG underline draw animations

**Mobile-First Architecture**:
- `--mobile-vh` CSS variable for accurate viewport
- No-scroll pattern for all pages
- Safe area insets for notches/home indicators
- Touch targets minimum 44x44px

**Outcomes**:
- Executive-grade visual quality
- Consistent Apple-like aesthetic
- No-scroll mobile experience
- Voice-first, mobile-first design
- Comprehensive motion system

---

### Phase 5: Memory Web & Portable AI Context + CTRL Rebrand
**Period**: February-March 2026
**Positioning**: "Clarity for Leaders" (rebranded from Mindmaker to CTRL)

**Trigger**: Recognition that the real value isn't the diagnostic. It's making every AI tool a leader uses dramatically better through portable context.

**Key Features Added**:
- **Memory Web**: Voice-first context extraction building a living knowledge base
- **Context Export**: One-click export to ChatGPT, Claude, Gemini, Cursor, Claude Code
- **Guided First Experience**: 3-question onboarding that delivers exportable context in 2 minutes
- **Pattern Detection**: AI surfaces strengths, blind spots, and behavioral preferences
- **Decision Tracking**: Records captured through Decision Advisor
- **AI Tools Hub (Think page)**: Decision Advisor, Meeting Prep, Prompt Coach, Stream of Consciousness
- **10X Skills Map**: Strength amplification and gap identification
- **Memory Health Dashboard**: AI Double health score, coverage visualization, fact grid

**Technical Changes**:
- 45+ Edge Functions (up from ~20)
- 30+ custom hooks
- Memory encryption (AES-256-GCM)
- Token-aware context building with budget management
- Memory lifecycle management (temperature system: hot/warm/cold)
- Google OAuth added alongside email auth
- Text input alternatives to all voice-only components

**Key Copy/Positioning**:
- Headline: "Talk. We learn. Every AI gets smarter."
- Subheadline: "Narrate your world and CTRL builds your personal Memory Web"
- CTA: "Get Started Free - 2 minutes to your first export"

**Outcomes**:
- Product shifted from assessment tool to context platform
- Immediate value delivery (2 min to first export vs. 10 min diagnostic)
- Portable context as primary differentiator
- Voice-first as interaction paradigm, not just an alternative input

---

## Major Pivots

### Pivot 1: From Implementation to Literacy
**Before**: "We help you implement AI in your organisation"
**After**: "We help you develop AI literacy to make better decisions"
**Rationale**: Leaders need mental models, not tools

### Pivot 2: From Quiz to Diagnostic
**Before**: "Take our AI leadership quiz!"
**After**: "Complete a 10-minute diagnostic"
**Rationale**: Senior leaders don't take quizzes

### Pivot 3: From Scores to Tensions
**Before**: Hero metric was benchmark score (0-100)
**After**: Hero content is tensions, risks, scenarios
**Rationale**: Leaders need to see gaps, not grades

### Pivot 4: From Prompts to Mental Models
**Before**: "Get AI prompts to use"
**After**: "Get thinking tools for daily decisions"
**Rationale**: Context matters more than templates

### Pivot 5: From Functional to Executive-Grade
**Before**: Functional but visually inconsistent
**After**: Apple-like, 10/10 visual quality
**Rationale**: CEOs judge products by appearance; visual quality signals credibility

### Pivot 6: From Scroll to No-Scroll
**Before**: Standard scrolling pages
**After**: Viewport-fit, no-scroll mobile experience
**Rationale**: Executive users expect polished, contained experiences

### Pivot 7: From Assessment to Portable AI Context
**Before**: "Take a 10-minute AI literacy diagnostic"
**After**: "Build a portable AI double in 2 minutes that makes every AI tool better"
**Rationale**: The real value is personalized AI interactions across all tools, not a one-time assessment score

### Pivot 8: From AI Tool to AI Infrastructure
**Before**: CTRL as another AI tool to learn
**After**: CTRL as the layer that makes every AI tool you already use better
**Rationale**: Leaders don't want another tool. They want their existing tools to work better.

### Pivot 9: From Mindmaker to CTRL
**Before**: "Mindmaker" - broad, abstract name suggesting AI mindset
**After**: "CTRL" - sharp, action-oriented name positioning around decision speed for leaders
**Rationale**: The rebrand to CTRL reflects the product's core value: giving leaders clarity and control over decisions in an AI-augmented world. "Clarity for Leaders" as tagline.

---

## Key Learnings

1. **Positioning is everything**: "AI literacy" resonates, "AI transformation" doesn't
2. **Senior UX matters**: Emojis and gamification alienate executives
3. **Architecture debt compounds**: Dual architecture caused cascading issues
4. **AI must be backstage**: Show outcomes, not "AI-powered" labels
5. **Evidence over generic**: Tie insights to specific user answers
6. **Visual quality is credibility**: CEOs judge products by appearance
7. **Mobile-first is mandatory**: Most executives check tools on mobile
8. **No-scroll is premium**: Contained experiences feel more polished
9. **Animations must be subtle**: Executive tools need restraint, not flash
10. **Design system consistency**: Every pixel matters at the executive level

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Early 2024 | Initial AI Leadership Benchmark |
| 2.0 | Mid 2024 | Dual architecture with V2 components |
| 2.1 | Jan 2025 | AI Literacy repositioning, unified architecture |
| 3.0 | Jan 2026 | Complete rebuild with Apple-like design system |
| 4.0 | Feb-Mar 2026 | Memory Web, Context Export, Portable AI Double |
| 4.1 | Mar 2026 | Rebrand from Mindmaker to CTRL: "Clarity for Leaders" |
| 5.0 | Apr 2026 | Briefing v2: evidence-based relevance lens + pgvector + four-part learning loop (Interests, industry seeds, explicit kill, nightly aggregator) |
| 5.1 | Apr 2026 | Phase 7 — six audit-week tracks shipped: revenue path, data path, UX, reliability, observability, cleanup. Hardened production platform. |

---

## Phase 6: Evidence-Based Briefing Pipeline (April 2026)

### Context

By Q1 2026 the Daily Briefing existed but was generic: a user profile got flattened into a single prompt, three news providers were raced (two always discarded), and an LLM was asked to both rank and narrate. Personalization was *asserted* in prose (`relevance_reason`) but never tied back to any specific profile fact. A creator-economy user's briefing shipped five wildly off-target headlines (data breach costs, geopolitical tensions, CIO100 Conference, African fintech VC) - a concrete failure case that exposed the systemic gap.

### The Rebuild

Replaced the entire personalisation path with an **evidence-based relevance pipeline**:

1. **Importance Lens** - explicit ranked profile items per (user, briefing_type, date), with cached LLM reweight
2. **Query Planner** - lens → targeted news queries
3. **Provider Merge** - Perplexity + Tavily + Brave in parallel with a 12s wall-clock cap
4. **Embedding Dedupe + Scoring** - pgvector + `text-embedding-3-small` (batched), cosine dedupe, relevance = `cos_sim × lens_weight`
5. **Budget-Constrained Curation** - word budget from training material, diversity and coverage rules
6. **Script Generation** - unchanged, kept the training_material voice pattern
7. **Audio Synthesis** - unchanged

Every segment now carries `lens_item_id`, `relevance_score`, and `matched_profile_fact`. Personalization went from prose-asserted to auditable.

### Four-Item Learning Loop

The pipeline alone wasn't enough; the profile itself was the bottleneck. Shipped four follow-on items:

1. **Diagnose** - `briefing-diagnose` edge function answers "why did this user get these headlines?" in one call.
2. **Briefing Interests** - new table + Settings tab; users declare beats (topics), entities (people/companies), excludes (never-show). Beats and entities prepend the lens at weight 1.0, clamped above 0.8 by the LLM reweight. Excludes post-filter the candidate pool within 0.80 cosine.
3. **Industry-aware seed beats** - `industry_beat_library` seeded with 11 industries × ~8 beats × ~5 entities; `SeedBeatsPrompt` proposes relevant seeds on cold-start via fuzzy-match on the user's declared industry. One tap to accept.
4. **Persistent semantic negative feedback** - explicit Ban button (writes `-1.0` delta) + nightly aggregator (`sp_aggregate_briefing_feedback` + pg_cron, 03:07 UTC) that promotes any lens signature with 3+ thumbs-down to a persistent `-0.4` delta. Signatures keyed on SHA-256 of `bucket|normalized_text` so feedback survives daily lens regeneration.

### UI Surfacing

Initially the new loop landed in `BriefingSheet` (the full-screen slide-up) and in the Settings tab. Users mostly interacted with the inline `BriefingCard` on the dashboard, which rendered segments with its own compact markup and missed the new affordances. A follow-up patch hoisted `SeedBeatsPrompt` onto the dashboard directly above the briefing card, added inline Bookmark + Ban + "Anchored to:" chips to `BriefingCard`'s segment rows, and promoted the Interests tab to position 3 in Settings.

### PRs

- PR #87 (merged 2026-04-19) - v2 pipeline + four items + cron
- PR #88 (merged 2026-04-19) - surfacing fix for the dashboard card

### Migrations Applied

- `20260418000000_briefing_v2_pgvector_schema` - pgvector extension, `briefings.schema_version`, `briefing_feedback` extension (`lens_item_id`, `dwell_ms`, `replayed`)
- `20260419000000_briefing_interests` - new table + RLS
- `20260419000001_industry_beat_library` - new table + seed data (11 industries)
- `20260419000002_briefing_lens_feedback` - new table
- `20260419000003_briefing_aggregate_feedback_cron` - SQL aggregator function + pg_cron schedule

---

## Phase 7: Six-Week Audit Hardening (April 2026)

### Context

By mid-April 2026, the product surface area had grown to 74 edge functions, 48 hooks, 97 migrations, and a multi-stage briefing pipeline. The shape was right; the edges were not all clean. A six-week audit-track program was committed, each week landing as its own PR with a clear thematic boundary.

### Week 1 — Revenue Path (PR #93, merged 2026-04-21)

**Shipped:**
- Mandatory Stripe webhook signature verification on `stripe-webhook` edge function. Unsigned/badly-signed payloads now reject with 400.
- Webhook idempotency via new `stripe_events_processed` table — replays of the same event ID are recognised and skipped.
- Briefing rate limits enforced via `_shared/rateLimit.ts` to prevent abuse and runaway cost.
- E2E test `tests/stripe-webhook-idempotency.spec.ts` proves the contract.

**Why it mattered:** A leaked or replayed Stripe webhook could double-charge a Pro subscriber. This is the kind of issue that surfaces at audit time and damages trust with executive buyers.

### Week 2 — Data Path (PR #94, merged 2026-04-22)

**Shipped:**
- Closed an assessment-data leak (specific issue redacted from public docs).
- Codified the storage bucket policy for `ctrl-briefings` (audio artifacts now have explicit RLS-aligned object policies).
- Completed end-to-end account deletion: removes Memory Web, briefings, audio artifacts, decisions, missions, assessments — verified in `tests/account-deletion.spec.ts`.

**Why it mattered:** Privacy claims must be backed by code. "Self-contained, encrypted at rest, fully deletable" is a sales anchor; this week made it provably true.

### Week 3 — UX (PR #95, merged 2026-04-22)

**Shipped:**
- Killed the onboarding gate that was blocking returning users on the dashboard.
- Fixed the NorthStar stub on the home view.
- Voice permission recovery flow when a user denies microphone access then changes their mind.
- Removed surveillance-y copy across the app.
- Removed every "coming soon" placeholder for unimplemented affordances. The product no longer advertises what it can't do.

**Why it mattered:** The product is sold to executives. Anything that feels half-finished erodes the premium positioning.

### Week 4 — Reliability (PR #99, merged 2026-04-23)

**Shipped:**
- New `_shared/with-timeout.ts` utility (with vitest coverage). Every external API call (Vertex, OpenAI, ElevenLabs, Perplexity, Tavily, Brave, Resend, Stripe) now wraps in a timeout + retry contract.
- Audio failure UX — if synthesis fails, the briefing card still shows segments + script.
- Onboarding stall recovery — users who closed the app mid-onboarding can resume cleanly.

**Why it mattered:** A 3-minute briefing that hangs for 60 seconds because Perplexity is slow is a credibility hit. The 12-second wall-clock cap on provider fan-out + per-call timeouts means worst-case behaviour is bounded.

### Week 5 — Observability (PR #97, merged 2026-04-23)

**Shipped:**
- Structured edge-function logger at `_shared/logger.ts`. JSON output: `{ ts, level, fn, msg, userId, duration_ms, error }`. Searchable in Supabase logs.
- CI gate prevents `console.log` regressions in edge functions.
- Tests for `with-timeout` to lock the retry contract.

**Why it mattered:** When a leader emails saying "my briefing is broken," we can find the request in seconds, see the exact failure path, and fix it the same day.

### Week 6 — Cleanup + e2e starter (PR #98, #100, #101, merged 2026-04-24 → 2026-04-26)

**Shipped:**
- P2 backlog closure across UX, copy, and minor inconsistencies.
- E2E test contract starter: 6 Playwright specs covering the highest-risk paths (auth, briefing journey, briefing rate limits, sparse profile, account deletion, stripe idempotency).
- New `ai_response_cache` table + 4 more end-to-end contracts.
- Lint cleanup (kept ~1600 pre-existing warnings as accepted debt; new violations now blocked at CI).

**Why it mattered:** The remaining "I'll fix it later" items had been later for too long. Closing them out cleared the runway for the next product expansion.

### Outcomes from Phase 7

- 6 thematic PRs merged in April 2026
- 6 e2e specs covering the riskiest user paths
- 0 known revenue-path bugs
- 0 known data-leak vectors
- Structured logs in production, queryable per user / function / duration
- This is the version sales/marketing AI agents can confidently sell — not "we plan to harden it" but "the audit is shipped and the tests prove it."