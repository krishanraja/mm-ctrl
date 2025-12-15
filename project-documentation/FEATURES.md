# Features

Complete feature inventory across all three Mindmaker tools.

---

## Leaders Tool: Individual AI Literacy Diagnostic

### Entry & Assessment

**Diagnostic Entry** (`HeroSection.tsx`)
- Plain-language value proposition
- Single "Start diagnostic" CTA
- No quiz/gamification language
- 10-minute time expectation set

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
- `generate-personalized-insights`: LLM-generated insights from diagnostic data
- `generate-prompt-library`: Personalised thinking tools
- `compute-tensions`: Strategic gap analysis
- `compute-risk-signals`: Risk and blind spot detection
- `derive-org-scenarios`: Future scenario generation
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
- OpenAI GPT-4 for insight generation
- Vertex AI (Gemini) as fallback
- Voice transcription via Deepgram/Whisper
- Structured output validation via Zod schemas

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
