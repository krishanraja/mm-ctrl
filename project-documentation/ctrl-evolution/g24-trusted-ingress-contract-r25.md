# G24 trusted canonical ingress R25

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated contract at `g24-trusted-ingress-contract-r25.json`

**Frozen parent:** R24 at commit `bcb77069cf1506ba0ad1d3a34de58567e219d5c8`, tree `0f90a1d2fb970081707b55210dff3292cfb79aff`, machine SHA-256 `559a62f56feb915f8f8d9b70acb540c4700e2e30d8dea2773a55205f4e6d7721`

## What R25 repairs

### The server owns authority order

A target intent cannot carry `valid_from`, row version, authority order or its final row fingerprint. Every authority partition has one exact head keyed by store and partition fingerprint. A fresh operation locks that head, compares the expected ref, order and fingerprint, derives transaction time and the next monotonic order, then atomically appends the new tip, advances the head and commits the registry result and receipt.

Backdated, duplicate, tied and non-tip targets cannot commit. They become persisted holds. Current selection uses the unique maximum server-owned authority order before checking active standing and time validity.

### Replay is resolved before proof freshness

The registry is checked before proof currentness or nonce consumption. An exact committed retry returns its stored replay response and receipt without revalidating an expired proof, consuming a nonce again or creating an effect. An exact held retry returns `replayed_held` under the same rule.

The operation identity is unique by target store and operation ID. Idempotency is independently unique by target store and idempotency key. A changed request or a reused idempotency key under a new operation ID becomes a persisted collision hold.

Only a genuinely fresh operation verifies proof freshness and consumes its nonce atomically with its result.

### Proofs have exact cryptographic meaning

Root bootstrap and root administration are separate proof families. Root bootstrap requires two distinct externally pinned signer identities, two signatures over the same exact preimage and a threshold of 2-of-2. Issuer and evaluator administration uses a separately pinned root-admin capability, never the bootstrap proof.

Root-admin, issuer and evaluator capabilities each bind a domain-separated signed preimage, exact field order, canonical bytes, proof fingerprint, algorithm, audience, operation and target scope, target partition fingerprint, expiry and pinned verifier source. Signature bytes and proof fingerprints are excluded from signed preimages.

A durable nonce ledger has one exact unique scope and atomic writer. Exact committed replay bypasses nonce validation. Reusing a nonce for a fresh operation holds.

### Every authority byte is restart-resolvable

Request, target intent, proof, result and replay response each have immutable content-addressed stores. Every store binds its `canonical_schema_ref` to one exact operation or result-branch schema, enforces a byte ceiling, verifies length and SHA-256, parses the exact closed schema, re-encodes to identical canonical bytes and recomputes its content fingerprint.

The existing live assertion and presented projection stores gain the same canonical and size checks. Missing, corrupt, oversized or schema-mismatched artifacts hold without response, target write or disclosure.

### Results and holds are total

Every operation has one domain-separated result fingerprint and one exhaustive first-match union: committed, committed replay, held replay, collision, authorization hold, stale head, invalid target, invalid proof and internal failure.

All fresh hold branches persist to the authority hold store. Exact retries return `replayed_held`. Hold results have no committed receipt and perform no target write. Committed and replayed results have non-null exact receipt identities.

### Dependent authority schemas are versioned

The case-control receipt, authority read set, dependent audit, principal projection, hold projection map, append-only selector and their changed fingerprint domains are explicitly R25. Same-version semantic change against frozen R24 is forbidden.

## Product boundary

R25 is invisible infrastructure. It adds no customer ceremony, administration, technical theatre or claim of intelligence. Its purpose is to preserve one canonical Brain, human semantic authority and the first and last human gates under retries, revocation and failure.

No adapter, database object, runtime connection, UI, deployment or external action is authorised.

## Blocking gate

Producer checks do not constitute approval. R25 remains blocked until independent technical reviewers attack this exact frozen candidate and agree it closes the R24 roots without introducing a new contradiction.
