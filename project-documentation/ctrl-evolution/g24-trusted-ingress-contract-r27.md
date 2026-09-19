# G24 trusted canonical ingress R27

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated R27 JSON contract

**Frozen parent:** R26 commit `4f63710f16ea75b2b9240a1ae523f381e1c138ed`, machine SHA-256 `05a40077658eb1a6e6cf655e2325712fbef6b93f078e46db1cc069d665d73988`

## Exact repairs

Collision is now a deterministic no-write projection from the existing immutable registry identity and incoming canonical request identity. It cannot insert, update or overwrite a registry or hold row, consume a nonce, create a receipt or create an effect. Repeats are byte-identical and disclose only one closed code and nonsecret fingerprints.

Session operations use one closed dual-proof bundle. It binds issuer and evaluator proof refs, hashes, fingerprints, nonces and verifier subjects to the same workspace, partition, operation, target and audience while preserving distinct roles and independent nonces. Receipts and authority read sets persist both exact proof triples and bundle identity. A consuming session branch atomically writes exactly two nonce rows or neither.

One branch-effect table is the sole nonce authority. Only committed, verified stale-head and verified-proof invalid-target branches consume. Authorization, invalid proof, preverification or unknown internal failure, collision and replay never consume.

Malformed target and proof bytes use bounded opaque content-addressed stores. Target, primary proof, issuer proof and evaluator proof slots verify base64url, byte ceiling, exact length and SHA-256 without claiming parse or canonical re-encoding.

One operation-discriminated replay schema is the sole replay authority. It binds operation, original registry or hold identity, historical result and replay response ref, hash and fingerprint. It has no timestamp. Per-operation replay variants and the competing generic projection are removed.

## Product boundary

R27 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.

Producer checks are not approval. Independent technical review remains blocking.
