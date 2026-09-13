# G24 trusted canonical ingress R28

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated R28 JSON contract

**Frozen parent:** R27 commit `41984124b10f31aeb51a55aaee1639d2b074652c`, machine SHA-256 `269d2b29d9e1b894c8c2bc5168c939fb0af92d3ce5bfe4b4de71a9d16348db0b`

## Exact repairs

The three session operation requests and their fingerprints are rebuilt together under R28. Their exact closed keys bind the workspace, operation, target, partition and one canonical dual-proof bundle. Deleted singular issuer and evaluator request fields cannot reappear through a stale fingerprint.

Dual bundles and receipt evidence now have const-bound, content-addressed stores with bounded canonical decoding and exact hash, schema and fingerprint checks. Committed receipts are discriminated between ordinary single-proof work and session dual-proof work. A session receipt preserves both proof identities, two role-specific nonce receipts and the exact authority read set. It contains no singular proof shortcut and no composite nonce family.

Held evidence is also discriminated. Ordinary work has one proof slot. Session work has separate issuer and evaluator slots plus an optional bundle slot. All eight availability combinations have exact `UNAVAILABLE` semantics and one total first-match selection.

Artifact manifests are regenerated from active request, target, proof, result and replay schemas. Forty-five deleted replay and collision result refs are gone, every remaining ref resolves, and every store const-binds its schema. Replay has one immutable source-complete payload followed by one acyclic envelope. All consumers use that envelope, no timestamp enters either identity and cross-row splicing is forbidden by exact equalities.

Collision remains a deterministic no-write response. The incoming request content address is exactly the SHA-256 of the canonical incoming request bytes, so it needs no fresh artifact ref or store write and identical retries remain byte-identical.

## Product boundary

R28 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.

Producer checks are not approval. Independent technical review remains blocking.
