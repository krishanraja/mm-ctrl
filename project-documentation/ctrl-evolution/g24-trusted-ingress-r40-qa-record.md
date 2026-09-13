# G24 trusted canonical ingress R40 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R40 materialization from frozen R39: passed
- Focused R40 contract checker: passed with 30 mutation probes
- Stored-artifact restart reconstruction: passed for all 4 branch classes
- Semantic-reference owner resolution: passed for all 1,766 occurrences
- Self-sealed runtime-semantic authority manifest: passed with 203 rows
- R40 machine SHA-256: `74434ed998ef047bc8ee855732688f20d061fd7d3ebd3981993047526cbcd535`
- Exact founder lock: passed
- Locked headless Crossing kernel: passed, 211 of 211 checks
- Full documentation chain: passed through R40
- Diff and frozen R6 through R39 immutability: passed

Mutation coverage includes the three residual `selected_variant` pseudo-references; missing variant and unresolved source or destination fields; typed mismatch; stale and future authority versions; undocumented classifier wrappers and fingerprint drift; NaN, positive and negative infinity, negative zero, undefined and sparse arrays; unknown and wrongly owned semantic references; empty operation-authority dependencies; projection-only restart evidence; stored bytes, fingerprint, selection and classifier splicing; manifest-content and graph drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
