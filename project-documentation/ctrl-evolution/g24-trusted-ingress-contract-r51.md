# G24 trusted canonical ingress R51

**Status:** fully materialized local architecture repair; independent attack remains blocking

**Authority:** the exact generated R51 JSON contract

## What R51 repairs

R51 removes ambiguity from proof signatures. The materializer and checker independently encode every signed field using the contract's exact byte rules: declared field order, big-endian lengths, UTF-8 strings, raw 32-byte SHA-256 values, unsigned integers and exact scalar encodings. The two signed preimages are persisted with their byte length and SHA-256. Both Ed25519 signatures pass over those bytes and fail over canonical JSON.

The persisted-store inventory is now an explicit union. It includes 133 canonical content stores, five opaque raw-input stores, proof-nonce persistence and twelve specialized durable row variants. Their 461 identity kinds share one indexed formula authority. Stored wrapper rows are traversed and verified alongside payloads. A wrapper's `canonical_schema_ref` is a semantic schema reference, not an artifact lookup.

R51 also removes every internal exact-one equality whose target was `UNAVAILABLE`. Exact targets remain exact. Ambiguous operation-dependent targets use one closed discriminator keyed by source schema, operation, result branch and target store. Opaque raw rows and proof-nonce persistence are included in the full schema classification and equality universe.

## Boundary

R51 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
