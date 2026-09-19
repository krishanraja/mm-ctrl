# G24 lifecycle precondition evaluator structural gate, R69

Status: local structural executable loading mechanics only

Date: 2026-09-15

R69 is a forward repair from the preserved, independently vetoed R68 artifact. It remains an immutable extension of the accepted R66 metadata-only architecture and its R67 closure receipt. It introduces a founder-lockable, import-free conformance module and a bounded child-process loader. It does not implement lifecycle precondition semantics.

R68 remains frozen at commit `06b96688bdfc9399bff3852884e5a3e934e37f95`. It is not authority because its executable did not enforce the complete inherited identifier policy, its declared input-byte ceiling was not literal, its parent-side object snapshot invoked Proxy traps, and its static source inspector was described too broadly.

No runtime, database, UI, deployment or external action is authorized or performed.

## Exact artifact

- Source and executable bytes: `supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r69.mjs`
- SHA-256 and content reference: `6d47389ea5cadcfc8e1c3da9dd8d594ed72323ad994e353b5d94e5886316bdb9`
- Git blob identity: `ac78c1410b89551a1adafcf4fbba97c9ac4dd748`
- Byte length: `7452`
- Module format: `ecmascript_module_utf8_import_free`
- Sole entrypoint and export: `dispatchEvaluateLifecyclePreconditionsStructuralR69`
- Founder-lock identity: `0461357500373c0956c7db887718256b1f3e014500194be009059a0ce1a66ca1`

The source bytes are the executable conformance bytes. There is no second generated bundle and therefore no source-to-bundle ambiguity. The R66 JSON compatibility descriptor remains a separate metadata artifact and cannot be executed.

## Dispatch boundary

The closed input carries only the server-owned structural envelope, the exact R63 intent, the R63 result schema version and the explicit fact that semantic predicate authority is `UNAVAILABLE`. The harness independently verifies the exact R66 `evaluate_lifecycle_preconditions` selection query and proof before it loads the module. That verification recomputes the query and proof fingerprints, all three locked selection-key components, canonical snapshot bytes and content reference, the R6 evaluator-registry set seal, member content identity, row version and fingerprint, and the operation-specific R63 result export.

The closed output is always one of two statuses:

- `verified_not_runnable` when the structural input and executable authority are exact;
- `hold` for malformed structural input or any failed pre-load check.

Both statuses carry `evaluator_artifact_hold`, `writes: []`, `result: null` and `evidence_rows: []`. No semantic success branch exists. R69 can never emit the R63 result or an R13 lifecycle precondition evidence row.

## Isolation and fail-closed behavior

The harness rehashes exact hard-pinned source bytes before loading them from a data URL in a bounded child process. Its language boundary accepts only primitive canonical JSON text, measures its UTF-8 bytes internally and never reflects over a caller-owned object. The serialized input ceiling is exactly 65,536 bytes; the complete child request ceiling is separately 131,072 bytes. It requires the exact export surface, executes independent restarts during the checker, and bounds output and execution time.

The executable enforces NFC identifiers, equality to the trimmed value, one through 256 actual UTF-8 bytes, valid surrogate pairing, and the inherited C0, C1, bidi, isolate, zero-width and BOM exclusions. Static source inspection is a lint defense only. It is not claimed as a sandbox or execution authority. Exact pinned source identity plus the child-process boundary is the executable authority, and a coherently self-resealed alternate machine is rejected.

Every missing, changed, truncated, substituted or self-resealed artifact, entrypoint, ABI, descriptor or R66 selection value produces the same closed no-write hold. A timeout, exception, oversized input, request or output, noncanonical input bytes, malformed identifier or alternate constructor escape also fails closed. Caller-owned accessors, cycles, prototypes and Proxies cannot cross the serialized byte boundary.

Static import-graph verification permits only the adjacent test to import the module. The checker and harness read its bytes. No UI module, `g24HeadlessCrossing`, Decision Engine, Edge Function entrypoint or deployment surface imports it.

## Scope boundary

R69 proves executable loading mechanics only. It does not prove evaluator semantics, typed facts or predicate authority, live registry completeness, serializable runtime selection, database writes, transactional rollback, restart integration, runtime behavior, UI behavior, deployment or external action.

The executable is a conformance artifact, not a production evaluator. Even after a structurally valid load, it returns `verified_not_runnable` with an evaluator artifact hold. Metadata compatibility never becomes execution authority.

## Durable open founder decision

The R63 evidence input is only an evidence reference and opaque human text, while the thirteen catalogue preconditions are prose identifiers. The frozen contract therefore has no deterministic rule for deciding whether the evidence proves a precondition.

The recommended next design is a server-derived closed structured trusted read-set with thirteen discriminated precondition fact variants. Each variant should bind the exact transition, precondition, typed facts, source row identities, versions, fingerprints, validity and a domain-separated bundle fingerprint. A later founder-locked evaluator can then apply explicit deterministic predicates while leaving the public R63 intent unchanged.

The alternative is separately governed signed satisfaction assertions. That is smaller inside the evaluator but transfers truth authority upstream and requires explicit issuer and verifier governance.

Opaque-text presence or natural-language interpretation as satisfaction is rejected. The choice between structured trusted read-set variants and signed satisfaction assertions remains open and is not implemented by R69.

## Rollback

Rollback is a revert of the single R69 commit. No persisted data, runtime import, route, dependency, lockfile, deployment or external system is changed. R68 remains preserved as rejected evidence and R67 remains the accepted metadata-only checkpoint.
