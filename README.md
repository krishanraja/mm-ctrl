# Mindmaker — Clarity for Leaders

> Think out loud. See what emerges.

Mindmaker helps leaders voice their thoughts and organizes them into a **Memory Web** — your portable context that makes every AI smarter, and **Team Instructions** that make your team sharper.

**For leaders who think before they decide.**

---

## How It Works

1. **Voice a thought**
2. **It organizes itself**
3. **Export anywhere** — ChatGPT, Claude, Gemini, Cursor, Claude Code
4. **Every decision gets clearer**

2 minutes to clarity. Voice-first, text always available.

---

## Core Features

### Memory Web
Your thoughts, organized. A living map of what you know, what you want, and how you think. Facts are categorized, verified by you, and encrypted at rest.

### Context Export — Your Context, Everywhere
One click to export your context to **any** AI tool:
- **ChatGPT** — Custom instructions
- **Claude** — Conversation context
- **Gemini** — Formatted context
- **Cursor** — .cursorrules file
- **Claude Code** — CLAUDE.md file
- **Raw Markdown** — Use anywhere

Export optimized for specific use cases: General Advisor, Meeting Prep, Decision Support, Code Review, Email Drafting, Strategic Planning.

### Thinking Tools
Four tools that think with your context:
- **Decision Advisor** — Think through a decision with full context
- **Meeting Prep** — Walk in prepared
- **Team Brief** — Draft instructions for your team
- **Stream of Consciousness** — Speak freely. It organizes itself.

### Team Instructions
Your thinking, delegated. Turn your context into clear instructions for anyone on your team. Drawn directly from your Memory Web.

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
