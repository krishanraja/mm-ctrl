# G24 R4 QA record

**Date:** 12 September 2026

**Status:** Frozen candidate reviewed; final adjudication `BLOCKED_PENDING_REPAIR`

**Prior final status:** `BLOCKED_PENDING_REPAIR`

## Repair boundary

R4 changes only:

1. the versioned R1 governance and independent-challenger references that can produce selector-eligible epistemic outcomes;
2. the exact engagement state graph and explicit separation between engagement close and the existing R1 Release object; and
3. the fail-closed partition between invalid controlling state, valid unresolved evidence and non-actionable provisional diagnostics.

The R1, R2 and R3 frozen artifacts and both earlier council runs remain immutable history.

## Deterministic proof required

The R4 checker must verify:

- all R1, R2 and R3 frozen hashes plus the R3 adjudication hash;
- exactly three allowed repair areas and no new canonical root;
- current policy and challenger references in selector input, output watermarks and invalidation;
- only trusted evaluation producing selector-eligible semantic outcomes;
- a current countercase or bounded-none result, with indeterminate state held;
- exactly six engagement states ending in `closed`;
- every transition endpoint belonging to the exact state set, with no grouped token or implied edge;
- a `preparing -> closed` path and all declared pause, close, continuation and reopen edges;
- actor, authority, precondition, version match, before/after references, invalidation and receipt on every edge;
- engagement state and close receipts never granting or proving R1 Release authority;
- invalid controlling state returning only `abstain_hold` with no actionable effect;
- valid unresolved evidence using a resolving route only after every earlier guard and otherwise holding;
- provisional detail existing only as non-authoritative hold metadata;
- all protected strengths and all closed external actions; and
- canonical state routing to this R4 candidate.

## Frozen candidate and check result

| Artifact | SHA-256 |
|---|---|
| `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` |
| `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` |
| `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` |

`node scripts/check-ctrl-g24-product-system-r4.mjs`, the complete `npm run docs:check`, the frozen R3 council verifier and the R4 Pack A verifier all passed against these bytes and their immutable dependencies. The complete history-blind review and history-aware adjudication are preserved at `runs/g24-r4-architecture-council-003/`.

All seven isolated specialists returned `PASS_WITH_WATCHPOINTS`, but final adversarial adjudication sustained one architecture defect, `P-01`. A pending Release projection containing selector-influenced content was not required to retain the selector result and its complete controlling watermark set, so a dependent independent-challenger change could invalidate the selector result without unambiguously invalidating the still-pending projection. The exact final adjudication SHA-256 is `c0e37605b5257beb08775c0c088cd13e1cc3cc9282ae47bcba281f0f8524630b`.

## Claims still unproven

R4 does not prove a working selector, correct policy semantics, exhaustive source capability, runtime totality, latency, cost, question comprehension, UI intuitiveness, session usefulness, consented capture, delivery, erasure, portable import, decision-quality lift or commercial value. Those remain at their named later gates.

## Next verification

Preserve R4 unchanged. Apply only `P-01` as a new R5 complete-dependent-watermark amendment, freeze and check those exact bytes, then obtain seven fresh isolated specialist verdicts followed by prosecution, defense, founder calibration and final adjudication. No headless build or external action begins on R4 or its repair candidate.
