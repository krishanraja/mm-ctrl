# G25 decision candidate grounding, R148

Status: `isolated_hosted_pass`

Date: 25 September 2026

## Product problem

R146 preserved the source created while an operator reconstructed a provisional answer. That proved where the generated wording came from, but not which earlier decision evidence made the wording reasonable. A readable citation is not relational lineage. Without exact evidence links, a fluent model could borrow an irrelevant fact, omit a contrary fact or create a convincing business horoscope.

## Implemented boundary

R148 adds an append-only link from each reconstructed candidate to the exact immutable evidence atoms that support, refute or contextualise it.

A grounded candidate can be staged only when:

- every evidence atom belongs to the same workspace and subject;
- every atom was already admitted to the same sealed decision version;
- no atom is dated beyond the current causal boundary;
- the list contains at least one supporting atom;
- no atom is repeated;
- the exact evidence list is included in the idempotency fingerprint.

The candidate remains provisional. Grounding does not turn it into a leader answer, accepted Brain truth or recommendation. Confirmation, correction and rejection remain separate leader actions.

## Why this matters

The reconstruction engine now has a hard data contract before any model is allowed to create candidates. It cannot earn authority through confidence, polish or citation volume. It must show the exact already-governed evidence that carried the inference, preserve contrary evidence as a typed relationship and abstain when that boundary cannot be met.

## Trust and operational controls

- The new link table is append-only and forces RLS.
- Browser roles receive no raw-table grant.
- Only the authenticated grounded-staging RPC is executable by a product user.
- The existing R146 actor check still separates the subject from an authorised operator.
- Exact retries converge on the same candidate and evidence set; changed retries fail.
- Evidence created by the candidate itself cannot be recycled as prior support.
- Production project `bkyuxvschuwngtcdhsyg` was not contacted.

## Files

- `supabase/migrations/20260925064643_decision_candidate_evidence_lineage.sql`
- `supabase/functions/_shared/decision-ingress-core.ts`
- `supabase/functions/_shared/decision-ingress-core.test.ts`
- `supabase/functions/decision-ingress-v1/index.ts`
- `scripts/run-ctrl-g25-decision-ingress-r146.mjs`
- `scripts/probe-ctrl-g25-decision-ingress-r146.mjs`
- `project-documentation/ctrl-evolution/g25-decision-candidate-grounding-r148-qa-record.md`

## Honest boundary

This proves exact evidence eligibility, lineage, authority, privacy and retry behaviour in the isolated backend. It does not prove that a model can reconstruct a specific, surprising or commercially valuable candidate. The next gate is the fail-closed reconstruction contract: grounded candidate or explicit abstention, never generic completion.
