# G24 trusted canonical ingress R32

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R32 JSON contract

## What R32 repairs

R32 makes `hold_row_ref` the sole hold identity available to any held result. The result cannot contain the final hold fingerprint. Result-independent evidence and the hold-row reference are issued first, the result follows, and only then is the final hold fingerprint computed over the result triple. A field-level dependency graph makes that ordering machine-checkable and rejects cycles.

All five opaque raw stores now derive their content address from their declared `opaque_bytes_sha256` field. The checker recursively rejects undeclared operands in every unique key and named derivation.

The issuer and evaluator nonce rows are exact, separate projections of the selected bundle truth projection, canonical proofs, request and outcome. Each row binds proof family, proof fingerprint, nonce subject, nonce, verifier identity, target store, operation ID and consumed branch. Receipt evidence, the session read set, the committed receipt and consuming hold evidence must resolve the same two content-addressed nonce rows.

The bundle truth projection schema, derivation and fingerprint authority now use one exact R32 domain and preimage. Historical response bindings are field-level and select one closed operation-and-branch result schema. Replay lookup resolves exact registry, hold, result, historical response, payload and envelope identities through content-addressed ref, byte-hash and fingerprint triples.

## Boundary

R32 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.
