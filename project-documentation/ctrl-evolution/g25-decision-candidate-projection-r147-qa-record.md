# G25 decision candidate projection R147 QA record

Status: `pass_local_isolated_hosted_and_rendered`

Date: 25 September 2026

## Acceptance results

| Gate | Result |
| --- | --- |
| Minimum projection excludes evidence basis | PASS |
| Explicit basis request returns source type, time, standing and exact text | PASS |
| Projection route writes nothing | PASS by contract and hosted lifecycle |
| Cross-workspace candidate read | PASS, HTTP 403 |
| Unauthenticated projection request | PASS, HTTP 401 |
| Raw browser-table visibility | PASS, hidden |
| Projection parser and application gateways | PASS, fail closed |
| Confirm without browser repeating model claim | PASS |
| Correction requires leader wording | PASS |
| Rejection cannot submit an answer | PASS |
| Failed retry keeps one idempotency identity | PASS |
| Focused unit tests | PASS, 25 of 25 |
| Rendered browser journeys | PASS, 3 of 3 |
| 1440 by 900, 390 by 844 and 320 by 568 | PASS |
| Horizontal overflow | PASS, none |
| Visible touch targets below 44 pixels | PASS, none |
| Evidence hidden until requested | PASS |
| Exact three leader outcomes | PASS |
| New TypeScript errors | PASS, zero |
| Direct production bundle | PASS, Vite build complete |
| Changed-file whitespace, em dash and credential-pattern gate | PASS, zero |
| Prior R142 database canary after migration | PASS, complete suite |
| Hosted disposable residue | PASS, zero |
| Hosted function source readback | PASS, all 6 deployed files exact after line-ending and terminal-newline normalisation |
| Database advisors | PASS for this slice; deny-all RLS notices are intentional, and no new projection index defect was reported |
| Production contact | PASS, none |

## Hosted identity

- Isolated project: `cgkcplcamsijghalintq`
- Migration: `20260925061613`
- Function: `decision-candidate-projection-v1`
- Function state: ACTIVE v3, JWT verified, import map present
- Deployment SHA-256: `feda66a4ad6a2caeee182606d1805686c6a6c71875447e7b43580ef34bb01d17`

## Commands

```text
npm run brain:g25:decision-candidate-projection-r147-check
npm run brain:g25:decision-candidate-projection-r147-hosted-probe
npx vitest run src/features/operator-brain/DecisionCandidateMoment.test.tsx src/features/operator-brain/decisionCandidateProjectionGateway.test.ts src/features/operator-brain/decisionCandidateReviewGateway.test.ts supabase/functions/_shared/decision-candidate-projection-core.test.ts
npx playwright test src/__tests__/e2e/g25-decision-candidate-moment-r147.spec.ts
npm run typecheck
```

## Judge reading

- Human agency: PASS. The model proposes one belief; the leader confirms, replaces or rejects it.
- Brain integrity: PASS. Read, evidence inspection and review remain separate operations over one immutable lineage.
- Trust and privacy: PASS for the isolated slice. The browser receives minimum decrypted meaning by default and no raw-table access.
- Human comprehension: PASS for the rendered contract. One proposed belief, one plain question and three answer-shaped controls are visible before optional depth.
- Interaction quality: PASS for the bounded surface. Phone and desktop render without overflow or undersized controls; no dead control remains.
- Product intelligence: PROVISIONAL. The interaction can carry a grounded candidate, but no claim is made that the reconstruction itself is insightful.
- Commercial value: NOT YET PROVED. A real consequential decision and invited leader remain required.

## Remaining boundary

Do not promote this route to production or treat the synthetic screen as a complete customer experience. Bind the reader and writer through the authenticated application, prove the operator reconstruction path and then test one complete authorised decision with real evidence.

The repository build wrapper remains blocked by four pre-existing, unchanged R142 through R144 documents containing em dashes. Direct Vite production compilation passes, and none of the 22 R147 changed files contains an em dash or credential-shaped value. This slice does not rewrite unrelated historical records to manufacture a green gate.
