# G25 decision candidate grounding R148 QA record

Status: `pass_local_and_isolated_hosted`

Date: 25 September 2026

## Acceptance results

| Gate | Result |
| --- | --- |
| Exact evidence atoms linked to candidate | PASS, two |
| Supporting evidence required | PASS, missing support rejected at HTTP 400 |
| Contrary evidence preserved as `refutes` | PASS |
| Evidence must belong to same decision version | PASS, unrelated candidate atom rejected at HTTP 409 |
| Duplicate and malformed evidence references | PASS, fail closed by contract |
| Evidence references included in retry identity | PASS |
| Candidate remains provisional | PASS, no answer before leader review |
| Cross-workspace stage | PASS, HTTP 403 |
| Unauthenticated function request | PASS, HTTP 401 |
| Raw candidate and link tables | PASS, hidden |
| Ordinary browser table privileges | PASS, zero |
| Anonymous entrypoints | PASS, zero |
| Authenticated entrypoints | PASS, six exact functions |
| Composite foreign-key coverage | PASS, zero uncovered |
| Focused tests | PASS, 18 of 18 |
| Prior R142 database canary | PASS, complete suite |
| Hosted end-to-end lifecycle | PASS |
| Hosted disposable residue | PASS, zero |
| Hosted function source readback | PASS, all six deployed files exact with CRLF ignored |
| TypeScript regression gate | PASS, 94 baseline errors, zero new |
| Direct production bundle | PASS, Vite build complete |
| Database advisors | PASS for this slice; closed-table RLS notice is intentional and no new missing-index defect was reported |
| Production contact | PASS, none |

## Hosted identity

- Isolated project: `cgkcplcamsijghalintq`
- Migration: `20260925064643`
- Function: `decision-ingress-v1`
- Function state: ACTIVE v2, JWT verified, import map present
- Deployment SHA-256: `7ac5ed1774848bf546ad2b4d26e7d2234189a4dc4b2def3f8270e034c330d3f4`

## Commands

```text
npm run brain:g25:decision-candidate-grounding-r148-check
npm run brain:g25:decision-candidate-grounding-r148-hosted-probe
npm run typecheck
npx vite build
```

## Judge reading

- Human agency: PASS. Exact evidence constrains the model, but only the leader can convert a candidate into an answer.
- Brain integrity: PASS. The inference and every supporting, refuting or contextual atom have immutable typed lineage.
- Trust and privacy: PASS for the isolated slice. Raw lineage remains closed and the function is JWT protected.
- Human comprehension: NOT CHANGED. R147 still owns the minimum leader projection.
- Product intelligence: READY FOR THE NEXT GATE. The model contract can now be tested without allowing ungrounded output into the Brain.
- Commercial value: NOT YET PROVED. A real consequential decision and invited leader remain required.

## Remaining boundary

Do not promote this route to production or treat evidence linkage as proof of insight quality. Build and adversarially test the reconstruction contract next. It must return either one specific grounded candidate or an explicit abstention with the missing evidence and next best action.
