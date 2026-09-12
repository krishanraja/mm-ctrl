# G24 R5 QA record

**Date:** 12 September 2026

**Status:** Frozen candidate cleared by final council for explicit founder architecture lock

**Prior final status:** `BLOCKED_PENDING_REPAIR`

## Repair boundary

R5 changes only the required dependency binding and invalidation semantics for a pending Release projection that contains selector-influenced content.

R1, R2, R3 and R4 artifacts and all three earlier G24 council runs remain immutable history.

## Deterministic proof required

The R5 checker must verify:

- all frozen R1, R2, R3 and R4 hashes plus the R4 adjudication hash;
- exactly one allowed repair area and no new canonical root;
- a required binding to included selector result versions and their complete controlling watermark sets;
- explicit inclusion of the dependent independent-challenger result version;
- invalidation before use when any included watermark changes, even if canonical source and Brain versions do not;
- one append-only invalidation receipt and zero approval, delivery or external side effect;
- lineage-scoped behavior that leaves unrelated challenger changes alone;
- no eligibility restoration through rebuild alone;
- renewed eligibility only after trusted current resolution and separate exact named-leader Release authority;
- every R4 protected strength and closed external action; and
- canonical state routing to R5.

## Claims still unproven

R5 does not prove a physical dependency graph, atomic invalidation, concurrency safety, use-time enforcement, delivery, revocation traversal, retention, erasure, residue, non-recall, question comprehension, UI intuitiveness, decision-quality lift or commercial value. Those remain at their named later gates.

## Frozen candidate and check result

| Artifact | SHA-256 |
|---|---|
| `g24-product-system-blueprint-r5.md` | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` |
| `g24-product-system-contract-r5.json` | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` |
| `g24-product-system-r5-delta.json` | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` |

`node scripts/check-ctrl-g24-product-system-r5.mjs`, the complete `npm run docs:check`, both earlier council verifiers and `git diff --check` pass against these exact bytes and their frozen dependencies.

## Next verification

The [complete R5 council](runs/g24-r5-architecture-council-004/) returned seven sealed `PASS_WITH_WATCHPOINTS` verdicts, zero vetoes and final status `CLEAR_FOR_FOUNDER_LOCK`. The final adjudication SHA-256 is `006c1816d5bc754792c16fb85d183f4d626b98112f9395e5d6ec964f9be72f1f`.

Place the exact R1 through R5 architecture chain before Krish for one architecture-only lock. No headless build, interface work or external action begins unless Krish explicitly locks those exact bytes and separately authorises the bounded implementation step.
