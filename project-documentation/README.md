# CTRL Project Documentation

**Master Index**

This folder contains all technical and strategic documentation for the CTRL portable AI context platform.

**Last Updated:** 2026-03-24
**Current Version:** v4.1 (CTRL rebrand: Clarity for Leaders)

---

## Documentation Structure

### Sales & Outbound
- [SALES_BRIEF.md](./SALES_BRIEF.md) - **Start here for outbound.** Product overview, angles, objection handling, ICP summary.

### Strategic Foundation
- [PURPOSE.md](./PURPOSE.md) - Core mission and problem statement
- [ICP.md](./ICP.md) - Ideal customer profile (individual senior leaders)
- [VALUE_PROP.md](./VALUE_PROP.md) - Value propositions by audience
- [OUTCOMES.md](./OUTCOMES.md) - Expected user outcomes and success metrics

### Product & Features
- [FEATURES.md](./FEATURES.md) - Complete feature inventory (Memory Web, Context Export, AI tools, Diagnostic, Missions, and more)
- [VISUAL_GUIDELINES.md](./VISUAL_GUIDELINES.md) - Visual design principles and examples

### Technical Foundation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and data flow
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design tokens, components, and patterns
- [BRANDING.md](./BRANDING.md) - Brand voice, tone, and messaging guidelines

### Operational Knowledge
- [HISTORY.md](./HISTORY.md) - Evolution of the product and major pivots (Phases 1-5)
- [COMMON_ISSUES.md](./COMMON_ISSUES.md) - Recurring bugs and architectural pain points
- [DECISIONS_LOG.md](./DECISIONS_LOG.md) - Key architectural and product decisions
- [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md) - Step-by-step rebuild instructions
- [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md) - AI assistant behavior guidelines

---

## Quick Start for Sales Agents

1. Read [SALES_BRIEF.md](./SALES_BRIEF.md) - everything you need in one page
2. Review [VALUE_PROP.md](./VALUE_PROP.md) for differentiation and positioning
3. Check [ICP.md](./ICP.md) for who to target (and who NOT to target)
4. See [BRANDING.md](./BRANDING.md) for voice and tone in emails

## Quick Start for Developers

1. Read [PURPOSE.md](./PURPOSE.md) to understand what you're building
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Study [COMMON_ISSUES.md](./COMMON_ISSUES.md) to avoid known pitfalls
4. Follow [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md) to set up your environment
5. Reference [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for UI implementation
6. Review [VISUAL_GUIDELINES.md](./VISUAL_GUIDELINES.md) for visual standards

---

## AI Reasoning Framework

All AI-generated insights are anchored in cognitive frameworks embedded in the `ai-generate` edge function.

### Five Core Cognitive Frameworks
1. **A/B Framing** - Reframe decisions to expose bias (positive vs negative framing)
2. **Dialectical Tension** - Thesis-antithesis-synthesis for balanced reasoning
3. **Mental Contrasting (WOOP)** - Goals, obstacles, and realistic planning
4. **Reflective Equilibrium** - Aligning decisions with organizational principles
5. **First-Principles Thinking** - Fundamental problem-solving, challenging assumptions

### AI Response Requirements
- Never provide generic advice disconnected from user's specific context
- Always tie insights to specific assessment data and user answers
- Apply appropriate cognitive framework based on decision type
- Present multiple perspectives before synthesizing recommendations
- Calibrate confidence levels to reasoning quality
- Challenge assumptions through Socratic questioning

---

## Current State (v4.1)

### Product Positioning
- **Tagline**: "Clarity for Leaders"
- **Core Value**: Decision speed for leaders. Portable AI context that makes every AI tool personalized
- **Time to Value**: 2 minutes to first export

### Design Philosophy
- **Apple-like quality**: Executive-grade, 10/10 visual polish
- **Voice-first**: Talk naturally, structure extracted automatically
- **Mobile-first**: No-scroll experience on all mobile pages
- **Light mode**: Warm off-white backgrounds, deep ink text, pure white cards

### Key Technical Features
- React 18 + TypeScript + Vite
- Framer Motion for animations
- Tailwind CSS + shadcn/ui components
- Supabase (PostgreSQL + 45+ Edge Functions)
- OpenAI GPT-4o (primary) + Vertex AI Gemini (fallback)
- OpenAI Whisper for voice transcription
- 20 lazy-loaded pages, 30+ custom hooks
- Memory encryption (AES-256-GCM)
- Google OAuth + Email auth

### Core Features
- **Memory Web**: Voice-first context extraction with encrypted storage
- **Context Export**: One-click export to ChatGPT, Claude, Gemini, Cursor, Claude Code
- **Guided First Experience**: 3-question onboarding delivering export in 2 minutes
- **Pattern Detection**: 10X skills, blind spots, behavioral preferences
- **AI Tools Hub**: Decision Advisor, Meeting Prep, Prompt Coach, Stream of Consciousness
- **Diagnostic Assessment**: 10-minute AI literacy diagnostic
- **Missions System**: First Moves commitment tracking with check-ins
- **Progress Tracking**: Snapshots and drift detection over time

---

## Terminology Standards

- **Memory Web**: Living knowledge base of facts about the leader
- **AI Double / Digital Clone**: The exportable context that represents the leader
- **Context Export**: Formatted output for AI tools
- **10X Skills**: Strengths identified for amplification
- **Blind Spots**: Gaps or risks surfaced by pattern detection
- **Diagnostic**: The assessment process (never "quiz" or "test")
- **Tensions**: Strategic gaps between current and desired state
- **Risk Signals**: Blind spots, waste, or theatre indicators
- **Thinking Tools**: Mental models and prompts (not "prompt library")
- **First Moves**: Prioritized next steps from diagnostic
- **Missions**: Active commitment to a First Move with check-in tracking
- **Memory Facts**: Individual verified data points in the Memory Web
- **Temperature**: Memory fact recency/relevance (hot/warm/cold)

---

## Version Control

| Field | Value |
|-------|-------|
| Documentation last updated | 2026-03-24 |
| Current product version | v4.1 (CTRL rebrand: Clarity for Leaders) |
| Architecture version | Single DB-based architecture |
| Design system version | v3.0 (Light mode, Apple-like) |
| AI primary model | OpenAI GPT-4o |
| AI fallback model | Vertex AI (Gemini 2.0 Flash) |
| Edge functions | 45+ |
| Pages | 20 (lazy-loaded) |
| Custom hooks | 30+ |
