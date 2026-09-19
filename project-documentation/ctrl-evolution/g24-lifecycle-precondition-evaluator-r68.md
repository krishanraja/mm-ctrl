# G24 lifecycle precondition evaluator structural gate, R68

Status: local structural executable loading mechanics only

Date: 2026-09-15

R68 is an immutable extension of the accepted R66 metadata-only architecture and its R67 closure receipt. It introduces a founder-lockable, import-free conformance module and an isolated loader. It does not implement lifecycle precondition semantics.

No runtime, database, UI, deployment or external action is authorized or performed.

## Exact artifact

- Source and executable bytes: `supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.mjs`
- SHA-256 and content reference: `fc2a93586fdbe42aa9f15e3a1990142403edb0a7df512881ffd9d5e18fad9104`
- Git blob identity: `7985b73dd5c41ff7f51d03cc84ffe43083878c7e`
- Byte length: `6765`
- Module format: `ecmascript_module_utf8_import_free`
- Sole entrypoint and export: `dispatchEvaluateLifecyclePreconditionsStructuralR68`
- Founder-lock identity: `4ccc949ac84ab2ab7ce357088230170a7be8348d8162e4d69ab5738c73d03b06`

The source bytes are the executable conformance bytes. There is no second generated bundle and therefore no source-to-bundle ambiguity. The R66 JSON compatibility descriptor remains a separate metadata artifact and cannot be executed.

## Dispatch boundary

The closed input carries only the server-owned structural envelope, the exact R63 intent, the R63 result schema version and the explicit fact that semantic predicate authority is `UNAVAILABLE`. The harness independently verifies the exact R66 `evaluate_lifecycle_preconditions` selection query and proof before it loads the module. That verification recomputes the query and proof fingerprints, all three locked selection-key components, canonical snapshot bytes and content reference, the R6 evaluator-registry set seal, member content identity, row version and fingerprint, and the operation-specific R63 result export.

The closed output is always one of two statuses:

- `verified_not_runnable` when the structural input and executable authority are exact;
- `hold` for malformed structural input or any failed pre-load check.

Both statuses carry `evaluator_artifact_hold`, `writes: []`, `result: null` and `evidence_rows: []`. No semantic success branch exists. R68 can never emit the R63 result or an R13 lifecycle precondition evidence row.

## Isolation and fail-closed behavior

The harness rehashes exact source bytes before loading them from a data URL in a bounded child process. It requires the exact export surface, executes three independent restarts during the checker, bounds input, output and execution time, and rejects imports, top-level effects, dynamic loading, ambient filesystem, network, environment, process, child-process, timer, clock, randomness and global escape paths in the candidate module.

Every missing, changed, truncated, substituted or self-resealed artifact, entrypoint, ABI, descriptor or R66 selection value produces the same closed no-write hold. A timeout, exception, oversized output, nondeterministic source, accessor, cycle or non-plain input also fails closed.

Static import-graph verification permits only the adjacent test to import the module. The checker and harness read its bytes. No UI module, `g24HeadlessCrossing`, Decision Engine, Edge Function entrypoint or deployment surface imports it.

## Scope boundary

R68 proves executable loading mechanics only. It does not prove evaluator semantics, typed facts or predicate authority, live registry completeness, serializable runtime selection, database writes, transactional rollback, restart integration, runtime behavior, UI behavior, deployment or external action.

The executable is a conformance artifact, not a production evaluator. Even after a structurally valid load, it returns `verified_not_runnable` with an evaluator artifact hold. Metadata compatibility never becomes execution authority.

## Durable open founder decision

The R63 evidence input is only an evidence reference and opaque human text, while the thirteen catalogue preconditions are prose identifiers. The frozen contract therefore has no deterministic rule for deciding whether the evidence proves a precondition.

The recommended next design is a server-derived closed structured trusted read-set with thirteen discriminated precondition fact variants. Each variant should bind the exact transition, precondition, typed facts, source row identities, versions, fingerprints, validity and a domain-separated bundle fingerprint. A later founder-locked evaluator can then apply explicit deterministic predicates while leaving the public R63 intent unchanged.

The alternative is separately governed signed satisfaction assertions. That is smaller inside the evaluator but transfers truth authority upstream and requires explicit issuer and verifier governance.

Opaque-text presence or natural-language interpretation as satisfaction is rejected. The choice between structured trusted read-set variants and signed satisfaction assertions remains open and is not implemented by R68.

## Rollback

Rollback is a revert of the single R68 commit. No persisted data, runtime import, route, dependency, lockfile, deployment or external system is changed. R67 remains the accepted metadata-only checkpoint.
