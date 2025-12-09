# Mindmaker AI Leadership Assessment

> AI-powered leadership readiness diagnostic tool that helps executives understand their AI adoption posture and provides personalized recommendations.

---

## Features

- **AI Readiness Assessment** - Comprehensive questionnaire covering 4 core dimensions
- **Deep Profile Capture** - Optional detailed work context for personalized insights
- **AI-Generated Insights** - Personalized edge, risk, and next moves via Vertex AI / OpenAI
- **Prompt Library** - Role-specific AI prompts for immediate use
- **Risk Signals** - Identification of shadow AI, skills gaps, and other concerns
- **Strategic Scenarios** - Organizational path recommendations
- **PDF Export** - Downloadable assessment report
- **Progress Tracking** - Real-time generation status with phase indicators

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State | React Context, TanStack Query |
| Backend | Supabase (PostgreSQL, Edge Functions) |
| AI | Vertex AI (Gemini 2.0 Flash), OpenAI (GPT-4o) fallback |
| Auth | Supabase Auth (optional) |

---

## Architecture

```
src/
├── components/        # UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── auth/         # Authentication components
│   ├── voice/        # Voice capture modules
│   └── ai-chat/      # AI interaction components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── contexts/         # React contexts
├── pages/            # Route pages
├── types/            # TypeScript types
└── integrations/     # External service clients

supabase/
├── functions/        # Edge functions
│   ├── ai-generate/  # AI content generation
│   ├── create-leader-assessment/
│   └── ...
└── config.toml       # Supabase configuration
```

---

## Assessment Pipeline

```
User Input → UnifiedAssessment.tsx
    ↓
runAssessment.ts (orchestrator)
    ↓
create-leader-assessment (edge function)
    ↓
ai-generate (edge function)
    ├── Plan A: Vertex AI (Gemini 2.0 Flash)
    ├── Plan B: OpenAI (GPT-4o)
    └── Plan C: Fallback content
    ↓
Store to tables:
    - leader_dimension_scores
    - leader_tensions
    - leader_risk_signals
    - leader_org_scenarios
    - leader_prompt_sets
    - leader_first_moves
    ↓
useGenerationProgress (polls generation_status)
    ↓
aggregateLeaderResults.ts
    ↓
UnifiedResults.tsx
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `leaders` | User profiles (email, name, company) |
| `leader_assessments` | Assessment records with `generation_status` |
| `leader_dimension_scores` | AI-generated dimension scores |
| `leader_tensions` | Strategic tensions identified |
| `leader_risk_signals` | Risk signals with severity levels |
| `leader_org_scenarios` | Organizational path recommendations |
| `leader_prompt_sets` | Personalized prompt library |
| `leader_first_moves` | Prioritized action items |
| `assessment_events` | Raw question/answer events |

---

## Local Development

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase CLI (optional, for local functions)

### Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file (or use Supabase dashboard for edge function secrets):

```env
# These are set in Supabase Edge Function secrets
GEMINI_SERVICE_ACCOUNT_KEY=<service-account-json>
OPENAI_API_KEY=<your-openai-key>
```

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `ai-generate` | AI content generation (Vertex AI → OpenAI → Fallback) |
| `create-leader-assessment` | Creates assessment record |
| `send-confirmation-email` | Email notifications via Resend |
| `sync-to-google-sheets` | Lead sync to Google Sheets |
| `compass-analyze` | Compass module analysis |
| `roi-estimate` | ROI calculation |

### Viewing Logs

Visit: https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/functions

---

## Deployment

1. Push changes to the repository
2. Lovable auto-deploys on push
3. Edge functions deploy automatically

Or manually via Lovable:
1. Open [Lovable Project](https://lovable.dev/projects/e5f2499f-2eac-434d-91ad-1dcac5472915)
2. Click **Share → Publish**

---

## Custom Domain

1. Navigate to **Project > Settings > Domains**
2. Click **Connect Domain**
3. Follow DNS configuration instructions

---

## Documentation

| Document | Purpose |
|----------|---------|
| [MASTER_INSTRUCTIONS.md](./project-documentation/MASTER_INSTRUCTIONS.md) | AI development guidelines |
| [ARCHITECTURE.md](./project-documentation/ARCHITECTURE.md) | System architecture |
| [FEATURES.md](./project-documentation/FEATURES.md) | Feature documentation |
| [COMMON_ISSUES.md](./project-documentation/COMMON_ISSUES.md) | Troubleshooting guide |
| [CHANGELOG.md](./CHANGELOG.md) | Change history |
| [PROJECT_NOTES.md](./PROJECT_NOTES.md) | Running decisions |

---

## Contributing

1. Follow the [MASTER_INSTRUCTIONS.md](./project-documentation/MASTER_INSTRUCTIONS.md)
2. Update CHANGELOG.md with every significant change
3. Test the full assessment pipeline before pushing
4. Check edge function logs after deployment

---

## Support

- **Lovable Docs**: https://docs.lovable.dev
- **Supabase Dashboard**: https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg

---

*Built with [Lovable](https://lovable.dev)*
