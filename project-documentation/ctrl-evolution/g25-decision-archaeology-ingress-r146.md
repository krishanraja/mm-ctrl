# G25 decision archaeology ingress, R146

Status: `isolated_hosted_lifecycle_passed`

Date: 25 September 2026

## Release problem

R145 made the consequential-work spine persistent, encrypted and reversible, but the application still had no narrow authenticated path into it. A generic writer would collapse model reconstruction, evidence and leader authority into one operation. That would recreate the exact failure the product is meant to prevent: confident machine interpretation silently becoming human truth.

## Implemented boundary

R146 adds two deliberately separate paths.

### Evidence-derived candidate

An authorised subject, owner or operator can stage one candidate against an eligible sealed question. The transaction writes:

- one encrypted source with exact provenance;
- one encrypted inferred or external assertion;
- one immutable evidence atom;
- one encrypted candidate record;
- one append-only `candidate_staged` event.

The candidate does not create an answer, call, Brain item or accepted standard.

### Human authority

The subject can:

- answer the question directly;
- confirm the candidate as their answer;
- correct it and record their own answer;
- reject it without creating an answer.

A confirm or correction creates a fresh `user_stated` source and assertion rather than relabelling the machine claim. The existing answer guard materialises a new immutable evidence atom and emits the existing `question_answered` event. A separate candidate review and event preserve what the model proposed and what the human did with it.

## Trust and operational controls

- The Edge route requires a verified user JWT and exact isolated-project host binding.
- Raw candidate and review tables grant no access to anonymous or authenticated browser roles.
- Only five narrow authenticated RPCs are executable.
- Every private source, assertion, candidate and answer field uses AES-256-GCM with workspace, subject, record and field bound into additional authenticated data.
- Request retries are keyed and compared through an HMAC-SHA-256 fingerprint so random encryption IVs do not break idempotency.
- Candidate and review history is append-only.
- Per-request transaction locks serialize matching idempotency keys without holding locks across network work.
- Version and question eligibility are rechecked inside the database transaction.
- Production project `bkyuxvschuwngtcdhsyg` is not named in or reachable from the implementation.

## Files

- `supabase/migrations/20260925054258_decision_candidate_ingress.sql`
- `supabase/migrations/20260925054429_decision_candidate_ingress_fk_indexes.sql`
- `supabase/migrations/20260925055922_decision_ingress_server_chronology.sql`
- `supabase/functions/decision-ingress-v1/index.ts`
- `supabase/functions/_shared/decision-ingress-core.ts`
- `supabase/functions/_shared/brain-decision-crypto.ts`
- `scripts/run-ctrl-g25-decision-ingress-r146.mjs`
- `scripts/probe-ctrl-g25-decision-ingress-r146.mjs`
- `project-documentation/ctrl-evolution/g25-decision-archaeology-ingress-r146-qa-record.md`

## Current proof

- 17 focused TypeScript tests pass.
- The migration compiles in disposable PostgreSQL.
- The complete prior R142 94-control canary still passes after the additive migration.
- Both new tables have forced RLS.
- Anonymous users have zero executable entrypoints.
- Authenticated users have exactly five narrow entrypoints.
- Ordinary browser roles have zero raw-table privileges.
- Typecheck adds zero new errors.
- Both additive migrations are applied to isolated project `cgkcplcamsijghalintq` under the exact remote migration versions stored in the repository.
- Hosted readback reports two forced-RLS tables, five authenticated entrypoints, zero anonymous entrypoints, zero browser raw-table privileges, zero unindexed foreign keys and zero candidate, review, answer or decision-case rows.
- The JWT-protected Edge Function is ACTIVE at version 1 with an import map and deployment SHA-256 `3923219a228bb9ad87729d9ca80963d0ba255f214b3b10588f0fe39abe912b2e`.
- A live authenticated lifecycle proved create without promotion, exact replay, changed-retry refusal, cross-workspace refusal, direct answer, confirm, correct, reject, fresh user-stated provenance and browser raw-table concealment.
- The lifecycle proof ended with zero workspaces, sources, candidates, reviews, answers, events and Auth users from the disposable fixture.
- A live proof exposed and repaired a causal-order defect: the client action time remains source metadata while the server receipt time now governs the immutable answer and review records created after the provenance atom.

## Honest boundary

The database boundary and Edge Function are live only in isolated Supabase project `cgkcplcamsijghalintq`. They are not connected to a rendered operator or leader surface. No customer data was used. No production environment was contacted.

## Next release step

Bind one operator reconstruction flow and one radically minimal leader confirmation flow to this ingress. Keep the candidate visibly provisional, preserve evidence inspection as a deeper layer, and do not promote to production until rendered mobile, authority, accessibility and complete-loop gates pass.
