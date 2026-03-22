# Claude Code Instructions

## Git & PR Workflow

- `gh pr create` and the GitHub API do NOT work in this environment (token is git-only).
- Do NOT waste time retrying `gh` commands or `curl` to the GitHub API.
- After pushing the branch, tell the user to create the PR from GitHub's UI (the yellow "Compare & pull request" banner on the repo page).
- Always push to the branch specified in the task description. Never push to main directly.

## Project

- This is a Next.js + Supabase app (TypeScript, Tailwind CSS)
- Edge functions live in `supabase/functions/`
- Run `npm run build` to verify changes compile
