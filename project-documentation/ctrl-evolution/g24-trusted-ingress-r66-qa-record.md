# G24 trusted canonical ingress R66 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R66 materialization from frozen R65: passed
- Focused R66 checker: passed with 49 mutation probes
- R65 machine SHA-256 and frozen artifacts: exact
- Locked selection key: exactly `operation_class`, `policy_lineage_ref`, `evaluated_at`
- Closed operation-class vocabulary: 20 of 20 exact operation names
- Invalid `trusted_ingress` family alias in registry selection state: absent
- Registry-member operation applicability: derived from exact per-operation result-export keys and values
- Selection query schema: closed and fingerprinted
- Selection proof schema: closed and fingerprinted
- Selection records: 20 of 20, codepoint sorted, unique and exhaustive
- Every query binds operation class, policy lineage and evaluated time: exact
- Every query filters the same complete frozen registry snapshot: exact
- Snapshot content reference, bytes SHA-256 and R6 set seal in every proof: exact
- Selected member content reference, row-version reference and fingerprint in every proof: exact
- Selected result schema compatibility for each operation: 20 of 20
- Unique current compatibility match for each operation: 20 of 20
- Unknown, missing, duplicate and family-alias operation-class mutations: rejected
- Cross-operation result/export and member claim without export mutations: rejected
- Wrong policy/time, stale/future, omission and per-operation overlap mutations: rejected
- Selection-key field omission, change, order and proof splice mutations: rejected
- `evaluate_lifecycle_preconditions` selection proof bound into evidence ordering and lifecycle proof lineage: exact
- R65 descriptor/executable split and fail-closed dispatch boundary: byte-identical
- Kernel dispatch preconditions: 8 required, 0 satisfied
- Executable behavior and live result generation: explicitly unproved and closed
- Frozen-registry completeness: proved only for the exact archive
- Live-registry completeness and serializable selection: explicitly unproved
- Operation compatibility export inventory: 20 of 20 across seven surfaces
- Exact ordering occurrence metadata and fixtures: 21 of 21 preserved
- Final-state semantic-reference occurrences: 58,385
- Full runtime-semantic authority manifest: 250 rows
- Visible surface changes: none
- External actions: none

## Closure

No reviewer verdict is recorded here. No executable evaluator, adapter, database, runtime, UI, deployment or external action was opened.
