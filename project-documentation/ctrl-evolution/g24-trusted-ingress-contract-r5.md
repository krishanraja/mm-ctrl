# G24 trusted canonical ingress contract R5

**State:** fourth local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** the rejected R4 ingress contract at `5e4ec8f6309a68542cd18b74e709d3490ec02b58`

**Inheritance:** R1 through R4 remain immutable failure evidence. R5 preserves every R4 clause except the seven sections explicitly replaced by the R5 machine overlay. When an R5 replacement conflicts with R4, R5 governs. No unlisted R4 field may be reinterpreted.

## Boundary

This is still a backstage contract for the verified local headless-kernel seam. It does not implement or prove the leader's final call, accepted Brain learning, portable export, customer messaging, continuing relationship, intelligence, comprehension, delight or value. It authorises no UI, adapter, database object, model call, customer data, external send, deployment, merge or release.

## Release use has two exact outcomes

`use_release` returns one of two closed variants. `pending_delivery` binds the current Release-use receipt and one outbox effect. `invalidated_before_use` is the required safe result when any controlling watermark bound into the pending projection differs at use time. That branch atomically appends one invalidation receipt naming the exact changed watermarks, creates no Release-use receipt, creates no outbox effect and confers no delivery eligibility. It is selected before a generic snapshot-change hold. A concurrent controlling-watermark change causes the serializable attempt to retry, then choose invalidation against current state.

The invalidation receipt contains the projection reference and version, its original watermark-set fingerprint, the current watermark-set fingerprint, the changed watermark kinds in canonical order, invalidation time and receipt fingerprint. Unrelated lineage changes are not controlling changes. Rebuilding a projection does not itself confer use or delivery authority.

## One complete snapshot and compare-and-swap

Every admitted operation captures thirteen set seals: the R4 eleven plus the current operator-grant and workload-grant sets. A change to either grant set advances the case-scope version in the same authority mutation, but that scalar rule never permits either seal to be omitted.

The snapshot fingerprint has one exact byte preimage. It starts with ASCII `CTRL-G24-TRUSTED-SNAPSHOT-R5`, followed by length-framed UTF-8 operation ID and operation class, raw 32-byte request and intent fingerprints, then length-framed stable principal reference and principal authority version. It then carries the thirteen seal objects in the fixed machine-contract order, each encoded as length-framed set kind, schema version and owner-lineage version, unsigned 64-bit member count and raw 32-byte digest. It ends with length-framed case-scope, engagement and plan versions. Every variable field uses an unsigned 32-bit big-endian byte length. Hash values decode from canonical lowercase hexadecimal to exactly 32 raw bytes. SHA-256 over that complete preimage is the snapshot fingerprint.

Final compare-and-swap recomputes the same preimage under the same transaction and requires byte equality. Any set or scalar change returns `snapshot_changed_hold`; no aggregate alias, missing field or operation-specific omission is legal.

## Set-member identity is executable

Each of the thirteen set kinds has one frozen identity projection. The projection is encoded with ASCII domain `CTRL-G24-SET-MEMBER-IDENTITY-R5`, then length-framed set kind and the projection's ordered UTF-8 field values. A member entry contains the resulting identity bytes followed by the raw 32-byte fingerprint of the member's complete canonical record.

Member entries sort by unsigned bytewise identity, then record fingerprint. Repeating an identity is invalid even if the record bytes match. Repeating an identity with different record bytes is also invalid. Missing, extra, null, non-canonical or unsupported projection fields are invalid. This makes duplicate-identity rejection implementable rather than descriptive.

## Operation identity and deterministic exhaustion

The operation registry has exactly one unique key: `(workspace_ref, operation_id)`. The first admitted request binds the stable principal, case-derived subject, requested case, operation class, request fingerprint and intent fingerprint. Reuse of that key with any different binding is `operation_identity_conflict_hold`. Credential rotation is not part of identity; current disclosure authority is still required for replay.

Serializable retry exhaustion has one outcome only: pre-commit `request_rejected` with `service_temporarily_unavailable`. It creates no operation row and no committed hold. The caller may retry the same operation ID. There is no `serialization_retry_hold` in R5.

A committed hold fingerprint never depends on an undefined set of available data. It covers the operation identity, hold code, all thirteen dependency slots and all three scalar slots in fixed order. Each dependency slot is exactly one valid digest or one domain-separated invalid-or-unavailable sentinel for that set kind. This makes the same admitted state produce one historical hold identity.

## Proof bytes, lineage and semantic equality

Every proof family has an explicit genesis tip and append rule. The genesis is SHA-256 over ASCII `CTRL-G24-PROOF-GENESIS-R5` plus the length-framed owner family. Each append tip is SHA-256 over ASCII `CTRL-G24-PROOF-CHAIN-R5`, the length-framed owner family, raw predecessor tip, raw canonical-record fingerprint and unsigned 64-bit append ordinal.

The resolver's bundle digest is SHA-256 over ASCII `CTRL-G24-PROOF-BUNDLE-R5`, length-framed owner family, raw SHA-256 of the canonical common-object bytes and raw SHA-256 of the canonical extension-object bytes. Canonical object bytes use the inherited R3 canonical JSON grammar.

Every base64url field is decoded before use. Each decoded value is a closed record envelope with its own kind, owner family, workspace, subject, case, snapshot, chain tip, authoritative-row fingerprint and evaluator-exported closed payload. Its bytes must parse, recanonicalise byte-for-byte and match the exact authoritative row and payload projection named in the per-family field map. The common and extension objects must agree with each other. A caller cannot make internally valid but semantically unrelated proof bytes authoritative.

## Fresh execution and historical replay are different authorities

Fresh execution checks current authentication, exact operation authority, case equality, all current grants and, for two-party lifecycle edges, one current unconsumed joint receipt. Replay never reruns those one-time execution predicates. Replay checks only current disclosure authority: current authentication, stable principal eligibility for the case and audience, and retention eligibility. It returns immutable historical bytes with `current_standing: false` and mutates nothing.

Each leader and operator lifecycle action is separately authenticated and append-only. An action binds the case, transition, predecessor lifecycle version, stable actor, actor class, authority version, nonce, issue time, expiry and fingerprint. A newly closed `lifecycle_authority_recorder` workload class may only combine exactly one current leader action with one current operator action when every case, transition and predecessor binding matches. Leader action, operator action and combination are separate serializable issuance steps; the server resolves actor, authority and time, and a failed step writes nothing. The joint receipt additionally binds both action references and fingerprints, the current authority versions, recorder identity, issue time, expiry, optional consumption time and its own fingerprint. The recorder cannot invent human authority or execute the transition. Consumption occurs atomically with the lifecycle transition.

For edited approval, the system first appends the new immutable intervention atom. A new visibility receipt and approval receipt must each bind that exact post-edit atom reference, version and content fingerprint. An older visibility receipt cannot be reused.

## Limits have one phase and one result

All raw transport and request-owned content limits, including canonical request bytes, intent bytes, answer text bytes and note bytes, are pre-admission. They return their exact `request_rejected` code and create no registry row. The inherited R3 `max_*` annotations are constraints consumed only by this R5 admission-limit engine, not a second validator with a different result.

State, resolver, evaluator, statement and transaction limits occur after admission and therefore commit one exact hold. Serializable retry exhaustion remains the sole pre-commit service-unavailable rejection described above. The total order in the machine overlay selects the first failure.

## Every provider call consumes a durable attempt

Before each provider call, a worker atomically appends a fenced attempt reservation. The reservation binds the outbox effect, positive attempt ordinal, current fencing token, worker, provider, provider operation, provider key, payload fingerprint, reservation time, state and optional outcome. `(outbox_effect_ref, attempt_ordinal)` is unique. The reservation and increment commit before the network call. A crash after reservation but before or during the call still consumes that attempt; no lease or worker change can reset the count.

The provider may be called only after the worker rereads the committed reservation, confirms the current fence and lease and repeats the R4 authority, payload and capability checks. Every retry requires the next committed reservation. At three reservations no further provider call is legal. Ambiguous outcomes without a current idempotency guarantee become `unknown` immediately. Ambiguous outcomes with a guarantee may reserve the next attempt only while fewer than three reservations exist; otherwise they become `unknown`.

Success requires immutable provider evidence binding the effect, attempt, fence, worker, provider and operation, key, payload fingerprint, provider response identifier, observed success time, receipt bytes fingerprint and evidence fingerprint. Only that exact evidence allows `confirmed`.

## R5 proof additions

Local implementation must prove at least:

1. changed controlling Release watermarks append exactly one invalidation receipt and create no use receipt or outbox;
2. all operations snapshot and compare-and-swap thirteen seals and three scalar versions through one exact byte fingerprint;
3. every set kind detects duplicate identities through its frozen field projection;
4. registry identity is unique per workspace and operation ID, and serializable exhaustion has only the non-durable service-unavailable result;
5. every committed hold hashes all dependency slots, including explicit per-kind sentinels;
6. proof genesis, predecessor, append ordinal, bundle framing, decoded fingerprints and authoritative semantic bindings reject substitution;
7. response-loss replay succeeds after a consumed lifecycle receipt only when current disclosure authority remains, and never repeats execution;
8. two-party action and joint receipts reject missing fields, mismatched actors, stale versions, expiry, fabricated recorder authority and reuse;
9. edited approval requires newly bound visibility and approval receipts for the final atom;
10. each request-owned size boundary has exactly one pre-admission rejection, while state and execution limits have exactly one committed hold;
11. every attempted provider call has a prior durable fenced reservation and crashes cannot exceed three attempts; and
12. provider confirmation rejects missing, mistyped or mismatched success evidence.

## Claim boundary

R5 is an unimplemented local architecture candidate. Passing its checker does not prove production Postgres or Supabase behavior, row-level security, deployment trust, provider behavior, intelligence, usability or value. Exact independent review remains blocking before any adapter or adversarial-fixture implementation can open.
