# G24 trusted canonical ingress R29

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated R29 JSON contract

**Frozen parent:** R28 commit `e3fcddbd7f4bc61c91122211831c0daf7d5ebc92`, machine SHA-256 `6c0f8c998506bf8df1a43c6b3b669e355513d346050b2fc1fef4d5482c4e3f69`

## Exact repairs

The session dual-proof bundle is now a server projection of resolved canonical issuer and evaluator proof artifacts and the selected authority and verifier subjects. Every repeated ref, hash, fingerprint, nonce, nonce subject, verifier identity, scope and audience has one field-by-field equality. The bundle fingerprint is computed only after those resolved values are canonicalized. A caller-provided duplicate can only match or hold.

Every nonce row now has one canonical content-addressed receipt ref, fingerprint and unique restart lookup. The complete authority read set has its own const-bound content-addressed artifact store. Session receipt evidence and the committed session receipt resolve both role-specific nonce receipts, the exact read-set artifact and the bundle truth projection.

One serializable branch transaction encloses proof validation, one or two nonce inserts, all evidence artifacts, the target and partition head when committed, the original registry row, result, exactly one committed receipt or hold row, and pre-materialized replay artifacts. Every listed effect commits or none does. A crash cannot leave a consumed nonce without the corresponding durable outcome.

Malformed bundle bytes now have their own bounded opaque family. Target, ordinary proof, bundle, issuer proof and evaluator proof slots each resolve only their exact family. The eight session availability combinations name those families and preserve explicit `UNAVAILABLE` values without permitting a role splice.

Registry and hold rows now carry canonical content-addressed source refs bound by their fingerprints. Replay payload and envelope artifacts, plus their unique source lookup, are pre-materialized inside the original transaction. First and concurrent replay only resolve and verify existing bytes, write nothing and add no dynamic time.

## Product boundary

R29 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.

Producer checks are not approval. Independent technical review remains blocking.
