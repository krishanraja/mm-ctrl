# G24 trusted canonical ingress R49 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R49 materialization from frozen R48: passed
- Focused R49 checker: passed with 23 mutation probes
- Operations: 15
- Persisted request schemas: 15
- Persisted target-intent schemas: 15
- Persisted proof schemas: 4
- Persisted result variants: 90
- Committed target stores: 6
- Persisted payload schema variants: 135
- Schema-qualified persisted identity kinds with one authority each: 315
- Unresolved identity authority references: 0
- Final-role-store exact-one references: 150
- Mechanically generated correlations: 450
- Complete schema-declared reference equality rows: 509
- Explicit schema-qualified non-artifact allowlist rows: 89
- Final-state semantic-reference occurrences: 9,801
- Full runtime-semantic authority manifest: 226 rows
- R49 machine SHA-256: `947f72ad8f1bf3eb7bb2d6b0b094c7c349bf2141bbbe161393b61275ddf96c7d`
- Visible surface changes: none
- External actions: none

Focused mutation coverage includes a fabricated committed-registry target reference, target-fingerprint splice, projection workspace mismatch, stale target-partition identity after a workspace change, proof expiry and issue boundaries, generic fallback restoration, internal reference laundering through the non-artifact allowlist, missing request, result or committed-target schemas, fixture-derived inventory authority, missing, duplicate or unresolved identity authorities, nonexistent semantic targets, incomplete schema equality coverage, stale resolution and correlation rows, proof and request splices, missing ordinary target fingerprint and aliased committed-target identity domains.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
