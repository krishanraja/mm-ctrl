# G24 predicate authority R87 panel verdict

Status: `VETOED_REPAIR_REQUIRED`

Date: 2026-09-16

## Frozen submission

- Commit: `0300d136b3c43e1f3eed9e18415baca9b7c62fd9`
- Tree: `5b258ff103051192f8186e5032e24e70c84f655f`
- Parent: `8f6bda5bdbd272f2ee7cf49756f40cc3de0f861d`
- Effective-contract blob: `1543fd5ea761cafa2f7f6825543de3095754449e`
- Manifest blob: `bd428d10316b450d078bf7e2af0f14d31420845a`
- Contract-document blob: `dea28439ceeb90df24e2da35201d406b0a1e84d4`
- R86 verdict blob: `a0aceafeb1f7ceb633ccfbad39e67e97c39e6bf7`
- Authority bundle fingerprint: `53026094327ac3d9707f360df680eea7cb05a6b965381436a3a9fdd35658e49b`
- Manifest bundle fingerprint: `35b4f8f42b63176f2a7c79328e9180bf4920dc261e2254e8177118b2e7502dd1`
- Effective-contract SHA-256: `06828b506242228f7fe83805b662810232d4b461a71e0f2307e1f773e8f4452d`

The official checker passed all thirteen predicate and final-authority paths, 212 executable vectors and 301 generated totality probes. The worktree was clean for every reviewer.

## Seven-role verdict

| Durable role | Verdict | Finding |
|---|---|---|
| Human Agency | VETO | A public-hash standing flip can withdraw a signed answer without a signed human-owned withdrawal event. |
| Human Comprehension and Access | VETO | Correction and withdrawal have no concise human-readable authoritative representation. |
| Consequential Usefulness | PASS | Current signed answers steer, failed finalization does not burn authority, and accepted actions retain visible consequences and decision deltas. |
| Epistemic Integrity | PASS | Within the presented journal, currentness is ordered, sealed, proof-bound and independent of validation arrival order. |
| Living Brain Integrity | VETO | Post-final answer correction is not connected to challenge, descendant blocking, repair receipts or revalidation. |
| Subject, Audience and Lifecycle Safety | VETO | A changed answer head makes exact retry of an accepted final fail while the replacement final remains blocked, stranding lifecycle state. |
| Behavioural and Implementation Reality | VETO | A truncated history can be re-genesis/resealed because no pinned genesis or store head exists; malformed resolver records can throw before validation. |

## Genuine R87 repairs retained

R87 genuinely closes R86's first-validator-wins and pre-final mutation failures. Current signed answers are selected by an ordered journal rather than request order. Predicate validation is pure. Invalid shape, fingerprint, binding, expiry, render or authority leaves route authority unclaimed. A successful same-process final excludes a competing proof. Unknown transition builders and validators return typed failure rather than throwing.

## Root causes

1. History completeness is relative only to the rows supplied to the resolver. Deleting the prefix, relabelling the surviving head as sequence one and recomputing public hashes creates an accepted false genesis.
2. Answer-state standing is not authorised by a signed transition event owned by the named human or a bounded signed Krish record of that human's instruction.
3. The new public resolver dereferences unvalidated record members before finite, closed-shape validation.
4. Final idempotency is re-evaluated against mutable current authority instead of resolving an immutable accepted-result record first.
5. A consumed answer head can become stale or withdrawn without entering the correction graph, challenging descendants or producing a repair path.

## R88 repair rule

R88 must:

1. bind every route/question journal to a pinned genesis, append-only head and complete snapshot identity;
2. bind each state record to the exact predecessor state ID, version and fingerprint, not merely the prior answer;
3. require signed answer-state transition authority for admission, supersession, correction and withdrawal, including actor, owner, route, question, prior head, new standing, sequence, time, reason and concise human-readable status;
4. validate the entire resolver input as finite closed data before any filtering or property access;
5. add an accepted-final registry checked before mutable predicate revalidation, returning the committed result for byte-identical retry and rejecting changed bytes under the same identity;
6. bind accepted finals to transition, predecessor, predicate, answer heads, render, authority receipt, subject, case, purpose and audience;
7. connect post-final answer changes to dependency challenge, descendant blocking, complete repair receipts and named-human revalidation or compensating lifecycle action; and
8. pin prefix and middle deletion plus reseal, unsigned and cross-human withdrawal, malformed resolver records, and every post-final supersession, correction and withdrawal path.

Only a unanimous seven-role pass on one exact frozen R88 commit may create a founder-ready receipt. Runtime, database, UI, deployment, merge, release and external authority remain closed.
