# Claude Code Instructions

## Git & PR Workflow

- `gh` CLI is authenticated and works. Use it for PRs, merges, and GitHub operations.
- Create a branch, push, create the PR with `gh pr create`, and merge with `gh pr merge --merge --delete-branch`. Handle the full cycle; never leave manual steps for the user.
- Never push directly to main; always go through a PR branch.
- After merging, switch back to main and pull.
- Clean up: delete screenshot/test artifacts before committing. Add transient files to `.gitignore`.

## Supabase Deployment

- Supabase CLI (`supabase`) is installed and the project is linked to `bkyuxvschuwngtcdhsyg`.
- **Edge functions**: Deploy with `supabase functions deploy <function-name>`. Always deploy after modifying any edge function; do not leave this for the user.
- **Database migrations**: The local migration history is out of sync with remote. Do NOT use `supabase db push`. Instead, run SQL directly via the Supabase Management API:
  ```powershell
  $body = @{ query = "YOUR SQL HERE" } | ConvertTo-Json -Compress
  $headers = @{ 'apikey' = $env:SUPABASE_ACCESS_TOKEN; 'Authorization' = "Bearer $env:SUPABASE_ACCESS_TOKEN"; 'Content-Type' = 'application/json' }
  Invoke-RestMethod -Uri 'https://api.supabase.com/v1/projects/bkyuxvschuwngtcdhsyg/database/query' -Method POST -Headers $headers -Body $body
  ```
  The Supabase access token is in the user rules (starts with `sbp_`). Never commit it to source.
  Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for idempotency. For RLS policies (no IF NOT EXISTS), query `pg_policies` first or accept that duplicates will error harmlessly.
- **Secrets**: Rotate via Supabase Dashboard. If a secret needs setting programmatically, use `supabase secrets set KEY=VALUE`.
- Always apply migrations and deploy functions yourself. Never tell the user to do it manually.

## Shell (PowerShell on Windows)

- No `&&` chaining; use `;` or separate commands.
- No heredocs (`<<'EOF'`); use simple `-m "message"` for git commits.
- No `tail`/`head` Unix commands; use `Select-Object -Last N` or read the file.
- `$$` in strings gets interpolated; avoid PL/pgSQL `DO $$ ... $$` blocks in inline SQL. Use separate policy creation statements instead.

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
- 55+ edge functions in `supabase/functions/`
- 35+ custom hooks in `src/hooks/`

## Key Conventions

- No em dashes in any copy - use hyphens, semicolons, or parentheses
- Light mode design: warm off-white backgrounds, deep ink text, pure white cards
- Mobile-first, no-scroll pattern on key pages
- Voice-first interaction where applicable
- Production URL: `ctrl.themindmaker.ai` (not leaders.themindmaker.ai)
