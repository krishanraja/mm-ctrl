# Features

Complete feature inventory across all three Mindmaker tools.

**Last Updated:** 2026-03-20

---

## Leaders Tool: Individual AI Literacy Diagnostic

### Entry & Assessment

**Landing Page** (`HeroSection.tsx`)
- Apple-like, executive-grade design
- Subtle video background (12% opacity)
- Centered white card with generous padding
- Plain-language value proposition
- Single "Start diagnostic" CTA
- Trust indicators (checkmarks, muted text)
- No quiz/gamification language
- 10-minute time expectation set
- No-scroll on mobile

**Assessment Flow** (`UnifiedAssessment.tsx`)
- Quiz path: 20 Likert-scale questions across 6 dimensions
- Voice path: Compass module (5 questions) + ROI module
- Deep profile questionnaire: 13 contextual questions
- Contact collection: Name, email, company, role
- Progress tracking throughout

**Dimensions Assessed**
1. Strategic Vision
2. Experimentation Culture
3. Delegation & Automation
4. Data & Decision Quality
5. Team Capability
6. Governance & Ethics

### Results & Insights

**Overview Tab** (`LeadershipBenchmarkV2.tsx`)
- AI Literacy Diagnostic score (0-100)
- Tier classification (Emerging/Establishing/Advancing/Leading)
- Radar chart showing 6 dimension scores
- Peer comparison bubble chart (anonymised cohort data)
- Percentile ranking
- Dimension-specific scores and tiers

**Tensions Tab** (`TensionsView.tsx`)
- **Strategic Tensions**: Gaps between current and desired state
- **Risk Signals**: Shadow AI, skills gaps, ROI leakage, decision friction
- **Org Scenarios**: 3-5 year structural change projections
- Priority ranking for each item
- Plain-language descriptions tied to assessment data

**Tools Tab** (`PromptLibraryV2.tsx`)
- Personalised thinking tools (mental models + prompts)
- 3-8 tool categories based on diagnostic results
- Each category includes:
  - What it's for
  - When to use
  - How to use
  - 2-5 specific prompts
- Copy all tools functionality
- Download as text file

**Privacy Tab** (`ConsentManager.tsx`)
- AI Leadership Index consent management
- Data usage transparency
- Opt-in/opt-out controls
- Consent audit trail

### Data Architecture

**Tables Used**
- `leaders`: Profile data
- `leader_assessments`: Assessment records and metadata
- `leader_dimension_scores`: Dimension-specific scores
- `leader_insights`: Generated insights (edge, risk, next move)
- `leader_first_moves`: Actionable next steps
- `leader_prompt_sets`: Personalised thinking tools
- `leader_tensions`: Strategic gaps
- `leader_risk_signals`: Blind spots and waste indicators
- `leader_org_scenarios`: Future state projections
- `assessment_events`: Granular Q&A log
- `assessment_behavioral_adjustments`: Deep profile influence on scores
- `index_participant_data`: Anonymised benchmark data

**Edge Functions**
- `create-leader-assessment`: Creates assessment record and initial scores
- `ai-generate`: Central AI generation function (Vertex AI primary, OpenAI fallback) - produces insights, prompts, tensions, risks, scenarios, and first moves in a single call
- `populate-index-participant`: Anonymised benchmark contribution

### Free vs Paid

**Free Tier** (Default)
- Full diagnostic assessment
- Overview tab with benchmark scores
- Limited prompts (2 categories)
- Basic tensions view

**Paid Tier** (Full Leadership Diagnostic)
- Full tensions, risks, and scenarios
- Complete prompt library (3-8 categories)
- Priority ranking and evidence
- Downloadable reports
- Payment: $49 via Stripe

---

## Mobile Dashboard Experience

### Dashboard Page (`/dashboard`)

**Mobile Layout** (`MobileDashboard.tsx`)
- Full viewport height (no-scroll)
- Fixed header with user name
- Scrollable content area
- Fixed bottom navigation
- Floating voice button

**Hero Status Card** (`HeroStatusCard.tsx`)
- Current tier display
- Percentile ranking
- Quick stats overview
- Visual tier indicator

**Priority Card Stack** (`PriorityCardStack.tsx`)
- Top priorities from tensions
- Swipeable card interface
- Action-oriented content
- Links to detailed views

**Bottom Navigation** (`BottomNav.tsx`)
- 4 navigation items
- Fixed bottom position
- Active state indicators
- Backdrop blur effect

**Voice Button** (`VoiceButton.tsx`)
- Floating action button
- Positioned above bottom nav
- Quick access to voice input
- Animated state changes

### Today Page (`/today`)

**Layout**
- Fixed header (title + subtitle)
- Scrollable content area
- No-scroll pattern on mobile

**Weekly Action** (`WeeklyAction.tsx`)
- Current week's focus action
- Progress tracking
- Completion status
- Context from assessment

**Daily Provocation** (`DailyProvocation.tsx`)
- Daily thought-provoking question
- Tied to user's tensions
- Encourages reflection
- Rotates daily

### Voice Page (`/voice`)

**Layout**
- Fixed header with back button
- Centered voice recorder
- Large mic icon
- Countdown timer
- Start/Stop button

**Voice Recorder** (`VoiceRecorder.tsx`)
- OpenAI Whisper integration
- Real-time transcription
- Visual feedback during recording
- Auto-stop on silence

### Pulse Page (`/pulse`)

**Strategic Pulse** (`StrategicPulse.tsx`)
- Baseline assessment summary
- Tensions overview
- Risk signals display
- Trend indicators

**Layout**
- Fixed header
- Scrollable content
- Card-based sections

### Sheet Component (`Sheet.tsx`)

**Specifications**
- Bottom sheet pattern
- Three height variants: small (40vh), medium (60vh), large (85vh)
- Backdrop with blur
- Spring animation physics
- Drag handle indicator
- Rounded top corners

---

## Memory Center

### Overview

Voice-first context extraction system that builds a persistent knowledge base about each leader, enabling increasingly personalised AI interactions over time.

**Page**: `/memory` (auth required)

### Features

**Voice-First Fact Extraction** (`VoiceMemoryCapture.tsx`)
- Record voice input about context, goals, blockers
- OpenAI Whisper transcription via `voice-transcribe` edge function
- AI extracts structured facts via `extract-user-context` edge function
- Facts categorised: identity, business, objective, blocker, preference
- Confidence scoring (0-1) on each extracted fact

**Fact Verification** (`FactVerificationCard.tsx`)
- Facts displayed with confidence indicators
- User can verify, correct, or reject each fact
- Verification statuses: inferred, verified, corrected, rejected
- Sources tracked: voice, form, linkedin, calendar, enrichment

**Memory Management** (`MemoryList.tsx`, `MemoryItemCard.tsx`, `MemoryPill.tsx`)
- Browse all stored memory facts
- Add facts manually via `AddMemorySheet.tsx`
- View detail via `MemoryDetailSheet.tsx`
- Delete or modify facts

**Privacy Controls** (`PrivacyControlsPanel.tsx`)
- Enable/disable memory collection
- Enable/disable auto-extraction from voice
- Set retention period (days)
- All settings managed via `memory-settings` edge function

**Data Export/Import** (`ExportImportPanel.tsx`)
- Export all memory data
- Import from external sources
- Data portability compliance

**Security**
- Content encrypted at rest using AES-256-GCM
- Encryption key stored in `MEMORY_ENCRYPTION_KEY` env var
- Decryption only in edge functions, never client-side
- RLS prevents cross-user access

### Data Architecture

**Tables Used**
- `user_memory`: Fact storage with encryption
- `user_memory_settings`: Privacy configuration

**Edge Functions**
- `memory-crud`: Create, read, update, delete memory facts
- `memory-settings`: Privacy settings management
- `extract-user-context`: AI fact extraction from voice
- `enrich-company-context`: Company context enrichment

### Components (11 files)
- `MemoryList.tsx`, `AddMemorySheet.tsx`, `MemoryDetailSheet.tsx`
- `MemoryItemCard.tsx`, `MemoryPill.tsx`, `FactVerificationCard.tsx`
- `VoiceMemoryCapture.tsx`, `PrivacyControlsPanel.tsx`, `ExportImportPanel.tsx`
- `MemoryErrorBoundary.tsx`

### Hooks
- `useMemoryQueries.ts`: React Query integration for memory CRUD
- `useUserMemory.ts`: Memory state management

---

## Context Export — Portable AI Context

### Overview

The headline differentiator: export your Memory Web as formatted context to any AI tool. One click to make ChatGPT, Claude, Gemini, Cursor, or any LLM instantly personalized.

**Page**: `/context-export` (auth required)

### Export Formats (6)

| Format | Target | Instructions |
|--------|--------|-------------|
| **ChatGPT** | OpenAI ChatGPT | Go to Settings > Personalization > Custom Instructions |
| **Claude** | Anthropic Claude | Paste at beginning of first message in new conversation |
| **Gemini** | Google Gemini | Paste as first message with "Context about me:" prefix |
| **Cursor** | Cursor IDE | Save as .cursorrules in project root |
| **Claude Code** | Claude Code CLI | Save as CLAUDE.md in project root |
| **Raw Markdown** | Any tool | Use anywhere that accepts markdown |

### Export Use Cases (6)

| Use Case | Optimized For |
|----------|--------------|
| **General Advisor** | All-purpose context for any AI conversation |
| **Meeting Prep** | Context optimized for preparing for meetings |
| **Decision Support** | Focus on goals, blockers, and decision history |
| **Code Review** | Technical preferences and project context |
| **Email Drafting** | Communication style and relationship context |
| **Strategic Planning** | Business context, objectives, and patterns |

### Features

- Format + use case selection matrix
- Real-time preview of generated context
- Token count display ("X tokens | Last updated [date]")
- One-click copy to clipboard
- Download as .md file
- Per-format instruction banners
- Quick export shortcut from dashboard header

### Data Architecture

**Edge Functions**
- `memory-export`: Generates formatted context from Memory Web, respecting privacy settings and token budgets

**Hooks**
- `useMemoryExport.ts`: Export generation, format selection, and clipboard integration

---

## Guided First Experience (Onboarding)

### Overview

Builds a leader's "digital double" in approximately 3 minutes through 3 guided voice questions. Designed to deliver immediate value — the user has an exportable AI context before reaching the dashboard.

### Flow

1. **Welcome** — "Let's build your AI double" (icon + CTA)
2. **Intro** — Shows 3 pillars: Memory Web, 10X Skills Map, Master Prompts
3. **Question 1: Identity** — "Tell me about yourself" (voice or text)
4. **Question 2: Work** — "Tell me about your work" (voice or text)
5. **Question 3: Goals** — "What are you working toward?" (voice or text)
6. **Processing** — Transcription → Fact extraction → Memory Web building (animated)
7. **Value Moment** — "Your AI double knows X things about you" + live preview of exportable context + copy to clipboard
8. **Complete** — "Your digital clone is live" → Dashboard

### Key Design Decisions

- Voice-first with text alternatives on every question
- Animated waveform during recording
- Progress bars (3 areas) at top
- Each question has area icon, title, prompt, hint
- Fact verification step lets user accept/reject extracted facts
- Value moment shows actual exportable context — proves immediate value

### Components
- `GuidedFirstExperience.tsx` (orchestrator)
- `src/components/onboarding/` (step components)

---

## Pattern Detection & 10X Skills

### Overview

AI analyzes the Memory Web to surface patterns: strengths to amplify, blind spots to address, and behavioral preferences. Displayed on the dashboard.

### Pattern Types

| Type | Description | Dashboard Section |
|------|-------------|-------------------|
| **strength** | Strengths to 10X — capabilities to amplify | "Strengths to 10X" card |
| **blind_spot** | Gaps or risks to address | "Blind Spots" card |
| **preference** | Working style and approach preferences | "Behaviors & Preferences" card |
| **behavior** | Recurring behavioral patterns | "Behaviors & Preferences" card |
| **anti_preference** | Things the user avoids or dislikes | "Behaviors & Preferences" card |

### Features

- Confidence scoring (0–1) on each pattern
- Patterns derived from Memory Web facts
- Auto-updated as Memory Web grows
- Up to 4 patterns displayed per section on dashboard

### Data Architecture

**Tables Used**
- `user_patterns`: Pattern storage with type, label, description, confidence

**Edge Functions**
- `detect-patterns`: AI pattern detection from Memory Web facts

---

## Decision Tracking

### Overview

Tracks decisions captured through the Decision Advisor tool, maintaining a history of choices with active/superseded status.

### Data Architecture

**Tables Used**
- `user_decisions`: Decision records with status (active, superseded), content, and timestamps

**Hooks**
- `useDecisions.ts`: Decision CRUD and history queries

---

## Memory Web Dashboard

### Overview

The central hub showing the leader's AI double health, Memory Web coverage, patterns, and facts.

### Dashboard Components

**AI Double Health Card**
- Animated health score percentage
- Stats: Total facts, Verified count, Patterns count, Decisions count
- Progress bar visualization
- "Getting Smarter" progress indicators

**Memory Web Coverage**
- Breakdown by category: Identity, Business, Goals, Challenges, Preferences
- Horizontal bar charts with counts per category
- Visual indicators for coverage gaps

**Skills & Patterns (3-column layout)**
- Strengths to 10X (with confidence scores)
- Blind Spots (with confidence scores)
- Behaviors & Preferences

**Memory Web Facts Grid**
- 2-column grid, up to 12 facts displayed
- Each fact: label, value, category badge, temperature badge (hot/warm/cold), verification status
- Expandable for context and confidence
- "View all X facts" link

**Voice Input Bar**
- Mic button with live recording indicator
- Text input: "Add to your digital clone — narrate anything about your work, goals, or challenges..."
- Persistent on dashboard for continuous Memory Web building

**Quick Export**
- Dashboard header shortcut to copy Claude export to clipboard

---

## Missions System (First Moves)

### Overview

After completing the diagnostic, leaders receive 3 prioritised "First Moves" - concrete next steps. The Missions system allows leaders to commit to a First Move, track progress through check-ins, and measure completion.

### Features

**First Move Selection** (`FirstMoveSelector.tsx`)
- Displays 3 AI-generated first moves from diagnostic
- Each move has content and priority ranking
- Leader selects one to commit as active mission

**Mission Dashboard** (`MissionsDashboard.tsx`)
- Active mission display with status
- Mission statuses: active, completed, skipped, extended
- Quick access to check-in

**Mission Check-In** (`MissionCheckIn.tsx` page)
- Structured reflection on mission progress
- Text and voice input support
- AI-generated response to reflection
- Check-in history

**Mission History** (`MissionHistory.tsx` page)
- View all past missions
- Status tracking (completed, skipped, extended)
- Timeline of check-ins per mission

### Data Architecture

**Tables Used**
- `leader_first_moves`: AI-generated first moves (3 per assessment)
- `leader_missions`: Active mission commitments
- `leader_check_ins`: Check-in reflections and AI responses

**Edge Functions**
- `send-mission-check-in`: Check-in reminder notifications

### Hooks
- `useMissions.ts`: Missions CRUD and state management

---

## Progress Tracking

### Overview

Tracks leader progress over time through periodic snapshots and drift detection, measuring how AI literacy evolves after the initial diagnostic.

### Features

**Progress Snapshots** (`Progress.tsx` page)
- Periodic captures of current state
- Comparison against baseline assessment
- Visual trajectory display

**Drift Detection**
- Measures change from baseline scores
- Identifies areas of improvement or regression
- Generates drift score

**Adoption Momentum**
- Tracks engagement patterns
- Measures tool usage frequency
- Identifies momentum trends

### Data Architecture

**Tables Used**
- `leader_progress_snapshots`: Point-in-time captures

**Edge Functions**
- `generate-progress-snapshot`: Generate snapshot data
- `compute-drift`: Calculate drift from baseline
- `batch-compute-drift`: Batch drift computation
- `update-adoption-momentum`: Momentum tracking

### Hooks
- `useProgress.ts`: Progress data queries

---

## Weekly Check-ins

### Overview

Structured weekly reflections that help leaders maintain engagement with their AI literacy development.

**Page**: `/check-in` (auth required)

### Features

- Weekly structured reflection prompts
- Text and voice input
- AI-generated responses and recommendations
- Check-in history and streaks

### Data Architecture

**Edge Functions**
- `submit-weekly-checkin`: Process check-in submission
- `send-weekly-checkin-reminder`: Reminder notifications
- `generate-weekly-prescription`: Weekly prescription content

### Hooks
- `useCheckIns.ts`: Check-in queries and state

---

## Operator Tools

### Overview

AI-powered tools for day-to-day leadership decision-making, available after completing the diagnostic.

### Features

**Decision Advisor** (`operator-decision-advisor`)
- AI-powered decision analysis
- Contextualised to user's assessment data and memory
- Applies cognitive frameworks

**Meeting Prep** (`generate-meeting-prep`)
- AI-generated meeting preparation content
- Tailored to user's context and objectives

**Prompt Coach** (`prompt-coach`, `PromptCoach.tsx` page)
- Interactive prompt coaching
- Teaches effective AI prompting techniques

**Sharpen Analysis** (`sharpen-analyze`)
- Skill improvement analysis
- Targeted development recommendations

**Daily Prompt** (`get-daily-prompt`)
- Daily provocative prompt generation
- Tied to user's tensions and context

**Weekly Action** (`get-or-generate-weekly-action`)
- Weekly action item generation
- Contextualised to current mission and progress

---

## Teams Tool: Executive Bootcamp Platform

### Pre-Work & Planning

**Intake Form** (`exec_intakes` table)
- Company context and strategic objectives
- AI maturity baseline
- Participant roster
- Preferred dates and logistics
- Workshop customisation preferences

**Bootcamp Planning** (`bootcamp_plans` table)
- Agenda configuration (7 segments)
- Cognitive baseline data
- Risk tolerance assessment
- Strategic goals 2026
- Required pre-work assignment
- Simulation snapshots

**Executive Pulse** (`exec_pulses` table)
- Pre-workshop individual assessments
- 4 scores: Awareness, Application, Governance, Trust
- Pulse responses JSON
- Profile linking

### Workshop Segments (7-Part Flow)

**Segment 1: Mirror** (Cognitive Baseline)
- Individual AI readiness snapshot
- Current state assessment
- Team comparison view

**Segment 2: Time Machine** (Bottleneck Mapping)
- Sticky note bottleneck submissions
- Spatial clustering on canvas
- Drag-and-drop prioritisation
- Export bottleneck map

**Segment 3: Crystal Ball** (AI Myth Busting)
- Common AI misconceptions
- Evidence-based reframing
- Team discussion facilitation

**Segment 4: Rewrite** (Effortless Map)
- Three lanes: Protect, Automate, Elevate
- Constraint inversion exercise
- Voting and prioritisation
- Sponsor assignment

**Segment 5: Huddle** (Synthesis Generation)
- AI-generated summary of workshop themes
- Priority actions identification
- Key concepts capture
- Tension mapping

**Segment 6: Draft** (Pilot Charter)
- Structured pilot definition
- Success criteria
- Resource allocation
- Timeline and milestones
- Governance model

**Segment 7: Provocation** (Provocation Report)
- What's really at stake
- Uncomfortable questions
- Structural implications
- Board-ready executive summary

### Facilitator Dashboard

**Workshop Session Management** (`workshop_sessions` table)
- Live segment tracking
- Participant count
- Timer controls per segment
- Real-time submission monitoring
- QR code generation for mobile participants

**Activity Session Management** (`activity_sessions` table)
- Per-activity QR codes
- Submission tracking
- Data aggregation
- Export capabilities

### Data Architecture

**Tables Used**
- `exec_intakes`: Pre-workshop intake data
- `bootcamp_plans`: Workshop configuration and planning
- `exec_pulses`: Individual pre-work assessments
- `workshop_sessions`: Live workshop state
- `activity_sessions`: Per-activity state
- `bottleneck_submissions`: Time Machine sticky notes
- `effortless_map_items`: Rewrite exercise data
- `huddle_synthesis`: AI-generated workshop summary
- `decision_frameworks`: Captured team frameworks

**Edge Functions**
- `send-booking-notification`: Intake confirmation email
- `send-advisory-sprint-notification`: Workshop prep email

---

## Partners Tool: Portfolio Assessment

### Partner Setup

**Partner Intake**
- Firm name and type (VC/PE/Consulting)
- Portfolio size and stage focus
- Assessment goals
- Contact details

### Portfolio Scoring

**Individual Company Entry**
- Company name and stage
- Industry and size
- AI maturity signals (binary or 1-5 scale)
- Contact person
- Notes

**Bulk Import**
- CSV upload for portfolio data
- Validation and error handling
- Batch processing

**Scoring Dimensions**
- Leadership alignment
- Experimentation culture
- Data readiness
- Team capability
- Governance maturity

### Portfolio View

**Heatmap Visualisation**
- Company rows × Dimension columns
- Colour-coded readiness levels
- Sortable and filterable
- Click-through to company detail

**Prioritisation**
- Aggregate scores per company
- Risk flagging
- Intervention priority queue
- Co-delivery opportunity identification

**Offer Pack Generation**
- Portfolio-wide AI literacy package
- Tiered pricing options
- Delivery timeline
- Resource requirements

### Data Architecture

**Tables Used**
- `partner_profiles`: Partner firm data
- `portfolio_companies`: Company inventory
- `portfolio_assessments`: Company-level scores
- `partner_offer_packs`: Generated packages

**Edge Functions**
- Portfolio scoring computation
- Offer pack generation
- Heatmap data aggregation

---

## Shared Features (Cross-Tool)

### Authentication & User Management
- Email/password auth via Supabase
- Google OAuth option
- Password reset flow
- Profile management

### AI Integration
- Vertex AI (Gemini 2.0 Flash) as primary generation model
- OpenAI GPT-4o as fallback
- OpenAI Whisper for voice transcription
- Structured output validation via Zod schemas
- Cognitive frameworks embedded in AI prompts
- AI response caching and rate limiting

### Data Privacy & Consent
- GDPR-compliant consent management
- Data anonymisation for benchmarking
- Audit trail for consent changes
- Opt-out mechanisms

### Email Notifications
- Assessment completion confirmation
- Workshop booking confirmation
- Advisory sprint notifications
- Diagnostic report delivery

### Payment Processing
- Stripe integration for Leaders diagnostic upgrade
- One-time payment ($49)
- Payment verification
- Receipt generation

### Analytics & Benchmarking
- Anonymised aggregate scoring (AI Leadership Index)
- Cohort comparison (by role, industry, company size)
- Quarterly index snapshots
- Momentum tracking

### Export & Sharing
- PDF export of diagnostic results
- Text file download of prompts
- Referral code generation
- Social sharing (coming soon)

---

## Mobile-First Architecture

### No-Scroll Mobile Experience

**Requirements**
- Every page fits viewport on mobile
- Fixed headers and navigation
- Scrollable content areas only
- Proper viewport handling with `--mobile-vh`

**Implementation Pattern**
```tsx
<div className="h-[var(--mobile-vh)] overflow-hidden flex flex-col">
  <header className="flex-shrink-0">
    {/* Fixed header */}
  </header>
  <main className="flex-1 overflow-y-auto">
    {/* Scrollable content */}
  </main>
  <nav className="flex-shrink-0">
    {/* Fixed bottom nav */}
  </nav>
</div>
```

### Touch Targets
- Minimum 44x44px for all interactive elements
- Generous padding on buttons
- Adequate spacing between tap targets

### Safe Areas
- Account for notches (top safe area)
- Account for home indicators (bottom safe area)
- Use `env(safe-area-inset-*)` CSS functions

---

## Animation & Motion

### Motion Library
- Framer Motion for all animations
- Consistent spring physics (stiffness: 400, damping: 35)
- Shared animation variants in `src/lib/motion.ts`

### Animation Types
- `fadeIn`: Opacity transitions
- `slideUp`: Vertical entrance animations
- `scaleIn`: Scale transitions
- `pageTransition`: Full page transitions
- `cardEntrance`: Card-specific animations

### Principles
- Fast, not slow (200-350ms)
- Smooth, not bouncy
- Subtle, not dramatic
- Respect reduced motion preferences
