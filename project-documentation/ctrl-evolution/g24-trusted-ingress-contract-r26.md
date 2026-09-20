# G24 trusted canonical ingress R26

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated contract at `g24-trusted-ingress-contract-r26.json`

**Frozen parent:** R25 at commit `d1033ec3feba099a50defa2c4f9b2db53e7f32bc`, tree `5bbc9bda2da993b1f65b58cb51f2df1be4025122`, machine SHA-256 `8def0d4f99db236425f0b69a98f2987176d3dc5e6fad46594103b87579d716f5`

## What R26 repairs

### One authority-order protocol

R26 removes the older append-only selector. Every authority store has one exact partition schema and a database uniqueness constraint across that partition plus server-owned authority order.

The partition head is absent if and only if the partition has no rows. Otherwise its order, row ref and row fingerprint must equal the unique maximum authority-order row across every standing. The transaction locks the head and partition range, compares the expected head, assigns head plus one and transaction time, then atomically appends the row, advances the head and commits the registry result and receipt.

After commit, the new row, head and selected tip must be the same authority. Duplicate, missing, rewound or nonmaximum heads hold.

### Durable rows are branch-safe originals

The authority registry is a closed union with only two durable states: original committed and original persisted hold. A committed row has non-null committed target and receipt identities. A held row has raw bounded input evidence and hold identity, but cannot carry committed target or receipt authority.

Replay is not a registry state. `replayed` and `replayed_held` are pure deterministic projections from original immutable rows and artifacts. They contain no dynamic replay timestamp, create no effect and perform no write, so concurrent exact retries are byte-identical.

Only committed outcomes can enter the receipt store. Every hold has an exact persisted schema, fingerprint, evidence rule and held-replay projection.

### Nonces belong to exact verifier subjects

Bootstrap nonces are scoped to a domain-separated verifier-set fingerprint over two distinct signer identities and two distinct key or artifact fingerprints in canonical sorted order. Root-admin, issuer and evaluator nonces are scoped to their exact verifier identities. Dual session authority has a fixed-order issuer-and-evaluator nonce subject.

The branch table consumes a nonce only after structural, signature, scope and time verification. Committed, stale-head and valid-target holds consume; malformed, unauthorized, invalid-proof, preverification-internal, collision and replay branches do not. Exact registry replay always precedes nonce lookup.

### Principal artifacts name their exact schema

Live assertion and presented projection artifact stores are separate closed R26 variants. Their `canonical_schema_ref` is a schema-level constant, not a caller-selected identifier. Each row includes parsed-content fingerprint, byte ceiling, exact length and SHA-256 verification, expected closed-schema parsing and canonical re-encoding equality.

### One writer and coherent session authority

`ctrl_authority_operation_executor` is the sole writer for authority rows, heads, registries, receipts, holds, nonce records and artifacts through closed operations. Direct DML by every other role is forbidden.

Session evidence issuance, revocation and expiry require both exact current issuer and evaluator proofs. Both must join the same active, time-valid authority snapshot and the session evidence. There is no evaluator-only label and no issuer-or-evaluator shortcut.

## Product boundary

R26 remains invisible infrastructure. It adds no customer ceremony, administration, technical theatre or claim of intelligence. It exists to keep one canonical Brain and human-owned truth intact under history, retries, revocation and failure.

No adapter, database object, runtime connection, UI, deployment or external action is authorised.

## Blocking gate

Producer checks are not approval. R26 remains blocked until independent technical reviewers attack this exact frozen candidate and agree it closes the R25 roots without introducing a new contradiction.
