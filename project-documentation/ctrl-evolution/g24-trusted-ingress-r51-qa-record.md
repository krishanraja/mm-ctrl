# G24 trusted canonical ingress R51 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R51 materialization from frozen R50: passed
- Focused R51 checker: passed with 16 mutation probes
- Exact field-encoded Ed25519 signatures: 2 of 2
- JSON verification of those signatures: 0 of 2, as required
- Persisted store shapes: 151
- Canonical content stores: 133
- Opaque raw-input stores: 5
- Proof-nonce persistence stores: 1
- Specialized durable row variants: 12
- Executable schema-qualified identity kinds: 461
- Stored wrapper rows traversed: 54
- Full-schema reference classifications: 782
- Executable typed equality rows: 782
- Internal exact-one rows with unavailable target: 0
- Closed internal target discriminators: 191
- Final-state semantic-reference occurrences: 14,603
- Full runtime-semantic authority manifest: 229 rows
- R51 machine SHA-256: `0c7afec2de092b4fed968c2c10d2dc3b33cb9e80fdcc52c8a1393d26aab534d8`
- Visible surface changes: none
- External actions: none

Focused mutation coverage includes JSON signature substitution, field-codec weakening, signed-preimage evidence substitution, missing opaque store or identity authority, missing proof-nonce wrapper identity, wrapper schema zero-match, wrapper artifact and parsed-fingerprint splices, restored internal `UNAVAILABLE`, missing discriminator authority, proof and nonce lineage splices, registry-history splice and post-snapshot manifest mutation.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
