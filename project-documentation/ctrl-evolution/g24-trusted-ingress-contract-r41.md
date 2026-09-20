# G24 trusted canonical ingress R41

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R41 JSON contract

## What R41 repairs

R41 puts an owned immutable snapshot in front of every validation, canonicalization, hash and semantic use. Input traversal uses one `Reflect.ownKeys` result and one own data-property descriptor read per value. Proxies, throwing reflection, symbol or non-enumerable keys, accessors, sparse or extended arrays, cycles, non-plain prototypes, unsupported values, non-finite numbers, negative zero and invalid Unicode scalars fail before any use, write or disclosure. The accepted result is an owned recursively frozen null-prototype object or dense frozen array, so later caller mutation cannot change checked bytes.

Four restart fixtures now contain seven exact schema-valid stored registry and hold artifacts. Construction and independent validation cover constants, ordinary and typed enums, SHA-256 values, exact sentinels, identifiers, timestamps, closed keysets, required fields, branch selection, availability pairs and operation-specific target stores. Every fixture has a unique operation ID, idempotency key and registry row identity. Each registry or hold row reference is derived from one declared domain-separated preimage before canonical bytes and the final fingerprint are computed.

The semantic-reference registry is explicit and closed. It records 2,035 exact source authority paths, field paths, reference kinds, literals, unique owners and owner versions across 206 manifested authorities. It proves occurrence bijection rather than inferring authority from a suffix or regular expression. The old compound total-result pseudo-reference and replay wildcard are replaced by closed discriminator-aware bindings to actual paths.

## Boundary

R41 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
