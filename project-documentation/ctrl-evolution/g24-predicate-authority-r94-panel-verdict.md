# G24 R94 seven-role panel verdict

Status: `VETO`

Reviewed commit: `9f3632c3cbc5355f54109bd1744f08e8ec08fb89`

Reviewed tree: `f67743819de4eab3c6eaf05478a3e561ad288c7e`

Parent: `d66981dad9f9a6b92b31e0d7f941f498f291bc37`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

## Exact frozen evidence

- Manifest blob: `638b698ed7b66088e77a41aa0531e696f1d7dd57`
- Effective-contract blob: `b55998c10136476125dc9a0ceb003186051b5103`
- Correction-contract blob: `2b289795f9450dcc76b667e94d09e9a42a9247b6`
- Checker blob: `72260bf633065efc51f4c3f8308f23eca0fa710d`
- Materializer blob: `1c1d37f7a6eb22d4f5ccdab46b6ead3de23fea44`
- Effective-contract SHA-256: `7a3ffa3c97cdacc03f175b5c7b8aa1cf2555cc1d26cb572b7c319829df4ab9bd`
- Manifest bundle fingerprint: `6c0ac49a864c875456820fa75376b77939898dceee612c921f39f96ba373a34c`
- Authority bundle fingerprint: `e1d52b2fd6844526d8f57d00a0246aeb3bbddf2cfcc23184d29374c1cbe45cc5`

The official R94 suite passed seven modules, all thirteen predicate/final paths, 212 executable vectors and 301 generated totality probes. Independent human and architecture traces confirmed that R94 genuinely fixes R93's repeated-owner defect across three-head and six-head recovery sequences. Fresh exact-byte attacks nevertheless found two schema-authority escapes.

## Role verdicts

| Durable role | Verdict | Decisive reason |
|---|---|---|
| Human Agency | PASS | Exact per-person remaining work, signed human action, replacement-first blocking and final review timing all held. |
| Human Comprehension and Access | PASS | Same-owner, split-owner and unequal partial states rendered one clear and sufficient next move. |
| Consequential Leader Value | PASS | Recovery became a complete live plan rather than dead-end ceremony. |
| Epistemic Integrity | VETO | The exact projection validator accepts fabricated owner identities and renders them as generic “answer owner” labels. |
| Lifecycle, Security and Privacy | VETO | A downstream consumer cannot distinguish an authorised human obligation from an unregistered principal using the declared gate. |
| Implementation Correctness | VETO | `Number.isInteger` accepts unsafe cardinalities, and a self-consistent projection is not bound to the authoritative missing-head set. |
| Architecture and Integration Reality | PASS | Runtime values match the discriminated schema, exact consumers are implementable and the local/no-runtime boundary remains honest. |

## Retained R94 gains

- One owner with three missing answers progresses exactly from three to two to one to review.
- Six split-owner heads preserve exact `3 + 3` and every unequal partial distribution.
- All six admitted answer-bearing transitions execute forward/reverse withdrawal and reanswer order classes.
- Review requests remain zero until every replacement is current.
- Missing, extra, wrong-type, duplicate, unsorted, mismatched-total and false-copy attacks reject.
- R91–R93 causal time, identity, observation, complete baseline, replay, reset and listener ownership protections remain intact.

## Fresh counterexample 1: fabricated responsible human

An exact-looking replacement projection with `named_human_id: "attacker"` returns `true`. Two unknown owners also validate and render as:

```text
Two answers need replacing: one from the answer owner and one from the answer owner.
```

The frozen trusted registry contains only `krish` and `leader-1`. Accepting any non-empty string discards both authority and the identity of who must act.

## Fresh counterexample 2: non-exact cardinality

`Number.MAX_SAFE_INTEGER + 1` returns `true` as both the global and per-owner count. JavaScript cannot represent adjacent mathematical integers exactly above the safe-integer limit, so the schema cannot claim exact cardinality while accepting this value. A structurally self-consistent total can also exceed the actual authoritative missing-head set because standalone validation receives no authoritative expected obligations.

## Mandatory R95 repair

1. Bind every replacement owner to the exact permitted named-human set for the accepted decision or frozen trusted registry; reject unknown owners instead of assigning a generic label.
2. Require positive safe integers for every count and a safe exact sum at each addition.
3. Make replacement validation require the authoritative missing-head obligation set and demand exact equality, rather than accepting a self-consistent standalone projection.
4. Add hostile cases for one and two unknown owners, a registered but wrong owner, unsafe count, unsafe sum and a total exceeding authoritative missing heads.
5. Retain all R94 recovery, causal, lifecycle, replay, privacy and same-process guarantees.

R75 and the active R77 founder lock remain unchanged. R94 opens no runtime, database, UI, deployment, merge, release or external authority.
