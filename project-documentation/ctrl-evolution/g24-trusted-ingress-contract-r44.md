# G24 trusted canonical ingress R44

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R44 JSON contract

## What R44 repairs

R44 removes the duplicate artifact truths left in R43. Each restart fixture now has one closed role-keyed persisted artifact store. Every named view is only a role identifier into that store. Exact branch role sets reject missing, duplicate, extra, wrong-role, wrong-schema and wrong-variant rows.

All 44 persisted artifacts declare their selected payload schema, canonical bytes, content address, payload fingerprint preimage, store-row schema and store-row fingerprint preimage. Validation recomputes both fingerprints from those declared preimages. It does not accept a value merely because it equals another field on the same wrapper.

A 104-row exact-one resolution authority traverses selected lineage references into the sole store. A 418-row correlation authority binds fixture and classifier branch, operation and idempotency, request, result, registry, hold, session evidence, proof, nonce, raw evidence, history, replay payload and envelope identities. The same complete verifier accepts the four restart fixtures and rejects every focused mutation.

## Boundary

R44 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
