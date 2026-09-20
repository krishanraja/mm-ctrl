# G24 lifecycle precondition evaluator closed caller-authority gate, R70

Status: local candidate, executable loading mechanics only

Date: 2026-09-15

R70 repairs the structural harness boundary rejected in frozen R69. It preserves R66 as the accepted metadata-only architecture, R67 as its acceptance receipt, and R68/R69 as immutable vetoed evidence. It does not implement lifecycle precondition semantics.

No runtime, database, UI, deployment or external action is authorized or performed.

## Exact artifact

- Source: `supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.mjs`
- SHA-256 and content reference: `e7b70f3816b38fa3744c1a86e627e835b770765745e370e569a350ddb1df05c9`
- Git blob: `27a9d8767d6e666bcdd184f7b511951f6bb4026e`
- Byte length: `7451`
- Sole export: `dispatchEvaluateLifecyclePreconditionsStructuralR70`
- Founder-lock identity: `8ee0ef4dd286e7f13f54f2d80d26ea341783d2dc89bb858e91b865fa2ce77fbf`
- R66 raw machine SHA-256: `b930cff4b346aad614cc0a576ab7160a7846a5f1e9f5cb27f864d286fd32a920`
- R70 raw machine SHA-256: `bc83f908bc9b4a2fee46917ab9501b6ae730c5fe419b7f3c1e2a55c59314cb80`

## Closed production-shaped boundary

The production-shaped gate has one optional positional argument: primitive canonical JSON text. Caller-owned authority objects have no slot: no R66 contract object, R70 machine object, source bytes, source path, selection record, isolate options or output schema can be supplied.

Inside one fail-closed `try`, the gate reads hard-coded local R66, R70 and source paths. It authenticates raw bytes before parsing either machine or dereferencing any field, using the exact R66 and R70 SHA-256 values. It verifies the exact raw source hash and length before loading it. The source path is a trusted constant, not machine-derived or caller-derived.

The primitive input is encoded to UTF-8 and decoded again before parsing. Any change, including replacement of a literal lone surrogate, fails closed. The serialized input limit is exactly 65,536 UTF-8 bytes; the complete child request limit is 131,072 bytes.

Every rejection returns a fresh hold envelope built only from trusted constants. Caller-owned authority objects cannot control its schema or any field. Passing caller-owned R66 or R70 Proxies as the only argument or as ignored extra arguments executes no traps.

## Dispatch and isolation

The isolated module validates the same closed structural envelope and all inherited identifier rules. A valid structural input returns `verified_not_runnable`. Malformed structural input returns `hold`. Both carry `evaluator_artifact_hold`, `writes: []`, `result: null` and `evidence_rows: []`.

No semantic success branch exists. R70 cannot emit the R63 result or an R13 evidence row.

The exact import-free source runs in a bounded child process from a data URL. Static source inspection remains lint only. It is not represented as sandbox authority. Alternate source, machine or contract bytes fail the content pins before they can become authority.

## Permanent regressions

The R70 gate retains these blocking R69 cases as permanent tests:

- literal lone high and low surrogates that change during UTF-8 encoding;
- missing hard-coded artifact paths;
- one-byte R70 machine or source mutation;
- caller-owned R66 or R70 Proxy authority objects;
- caller-controlled output-schema attempts;
- malformed, oversized and noncanonical primitive inputs;
- timeout, throw, oversized output and forbidden source capabilities;
- live or product import reachability.

## Scope boundary

R70 proves executable loading mechanics only. It does not prove evaluator semantics, typed facts, predicate authority, live registry completeness, runtime selection, database or transactional behavior, restart integration, UI, deployment or external action.

The open predicate-authority choice remains unchanged. The recommended later lane is a server-derived closed structured trusted read-set with thirteen discriminated fact variants. The alternative is separately governed signed satisfaction assertions. Neither is selected or implemented here.

## Rollback

Before freeze, rollback is removal of the R70 candidate files and restoration of the seven current-state references in the same local change. After freeze, rollback is a revert of the single R70 candidate commit. R67 remains the accepted metadata-only checkpoint.
