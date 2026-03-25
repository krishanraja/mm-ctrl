# Claude Code Instructions

## Git & PR Workflow

- Always try to create PRs automatically. Use the GitHub MCP tools, `gh` CLI, or the compare URL as a fallback.
- Never refuse to attempt PR creation — try every available method before asking the user to do it manually.
- Always push to the branch specified in the task description. Never push to main directly.

## Project

- This is a Next.js + Supabase app (TypeScript, Tailwind CSS)
- Edge functions live in `supabase/functions/`
- Run `npm run build` to verify changes compile
