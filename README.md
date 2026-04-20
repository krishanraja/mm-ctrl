# CTRL: Clarity for Leaders

> Think out loud. See what emerges.

CTRL helps leaders voice their thoughts and organizes them into a **Memory Web** (your portable context that makes every AI smarter), an **Edge** profile (your leadership strengths amplified, weaknesses covered), and **Context Exports** that make every AI tool you use instantly personal.

**Build your portable AI double in 2 minutes. Every AI tool you use instantly knows your context, goals, and thinking style.**

---

## The Problem

Every leader uses AI. But every AI conversation starts from zero. You re-explain who you are, what your company does, what you're working on, every single time. The advice stays generic. Decision speed suffers.

CTRL eliminates that friction permanently.

## How It Works

1. **Voice a thought**
2. **It organizes itself**
3. **Export anywhere** - ChatGPT, Claude, Gemini, Cursor, Claude Code
4. **Every decision gets faster**

2 minutes to your first export. Voice-first, text always available.

---

## Core Features

### Memory Web
Your thoughts, organized. A living map of what you know, what you want, and how you think. Facts are categorized, verified by you, and encrypted at rest.

### Edge: Leadership Amplifier
Your strengths sharpened, your weaknesses covered. Edge synthesizes your Memory Web and assessment data into a leadership profile, then offers AI-powered capabilities:
- **Sharpen** strengths: Systemize, Teach, Lean Into
- **Cover** weaknesses: Board Memos, Strategy Docs, Emails, Meeting Agendas, Templates
- Interactive strength/weakness pills with feedback loops
- Intelligence gap detection with guided resolution
- Pro tier with premium artifact generation

### Daily Briefing: Personalised Intelligence
Three minutes of audio every morning, tuned to the one thing that matters: your world. Not a feed. Not another digest. An **evidence-based pass** that reads your active decisions, missions, watchlist, and declared interests, then hands you 3-5 stories that actually move your math.

- Every story is **anchored** to something specific in your profile (you can literally see "Anchored to: <your active decision>" on the card)
- **Bookmark** any story → its anchor becomes a persistent beat
- **Ban** any topic → kills it semantically (embeddings-based, not keyword)
- **Settings → Interests** → declare beats, track people/companies, exclude whole topics
- Cold-start covered: new users get industry-specific seed beats proposed on day one (11 industries pre-seeded)
- Seven briefing types: Daily Brief, Macro Trends, Vendor Landscape, Competitive Intel, Boardroom Prep, AI Model Landscape, Custom Voice
- Built on a seven-stage pipeline: importance lens → query planner → multi-provider fan-out → pgvector dedupe + scoring → budget-constrained curation → script generation → audio synthesis
- Persistent semantic feedback loop: explicit kills (-1.0 immediately) + nightly aggregator that promotes 3+ thumbs-down to persistent -0.4 weight deltas

### Context Export: Your Context, Everywhere
One click to export your context to **any** AI tool:
- **ChatGPT** - Custom instructions
- **Claude** - Conversation context
- **Gemini** - Formatted context
- **Cursor** - .cursorrules file
- **Claude Code** - CLAUDE.md file
- **Raw Markdown** - Use anywhere

Export optimized for specific use cases: General Advisor, Meeting Prep, Decision Support, Code Review, Email Drafting, Strategic Planning.

### Thinking Tools
Four tools that think with your context:
- **Decision Advisor** - Think through a decision with full context
- **Meeting Prep** - Walk in prepared
- **Team Brief** - Draft instructions for your team
- **Stream of Consciousness** - Speak freely. It organizes itself.

### AI Literacy Diagnostic
10-minute assessment covering Strategic Vision, Experimentation Culture, Delegation & Automation, Data & Decision Quality, Team Capability, and Governance. Surfaces tensions, risk signals, and organizational scenarios.

### Missions & Progress
Commit to action items from your diagnostic. Track progress through check-ins. Adaptive prompts adjust based on your momentum.

---

## Design Philosophy

- **Apple-like quality** - Executive-grade, 10/10 visual polish
- **Voice-first** - Talk naturally, we handle the structure
- **Mobile-first** - Immersive, no-scroll experience on every page
- **Light mode** - Warm off-white backgrounds, deep ink text, pure white cards

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Framer Motion |
| Styling | Tailwind CSS, shadcn/ui |
| State | React Context, TanStack Query |
| Backend | Supabase (PostgreSQL, 53 Edge Functions, Deno runtime) |
| AI Primary | Vertex AI (Gemini 2.0 Flash) via Google Cloud service account |
| AI Fallback | OpenAI GPT-4o |
| Voice | OpenAI Whisper |
| Auth | Supabase Auth (Email + Google OAuth) |
| Payments | Stripe (Edge Pro subscription) |
| Email | Resend |
| Hosting | Vercel (frontend), Supabase Cloud (backend) |

---

## Architecture

The app uses a **unified dashboard** architecture. The Dashboard page (`/dashboard`) is the primary hub, rendering either the Memory Web view (default) or the Edge view (`?view=edge`). Desktop uses a persistent sidebar; mobile uses a bottom navigation bar.

### Active Routes

| Route | Page | Auth | Notes |
|-------|------|------|-------|
| `/` | Landing | No | Video background hero, CTRL branding |
| `/auth` | Auth | No | Email + Google OAuth |
| `/auth/callback` | Auth Callback | No | OAuth redirect handler |
| `/booking` | Booking | No | External booking page |
| `/dashboard` | Dashboard (Memory Web) | Yes | Default view - Memory Web with guided first experience |
| `/dashboard?view=edge` | Dashboard (Edge) | Yes | Edge leadership amplifier |
| `/memory` | Memory Center | Yes | Detailed memory management |
| `/context` | Context Export | Yes | Export to AI tools |
| `/settings` | Settings | Yes | User preferences |
| `/profile` | Profile | Yes | User profile |

Legacy routes (`/today`, `/voice`, `/pulse`, `/diagnostic`, `/think`) redirect to `/dashboard`.

### Navigation Structure

**Desktop:** Fixed left sidebar (264px) with CTRL logo, nav items (Home, Edge, Memory Web, Export to AI), settings, and sign out.

**Mobile:** Bottom navigation bar with 4 tabs: Home, Edge, Memory, Export.

### Directory Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── auth/            # Authentication (AuthProvider, RequireAuth)
│   ├── landing/         # Landing page (HeroSection, CtrlLogo, TrustIndicators)
│   ├── dashboard/       # Dashboard hub
│   │   ├── desktop/     # DesktopDashboard, Sidebar, Panel
│   │   └── mobile/      # MobileDashboard, BottomNav, VoiceFAB, sheets
│   ├── memory-web/      # Memory Web views (desktop + mobile dashboards, sidebar, guided experience)
│   ├── edge/            # Edge leadership amplifier (EdgeView, EdgeProfileCard, paywall, pills)
│   ├── voice/           # Voice capture components
│   ├── memory/          # Memory management components
│   ├── onboarding/      # Guided first experience
│   ├── missions/        # Missions tracking
│   ├── sharpen/         # Sharpen tool (voice input, insights)
│   ├── ai-chat/         # AI interaction
│   ├── diagnostic/      # Assessment components
│   ├── team-instructions/ # Team instruction generation
│   └── pulse/           # Strategic Pulse
├── hooks/               # 32 custom React hooks
├── pages/               # 23 page components (many are legacy redirects)
├── contexts/            # Auth, Theme, AppState
├── types/               # TypeScript types (including edge.ts)
├── utils/               # Utilities
├── router.tsx           # React Router v6 with createBrowserRouter
└── integrations/        # External service clients (Supabase)

supabase/
├── functions/           # 53 edge functions (Deno runtime)
│   ├── _shared/         # Shared utilities (rate limiting, AI cache, context builders, etc.)
│   ├── ai-generate/     # Central AI function (Vertex primary, OpenAI fallback)
│   ├── voice-transcribe/
│   ├── extract-user-context/
│   ├── memory-crud/
│   ├── memory-export/
│   ├── edge-generate/   # Edge artifact generation
│   ├── synthesize-edge-profile/  # Edge profile synthesis
│   ├── create-edge-subscription/ # Edge Pro payments
│   ├── detect-patterns/
│   ├── submit-decision-capture/
│   ├── generate-meeting-prep/
│   ├── prompt-coach/
│   └── ... (53 total)
├── migrations/          # PostgreSQL migrations
├── email-templates/     # Auth email templates
└── config.toml
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

Requires **Node.js >=22 <24**. Environment variables configured in Supabase dashboard for edge function secrets.

---

## Documentation

Detailed documentation lives in `project-documentation/`:

| Document | Purpose |
|----------|---------|
| [README.md](./project-documentation/README.md) | Documentation index and quick start |
| [SALES_BRIEF.md](./project-documentation/SALES_BRIEF.md) | Sales-ready product overview |
| [FEATURES.md](./project-documentation/FEATURES.md) | Complete feature inventory |
| [VALUE_PROP.md](./project-documentation/VALUE_PROP.md) | Value propositions by audience |
| [PURPOSE.md](./project-documentation/PURPOSE.md) | Core mission and problem statement |
| [ICP.md](./project-documentation/ICP.md) | Ideal customer profile |
| [ARCHITECTURE.md](./project-documentation/ARCHITECTURE.md) | System architecture |
| [BRANDING.md](./project-documentation/BRANDING.md) | Brand voice and guidelines |
| [DESIGN_SYSTEM.md](./project-documentation/DESIGN_SYSTEM.md) | Design tokens, components, patterns |
| [MASTER_INSTRUCTIONS.md](./project-documentation/MASTER_INSTRUCTIONS.md) | AI development guidelines |

---

## Deployment

- **Frontend**: Auto-deploys to Vercel on push to main
- **Edge Functions**: Deployed via Supabase CLI (`supabase functions deploy`)
- **Database**: Migrations applied via `supabase db push`

---

*Built by [Krish Raja](https://ctrl.ai). Deployed on [Vercel](https://vercel.com) and [Supabase](https://supabase.com)*
