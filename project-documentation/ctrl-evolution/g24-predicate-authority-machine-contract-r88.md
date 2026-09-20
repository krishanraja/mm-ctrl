# G24 human-owned answer history and self-healing finality contract, R88

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `04172fed2d91195f118dbb00ad55d1f4e0ab55c30a14717b7e29c98caf3c88d3`

Manifest bundle fingerprint: `3320350a37c99b219c58c5e64d160cf09bee938a1c2393cb851ba3f374d73e84`

Effective-contract SHA-256: `a71be37c53a2409de32c7b73875f3641a76e1ff87d5b62128a990b0f8dec8493`

## Why R88 exists

R87 made answer selection independent of validation order and moved route commitment behind the complete final-authority gate. Independent review then found that presented history could be truncated and resealed as a false genesis, withdrawal was not owned by a signed human action, malformed resolver records could throw, and a legitimate answer change after acceptance stranded the old final instead of invoking the Brain's self-healing loop.

R88 repairs those failures forward. R87 remains immutable vetoed evidence under the [R87 panel verdict](g24-predicate-authority-r87-panel-verdict.md); it is not effective authority.

## Effective contract

R88 retains every genuine R87 repair and adds four joined authority layers:

1. **Pinned append-only answer history.** Every route and question is bound to an exact genesis, exact immediate predecessor chain, complete append-only head, canonical state membership and full store snapshot fingerprint. A removed prefix or middle record cannot be relabelled and resealed into a new valid history.
2. **Human-owned state change.** Admission, supersession, correction and withdrawal require a signed transition from the named answer owner, authenticated through an allowed credential and bound to the exact prior state, answer, route, question, sequence, standing, time and reason. An unsigned standing flip or cross-human withdrawal fails.
3. **Accepted-result idempotency.** The final coordinator resolves a same-process accepted-result registry before revalidating mutable current authority. Byte-identical retry returns the committed result. Changed bytes under the same reserved-transition identity collide and reject. The accepted record binds transition, predecessor, predicate, every consumed answer head, final render, final authority, subject, case, purpose and audience.
4. **Post-final self-healing.** A signed correction or withdrawal of a consumed answer preserves the accepted result as history, removes its current steering eligibility, blocks affected descendants and emits one complete human-review repair receipt per changed consumed head. A replacement proof may become semantically valid but cannot steal the already committed lifecycle route; named-human revalidation or a compensating lifecycle action is required.

Predicate validation remains pure. Failed shape, fingerprint, render, receipt, authority, binding or expiry validation commits no route claim. The final route compare-and-set remains after all joined checks. Unknown transitions and malformed resolver values reject without throwing.

## Human experience protected

The ledger machinery stays backstage. The person sees a concise status only when a meaningful answer change occurs:

- “Your answer is now the one this decision will use.”
- “Your newer answer replaces the earlier choice.”
- “Your answer was withdrawn. Nothing will move until you answer again.”

The final surface still shows the exact lifecycle action and every material decision delta. Correction does not silently rewrite history or quietly keep acting on an answer the person no longer owns.

## Independent proof before freeze

The checker reconstructs the authority bundle from source bytes, verifies 119 signed answer-state transition specimens and all signed final-authority events, executes all thirteen predicate and final-authority paths, runs 212 pinned vectors and 301 generated hostile-input probes, and adds explicit adversarial checks for:

- prefix deletion, re-genesis and recomputed seals;
- head or middle deletion and recomputed store seals;
- null, accessor and sparse resolver records;
- unsigned standing change and cross-human withdrawal;
- exact predecessor, genesis, head and complete snapshot binding;
- accepted final followed by answer correction, withdrawal and replacement proof;
- byte-identical retry after current authority changes;
- changed bytes under an accepted identity;
- historical preservation, current-steering removal, descendant blocking and complete repair receipts for every changed consumed answer head; and
- the complete R86 and R87 no-burn, arrival-order, visibility and totality attacks.

Run:

```text
npm run brain:g24:predicate-r88-check
```

## Bounded claim

R88 proves deterministic same-process contract semantics only. The answer-state store, accepted-final registry, correction bridge and route compare-and-set are executable authority models, not production persistence. Cross-process concurrency, restart durability and shared-consumer transactions require a separately authorised database adapter and remain outside this claim.

## Still not authorized

R88 is local contract data and deterministic conformance evidence only. It does not authorize or implement a production semantic evaluator, result-producing lifecycle runtime, live registry, shared transaction adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R88 commit and submit that immutable identity to all seven durable judge roles. Every R87 escape route must be reproduced against the frozen bytes, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready receipt.
