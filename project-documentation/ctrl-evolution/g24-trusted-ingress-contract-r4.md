# G24 trusted canonical ingress contract R4

**State:** third local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** the rejected R3 ingress contract at `6e965e8a4b2011e881f737b0860e3d471fe0d4d5`

**Inheritance:** R1 through R3 remain immutable failure evidence. R4 preserves their sound ownership and scope boundaries but replaces every request admission, authority, result, proof, seal, registry, outbox and limit clause with the exact R4 machine contract.

## Boundary

R4 still covers only the verified local headless kernel seam. It does not implement or claim the leader's final business call, accepted Brain learning, a complete portable Release, customer messaging, the continuing relationship, decision-quality advantage, comprehension, delight or value. No UI, adapter, database object, model call, customer data, external send, deployment, merge or release is authorised.

## Two-stage request admission

Raw input first passes streaming transport and parser limits, duplicate-key detection, authentication and the closed request grammar. Failure before a valid operation ID, case ref, class and exact intent exist returns `request_rejected`. That envelope contains only a server-generated correlation ID, a closed rejection code and server time. It never fabricates, echoes or persists invalid request identity and creates no operation-registry row.

Only a completely valid request becomes `admitted_pending` inside one serializable database transaction. Every post-admission hold is durably committed as `committed_hold`; retrying the same operation ID returns the exact stored hold without reevaluation. A caller that wants a new evaluation after state changes uses a new operation ID. Transaction abort before commit leaves no durable row or proof state, so the same exact request may be evaluated again.

The response union is exactly `request_rejected`, `committed`, `held`, `replayed_committed` or `replayed_held`. Successful replay returns the exact original canonical payload bytes. Held replay returns the exact original hold code and time. Every replay first rechecks current authentication, actor or workload authority, case membership, audience and retention eligibility.

## Closed authority

Human principals are typed as `krish_operator`, `authorized_operator` or `named_leader`. Workload principals are typed as `selector_executor`, `intervention_compiler`, `release_compiler`, `enrichment_planner`, `enrichment_worker`, `delivery_worker`, `outbox_lease_reaper` or `provider_reconciler`. Every property type and enum is closed in the machine contract.

An actor label alone never grants authority. The authenticated stable actor must equal the current case's named leader or be present in its current operator grant, as required by the operation. Workload identity must equal a current case capability grant for the exact operation. `correct_answer` remains named-leader only. Operator transcription repair remains a proposal that cannot change an answer, case effect or Brain.

Lifecycle authority follows the exact thirteen frozen edges. Krish-only edges require the current engagement operator. Leader-and-Krish edges require a current, unconsumed, exact two-party authority receipt naming both stable actors, the transition, predecessor lifecycle version and case. Leader-or-Krish edges require the current named leader or current engagement operator. No placeholder lifecycle actor exists.

## Approval is four different consequences

The approval decision is a discriminated state transition:

- `approve` appends an approval receipt bound to the exact current immutable intervention atom;
- `edit` creates one new immutable atom version from the referenced edited content and appends an approval receipt bound only to that new version;
- `hold` appends a nonapproval held receipt and creates no delivery eligibility; and
- `suppress` appends a nonapproval suppressed receipt, creates no delivery eligibility and prevents that atom version from being selected again.

Each branch has a closed write set and result payload. A held or suppressed intervention can never masquerade as approved.

## Concrete evaluator ABI, results and proofs

Every operation has one exact R4 result-payload schema. Every proof family has a closed common bundle and closed typed extension schema. The machine contract maps each operation to one exported result schema and each owner family to one exported proof schema. These exports are part of the evaluator manifest digest.

For an operation and evaluation time, the evaluator registry must resolve exactly one active member under a non-overlapping half-open activation interval. The member binds evaluator ID, semantic version, artifact SHA-256, ABI version, policy lineage, manifest SHA-256 and the exact operation and proof export map. The worker computes hashes from its immutable loaded evaluator and manifest bytes; it cannot merely declare them. Zero matches, multiple matches, mismatch or unsupported export returns `evaluator_artifact_hold` before kernel execution.

## Exact set-seal bytes and compare-and-swap

R4 uses eleven seals: control universe, applicable controls, control closure edges, visible sources, visible assertions, accepted Brain items, accepted Brain relationships, route capability registry, receipt chain tips, evaluator registry and provider capability registry.

The digest preimage is byte-framed, not concatenated prose. It starts with the ASCII domain `CTRL-G24-SET-SEAL-R4`, then length-prefixed UTF-8 bytes for set kind, set schema version and owner lineage version, then an unsigned 64-bit big-endian member count, then exactly that many sorted unique raw 32-byte SHA-256 member fingerprints. Every variable field uses an unsigned 32-bit big-endian byte length. Invalid, duplicate, mismatched or unsupported members hold and produce no seal.

Every operation snapshots and final compare-and-swaps the same eleven set seals and three scalar versions. Case-scope and engagement versions always name current canonical versions. Plan version names the current plan only for `record_enrichment_attempt`; every other operation uses the literal canonical sentinel `not_applicable`. There is no aggregate alias and no operation-specific omission.

## Single-use resolver capability and transaction-local proof state

The authoritative resolver creates a closure that internally contains the exact canonical bundle. The constructor accepts only that closure, not a separately supplied bundle. The closure is bound to one transaction attempt ID, live database-connection nonce hash, stable principal ref, case, snapshot fingerprint, canonical bundle digest and owner family. It can be consumed once, by the matching family rehydrator, before its deadline. Commit, rollback, timeout, cancellation, connection loss or first use invalidates it.

All kernel proof, collision and terminal registries are transaction-local drafts. No result or proof-bearing object is externally observable before database commit. Abort discards the entire context. The response is then read from the immutable committed result row; a retry creates a fresh context from current canonical database state.

## Complete outbox state machine

The provider capability registry is canonical, sealed state. Its member states whether the exact provider operation supports idempotency, names the provider key grammar and binds the verification source and activation interval. A worker may use that guarantee only when exactly one current member matches the effect.

One worker atomically claims an outbox item with a lease and fencing token. Before a provider call it rechecks authority, exact payload bytes and the provider capability. Authority failure or payload change appends a fenced `failed` result without calling the provider. A provider success is confirmed only by the current fencing token. An immediate ambiguous provider outcome or an ambiguous crash permits at most three same-key attempts only under a current provider guarantee; otherwise the item becomes `unknown` and is never automatically resent.

Only a current `provider_reconciler` workload may resolve `unknown`, using an immutable provider-evidence record whose provider, operation, effect, key, payload fingerprint, observed outcome, observation time and evidence fingerprint match the outbox item. Reconciliation can append `confirmed` or `failed`; it can never send.

## Bounded before parse

V1 accepts only identity content encoding. The server enforces raw transport bytes while streaming, then token count, nesting depth, property count, string code-unit and escape count before materialisation. Duplicate keys are rejected in the same bounded stream. Canonical request, intent, field, collection, snapshot, evaluator, statement, transaction and retry limits run only afterward.

The machine contract defines one total ordered list containing every individual limit and an exact hold or rejection code for each. The first failure wins. Pre-admission failures create no registry row; post-admission limits commit one durable held result.

## R4 proof additions

Local implementation must prove at least:

1. malformed, missing, duplicate and unknown request identities return only `request_rejected` without a registry row;
2. committed success and hold responses survive response loss and restart, and replay never reevaluates;
3. each approval branch has its exact write set and only approve or exact edited-version approval confers standing;
4. every human and workload operation passes only under its exact principal, case equality and current grant predicate;
5. all thirteen lifecycle transitions enforce their exact one-party or two-party rule;
6. every operation result and every proof family rejects missing, extra, mistyped and wrong-schema fields;
7. zero, multiple, stale, mismatched and falsely declared evaluator artifacts hold before kernel execution;
8. length-framed seal ambiguity, duplicate members, reordering, wrong domains and all eleven single-set mutations hold;
9. every operation uses the same eleven seals and exact scalar sentinels in both snapshot and compare-and-swap;
10. cross-transaction, cross-connection, cross-principal, cross-case, cross-snapshot, cross-bundle, cross-family, expired and reused resolver capabilities fail;
11. rollback after every kernel mutation leaves no proof, collision or terminal state;
12. authority revocation and payload drift prevent provider calls and append exact fenced failure;
13. competing outbox workers, stale fences, expired leases, ambiguous provider success and reconciliation mismatch cannot double-send or fabricate confirmation; and
14. every raw and canonical limit fails at its exact ordered boundary without proportional unbounded work.

## Claim boundary

R4 is an unimplemented local architecture candidate. Passing its checker will not prove production Postgres or Supabase behavior, private module isolation, cryptographic deployment trust, provider behavior, intelligence, usability or value. Exact independent review remains blocking before a separately bounded local adapter and adversarial fixture build may open.
