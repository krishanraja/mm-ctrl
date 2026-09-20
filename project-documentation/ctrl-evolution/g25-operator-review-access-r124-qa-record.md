# G25 operator review access, R124 QA

## Verification

- The evaluator admits only the exact active role, audience, purpose, finite expiry and packet binding.
- Owner-granted authority is required for both role and audience grant; the operator cannot self-authorize.
- The public denial is always `not_available`, while the private receipt preserves the exact denial reason.
- An allowed response exposes five named projection fields and no packet hashes, raw evidence, criteria or source text.
- The receipt explicitly records that no active standard changed, no decision authority was granted and no notification was sent.
- Eighteen deterministic Vitest cases pass: one allow and seventeen fail-closed cases.
- The static checker confirms the R123 dependency, existing Brain schema reuse, missing live packet bindings, exact constants, receipt shape, no browser service role and no em dash.

## Architecture adjudication

The Mindmake OS architecture strengthened this cut in three ways. Supabase remains the one source of truth, the existing role and grant tables remain the only access spine, and the new receipt is a general access-audit concept rather than a review-specific shadow ledger. The pull-only rule also prohibits notifications or ambient cross-customer reads.

## Boundary

R124 is a headless contract and pure evaluator. It does not prove PostgreSQL policy, atomic receipt persistence, stable operator runtime identity, PostgREST behavior, Edge transport, rendered product integration or production safety. Those remain R125 and later gates.
