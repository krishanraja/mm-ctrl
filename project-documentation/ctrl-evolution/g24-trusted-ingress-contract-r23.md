# G24 trusted canonical ingress contract R23

**State:** twenty-second local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** the rejected R22 candidate at `68f4795c587554560d82ada219f3f50a8fedcc6c`

## Purpose

R23 closes the eight trust-boundary failures found in the independent R22 attacks. The generated JSON is the complete effective contract derived byte for byte from frozen R22.

## Root trust comes from outside the ledger

The case-session root is one append-only authoritative singleton partition whose identity and artifact digest must match immutable deployment trust configuration. The row cannot authenticate itself. Deterministic current selection admits exactly one active row matching that pinned configuration or holds.

Bootstrap requires a two-person offline ceremony proof. Rotation supplies an exact expected prior version and fingerprint, is idempotent and compare-and-swap protected, and atomically appends the replacement while making the prior anchor non-current. One offline ceremony writer owns the store; all runtime direct DML is forbidden.

## Authority changes are real operations

Bootstrap, rotation, issue, revoke, restore, expire and offboard each have a distinct closed request, discriminated result union, receipt schema, fingerprint domains, replay rule, collision rule and atomic postcondition. Requests carry an operation identifier, idempotency key, exact target bytes and fingerprint, expected prior identity and authenticated root or delegated capability. Commit time is server-owned.

Issuer, evaluator, account binding, account standing and session evidence rows all have explicit versioned standing fields and exact transition tables. Revocation, expiry and offboarding append a new standing and make the prior active row non-current. Restore is semantically and byte-wise distinct from revoke.

## Live authentication is independent evidence

The server authentication boundary emits one closed live-principal assertion under a deployment-pinned runtime attestor. It is not derived from durable session evidence. Signature verification happens before durable lookup. Session reference and instance hash, workspace, account, actor, class, authority version, issue time and expiry then join byte-for-byte to the selected durable session evidence and presented principal projection.

Any circular derivation, caller field, invalid attestation or cross-workspace mismatch holds without registry disclosure or write.

## Receipts survive restart

The authority read set persists every composite scope needed to rehydrate root, account, session, session-instance and case lookups. It also persists content-addressed live-assertion and presented-projection bytes and hashes. These scope and artifact fields are included in the read-set fingerprint.

Restart resolves every exact key and immutable artifact, verifies hashes and attestation joins, and rechecks standing and compare-and-swap state. Missing, duplicate, changed or corrupt evidence returns no authoritative response or write.

## Every hold byte has one codec

Identifier and SHA-256 codecs are closed, versioned and resolvable. Identifiers encode validated UTF-8 identifier bytes. SHA-256 values decode exactly sixty-four lowercase hexadecimal characters into thirty-two raw bytes before base64url encoding. Text, identifier and raw-digest substitutions are rejected.

Every hold dependency resolves its source schema and its codec through the contract.

## Schema digests are order-independent

One canonical schema serialization sorts object keys by Unicode code point, preserves array order, defines JSON string, number and literal rules, emits no whitespace and rejects unsupported values. Union and branch digests are recomputed from those bytes, so object insertion order cannot change identity.

The selected result-schema digest participates in the universal result fingerprint and persists through result blob, committed success, response, replay, Release terminal consumption and the pending-outbox origin fingerprint and restart checks. Same-version semantic drift therefore fails closed.

## Visible experience and boundary

R23 adds no interface copy, approval, customer state or administration. Root ceremonies, authority protocols, attestations, codecs, read sets and digests remain backstage.

R23 authorises no adapter, database change, runtime connection, customer data, model or provider call, UI change, deployment, merge, release or external action. It does not prove intelligence, comprehension, decision quality, delight or customer value. Independent technical review remains blocking.
