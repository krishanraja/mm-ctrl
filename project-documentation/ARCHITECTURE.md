# Architecture

Complete system architecture and data flow documentation.

---

## System Overview

**Stack**:
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT-4 (primary), Vertex AI Gemini (fallback)
- **Payments**: Stripe
- **Email**: Resend
- **Hosting**: Lovable Cloud (frontend), Supabase Cloud (backend)

**Architecture Type**: Serverless full-stack with edge functions

---

## Frontend Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                    # shadcn components (DO NOT EDIT)
│   ├── auth/                  # Authentication flows
│   ├── voice/                 # Voice assessment components
│   ├── ai-chat/               # AI chat interface (deprecated)
│   ├── HeroSection.tsx        # Landing page hero
│   ├── UnifiedAssessment.tsx  # Quiz + voice assessment orchestrator
│   ├── UnifiedResults.tsx     # Results page with tabs
│   ├── LeadershipBenchmarkV2.tsx  # Overview tab
│   ├── PromptLibraryV2.tsx    # Tools tab
│   ├── TensionsView.tsx       # Tensions tab
│   └── [Other components]
├── contexts/
│   └── AssessmentContext.tsx  # Global assessment state
├── hooks/
│   ├── useAILiteracyAssessment.ts
│   ├── useExecutiveInsights.ts
│   ├── useLeadQualification.ts
│   └── [Other hooks]
├── utils/
│   ├── orchestrateAssessmentV2.ts  # Main orchestration logic
│   ├── aggregateLeaderResults.ts   # Data aggregation for UI
│   ├── pipelineGuards.ts           # Input validation
│   ├── edgeFunctionClient.ts       # Edge function wrapper
│   └── [Other utilities]
├── types/
│   ├── pipeline.ts            # Core type contracts
│   ├── profile.ts             # Profile types
│   ├── voice.ts               # Voice assessment types
│   └── diagnostic.ts          # Diagnostic types
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client
│       └── types.ts           # Generated DB types (READ-ONLY)
└── pages/
    ├── Index.tsx              # Main landing page
    └── NotFound.tsx           # 404 page
```

### State Management

**Global State** (AssessmentContext):
- Current assessment data
- Contact information
- Session ID
- Completion status

**Local State**:
- Component-specific UI state
- Form inputs
- Loading states

**Server State** (via Supabase + React Query):
- Assessment results
- User profile
- Historical assessments

### Routing

Using React Router v6:
- `/` - Landing page
- `/auth` - Authentication (handled by Supabase Auth UI)
- All other routes render `Index.tsx` (SPA architecture)

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
├── scenario_key (stagnation_loop | shadow_ai_instability | high_velocity_path | culture_capability_mismatch)
├── summary
└── priority_rank

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

**Indexes**:
- `leader_assessments.leader_id`
- `leader_dimension_scores.assessment_id`
- `leader_prompt_sets.assessment_id`
- `assessment_events.assessment_id`
- `index_participant_data.company_identifier_hash`

### Edge Functions

**Location**: `supabase/functions/`

**Core Functions**:

1. **create-leader-assessment**
   - Input: `leaderId`, `assessmentData`, `deepProfileData`, `contactData`, `source`
   - Output: `assessmentId`, `scores`, `tier`
   - Creates assessment record, calculates scores, applies behavioral adjustments

2. **generate-personalized-insights**
   - Input: `assessmentId`, `leaderId`, `profileData`, `assessmentData`
   - Output: `yourEdge`, `yourRisk`, `yourNextMove`, `dimensionInsights`
   - LLM-generated insights tied to specific diagnostic data

3. **generate-prompt-library**
   - Input: `assessmentId`, `leaderId`, `profileData`, `assessmentData`
   - Output: Array of `PromptSet` objects
   - LLM-generated thinking tools personalised to user context

4. **compute-tensions**
   - Input: `assessmentId`, `leaderId`, `scores`, `profileData`
   - Output: Array of `Tension` objects
   - Identifies strategic gaps between current and desired state

5. **compute-risk-signals**
   - Input: `assessmentId`, `leaderId`, `scores`, `profileData`
   - Output: Array of `RiskSignal` objects
   - Flags blind spots, waste, and theatre indicators

6. **derive-org-scenarios**
   - Input: `assessmentId`, `leaderId`, `scores`, `profileData`
   - Output: Array of `OrgScenario` objects
   - Projects 3-5 year structural change scenarios

7. **populate-index-participant**
   - Input: `leaderId`, `assessmentData`, `consentFlags`
   - Output: `participantId`
   - Anonymises and stores data for AI Leadership Index

**Shared Modules** (`supabase/functions/_shared/`):
- `context-builder.ts`: Builds LLM context from diagnostic data
- `prompt-templates.ts`: System prompts for LLM calls
- `quality-guardrails.ts`: Output validation and filtering
- `schemas.ts`: Zod schemas for structured outputs

---

## Data Flow

### Assessment Creation Flow

```
User completes assessment
         ↓
UnifiedAssessment.tsx collects data
         ↓
orchestrateAssessmentV2() invoked
         ↓
1. Validate inputs (pipelineGuards.ts)
2. Calculate scores + behavioral adjustments
3. Call create-leader-assessment edge function
4. Store dimension scores
5. Store execution gaps
         ↓
Parallel edge function calls:
├─ generate-personalized-insights
├─ generate-prompt-library
├─ compute-tensions
├─ compute-risk-signals
└─ derive-org-scenarios
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
└─ leader_org_scenarios (for scenarios)
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
orchestrateAssessmentV2() with source='voice'
         ↓
[Same flow as quiz assessment]
```

---

## AI Integration

### LLM Architecture

**Primary**: OpenAI GPT-4
**Fallback**: Vertex AI (Gemini Pro)

**Call Pattern**:
```typescript
try {
  response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [...],
    response_format: { type: 'json_object' }
  });
} catch (error) {
  console.error('OpenAI failed, trying Vertex AI');
  response = await vertexAI.generateContent({...});
}
```

### Structured Outputs

Using Zod schemas (in `schemas.ts`):

```typescript
PersonalizedInsightsSchema.parse(llmResponse);
PromptLibrarySchema.parse(llmResponse);
```

Validation ensures:
- Required fields present
- Correct types
- Min/max lengths
- Enum value constraints

### Prompt Engineering

**System Prompts** (`prompt-templates.ts`):
- Role definition
- Output format specification
- Quality criteria
- Examples (few-shot learning)

**Context Building** (`context-builder.ts`):
- Profile data
- Assessment responses
- Deep profile answers
- Scoring results

**Quality Guardrails** (`quality-guardrails.ts`):
- Detect hallucinations
- Filter inappropriate content
- Validate evidence citations
- Check personalization quality

---

## Pipeline Guarantees

### Type Safety

**Input Contracts** (`pipeline.ts`):
```typescript
interface PipelineSafeResponse<T> {
  success: boolean;
  data: T;
  generationSource: 'vertex-ai' | 'openai' | 'fallback' | 'none';
  durationMs: number;
  error?: string;
}

interface SafeProfileData { /* ... */ }
interface SafeAssessmentData { /* ... */ }
interface SafeContactData { /* ... */ }
```

**Validation** (`pipelineGuards.ts`):
```typescript
export function validateProfileData(profile: any): SafeProfileData {
  // Returns validated or default-filled object
  // Never throws, always safe
}
```

### Fallback Strategies

**LLM Failures**:
1. Try OpenAI
2. If fails, try Vertex AI
3. If both fail, use generic fallbacks

**Fallback Content**:
- Generic insights based on score tier
- Standard prompt templates
- Default tensions/risks/scenarios

**DB Failures**:
- Log error
- Return empty arrays
- UI shows graceful message

### Error Handling

**Edge Functions**:
```typescript
try {
  const result = await processAssessment(...);
  return new Response(JSON.stringify(result), { status: 200 });
} catch (error) {
  console.error('Error:', error);
  return new Response(
    JSON.stringify({ error: error.message }), 
    { status: 500 }
  );
}
```

**Frontend**:
```typescript
const { data, error } = await invokeEdgeFunction('function-name', body);

if (error) {
  console.error('Edge function error:', error);
  toast.error('Failed to generate insights. Using defaults.');
  return fallbackInsights();
}
```

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

**Tables with RLS**:
- `leaders`: Users can only read/update their own record
- `leader_assessments`: Users can only read own assessments
- `leader_insights`, `leader_prompt_sets`, etc.: Tied to assessment ownership

**Anonymous Tables**:
- `index_participant_data`: No user_id, anonymised
- `ai_leadership_index_snapshots`: Public read, admin write

### Data Privacy

**Anonymisation** (`populate-index-participant`):
- Hash company identifiers with salt
- Remove PII (names, emails)
- Store only aggregate dimensions

**Consent Management** (`ConsentManager.tsx`):
- Opt-in for AI Leadership Index
- Audit trail of consent changes
- Can revoke at any time

---

## Deployment

### Frontend

**Build**:
```bash
npm run build
```

**Output**: `dist/` directory with static assets

**Hosting**: Lovable Cloud (auto-deployed on git push)

### Backend

**Edge Functions**:
- Auto-deployed via Supabase CLI
- Environment variables stored in Supabase dashboard
- Secrets: `OPENAI_API_KEY`, `VERTEX_AI_PROJECT_ID`, etc.

**Database Migrations**:
- Located in `supabase/migrations/`
- Applied via Supabase CLI: `supabase db push`

### Environment Variables

**Required**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (Supabase secrets)
- `RESEND_API_KEY` (Supabase secrets)
- `STRIPE_SECRET_KEY` (Supabase secrets)

---

## Performance

### Optimisations

**Frontend**:
- Code splitting via React.lazy
- Image lazy loading
- Debounced inputs
- React Query caching

**Backend**:
- Edge function warm-up
- Database connection pooling
- Parallel LLM calls where possible
- Response caching (limited, AI content)

### Bottlenecks

**Known**:
- LLM generation: 5-15 seconds per call
- Multiple sequential edge functions: 30-60 seconds total
- Voice transcription: 2-5 seconds per question

**Mitigation**:
- Show loading states
- Use skeleton screens
- Provide progress indicators
- Parallelise edge function calls

---

## Monitoring

### Logging

**Frontend**:
- Console logs for debugging (prefixed with emoji)
- Sentry (optional, not currently configured)

**Backend**:
- Supabase logs (auto-captured)
- Edge function console.log → Supabase dashboard

### Metrics

**Track**:
- Assessment completion rate
- Edge function success/failure rate
- LLM call duration
- User conversion (free → paid)

**Tools**:
- Supabase Analytics
- Stripe Dashboard
- Custom DB queries

---

## Testing

### Current State

**Automated Testing**: None (not currently implemented)

**Manual Testing**:
- Test quiz flow end-to-end
- Test voice flow end-to-end
- Test results display in all tabs
- Test free vs paid gating
- Test dark mode
- Test mobile responsiveness

### Testing Checklist

Before each release:
- [ ] Quiz assessment completes successfully
- [ ] Voice assessment completes successfully
- [ ] Results display correctly (Overview, Tensions, Tools)
- [ ] Free tier shows limited content
- [ ] Paid upgrade flow works
- [ ] Email confirmation sends
- [ ] Benchmark chart renders
- [ ] Prompt library displays
- [ ] Dark mode works
- [ ] Mobile responsive

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
  "tailwindcss": "^3.x",
  "lucide-react": "^0.462.0",
  "zod": "^3.23.8"
}
```

### UI Components

All from `shadcn/ui`:
- button, card, badge, input, label, tabs, dialog, select, etc.

### Build Tools

- Vite: Fast dev server and bundler
- TypeScript: Type safety
- PostCSS: CSS processing
- ESLint: Linting

---

## Constraints

### Technical

- **No backend code execution**: Only edge functions (Deno runtime)
- **No direct file uploads**: Use Supabase Storage API
- **No WebSockets**: Use Supabase Realtime for live updates
- **LLM rate limits**: OpenAI tier limits, Vertex AI quotas

### Business

- **Supabase free tier limits**: 500 MB database, 2 GB egress/month
- **OpenAI API costs**: ~$0.02 per assessment (GPT-4)
- **Stripe processing fees**: 2.9% + $0.30 per transaction

---

## Future Architecture Considerations

### Scalability

**If user base grows significantly**:
- Move to Supabase Pro plan
- Implement Redis caching layer
- Add CDN for static assets
- Batch edge function calls

### Features

**Potential additions**:
- Real-time collaboration (Teams tool)
- Multi-language support (i18n)
- API for external integrations
- Mobile native apps

**Architecture impact**:
- Add i18n library
- Create REST API layer
- Build React Native version
