# G24 trusted canonical ingress contract R3

**State:** second local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** only the rejected R2 ingress contract at `3f94599065528c52f59135a48f5d6c93494699f9`

**Inheritance:** all R2 ownership, completeness, least-privilege, limit and claim boundaries remain unless R3 explicitly replaces them below

## Boundary

R3 makes the R2 architecture deterministic enough to implement without inventing request semantics, proof authority, transaction behavior or retry behavior. It does not expand product scope.

The operation registry covers only the currently verified headless kernel seam. It does not yet implement or claim the leader's final business call, accepted Brain learning, complete portable Release, customer messaging or the continuing relationship. Those remain separate named product and proof gates.

## Principal and request grammar

The server derives one principal from transport credentials:

- `human_session`: stable actor ref, current session-instance hash, actor class and authority version; or
- `workload_identity`: stable workload ref, credential-instance hash, capability class and capability version.

Raw credentials never enter canonical request bytes. The current credential is checked on every request and every replay that would return protected bytes, including read-only results.

The JSON request still has exactly `operation_id`, `requested_case_ref`, `operation_class` and `intent`. A streaming duplicate-key detector runs before JSON materialisation. Unknown, repeated, accessor-derived or non-JSON input holds.

Canonical identifiers are NFC-normalised strings of 1 to 256 UTF-8 bytes, equal to their trimmed value and free of C0/C1, bidirectional, isolate, zero-width and BOM format controls. Human text is a valid Unicode-scalar string whose exact value is preserved; it is not trimmed or normalised. Numbers are safe non-negative integers. Null is forbidden unless an exact field schema permits it. Optional fields are absent, never silently converted to null.

Canonical fingerprint bytes are:

`CTRL-G24-INGRESS-R3` + NUL + object kind + NUL + schema version + NUL + canonical JSON UTF-8 bytes.

Canonical JSON recursively sorts object keys by Unicode scalar value, preserves array order, uses minimal JSON escaping, rejects duplicate keys, negative zero, non-finite numbers, holes, extra properties, unsupported prototypes and invalid Unicode, and has no insignificant whitespace. A canonicalisation failure returns the per-operation invalid-command hold and the reserved fingerprint sentinel `__g24_ingress_invalid__`, which is never accepted as an identity.

## Exact intent and result unions

The complete field types, schema versions, enums, optional fields, array ceilings and cross-field rules live in the R3 machine overlay. The authoritative answer kinds exactly match the verified kernel: `option`, `ranking`, `write_in`, `voice`, `unknown`, `defer`, `refuse` and `premise_wrong`.

`answer_value` is discriminated by answer kind:

- `option`: one canonical option ref;
- `ranking`: one to five unique canonical option refs in complete order;
- `write_in` or `voice`: exact human text within the answer byte limit;
- `unknown`, `defer`, `refuse` or `premise_wrong`: absent value.

Only the named leader can issue `correct_answer`, which may change their attributed semantic answer. `record_answer_transcription_repair` is a separate operator operation. It creates a subject-review proposal and cannot mutate the answer, case effect or Brain until the named leader accepts it through a later exact leader action.

Every successful response carries the canonical kernel result twice in controlled form: `result_payload_b64url` is the base64url encoding of the exact canonical result bytes returned to the authorised caller, and `encrypted_result_bytes_ref` is the immutable private storage reference. The result schema version must be an exported schema in the attested evaluator ABI; an implementer cannot invent or reinterpret its shape.

Every result is one of three exact envelopes:

- `committed`: operation identity, operation class, canonical immutable result ref, result schema version, exact base64url result bytes, exact encrypted result-byte ref, result fingerprint, byte length, snapshot fingerprint and evaluated time;
- `replayed`: the same exact result schema, payload bytes, immutable references and fingerprints plus the original committed operation ref; or
- `held`: operation identity, operation class, one closed hold code, evaluated time and no result, receipt, snapshot payload, outbox or mutation.

## Durable operation replay

The operation registry stores an immutable encrypted canonical result-byte object or an immutable canonical result record ref, plus its fingerprint, byte length, schema version, audience, retention class and creation time. A fingerprint alone is insufficient.

Operation identity binds the stable principal ref, derived workspace and subject, case, class and intent fingerprint. It records the first credential-instance hash for audit, but credential rotation by the same currently authorised principal is not an identity conflict. A different stable principal, case, class or intent is a conflict.

Before any replay, the server revalidates the current human session or workload credential, current actor capability, case membership, audience and retention eligibility. If access has changed, it returns `replay_access_hold` and no protected bytes. Exact authorised replay decrypts and returns the original canonical result bytes; it does not rerun the operation.

## One exact sealed read and compare-and-swap set

Every set seal uses exactly:

- set kind;
- set schema version;
- owning lineage version;
- canonical member count;
- domain-separated SHA-256 digest of the sorted unique canonical member fingerprints; and
- invalid sentinel status.

Duplicate members, duplicate identities with different bytes, count mismatch, invalid member fingerprint or unsupported encoding invalidates the seal.

The full snapshot and final compare-and-swap use the same ten set seals: control universe, applicable controls, control closure edges, visible sources, visible assertions, accepted Brain items, accepted Brain relationships, route capability registry, receipt chain tips and evaluator registry. They also bind case-scope version, engagement version and plan version where applicable. No aggregate `evidence_seal` or `brain_seal` alias exists.

The snapshot fingerprint uses the R3 canonical byte grammar and domain `g24:trusted-snapshot:r3`. Each set seal uses domain `g24:set-seal:r3:<set-kind>`. Operation intent, result and registry identity have distinct domains. The exact list in the machine overlay is shared by fingerprinting and compare-and-swap checks.

The evaluator is canonical state rather than a rolling worker assumption. Its registry member binds evaluator ID, semantic version, artifact SHA-256, ABI version, policy lineage and activation interval. The worker presents a build-time artifact attestation whose ID, version, hash and ABI exactly match the current registry member before evaluation. Missing, stale, rolling-version or unverifiable evaluator code returns `evaluator_artifact_hold`. The evaluator registry seal is included in both snapshot fingerprinting and final compare-and-swap.

## Transaction-local proof execution

The local implementation must first refactor the verified kernel's mutable WeakMaps and collision or terminal Maps into a transaction-local `G24ProofRegistry` owned by one ingress execution context. Default public kernel calls may retain a private process context for existing local tests, but trusted ingress may never use it.

The server-only constructor is conceptually:

`createG24IngressExecutionContext(resolverCapability, canonicalBundle) -> context | hold`

`resolverCapability` is an unforgeable closure value created only by the successful authoritative resolver. It is not serialisable, exportable, accepted from a caller or available in the browser build.

The canonical bundle has exact common fields: bundle schema version, owner family, workspace, subject, case, snapshot fingerprint, canonical record bytes and fingerprint, predecessor chain bytes and tip, current set seals, append-provenance ref and evaluated time. Per-family schemas add only the exact fields required by selector, approval, answer, correction, lifecycle, Release, plan or execution receipt validation.

The context exposes only per-family `rehydrate` methods, pure kernel operations, `registerTerminalPlanState` and `finalizeResultBytes`. It never exposes its registries or capability. Rehydration returns `issued` with a transaction-local proof or one closed hold code.

All kernel calculation mutates only draft registries owned by the database transaction. Database append and uniqueness checks occur before any result is externally observable. On rollback, serialization failure, timeout or cancellation, the entire draft context is discarded. Nothing is published to a process-global registry. After commit, the response is read from the immutable committed result record. A retry reconstructs a fresh context from canonical database state.

Terminal plan state and the exact receipt-chain tip are loaded and registered before any plan call. Database uniqueness and compare-and-swap, not a process-global Map, decide attempt and terminal winners.

## Outbox claim and crash state machine

The outbox states are `pending`, `claimed`, `confirmed`, `failed` and `unknown`.

One worker atomically claims a pending item by compare-and-swap, setting a worker ref, lease expiry, attempt ordinal and monotonically increasing fencing token. Only the holder of the current fencing token may append a terminal provider result. A second worker cannot claim an unexpired lease or confirm an older claim.

Immediately before the provider call, the worker rechecks current authority and payload fingerprint. With a provider that guarantees idempotency, an expired claim may be reclaimed and retried only with the identical provider key and bytes. Without that guarantee, an expired `claimed` item becomes `unknown` and is never automatically sent again. This covers a worker crash after provider success but before confirmation. Reconciliation may later append `confirmed` or `failed`; it cannot create a second send.

No external call is authorised in this phase.

## Exact limit encoding

All byte limits count the R3 canonical UTF-8 representation after duplicate-key detection and before expensive graph or history traversal. Human text limits count exact UTF-8 bytes of the preserved string. Row and collection limits count unique canonical members after bounded identity admission, while raw presented collection length is preflighted first.

The machine overlay maps every R2 numeric limit to one closed hold code. Limit evaluation order is request bytes, intent bytes, per-field bytes, raw collection lengths, canonical set counts, snapshot bytes, evaluator time, statement time, transaction time and serialization retries. The first failed limit wins deterministically.

## R3 proof additions

In addition to every R1 and R2 attack, local implementation must prove:

1. all exact property types, enums, answer discriminators, optional absence and result envelopes;
2. duplicate JSON keys and canonicalisation edge cases fail before operation registration;
3. a rotated valid session for the same actor may replay, while expired, revoked, wrong-actor, wrong-audience and workload/human substitution cannot;
4. exact result bytes survive commit-response loss and restart without rerunning the operation;
5. every one of the ten set seals is in both snapshot fingerprinting and compare-and-swap, and each mutation holds;
6. set-seal duplicate, collision, order, sentinel and domain-crossing attacks fail;
7. transaction abort after every kernel mutation point leaves no proof, collision identity or terminal state in a later context;
8. a fresh context rehydrates every family only from a valid resolver closure and rejects copied capability or canonical bytes;
9. two outbox workers cannot both hold a live lease or confirm with different fencing tokens;
10. provider-success crash becomes safe same-key retry only with a provider guarantee and otherwise becomes `unknown` without resend;
11. operator transcription repair cannot change the leader's answer or Brain; and
12. each limit produces its exact machine hold code in deterministic order; and
13. missing, stale, rolling-version or unverifiable evaluator artifacts hold before kernel execution.

## Claim boundary

R3 is still an unimplemented local architecture candidate. It does not prove real Postgres or Supabase transactions, private-module isolation, cryptographic key handling, production concurrency, provider behavior, decision intelligence, comprehension, delight or value. No external or runtime action opens until exact independent review clears this contract and a separate bounded implementation contract is recorded.
