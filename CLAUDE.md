# Claude Code Instructions

## Git & PR Workflow

- `gh pr create` and the GitHub API do NOT work in this environment (token is git-only).
- Do NOT waste time retrying `gh` commands or `curl` to the GitHub API.
- After pushing the branch, tell the user to create the PR from GitHub's UI (the yellow "Compare & pull request" banner on the repo page).
- Always push to the branch specified in the task description. Never push to main directly.

## Project

- This is a **Vite + React 18 + TypeScript** app with **Supabase** backend
- Styled with **Tailwind CSS** and **shadcn/ui** components
- Animations via **Framer Motion**
- Edge functions live in `supabase/functions/` (Deno runtime)
- Router: React Router v6 with `createBrowserRouter` and lazy loading (`src/router.tsx`)
- Run `npm run build` to verify changes compile
- Node.js requirement: `>=22 <24`

## Architecture Quick Reference

- **Dashboard** (`/dashboard`) is the main hub - shows Memory Web (default) or Edge (`?view=edge`)
- Desktop: sidebar navigation (`DesktopSidebar`) + main content area
- Mobile: bottom nav (`BottomNav`) + full-screen views
- Legacy routes (`/today`, `/voice`, `/pulse`, `/diagnostic`, `/think`) all redirect to `/dashboard`
- AI: Vertex AI Gemini primary, OpenAI GPT-4o fallback
- 53 edge functions in `supabase/functions/`
- 32 custom hooks in `src/hooks/`

## Key Conventions

- No em dashes in any copy - use hyphens, semicolons, or parentheses
- Light mode design: warm off-white backgrounds, deep ink text, pure white cards
- Mobile-first, no-scroll pattern on key pages
- Voice-first interaction where applicable
