# G24 trusted canonical ingress R43 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R43 materialization from frozen R42: passed
- Focused R43 contract checker: passed with 33 contract mutation probes
- Owned immutable snapshot rejection probes: passed, 19 of 19
- Pre-allocation and resource-bound probes: passed, 6 of 6
- Captured-primordial pollution probes: passed, 6 of 6
- Normative schema row-reference derivation: passed for all 7 registry and hold artifacts
- Persisted content-addressed lineage: passed for all 37 artifacts
- Complete durable lineage: passed for all 44 rows
- Durable restart reconstruction: passed for all 4 branch classes
- Mechanically generated correlation graph: passed for all 201 equalities
- Exact nested semantic-reference inventory: passed for all 5,620 occurrences
- Self-sealed runtime-semantic authority manifest: passed with 210 rows
- R43 machine SHA-256: `6f0143c6ea8d0c13f795073d2c02c1328b1deb093ae3fbecce2c33d3af7627ae`

Mutation coverage includes proof-byte, issuer-nonce-fingerprint and raw-evaluator-byte splicing; coherent partial hold-branch resealing; session operation and operation-id splicing; request, result, history, registry, hold, payload and envelope mismatches; array numeric prototype setters and getters; property keys above 8,388,608 bytes; cumulative key bytes above 67,108,864; huge sparse arrays; unsupported or unstable values; imprecise semantic targets; manifest drift; visible expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
