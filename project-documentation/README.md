# Mindmaker Project Documentation

**Master Index**

This folder contains all technical and strategic documentation for the Mindmaker AI literacy system.

**Last Updated:** 2026-01-16
**Current Version:** v3.0 (Apple-like executive-grade rebuild)

---

## Documentation Structure

### Strategic Foundation
- [PURPOSE.md](./PURPOSE.md) - Core mission and problem statement
- [ICP.md](./ICP.md) - Ideal customer profile (individual senior leaders)
- [VALUE_PROP.md](./VALUE_PROP.md) - Value propositions by audience
- [OUTCOMES.md](./OUTCOMES.md) - Expected user outcomes and success metrics

### Product & Features
- [FEATURES.md](./FEATURES.md) - Complete feature inventory for the Leaders tool
- [VISUAL_GUIDELINES.md](./VISUAL_GUIDELINES.md) - Visual design principles and examples

### Technical Foundation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and data flow
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design tokens, components, and patterns
- [BRANDING.md](./BRANDING.md) - Brand voice, tone, and messaging guidelines

### AI Reasoning & Behavioral Framework
- [LLM_CRITICAL_THINKING_TRAINING.md](./LLM_CRITICAL_THINKING_TRAINING.md) - **Critical document** for AI reasoning quality and behavioral psychology filters

### Operational Knowledge
- [HISTORY.md](./HISTORY.md) - Evolution of the product and major pivots
- [COMMON_ISSUES.md](./COMMON_ISSUES.md) - Recurring bugs and architectural pain points
- [DECISIONS_LOG.md](./DECISIONS_LOG.md) - Key architectural and product decisions
- [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md) - Step-by-step rebuild instructions
- [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md) - AI assistant behavior guidelines

### Audit Reports
- [PRODUCTION_AUDIT_2024_12_13.md](./PRODUCTION_AUDIT_2024_12_13.md) - Comprehensive production readiness audit

---

## Quick Start for New Developers

1. Read [PURPOSE.md](./PURPOSE.md) to understand what you're building
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Study [COMMON_ISSUES.md](./COMMON_ISSUES.md) to avoid known pitfalls
4. Follow [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md) to set up your environment
5. Reference [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for UI implementation
6. Review [VISUAL_GUIDELINES.md](./VISUAL_GUIDELINES.md) for visual standards

## Critical: AI Reasoning Framework

**All AI-generated insights must be anchored in the cognitive frameworks defined in [LLM_CRITICAL_THINKING_TRAINING.md](./LLM_CRITICAL_THINKING_TRAINING.md).**

This document defines the behavioral psychology filter for leadership decisions, including:

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

### Quality Standards
- Reasoning must be transparent and step-by-step
- Recommendations must honor dialectical tension (pros AND cons)
- Insights must be actionable, not abstract
- All outputs should enable better human judgment, not replace it

---

## Current State (v3.0)

### Design Philosophy
- **Apple-like quality**: Executive-grade, 10/10 visual polish
- **Mobile-first**: No-scroll experience on all mobile pages
- **Voice-first**: OpenAI Whisper integration for voice input
- **Light mode**: Warm off-white backgrounds, deep ink text, pure white cards

### Key Technical Features
- React 18 + TypeScript + Vite
- Framer Motion for animations
- Tailwind CSS + shadcn/ui components
- Supabase (PostgreSQL + Edge Functions)
- OpenAI GPT-4o + Whisper
- Google Gemini fallback

### Visual Standards
- Generous spacing (Apple-like padding)
- Subtle shadows (multi-layer, soft)
- Rounded corners (24px cards, 16px buttons)
- System fonts (San Francisco, Segoe UI)
- Subtle video backgrounds (12% opacity)

### Mobile Architecture
- `--mobile-vh` CSS variable for accurate viewport
- Fixed headers and bottom navigation
- Scrollable content areas only
- Safe area insets for notches
- Touch targets minimum 44x44px

---

## Terminology Standards

- **Diagnostic**: The assessment process (never "quiz" or "test")
- **Leaders Tool**: Individual executive diagnostic (formerly "Benchmark")
- **Teams Tool**: Executive bootcamp/workshop platform
- **Partners Tool**: Portfolio assessment for VCs/PE
- **AI Literacy**: Core product positioning (not "AI implementation" or "AI training")
- **Tensions**: Strategic gaps between current and desired state
- **Risk Signals**: Blind spots, waste, or theatre indicators
- **Org Scenarios**: 3-5 year structural change projections
- **Thinking Tools**: Mental models and prompts (not "prompt library")

---

## Version Control

| Field | Value |
|-------|-------|
| Documentation last updated | 2026-01-16 |
| Current product version | v3.0 (Apple-like rebuild) |
| Architecture version | Single DB-based architecture |
| Design system version | v3.0 (Light mode, Apple-like) |
| Last audit | 2024-12-13 |

---

## Critical Design Rules

### Must Follow
1. **No `bg-background` on App.tsx root** - blocks video backgrounds
2. **Use `--mobile-vh` for mobile heights** - not `100vh` or `100dvh`
3. **All buttons need `border-0`** - explicit border removal
4. **Video at 12% opacity** - truly subtle, not distracting
5. **Generous padding** - p-8 minimum on cards

### Must Avoid
1. Scroll on mobile pages (use no-scroll pattern)
2. Arbitrary z-index values (use documented system)
3. Hardcoded colors (use design tokens)
4. Large bottom padding (causes overflow)
5. Decorative elements (functional only)

---

## File Quick Reference

| Need | File |
|------|------|
| Color values | DESIGN_SYSTEM.md |
| Typography scale | DESIGN_SYSTEM.md |
| Animation specs | DESIGN_SYSTEM.md |
| Mobile viewport | DESIGN_SYSTEM.md |
| Video background | VISUAL_GUIDELINES.md |
| Card patterns | VISUAL_GUIDELINES.md |
| Button styles | VISUAL_GUIDELINES.md |
| Component structure | ARCHITECTURE.md |
| Database schema | ARCHITECTURE.md |
| Edge functions | ARCHITECTURE.md |
| Feature list | FEATURES.md |
| Known bugs | COMMON_ISSUES.md |
| Past decisions | DECISIONS_LOG.md |
| Setup guide | REPLICATION_GUIDE.md |
| **AI reasoning frameworks** | **LLM_CRITICAL_THINKING_TRAINING.md** |
| **Cognitive frameworks** | **LLM_CRITICAL_THINKING_TRAINING.md** |
| **Behavioral psychology** | **LLM_CRITICAL_THINKING_TRAINING.md** |
