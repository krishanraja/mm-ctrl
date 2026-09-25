# G25 authenticated decision reconstruction route R151 QA record

Status: `pass_isolated_live`

Date: 25 September 2026

## Acceptance results

| Gate | Result |
| --- | --- |
| Browser request surface | PASS, question ID plus idempotency key only |
| Client-supplied evidence, model or prompt | PASS, rejected by exact request parser |
| Authentication | PASS, JWT required |
| Cross-customer access | PASS, denied |
| Direct signed-in database primitive | PASS, denied |
| Database service boundary | PASS, three service-only wrappers; zero authenticated original entrypoints |
| Canonical encrypted packet | PASS |
| Real provider call | PASS, `gpt-5.6-sol` |
| Candidate semantic gate | PASS |
| Exact evidence lineage | PASS, two existing atoms including support and refutation |
| Atomic candidate plus receipt | PASS |
| Exact retry | PASS, same run, candidate and provider response receipt |
| Changed retry | PASS, rejected |
| Raw reconstruction table access | PASS, none for anonymous or authenticated roles |
| Leader authority | PASS, model candidate remained proposed until leader action |
| Fresh leader provenance | PASS, confirmed and corrected answers are `user_stated` |
| Local focused tests | PASS, 31 of 31 |
| Prior database canary | PASS, complete R142 suite |
| Database containment | PASS, 4 forced-RLS tables, 0 ordinary browser privileges, 0 unindexed foreign keys |
| Edge deploy | PASS, ACTIVE version 15, JWT verification enabled |
| Deployed source readback | PASS, all 8 deployed files match local source after line-ending normalisation |
| Edge bundle SHA-256 | PASS, `249d60796f841027d17a553ed0e94adffb2c9b6d52493f56e1d5114114109548` |
| TypeScript regression gate | PASS, 94 baseline, 94 current, 0 new |
| Direct Vite production build | PASS |
| Hosted cleanup | PASS, zero disposable users, workspaces, runs, candidates, evidence links, reviews, answers, events and sources |
| Production contact | PASS, none |

## Commands

```text
npm run brain:g25:decision-reconstruction-route-r151-check
npm run brain:g25:decision-reconstruction-route-r151-hosted-probe
npm run typecheck
npx vite build
```

## Advisor reading

The four candidate and reconstruction tables appear in the informational `rls_enabled_no_policy` advisor because they are intentionally closed tables accessed only through security-definer functions. The new reconstruction functions no longer appear as authenticated security-definer entrypoints. Unused-index notices are expected on this empty isolated project and do not justify removing foreign-key or query-path indexes before realistic volume exists.

## Judge reading

- Human agency: PASS. The provider can propose or abstain only; only the leader can confirm or correct.
- Brain integrity: PASS for this route. Exact evidence lineage and immutable receipts survive the real provider call.
- Trust and privacy: PASS in the isolated proof. Browser-controlled packets and direct commit access are closed.
- Reliability: PASS for one live fixture. Malformed, generic, counterevidence-dropping and thin-evidence outputs failed closed during the proof sequence.
- Cost control: PASS. The accepted live call cost estimate was approximately 2.04 US cents and the retry spent nothing again.
- Product intelligence: PROVISIONAL. One strong fixture passed and one thin fixture correctly abstained. The frozen evaluation range remains required.

## Remaining boundary

Do not connect the production UI or claim general decision intelligence yet. R152 must test the fixed provider across the planned evidence-depth range, multiple decision families, required abstentions, prompt-injection cases and held-back expectations.
