# G24 trusted canonical ingress R24

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated contract at `g24-trusted-ingress-contract-r24.json`

**Frozen parent:** R23 at commit `6b490c0860edfa83142e28d1a8336abea07b3d2f`, tree `35b4189c6126897e8ba0fae0eba59dc135811868`, machine SHA-256 `4b191c1215fd0d7ea8a2d15ec8a42475e50ef88f0c24dcdba51c035a1da6b584`

## What R24 repairs

### History cannot resurrect authority

Every append-only authority partition is ordered across all rows, all standings and all effective times before authorization. Only the unique latest row may be considered. It authorizes only when its standing is active and it is time-valid at the same serializable transaction snapshot.

A later revoked, offboarded, expired or future row therefore holds. It can never reveal an earlier active row. Duplicate tips, ordering ties, unavailable evidence or a changed partition tip also hold without an authoritative response or write.

### Authority operations have durable identity

Each permitted authority operation has one exact R24 request, result union, authority role, proof schema, target decoder and standing transition. The durable operation registry binds target store, operation ID, idempotency key, canonical request, target and result artifacts, fingerprints and any committed receipt.

The authoritative receipt store binds the same request, target, result and proof bytes. Restart rehydrates every referenced artifact and recomputes every schema, hash, fingerprint, partition and transition equality. Exact retries replay. A changed idempotency key or request under the same store and operation ID collides and holds.

Committed and replayed results require exact receipt identities. Hold branches contain only their hold identity and cannot smuggle nullable committed fields.

### Privilege is typed and singular

Root bootstrap, current issuer and current evaluator proofs are separate closed schemas. Each binds its role, authority row, root, audience, operation and target scope, nonce, issue and expiry time, signature algorithm and pinned verifier identity.

Every operation names exactly one authority class. Root proof controls issuer and evaluator registry changes. Issuer proof controls account binding and access standing. Evaluator proof controls server-session evidence. An issuer-or-evaluator shortcut is forbidden.

### Root scope is intentionally narrow

R24 supports one immutable externally pinned root singleton and verifies one exact bootstrap ceremony proof. The root row must equal the deployment configuration root ref, version, artifact and configuration digest byte-for-byte.

Root rotation is outside R24 and outside any active adapter scope. Any rotation attempt holds without change and requires a future independently reviewed staged protocol. R24 does not pretend that a deployment pin and database row can rotate atomically.

### Restart resolves principal evidence

Live-principal assertions and presented-principal projections have closed immutable content-addressed stores. Each store binds exact canonical bytes, byte length, SHA-256, schema, writer and retention. Receipts persist the root row version, deployment configuration identity and digest, and pinned runtime-attestor snapshot alongside the existing session authority read set.

Restart resolves those stores and rows, verifies the pinned root and attestor, then reruns latest-row standing, time-validity and compare-and-swap checks. Missing, duplicate or changed evidence holds.

### One outbox origin remains authoritative

`outbox.effect_origin_schema` now directly carries `selected_result_schema_sha256`. Its R24 fingerprint, genesis equalities and restart lookup bind that digest to the committed result and result blob.

The R23 pending-origin sidecar and its fingerprint are removed and unwired. No second origin authority remains.

## Product boundary

R24 changes no visible customer experience. It adds no approval ritual, administration, technical theatre or claim of intelligence. It preserves the one canonical Brain, leader-owned semantic truth and human first and last gates by making hidden authority fail closed.

No adapter, database object, runtime connection, UI, deployment or external action is authorised by this contract.

## Blocking gate

Producer-side materialization and adversarial checks are evidence, not approval. R24 remains blocked until independent technical reviewers attack this exact frozen candidate and agree it closes the R23 roots without introducing a new contradiction.
