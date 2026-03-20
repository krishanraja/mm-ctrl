# Mindmaker — Your Portable AI Double

> Talk. We learn. Every AI gets smarter.

Mindmaker builds a **Memory Web** about you — who you are, what you do, how you think — then exports that context to any AI tool you use. ChatGPT, Claude, Gemini, Cursor, any LLM. Every AI conversation becomes personalized from the first word.

**For leaders building their AI advantage.**

---

## How It Works

1. **Talk naturally** about your work, goals, challenges
2. **We extract** facts, skills, and patterns automatically
3. **Export to any AI** — ChatGPT, Claude, Gemini, Cursor, Claude Code
4. **Every AI conversation gets 10x better**

2 minutes to your first export. Voice-first, text always available.

---

## Core Features

### Memory Web
Every conversation builds a rich map of who you are, what you do, and how you think. Facts are categorized (identity, business, goals, challenges, preferences), verified by you, and encrypted at rest.

### Context Export — Portable AI Context
Generate your personal context for **any** AI tool:
- **ChatGPT** — Custom instructions
- **Claude** — Conversation context
- **Gemini** — Formatted context
- **Cursor** — .cursorrules file
- **Claude Code** — CLAUDE.md file
- **Raw Markdown** — Use anywhere

Export optimized for specific use cases: General Advisor, Meeting Prep, Decision Support, Code Review, Email Drafting, Strategic Planning.

### AI Tools That Know You
Four tools powered by your Memory Web:
- **Decision Advisor** — Think through decisions with AI that knows your context
- **Meeting Prep** — Contextual briefs for your next meeting
- **Prompt Coach** — Sharpen your AI prompts with your context baked in
- **Stream of Consciousness** — Just speak, we extract what matters

### 10X Skills & Patterns
AI identifies your strengths to amplify and blind spots to address — personalized from your Memory Web data. Pattern detection surfaces behaviors, preferences, and recurring themes.

### Missions & Progress
Commit to action items from your diagnostic. Track progress through check-ins. Adaptive prompts adjust based on your momentum.

### AI Literacy Diagnostic
10-minute assessment covering Strategic Vision, Experimentation Culture, Delegation & Automation, Data & Decision Quality, Team Capability, and Governance. Surfaces tensions, risk signals, and organizational scenarios.

---

## Design Philosophy

- **Apple-like quality** — Executive-grade, 10/10 visual polish
- **Voice-first** — Talk naturally, we handle the structure
- **Mobile-first** — Immersive, no-scroll experience on every page
- **Light mode** — Warm off-white backgrounds, deep ink text, pure white cards

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Framer Motion |
| Styling | Tailwind CSS, shadcn/ui |
| State | React Context, TanStack Query |
| Backend | Supabase (PostgreSQL, 45+ Edge Functions) |
| AI | OpenAI GPT-4o (primary), Vertex AI Gemini (fallback) |
| Voice | OpenAI Whisper |
| Auth | Supabase Auth (Email + Google OAuth) |
| Payments | Stripe |
| Email | Resend |
| Hosting | Vercel (frontend), Supabase (backend) |

---

## Architecture

```
src/
├── components/        # UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── auth/         # Authentication
│   ├── voice/        # Voice capture
│   ├── memory-web/   # Memory Web dashboard
│   ├── onboarding/   # Guided first experience
│   └── ai-chat/      # AI interaction
├── hooks/            # 30+ custom React hooks
├── pages/            # 20 lazy-loaded pages
├── contexts/         # Auth, Theme, AppState
├── types/            # TypeScript types
├── utils/            # Utilities
└── integrations/     # External service clients

supabase/
├── functions/        # 45+ edge functions
│   ├── voice-transcribe/
│   ├── extract-user-context/
│   ├── memory-crud/
│   ├── memory-export/
│   ├── ai-generate/
│   ├── detect-patterns/
│   ├── submit-decision-capture/
│   ├── generate-meeting-prep/
│   ├── prompt-coach/
│   └── ...
└── config.toml
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Requires Node.js 18+. Environment variables configured in Supabase dashboard for edge function secrets.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [SALES_BRIEF.md](./project-documentation/SALES_BRIEF.md) | Sales-ready product overview |
| [FEATURES.md](./project-documentation/FEATURES.md) | Complete feature inventory |
| [VALUE_PROP.md](./project-documentation/VALUE_PROP.md) | Value propositions by audience |
| [PURPOSE.md](./project-documentation/PURPOSE.md) | Core mission and problem statement |
| [ICP.md](./project-documentation/ICP.md) | Ideal customer profile |
| [ARCHITECTURE.md](./project-documentation/ARCHITECTURE.md) | System architecture |
| [BRANDING.md](./project-documentation/BRANDING.md) | Brand voice and guidelines |
| [MASTER_INSTRUCTIONS.md](./project-documentation/MASTER_INSTRUCTIONS.md) | AI development guidelines |

Full documentation index: [project-documentation/README.md](./project-documentation/README.md)

---

## Deployment

- **Frontend**: Auto-deploys to Vercel on push
- **Edge Functions**: Auto-deploys to Supabase on push to `supabase/functions/`

---

*Built by [Krish Raja](https://mindmaker.ai) — Deployed on [Vercel](https://vercel.com) and [Supabase](https://supabase.com)*
