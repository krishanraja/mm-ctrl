# G24 trusted canonical ingress R42 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R42 materialization from frozen R41: passed
- Focused R42 contract checker: passed with 27 contract mutation probes
- Owned immutable snapshot rejection probes: passed, 19 of 19
- Pre-allocation and resource-bound probes: passed, 4 of 4
- Captured-primordial pollution probes: passed, 5 of 5
- Normative schema row-reference derivation: passed for all 7 registry and hold artifacts
- Complete lineage artifacts: passed for all 21 stored artifacts
- Durable restart reconstruction: passed for all 4 branch classes
- Complete restart correlation authority: passed for all 8 correlation groups
- Independent semantic-reference occurrence bijection: passed for all 5,236 occurrences
- Self-sealed runtime-semantic authority manifest: passed with 210 rows
- R42 machine SHA-256: `6cbbb9a31e23e9b04ab527079b0ee1df2eb8f6c284d58c76f136acc9f0f190fe`

Mutation coverage includes changed requests retaining a stale row reference; fabricated row references; cross-row request, result, history, evidence, proof and nonce splicing; resealed registry artifacts; incomplete correlations; mutable-source check/use instability; prototype pollution after primordial capture; proxies, reflection and descriptor traps; huge and maximally bounded sparse arrays; getters, hidden and symbol properties; unsupported values and invalid Unicode; altered reference vocabulary or missing occurrence rows; hidden nested semantic references; manifest content, graph and envelope drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
