# G24 trusted canonical ingress R45 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R45 materialization from frozen R44: passed
- Focused R45 contract checker: passed with 22 mutation probes
- One role-keyed artifact store: passed for all 47 artifacts
- Committed target intent and server-materialized target row: distinct and bound
- Ordinary proof nonce-consumption receipt: materialized and bound
- Final committed receipt: materialized after result identity and bound to result, proof, nonce, partition head and authority order
- Exact-one selected-lineage resolution: passed for all 78 references
- Restart correlation authority: passed for all 234 rows
- Durable restart reconstruction: passed for all 4 branch classes
- Runtime-semantic authority manifest: passed with 217 rows
- Frozen R44 core artifact immutability: passed
- Locked headless Crossing kernel: passed, 211 of 211 checks
- Founder lock and complete documentation, inventory and link chain through R45: passed
- R45 machine SHA-256: `9f682c11241242e6ab0de565f956d0d5fa57c218145317c512974d04c8771998`

Focused mutation coverage includes a coherently rehashed malicious proof-fingerprint preimage, missing or conflated committed target rows, row-version splices, missing or spliced receipt and nonce evidence, zero and multiple lineage resolutions, companion byte and fingerprint mismatches, incomplete correlations, wrapper-version substitution and receipt lineage changes.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
