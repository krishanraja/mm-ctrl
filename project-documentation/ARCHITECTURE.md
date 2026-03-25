# Architecture

Complete system architecture and data flow documentation.

**Last Updated:** 2026-03-24

---

## System Overview

**Stack**:
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI Primary**: Vertex AI (Gemini 2.0 Flash) via Google Cloud service account
- **AI Fallback**: OpenAI GPT-4o
- **Voice**: OpenAI Whisper API for voice-to-text
- **Payments**: Stripe
- **Email**: Resend
- **Hosting**: Vercel (frontend), Supabase Cloud (backend)

**Architecture Type**: Serverless full-stack with edge functions

---

## Frontend Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                    # shadcn components (DO NOT EDIT)
│   ├── auth/                  # Authentication flows (RequireAuth)
│   ├── voice/                 # Voice assessment components
│   ├── landing/               # Landing page components
│   │   └── HeroSection.tsx    # Landing page hero
│   ├── dashboard/
│   │   └── mobile/
│   │       ├── MobileDashboard.tsx
│   │       ├── BottomNav.tsx
│   │       ├── VoiceButton.tsx
│   │       ├── Sheet.tsx
│   │       ├── HeroStatusCard.tsx
│   │       └── PriorityCardStack.tsx
│   ├── action/                # Weekly action components
│   │   └── WeeklyAction.tsx
│   ├── ai-chat/               # AI chat components
│   ├── analytics/             # Analytics components
│   ├── diagnostic/            # Diagnostic-specific components
│   ├── insight/               # Insight display components
│   ├── memory/                # Memory Center components (11 files)
│   │   ├── MemoryList.tsx
│   │   ├── AddMemorySheet.tsx
│   │   ├── MemoryDetailSheet.tsx
│   │   ├── MemoryItemCard.tsx
│   │   ├── MemoryPill.tsx
│   │   ├── FactVerificationCard.tsx
│   │   ├── VoiceMemoryCapture.tsx
│   │   ├── PrivacyControlsPanel.tsx
│   │   ├── ExportImportPanel.tsx
│   │   └── MemoryErrorBoundary.tsx
│   ├── missions/              # Missions system components
│   │   ├── FirstMoveSelector.tsx
│   │   └── MissionsDashboard.tsx
│   ├── mobile/
│   │   └── MobileLayout.tsx   # Mobile viewport wrapper
│   ├── onboarding/            # Onboarding flow components
│   ├── operator/              # Operator tools components
│   ├── progress/              # Progress tracking components
│   ├── provocation/
│   │   └── DailyProvocation.tsx
│   ├── pulse/
│   │   └── StrategicPulse.tsx
│   ├── settings/              # Settings components
│   ├── sharpen/               # Sharpen analysis components
│   ├── UnifiedAssessment.tsx  # Quiz + voice assessment orchestrator
│   ├── UnifiedResults.tsx     # Results page with tabs
│   ├── LeadershipBenchmarkV2.tsx  # Overview tab
│   ├── PromptLibraryV2.tsx    # Tools tab
│   ├── TensionsView.tsx       # Tensions tab
│   ├── ConsentManager.tsx     # Privacy/consent tab
│   ├── SingleScrollResults.tsx # Single-page results view
│   ├── AssessmentHistory.tsx  # Past assessments
│   ├── BenchmarkComparison.tsx
│   ├── PeerBubbleChart.tsx
│   ├── PeerComparisonMobile.tsx
│   ├── MomentumDashboard.tsx
│   ├── ErrorBoundary.tsx
│   └── [Other components]
├── contexts/
│   ├── AppStateContext.tsx    # Global app state management
│   └── AssessmentContext.tsx  # Assessment flow state
├── hooks/
│   ├── useStructuredAssessment.ts
│   ├── useRealtimeAssessment.ts
│   ├── useAILiteracyAssessment.ts
│   ├── useUserState.ts
│   ├── useAuth.ts
│   ├── useDevice.ts
│   ├── useMemoryQueries.ts   # Memory Center queries
│   ├── useUserMemory.ts      # Memory state management
│   ├── useMissions.ts        # Missions system
│   ├── useCheckIns.ts        # Check-in system
│   ├── useProgress.ts        # Progress tracking
│   ├── useTodaysTension.ts
│   ├── useGenerationProgress.ts
│   ├── useExecutiveInsights.ts
│   ├── useLeadQualification.ts
│   ├── usePayment.ts
│   ├── useVoice.ts
│   ├── useVoiceInput.ts
│   ├── useMediaQuery.ts
│   ├── use-mobile.tsx
│   ├── useLongPress.ts
│   ├── useOffline.ts
│   ├── useOfflineDetection.ts
│   └── use-toast.ts
├── lib/
│   └── motion.ts              # Animation utilities (Framer Motion)
├── utils/
│   ├── runAssessment.ts             # Main assessment orchestrator
│   ├── orchestrateAssessmentV2.ts   # V2 orchestration logic
│   ├── aggregateLeaderResults.ts    # Data aggregation for UI
│   ├── pipelineGuards.ts           # Input validation
│   ├── edgeFunctionClient.ts       # Edge function wrapper
│   ├── mobileViewport.ts           # Viewport handling
│   └── [Other utilities]
├── types/
│   ├── pipeline.ts            # Core type contracts
│   ├── profile.ts             # Profile types
│   ├── voice.ts               # Voice assessment types
│   ├── diagnostic.ts          # Diagnostic types
│   ├── memory.ts              # Memory system types
│   ├── memory-settings.ts     # Memory privacy settings types
│   ├── missions.ts            # Missions system types
│   └── video-background.ts    # Video background types
├── data/
│   ├── compassQuestions.ts    # Compass assessment questions
│   ├── secondaryQuestions.ts  # Secondary assessment questions
│   └── sharpenSystemPrompt.ts # Sharpen AI system prompt
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client
│       └── types.ts           # Generated DB types (READ-ONLY)
├── pages/
│   ├── Landing.tsx            # Main landing page (/)
│   ├── Auth.tsx               # Authentication (/auth)
│   ├── Diagnostic.tsx         # Assessment flow (/diagnostic)
│   ├── Dashboard.tsx          # Main dashboard (/dashboard)
│   ├── Voice.tsx              # Voice recording (/voice)
│   ├── Pulse.tsx              # Strategic pulse (/pulse)
│   ├── Today.tsx              # Today page (/today)
│   ├── Profile.tsx            # User profile (/profile)
│   ├── MemoryCenter.tsx       # Memory Center (/memory)
│   ├── WeeklyCheckin.tsx      # Weekly check-in (/check-in)
│   ├── MissionCheckIn.tsx     # Mission check-in (/mission-check-in)
│   ├── MissionHistory.tsx     # Mission history (/missions/history)
│   ├── Progress.tsx           # Progress tracking (/progress)
│   ├── Booking.tsx            # Workshop booking (/booking)
│   ├── Baseline.tsx           # Baseline assessment
│   ├── DecisionCapture.tsx    # Decision capture
│   ├── PromptCoach.tsx        # Prompt coaching
│   ├── Settings.tsx           # User settings
│   ├── Timeline.tsx           # Assessment timeline
│   └── NotFound.tsx           # 404 page
├── styles/                    # Design tokens & styles
├── __tests__/                 # Test files
└── index.css                  # Design system
```

### State Management

**Global State** (AppStateContext + AssessmentContext):
- Current assessment data
- Contact information
- Session ID
- Completion status
- App-wide state flags

**Local State**:
- Component-specific UI state
- Form inputs
- Loading states

**Server State** (via Supabase + TanStack React Query):
- Assessment results
- User profile
- Historical assessments
- Memory data
- Missions and check-ins

### Routing

Using React Router v6 with `createBrowserRouter` and lazy loading:

| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Landing | No |
| `/auth` | Auth | No |
| `/diagnostic` | Diagnostic | No |
| `/dashboard` | Dashboard | Yes |
| `/voice` | Voice | No |
| `/pulse` | Pulse | Yes |
| `/today` | Today | Yes |
| `/profile` | Profile | Yes |
| `/memory` | MemoryCenter | Yes |
| `/check-in` | WeeklyCheckin | Yes |
| `/mission-check-in` | MissionCheckIn | No |
| `/missions/history` | MissionHistory | Yes |
| `/progress` | Progress | Yes |
| `/booking` | Booking | No |
| `*` | Redirect to `/` | No |

All pages are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` boundaries.

---

## Component Architecture

### Core UI Components

#### Button Component (`src/components/ui/button.tsx`)

**Variants:**
- `default`: Primary action (ink background, white text)
- `outline`: Secondary action (transparent, bordered)
- `ghost`: Tertiary action (transparent, hover background)
- `hero`: Large primary CTA (for landing page)
- `cta`: Accent-colored action

**Sizes:**
- `sm`: h-9
- `default`: h-10
- `lg`: h-11
- `xl`: h-14, text-base

**Critical Requirements:**
- All variants must have `border-0` explicitly
- Smooth transitions (200ms)
- Proper hover states
- Accessible focus states

#### Card Component (`src/components/ui/card.tsx`)

**Structure:**
- `Card`: Base container (white, rounded-3xl, shadow-lg)
- `CardHeader`: Title section (p-8 pb-6, space-y-3)
- `CardContent`: Main content (p-8 pt-4)
- `CardTitle`: Heading (text-xl, font-bold)

**Styling:**
- Background: Pure white
- Border: Subtle (border/40)
- Shadow: Soft, Apple-like
- Padding: Generous (p-8 minimum)

### Landing Page Components

#### HeroSection (`src/components/landing/HeroSection.tsx`)

**Layout:**
- Full viewport height: `h-[var(--mobile-vh)]`
- Centered content card
- Video background (subtle)
- No scroll on mobile

**Content Card:**
- Max width: `max-w-2xl`
- Padding: `p-8 sm:p-12 md:p-16 lg:p-20`
- Background: White
- Border radius: `rounded-3xl`
- Shadow: `shadow-lg`

**Elements:**
1. Logo: Top-left, minimal spacing
2. Headline: Large, bold, tight leading
3. Underline animation: SVG path, animated draw
4. Description: Large, readable, muted color
5. CTA Buttons: Primary + Secondary, large, rounded
6. Trust indicators: Small checkmarks, muted text

**Animations:**
- Fade in on mount (staggered delays)
- Slide up for card
- SVG underline draw animation

### Dashboard Components

#### MobileDashboard (`src/components/dashboard/mobile/MobileDashboard.tsx`)

**Layout:**
- Full viewport height
- Fixed header
- Scrollable content area
- Fixed bottom navigation
- Floating voice button

**Structure:**
```
┌─────────────────┐
│ Header (fixed)  │
├─────────────────┤
│                 │
│ Content (scroll)│
│                 │
├─────────────────┤
│ BottomNav       │
└─────────────────┘
     [VoiceBtn]
```

#### BottomNav (`src/components/dashboard/mobile/BottomNav.tsx`)

**Specifications:**
- Fixed bottom
- Height: `h-20`
- Background: `bg-background/98` with backdrop blur
- Border: Top border, subtle
- Shadow: Subtle top shadow
- Items: 4 navigation items
- Active state: `text-primary bg-primary/10`

#### Sheet Component (`src/components/dashboard/mobile/Sheet.tsx`)

**Specifications:**
- Bottom sheet pattern
- Heights: small (40vh), medium (60vh), large (85vh)
- Backdrop: `bg-black/40` with blur
- Animation: Spring physics (stiffness: 400, damping: 35)
- Handle: Top drag indicator
- Rounded top corners: `rounded-t-3xl`

---

## Page Specifications

### Landing Page (`/`)

**Requirements:**
- No scroll on mobile
- Video background (subtle)
- Centered white card
- Large, readable typography
- Clear CTAs
- Trust indicators below

### Dashboard (`/dashboard`)

**Mobile:**
- Fixed header with user name
- Hero status card (tier, percentile)
- Priority card stack
- Bottom navigation
- Floating voice button

### Today Page (`/today`)

**No-Scroll Pattern:**
```tsx
<div className="h-[var(--mobile-vh)] overflow-hidden flex flex-col">
  <div className="flex-shrink-0 px-6 pt-6 pb-4">
    {/* Header */}
  </div>
  <div className="flex-1 overflow-y-auto px-6 pb-safe-bottom">
    {/* Scrollable content */}
  </div>
</div>
```

### Memory Center (`/memory`)

**Features:**
- Voice-first fact extraction
- Fact verification cards with confidence scores
- Privacy controls panel
- Export/import panel
- Error boundary wrapper

### Missions (`/mission-check-in`, `/missions/history`)

**Features:**
- First Move commitment flow
- Periodic check-in reflections
- AI-generated responses to reflections
- Mission history with status tracking

### Voice Page (`/voice`)

- Fixed header with back button
- Centered voice recorder
- Large mic icon, countdown timer

### Pulse Page (`/pulse`)

- Baseline card, tensions cards, risk signals cards

---

## Backend Architecture

### Database Schema

**Core Tables**:

```
leaders
├── id (PK)
├── email (unique)
├── full_name
├── company_name
├── role_title
├── industry
├── company_size
└── created_at

leader_assessments
├── id (PK)
├── leader_id (FK → leaders)
├── session_id
├── source ('quiz' | 'voice')
├── benchmark_score (0-100)
├── benchmark_tier (emerging | establishing | advancing | leading)
├── learning_style
├── generation_status (JSON)
└── created_at

leader_dimension_scores
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── dimension_key (strategic_vision | experimentation | delegation | data_quality | team_capability | governance)
├── score_numeric (0-100)
├── dimension_tier
└── explanation

leader_insights
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── your_edge (text)
├── your_risk (text)
├── your_next_move (text)
└── dimension_insights (JSON)

leader_prompt_sets
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── category_key
├── title
├── description
├── what_its_for
├── when_to_use
├── how_to_use
├── prompts_json (JSON array)
└── priority_rank

leader_tensions
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── dimension_key
├── summary_line
└── priority_rank

leader_risk_signals
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── risk_key (shadow_ai | skills_gap | roi_leakage | decision_friction)
├── level (low | medium | high)
├── description
└── priority_rank

leader_org_scenarios
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── scenario_key
├── summary
└── priority_rank

leader_first_moves
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── move_number (1, 2, 3)
├── content (text)
└── created_at

leader_missions
├── id (PK)
├── leader_id (FK → leaders)
├── assessment_id (FK → leader_assessments)
├── first_move_id (FK → leader_first_moves)
├── status (active | completed | skipped | extended)
├── started_at
├── completed_at
└── created_at

leader_check_ins
├── id (PK)
├── leader_id (FK → leaders)
├── mission_id (FK → leader_missions)
├── reflection_text
├── ai_response (text)
├── voice_url (text)
└── created_at

leader_progress_snapshots
├── id (PK)
├── leader_id (FK → leaders)
├── snapshot_data (JSON)
├── drift_score
└── created_at

user_memory
├── id (PK)
├── user_id (FK)
├── fact_category (identity | business | objective | blocker | preference)
├── fact_text
├── confidence (0-1)
├── source (voice | form | linkedin | calendar | enrichment)
├── verification_status (inferred | verified | corrected | rejected)
├── encrypted_content (bytea)
└── created_at

user_memory_settings
├── id (PK)
├── user_id (FK)
├── memory_enabled (boolean)
├── auto_extract (boolean)
├── retention_days (integer)
└── updated_at

assessment_events
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── profile_id (FK → leaders)
├── session_id
├── tool_name ('quiz' | 'deep_profile' | 'voice')
├── event_type ('question_answered')
├── question_id
├── question_text
├── raw_input (user's answer)
├── structured_values (JSON)
└── created_at

assessment_behavioral_adjustments
├── id (PK)
├── assessment_id (FK → leader_assessments)
├── experimentation_weight
├── delegation_weight
├── time_optimization
├── stakeholder_complexity
├── raw_inputs (JSON)
└── adjustment_rationale (JSON)

index_participant_data
├── id (PK)
├── user_id
├── session_id
├── company_identifier_hash (anonymised)
├── role_title
├── industry
├── company_size
├── readiness_score
├── tier
├── dimension_scores (JSON)
├── consent_flags (JSON)
└── completed_at
```

### Edge Functions

**Location**: `supabase/functions/`

**Total**: 45 edge functions + shared module directory

#### Core Assessment Functions

1. **create-leader-assessment** - Creates assessment record, calculates scores, applies behavioral adjustments
2. **ai-generate** - Central AI generation function (Vertex AI primary, OpenAI fallback, static tertiary). Produces all AI content: insights, prompts, tensions, risks, scenarios, first moves. Applies cognitive frameworks.
3. **compass-analyze** - Analyzes voice transcripts from Compass module
4. **roi-estimate** - Extracts ROI data from voice transcripts
5. **populate-index-participant** - Anonymises and stores benchmark data

#### Memory & Context Functions

6. **memory-crud** - Create, read, update, delete memory facts
7. **memory-settings** - Memory privacy settings management
8. **extract-user-context** - Extract context from voice input
9. **enrich-company-context** - Enrich company data from external sources

#### Missions & Progress Functions

10. **send-mission-check-in** - Send check-in reminder notifications
11. **generate-progress-snapshot** - Generate progress snapshot data
12. **compute-drift** - Compute drift from baseline assessment
13. **batch-compute-drift** - Batch drift computation
14. **update-adoption-momentum** - Track adoption momentum metrics

#### Operator & Intelligence Functions

15. **operator-decision-advisor** - AI-powered decision advisory
16. **generate-meeting-prep** - AI meeting preparation content
17. **prompt-coach** - Prompt coaching assistance
18. **sharpen-analyze** - Sharpen analysis for skill improvement
19. **detect-patterns** - Pattern detection across assessments
20. **get-daily-prompt** - Daily provocative prompt generation
21. **get-or-generate-weekly-action** - Weekly action item generation
22. **generate-weekly-prescription** - Weekly prescription content
23. **get-peer-snippets** - Anonymised peer comparison data

#### Communication Functions

24. **send-confirmation-email** - Assessment completion confirmation
25. **send-diagnostic-email** - Diagnostic report delivery
26. **send-booking-notification** - Workshop booking confirmation
27. **send-advisory-sprint-notification** - Advisory sprint notification
28. **send-weekly-checkin-reminder** - Weekly check-in reminders
29. **send-feedback** - User feedback submission
30. **resend-webhook** - Resend email webhook handler

#### Payment Functions

31. **create-diagnostic-payment** - Create Stripe payment intent
32. **verify-diagnostic-payment** - Verify payment completion
33. **stripe-webhook** - Stripe webhook handler
34. **create-stripe-prices** - Stripe price configuration

#### Data & Integration Functions

35. **sync-to-google-sheets** - Sync leads to Google Sheets
36. **batch-process-pending-syncs** - Batch sync processing
37. **generate-quarterly-index** - Quarterly AI Leadership Index
38. **claim-history** - Claim assessment history for authenticated users

#### User Preference Functions

39. **upsert-notification-prefs** - Notification preferences
40. **upsert-sharing-consent** - Data sharing consent

#### Voice & Interaction Functions

41. **voice-transcribe** - OpenAI Whisper transcription
42. **ai-assessment-chat** - AI assessment chat
43. **submit-reflection** - Submit reflection responses
44. **submit-decision-capture** - Capture decision data
45. **submit-weekly-checkin** - Submit weekly check-in

**Shared Modules** (`supabase/functions/_shared/`):
- `context-builder.ts`: Builds LLM context from diagnostic data
- `openai-utils.ts`: OpenAI API wrapper utilities
- `llm-quality-guardrails.ts`: Output validation and filtering
- `ai-cache.ts`: AI response caching layer
- `rate-limit.ts` / `rate-limiting.ts`: Rate limiting middleware
- `email-utils.ts`: Email sending utilities
- `storage-utils.ts`: Supabase Storage helpers
- `validate-database.ts`: Database validation helpers

---

## Data Flow

### Assessment Creation Flow

```
User completes assessment
         ↓
UnifiedAssessment.tsx collects data
         ↓
runAssessment.ts invoked
         ↓
1. Validate inputs (pipelineGuards.ts)
2. Calculate scores + behavioral adjustments
3. Call create-leader-assessment edge function
4. Store dimension scores
         ↓
Call ai-generate edge function:
├─ Plan A: Vertex AI (Gemini 2.0 Flash)
├─ Plan B: OpenAI GPT-4o
└─ Plan C: Static fallback content
         ↓
ai-generate produces all content:
├─ Personalised insights (edge, risk, next move)
├─ Thinking tools (prompt library)
├─ Strategic tensions
├─ Risk signals
├─ Org scenarios
└─ First moves (3 prioritised actions)
         ↓
Store results in respective tables
         ↓
Store assessment events (Q&A log)
         ↓
Store behavioral adjustments
         ↓
Store anonymised index data (if consent)
         ↓
Return assessmentId to UI
         ↓
Navigate to UnifiedResults.tsx
```

### Results Display Flow

```
UnifiedResults.tsx mounts
         ↓
aggregateLeaderResults() fetches data
         ↓
Queries:
├─ leader_assessments (for metadata)
├─ leader_dimension_scores (for scores)
├─ leader_insights (for edge/risk/move)
├─ leader_prompt_sets (for thinking tools)
├─ leader_tensions (for tensions)
├─ leader_risk_signals (for risks)
├─ leader_org_scenarios (for scenarios)
└─ leader_first_moves (for next steps)
         ↓
Aggregates into single result object
         ↓
Passes to tab components:
├─ LeadershipBenchmarkV2 (Overview)
├─ TensionsView (Tensions)
└─ PromptLibraryV2 (Tools)
         ↓
Components render data
```

### Voice Assessment Flow

```
User records voice responses
         ↓
VoiceOrchestrator.tsx manages flow
         ↓
1. CompassModule: 5 questions → transcripts
2. RoiModule: ROI estimation → transcripts
         ↓
Call compass-analyze edge function
   ↓
   OpenAI analyzes transcripts → scores, tier, focus areas
         ↓
Call roi-estimate edge function
   ↓
   OpenAI extracts ROI data → time saved, cost saved
         ↓
mapVoiceToAssessment() converts to V2 format
         ↓
DeepProfileQuestionnaire collects context
         ↓
runAssessment() with source='voice'
         ↓
[Same flow as quiz assessment]
```

### Memory Center Flow

```
User opens Memory Center (/memory)
         ↓
useMemoryQueries() fetches existing facts
         ↓
Voice-first input:
├─ VoiceMemoryCapture records speech
├─ voice-transcribe edge function transcribes
├─ extract-user-context extracts structured facts
└─ memory-crud stores encrypted facts
         ↓
Fact verification:
├─ Facts shown with confidence scores
├─ User verifies/corrects/rejects
├─ Verification status updated
         ↓
Privacy controls:
├─ memory-settings edge function
├─ Enable/disable auto-extraction
├─ Set retention period
└─ Export/import data
```

### Missions Flow

```
After assessment, First Moves displayed
         ↓
FirstMoveSelector.tsx presents 3 moves
         ↓
User commits to a mission
         ↓
leader_missions record created (status: active)
         ↓
Periodic check-ins:
├─ MissionCheckIn.tsx captures reflection
├─ AI generates response
├─ leader_check_ins record created
         ↓
Progress tracking:
├─ generate-progress-snapshot captures state
├─ compute-drift measures change from baseline
├─ Progress.tsx displays trajectory
         ↓
Mission completion:
├─ Status updated to completed/skipped/extended
├─ MissionHistory.tsx shows all missions
```

---

## AI Integration

### LLM Architecture

**Primary**: Vertex AI (Gemini 2.0 Flash) via Google Cloud service account with OAuth token caching
**Fallback**: OpenAI GPT-4o

**Call Pattern** (in `ai-generate/index.ts`):
```typescript
// Plan A: Vertex AI
try {
  response = await tryVertexAI(context, prompt);
  generationSource = 'vertex-ai';
} catch (error) {
  // Plan B: OpenAI
  try {
    response = await tryOpenAI(context, prompt);
    generationSource = 'openai';
  } catch (error) {
    // Plan C: Static fallback
    response = getStaticFallback(scores, tier);
    generationSource = 'fallback';
  }
}
```

**Model Configuration:**
- Temperature: 0.7
- Max tokens: 4000
- Response format: JSON object with structured output

### Cognitive Framework Integration

The `ai-generate` function embeds five cognitive frameworks directly into prompts:

1. **A/B Framing**: Forces alternative perspectives on each recommendation
2. **Dialectical Reasoning**: Thesis-antithesis-synthesis for balanced insights
3. **Mental Contrasting (WOOP)**: Goals, obstacles, realistic planning
4. **Reflective Equilibrium**: Aligning with organizational principles
5. **First-Principles Thinking**: Breaking down assumptions

### Structured Outputs

Using Zod schemas for validation. Validation ensures required fields, correct types, min/max lengths, and enum value constraints.

### Quality Guardrails

- `_shared/llm-quality-guardrails.ts`: Output validation and filtering
- `_shared/ai-cache.ts`: Response caching for repeated patterns
- `_shared/rate-limit.ts`: Per-user rate limiting

---

## Pipeline Guarantees

### Type Safety

**Input Contracts** (`pipeline.ts`):
```typescript
interface PipelineSafeResponse<T> {
  success: boolean;
  data: T;
  generationSource: 'vertex-ai' | 'openai' | 'gemini' | 'fallback' | 'none';
  durationMs: number;
  error?: string;
}
```

### Fallback Strategies

**LLM Failures**:
1. Try Vertex AI (Gemini 2.0 Flash)
2. If fails, try OpenAI GPT-4o
3. If both fail, use generic fallbacks

**DB Failures**:
- Log error, return empty arrays, UI shows graceful message

---

## Authentication & Security

### Auth Flow

Using Supabase Auth:
1. User signs up with email/password or Google OAuth
2. Supabase creates user record
3. Frontend stores session in local storage
4. All edge function calls include auth token
5. Edge functions validate token via Supabase client

### Row-Level Security (RLS)

All user-facing tables have RLS policies:
- `leaders`, `leader_assessments`, `leader_insights`, `leader_prompt_sets`, etc.
- `leader_missions`, `leader_check_ins`: Own data only
- `user_memory`, `user_memory_settings`: Own data only

### Memory Encryption

- Content encrypted at rest using AES-256-GCM
- Encryption key in `MEMORY_ENCRYPTION_KEY` env var
- Decryption only in edge functions, never client-side

---

## Deployment

### Frontend

**Build**: `npm run build`
**Hosting**: Vercel (auto-deployed on git push)

### Backend

**Edge Functions**: Deployed via Supabase CLI
**Database Migrations**: `supabase/migrations/`, applied via `supabase db push`

### Environment Variables

**Frontend (Vercel)**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Backend (Supabase Secrets)**:
- `OPENAI_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (Vertex AI)
- `MEMORY_ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_SHEETS_CREDENTIALS`

---

## Testing

### Current State

**Automated Testing**: Vitest configured (`vitest.config.ts`) with unit tests in `src/__tests__/`

**Manual Testing Checklist**:
- [ ] Quiz assessment completes successfully
- [ ] Voice assessment completes successfully
- [ ] Results display correctly (Overview, Tensions, Tools)
- [ ] First Moves display and mission commitment works
- [ ] Free tier shows limited content
- [ ] Paid upgrade flow works
- [ ] Memory Center: create, read, update, delete, voice capture
- [ ] Missions: commit, check-in, complete flow
- [ ] Progress: snapshots generate correctly
- [ ] Weekly Check-in: submission and AI response
- [ ] Mobile responsive, no-scroll on mobile pages

---

## Dependencies

### Core Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "@supabase/supabase-js": "^2.50.3",
  "@tanstack/react-query": "^5.56.2",
  "framer-motion": "^11.x",
  "tailwindcss": "^3.4.11",
  "lucide-react": "^0.462.0",
  "zod": "^3.23.8",
  "typescript": "^5.5.3",
  "vite": "^5.4.1"
}
```

### Constraints

- **No backend code execution**: Only edge functions (Deno runtime)
- **Node.js requirement**: >=22 <24
- **LLM rate limits**: Vertex AI quotas, OpenAI tier limits
- **AI API costs**: ~$0.01-0.02 per assessment (Vertex AI primary)
