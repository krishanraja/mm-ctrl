# G24 R92 seven-role panel verdict

Status: `VETO`

Reviewed commit: `6e104a7691a2003b0feaa21fd39292d42204e087`

Reviewed tree: `e9594dba20e2a30cafdf8609ed8882d101c3c10d`

Parent: `33717167ab7b4f11e767c555bf003c70476a6cc4`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

## Exact frozen evidence

- Contract blob: `40c638dac3ae64e6f56541d8adeecfe81a6d2d60`
- Manifest blob: `3bf901930b7d9b61d32a6cb29110e8d16b8a5a73`
- Effective-contract blob: `ce20c825c30641f70c977fb5d6ff36e03c8bc813`
- Checker blob: `507341790d2b67fd9816480272fc46bfae987311`
- Materializer blob: `af31a040451012d9769876b5347eefe1e9ab0acf`
- Effective-contract SHA-256: `6e83e543354ba665955e30b8acd1c558f9af0762293edf8e00cd7c773be18f43`
- Manifest bundle fingerprint: `cf46160957721f2ba806511a3466fd1755e4196f5e51cbc498b6713c8f9c5847`

The official R92 suite passed seven source modules, all thirteen predicate/final paths, 212 executable vectors and 301 generated totality probes. Every named R91 counterexample was genuinely closed. Fresh exact-byte attacks nevertheless produced two valid vetoes.

## Role verdicts

| Durable role | Verdict | Decisive reason |
|---|---|---|
| Human Agency | PASS | Owner-signed withdraw/reanswer authority, replacement-first precedence, safe hold, exact review and later reblocking remain intact. |
| Human Comprehension and Access | VETO | Two valid withdrawals are described as one. Replacing once cannot unlock review, so the singular instruction is materially insufficient. |
| Consequential Leader Value | VETO | The sole next-step status understates the minimum remaining human actions and creates avoidable dead-end ceremony. |
| Epistemic Integrity | PASS | Causal time, complete observation chains, current heads and evolving event identity are correctly bound. |
| Lifecycle, Security and Privacy | VETO | Two registrations of the same callback are not independently owned; an already-used unsubscribe handle can remove another subscription. |
| Implementation Correctness | VETO | The promised idempotent unsubscribe contract is false for duplicate callback registrations, and official coverage tests only one registration. |
| Architecture and Integration Reality | PASS | R91 defects are closed, same-process boundaries are honest and the production transaction/outbox limitation is explicit. |

## Counterexample 1: multiple withdrawals, singular guidance

Both consumed heads in a valid accepted decision can be withdrawn with signed authority. The authoritative state then contains two open withdrawal challenges and zero normal review requests, but `currentStatus` reports:

```text
One answer was withdrawn. Choose a new answer, then review all changes with Krish.
```

Replacing exactly one answer still produces `replacement_required` and zero review requests. Only after both answers are replaced can review begin. The instruction therefore understates the minimum remaining work and does not expose which owners must act.

The enforcement is safe: descendants remain blocked and one replacement never reopens work. That is not enough for a human-facing contract whose only current-status projection promises a truthful next move.

## Counterexample 2: aliased unsubscribe ownership

R92 stores callback functions directly and removes `listeners.indexOf(listener)`. Two logical subscriptions created from the same function therefore alias:

```js
const f = () => {}
const u1 = answerAuthorityService.onAdvance(f)
const u2 = answerAuthorityService.onAdvance(f)

[u1(), u1(), u2()]
```

Actual result:

```json
[true, true, false]
```

Required result:

```json
[true, false, true]
```

The second `u1()` removes the registration owned by `u2`. Listeners are post-commit and non-authoritative, so this is not an answer-authority bypass; it is still a direct lifecycle-isolation and public-contract failure.

## Retained R92 gains

R92 remains valuable immutable evidence. It closes all five R91 failures:

- signed review cannot predate the latest challenge, observation or current head;
- unequal signer times resolve by canonical maximum independent of caller order;
- review-event identity binds the evolving observation and current-head state;
- mixed withdrawal/correction ordering preserves replacement-first precedence;
- a throwing later listener cannot make a committed answer transition appear failed.

## Mandatory R93 repair

R93 must repair forward without weakening any retained guarantee:

1. Derive every non-current open head, its count and its responsible named human from authoritative state.
2. Make status copy truthful for one and multiple replacements. At minimum, the displayed count must equal the minimum remaining replacement actions before review can be requested; owner-aware guidance is preferred when safe and legible.
3. Execute double-withdrawal permutations, zero-of-two, one-of-two and two-of-two replacements, review availability and later reblocking.
4. Store a unique subscription record or token per registration, close each unsubscribe handle over that exact record and a closure-local active flag, and remove only that registration once.
5. Add duplicate-same-function delivery and unsubscribe tests proving `u1 → true`, repeated `u1 → false`, `u2 → true` and exact intended delivery counts.

R75 and the active R77 founder lock remain unchanged. R92 opens no runtime, database, UI, deployment, merge, release or external authority.
