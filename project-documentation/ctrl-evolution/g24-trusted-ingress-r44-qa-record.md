# G24 trusted canonical ingress R44 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R44 materialization from frozen R43: passed
- Focused R44 contract checker: passed with 35 mutation probes
- Owned immutable snapshot rejection probes: passed, 19 of 19
- Pre-allocation and resource-bound probes: passed, 6 of 6
- Captured-primordial pollution probes: passed, 6 of 6
- One canonical role-keyed artifact store: passed for all 44 artifacts
- Exact-one artifact resolution: passed for all 104 reference rows
- Complete correlation authority: passed for all 418 equalities
- Durable restart reconstruction: passed for all 4 branch classes
- Exact semantic-reference inventory: passed for all 5,843 occurrences
- Self-sealed runtime-semantic authority manifest: passed with 214 rows
- R44 machine SHA-256: `f792939ee19cb9359023bb5a65d192f2a4422c68d17db94c097e6c8e717acf7e`

Focused mutation coverage includes replacing the bundle-truth-projection role with an individually valid target artifact, a valid row in the wrong role, missing, duplicate and extra roles, malformed and resealed wrappers, proof, nonce and raw-evidence splices, and a registry-only hold-branch change with a recomputed row identity while replay payload remains historical.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
