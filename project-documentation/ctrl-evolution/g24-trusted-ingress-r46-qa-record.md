# G24 trusted canonical ingress R46 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R46 materialization from frozen R45: passed
- Focused R46 checker: passed with 22 mutation probes
- Exhaustive selected-schema references: 104 of 104 resolved exactly once
- Explicit selected-schema self identities: 9 of 9
- Explicit non-artifact or sentinel selected-schema references: 122 of 122
- Selected reference correlations: 312 of 312
- Durable restart fixtures: 4 of 4
- Full runtime-semantic authority manifest: 220 rows
- Exact semantic-reference occurrences: 6,407
- Target-intent projection and complete mutable-field row version: passed
- Normative bootstrap verifier-set nonce subject: passed
- Frozen R45 core artifact immutability: passed
- Locked headless Crossing kernel: passed, 211 of 211 checks
- Founder lock and complete documentation, inventory and link chain through R46: passed
- R46 machine SHA-256: `3a55d19ddfbfce31feb353620322e645f8d0f42bd287a3a87cefe6f36d0d0082`

Focused mutation coverage includes deletion of newly discovered reference rows, history-to-request splicing, omitted result-to-hold lineage, projection proof splicing, expiry and copied-field changes, unchanged row-version aliasing, signer and key-artifact substitutions, private nonce domains, minimal manifest regression, dependency and transitive-hash changes, envelope changes and semantic-reference count regression.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
