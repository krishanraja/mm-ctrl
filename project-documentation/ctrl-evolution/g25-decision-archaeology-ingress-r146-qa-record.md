# G25 decision archaeology ingress R146 QA record

Status: `pass_local_and_isolated_hosted_lifecycle`

Date: 25 September 2026

## Acceptance results

| Gate | Result |
| --- | --- |
| Evidence-derived candidate cannot create a leader answer | PASS |
| Confirmation and correction create fresh user-stated provenance | PASS by database contract |
| Rejection creates no answer | PASS by database contract |
| Candidate and review history are append-only | PASS |
| Private fields are record-context encrypted | PASS |
| Retry fingerprint is stable and keyed | PASS |
| Anonymous RPC execution | PASS, 0 of 5 |
| Authenticated raw-table privileges | PASS, 0 |
| Candidate and review forced RLS | PASS, 2 of 2 |
| Prior R142 canary after migration | PASS, complete suite |
| Focused TypeScript tests | PASS, 17 of 17 |
| New TypeScript errors | PASS, 0 |
| Changed-file whitespace and em-dash gate | PASS |
| Changed-file secret pattern scan | PASS, 0 matching files |
| Isolated migration versions | PASS, `20260925054258`, `20260925054429` and `20260925055922` |
| Isolated catalogue and ACL readback | PASS |
| New unindexed foreign keys | PASS, 0 after additive correction |
| JWT-protected function deployment | PASS, ACTIVE v1, import map present |
| Hosted function source readback | PASS, all 6 deployed files exact after line-ending normalisation |
| Unauthenticated request refusal | PASS, HTTP 401 |
| Candidate creation without answer promotion | PASS live |
| Exact retry and changed-retry conflict | PASS live |
| Cross-workspace denial | PASS live, HTTP 403 |
| Confirm, correct, reject and direct answer | PASS live |
| Confirmed and corrected provenance | PASS live, fresh `user_stated` assertions |
| Browser raw-table visibility | PASS live, hidden |
| Disposable hosted residue | PASS, 0 rows across all measured fixture tables and Auth |
| Post-repair RPC privilege readback | PASS, authenticated true; anonymous and public false |
| Production contact | PASS, none |

## Commands

```text
npm run brain:g25:decision-ingress-r146-check
npm run brain:g25:decision-ingress-r146-hosted-probe
npm run typecheck
```

The repository-wide standards command remains red on four pre-existing, unchanged R142 through R144 documents containing em dashes. The 19 R146 changed files contain none. This slice does not rewrite unrelated historical records to manufacture a green gate.

## Judge reading

- Human agency: PASS. A machine candidate cannot award itself answer standing.
- Brain integrity: PASS. Source, assertion, evidence atom, proposal and human response remain separate, inspectable records.
- Trust and privacy: PASS for the isolated lifecycle. Host binding, JWT authentication, forced RLS, closed tables, context-bound encryption, cross-workspace denial and zero-residue cleanup were exercised live.
- Product intelligence: PASS as a mechanism, not an efficacy claim. The architecture reduces repeated intake and preserves correction, but does not yet prove that the reconstructed candidate is insightful.
- Interaction quality: NOT YET APPLICABLE. No new surface is authorised or rendered.
- Commercial value: PROVISIONAL. Decision archaeology supports a lower-burden, more specific experience, but private-pilot value still requires one complete real consequential decision.
- Systems and operations: PASS for the isolated slice. Three migrations and the function are live in the isolated project, the lifecycle is observable, and disposable fixtures return to zero. Production promotion and surface integration remain separate gates.

## Remaining boundary

Do not promote this route to production or imply customer value from infrastructure alone. The next proof must connect one operator reconstruction and one radically minimal leader confirmation surface without weakening the authority boundary.
