# G24 trusted canonical ingress R32 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R32 materialization from frozen R31: passed
- Focused R32 contract checker: passed with 44 mutation probes
- R32 machine SHA-256: `f392cd5338bf5ade8c07e1724bfbd44fda0906bd8ee6d4726a60d45e219559c0`
- Exact founder lock: passed
- Locked headless Crossing kernel: 211 of 211 tests passed
- Full documentation chain: passed
- Diff and frozen R31 immutability: passed

Mutation coverage includes final hold fingerprint restored to any held result; fixed-point and reverse dependency cycles; result identity added back to evidence; stale transaction ordering; undeclared unique-key and derivation operands; stale raw-byte field names; missing nonce verifier identity; issuer and evaluator proof, nonce-subject, family, target, operation and branch splices; receipt and read-set reference drift; R30 or R31 projection domains; projection preimage drift; historical operation, schema, local-field, result-field and artifact-field mismatch; unrelated registry or hold replay sources; ref, byte-hash and fingerprint triple drift; weakened content addressing; incomplete result manifests; same-version semantic drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
