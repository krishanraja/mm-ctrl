# G24 trusted canonical ingress R38

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R38 JSON contract

## What R38 repairs

R38 replaces the five-row R37 authority list with an independently pinned manifest of all 194 top-level runtime-semantic authorities. Each manifest row fixes the exact path, semantic kind, keyset, version, canonical content hash, direct dependencies and full transitive dependency closure. A domain-separated Unicode-code-point-sorted canonical JSON UTF-8 codec prevents insertion order from becoming authority. Any changed, added, removed, nested or co-mutated semantic control changes a checker-pinned hash.

Replay registry authority and replay resolution bindings are versioned together at R38. The committed registry, held registry, hold row and replay classifier must agree byte-for-byte on the selected row identity, proof family, branch class, evidence kind and selector version. The branch map, registry authority, binding authority and replay derivation carry identical source precedence and anti-splice semantics. Callers cannot select either authority reference.

Proof, operation, outbox, transaction, branch write-set and all four issuance-DAG controls are exact manifested authorities. Caller-supplied proof bundles, caller-selected Release authority and provider-callback outbox state are forbidden. Verified session holds require exactly two nonce rows and verified evidence. Raw session holds require zero nonce rows and raw evidence, with truth projection and authority read set forbidden.

R38 verifies the frozen R37 machine, human contract, QA, checker and materializer by exact hash. Every unchanged R37 top-level semantic object must remain canonically identical.

## Boundary

R38 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.
